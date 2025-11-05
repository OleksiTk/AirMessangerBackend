// src/middlewares/authMiddleware.ts
import type { Request, Response, NextFunction } from "express";
import { tokenService } from "../services/tokenService.js";

declare global {
  namespace Express {
    interface Request {
      userId?: number;
      googleId?: string;
    }
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    const token = authHeader?.split(" ")[1];
    console.log(token);

    let checkExpresion = token === undefined ? true : false;
    console.log("token", checkExpresion);

    // Якщо немає accessToken в headers - пробуємо refresh
    if (!token) {
      const refreshToken = req.cookies.refreshToken;
      console.log("Немає accessToken, використовуємо refresh");

      if (!refreshToken) {
        return res.status(401).json({ message: "Token not provided" });
      }

      try {
        // Верифікуємо refreshToken
        const decoded = await tokenService.verifyRefreshToken(refreshToken);

        if (!decoded || !("userId" in decoded)) {
          return res.status(401).json({ message: "Invalid refresh token" });
        }

        // Генеруємо новий accessToken
        const newAccessToken = tokenService.generateAccessToken(
          decoded.userId,
          decoded.googleId
        );

        // Встановлюємо новий accessToken в cookies
        res.cookie("accessToken", newAccessToken, {
          // domain: ".up.railway.app",
          httpOnly: true,
          secure: true, // ОБОВ'ЯЗКОВО true для SameSite=none
          sameSite: "lax", // ✅ 'none' замість 'strict'
          path: "/",
          maxAge: 15 * 60 * 1000, // 15 хвилин
        });

        req.userId = decoded.userId;
        req.googleId = decoded.googleId;

        return next();
      } catch (refreshError) {
        return res
          .status(401)
          .json({ message: "Session expired, please login again" });
      }
    }

    // Якщо є accessToken - верифікуємо його
    try {
      const decoded = await tokenService.verifyAccessToken(token);
      console.log("ця умова робить");

      if (!decoded || typeof decoded !== "object" || !("userId" in decoded)) {
        return res.status(401).json({ message: "Invalid token" });
      }

      req.userId = decoded.userId;
      req.googleId = decoded.googleId;

      return next();
    } catch (error) {
      // Якщо accessToken невалідний - пробуємо refresh
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({ message: "Token expired" });
      }

      try {
        const decoded = await tokenService.verifyRefreshToken(refreshToken);

        if (!decoded || !("userId" in decoded)) {
          return res.status(401).json({ message: "Invalid refresh token" });
        }

        const newAccessToken = tokenService.generateAccessToken(
          decoded.userId,
          decoded.googleId
        );

        res.cookie("accessToken", newAccessToken, {
          // domain: ".up.railway.app",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 15 * 60 * 1000,
        });
        req.googleId = decoded.googleId;

        req.userId = decoded.userId;
        return next();
      } catch (refreshError) {
        return res.status(401).json({
          message: "Session expired, please login again",
        });
      }
    }
  } catch (error) {
    res.status(401).json({ message: "Authentication failed" });
  }
};
