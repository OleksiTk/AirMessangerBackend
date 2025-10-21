// src/middlewares/authMiddleware.ts
import type { Request, Response, NextFunction } from "express";
import { tokenService } from "../services/tokenService.js";

declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let accessToken = req.cookies.accessToken;

    if (!accessToken) {
      const refreshToken = req.cookies.refreshToken;
      console.log("ми тут ");

      if (!refreshToken) {
        return res.status(401).json({ message: "Refresh token expired" });
      }

      try {
        // Верифікуємо refreshToken
        const decoded = await tokenService.verifyRefreshToken(refreshToken);

        if (!decoded || !("userId" in decoded)) {
          return res.status(401).json({ message: "Invalid refresh token" });
        }

        // ✅ Генеруємо новий accessToken
        const newAccessToken = tokenService.generateAccessToken(decoded.userId);

        // Встановлюємо новий accessToken в cookies
        res.cookie("accessToken", newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 15 * 60 * 1000, // 15 хвилин
        });

        req.userId = decoded.userId;
        return next();
      } catch (refreshError) {
        return res
          .status(401)
          .json({ message: "Session expired, please login again" });
      }
    }
    try {
      // Спробуємо верифікувати accessToken
      const decoded = await tokenService.verifyAccessToken(accessToken);

      if (!decoded || typeof decoded !== "object" || !("userId" in decoded)) {
        return res.status(401).json({ message: "Invalid token" });
      }

      req.userId = decoded.userId;
      return next();
    } catch (error) {
      return res.status(401).json({ message: "Authentication failed" });
    }
  } catch (error) {
    res.status(401).json({ message: "Authentication failed" });
  }
};
