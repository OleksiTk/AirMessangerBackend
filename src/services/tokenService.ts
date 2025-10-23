// src/services/tokenService.ts
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.js";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!;
const ACCESS_TOKEN_EXPIRES = "15m";
const REFRESH_TOKEN_EXPIRES = "7d";

export const tokenService = {
  generateAccessToken(userId: number, googleId: string) {
    return jwt.sign({ userId, googleId }, ACCESS_TOKEN_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRES,
    });
  },

  generateRefreshToken(userId: number, googleId: string) {
    return jwt.sign({ userId, googleId }, REFRESH_TOKEN_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRES,
    });
  },

  async saveRefreshToken(userId: number, refreshToken: string) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    return prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt,
      },
    });
  },

  async verifyAccessToken(token: string) {
    try {
      const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
      return decoded;
    } catch (error) {
      return null;
    }
  },

  async verifyRefreshToken(token: string) {
    try {
      const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET);
      if (typeof decoded === "string") {
        throw new Error("Invalid token payload");
      }
      return decoded;
    } catch (error) {
      return null;
    }
  },

  async removeRefreshToken(token: string) {
    return prisma.refreshToken
      .delete({
        where: { token },
      })
      .catch(() => null);
  },
};
