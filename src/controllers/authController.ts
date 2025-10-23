// src/controllers/authController.ts
import type { Request, Response } from "express";
import { authService } from "../services/authService.js";
import { v4 as uuidv4 } from "uuid";
export const authController = {
  async register(req: Request, res: Response) {
    try {
      const { email, password, name_profile } = req.body;

      if (!email || !password || !name_profile) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      const googleId = uuidv4();
      const result = await authService.register(
        email,
        password,
        name_profile,
        googleId
      );
      res.cookie("accessToken", result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 15 * 60 * 1000, // 15 хвилин
      });
      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.status(201).json({
        message: "User registered successfully",
        user: result.user,
        accessToken: result.accessToken,
        googleId: googleId,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Registration failed";
      res.status(400).json({ message });
    }
  },

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }

      const result = await authService.login(email, password);
      res.cookie("accessToken", result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 15 * 60 * 1000, // 15 хвилин
      });
      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        message: "Login successful",
        user: result.user,
        accessToken: result.accessToken,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";
      res.status(401).json({ message });
    }
  },

  async refreshToken(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({ message: "No refresh token" });
      }

      const result = await authService.refreshAccessToken(refreshToken);

      res.status(200).json({
        accessToken: result.accessToken,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Token refresh failed";
      res.status(401).json({ message });
    }
  },

  async logout(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (refreshToken) {
        await authService.logout(refreshToken);
      }

      res.clearCookie("refreshToken");

      res.status(200).json({ message: "Logout successful" });
    } catch (error) {
      res.status(500).json({ message: "Logout failed" });
    }
  },
  async changeProfileInfo(req: Request, res: Response) {
    try {
      const { avatar, name, last_name } = req.body;
      const userId = req.googleId;

      if (!name || !last_name || !userId) {
        return res.status(400).json({
          message: "Missing required fields",
          userId,
          last_name,
          name,
          avatar,
        });
      }

      const updatedUser = await authService.changeProfileInfo(
        userId,
        avatar,
        name,
        last_name
      );
      res.json(updatedUser);
    } catch (error) {}
  },
  async getContacts(req: Request, res: Response) {
    try {
      const { name_profile } = req.query;
      const googleId = req.googleId;
      console.log(googleId, "гугл ID");

      if (typeof name_profile !== "string" || typeof googleId !== "string") {
        return res.status(400).json({
          message:
            "Invalid query parameter 'name_profile'. It should be a string.",
        });
      }
      const updatedUser = await authService.getContacts(name_profile, googleId);
      res.json(updatedUser);
    } catch (error) {
      res.status(400).json({
        message: "Something went wrong",
      });
    }
  },
  async getUser(req: Request, res: Response) {
    try {
      const googleId = req.googleId;
      console.log(googleId, "гугл ID");

      if (typeof googleId !== "string") {
        return res.status(400).json({
          message:
            "Invalid query parameter 'name_profile'. It should be a string.",
        });
      }
      const getUser = await authService.getUser(googleId);
      res.json(getUser);
    } catch (error) {
      res.status(400).json({
        message: "Something went wrong",
      });
    }
  },
};
