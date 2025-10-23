// src/services/authService.ts
import bcrypt from "bcrypt";
import { prisma } from "../config/prisma.js";
import { tokenService } from "./tokenService.js";

export const authService = {
  async register(
    email: string,
    password: string,
    name_profile: string,
    googleId: string
  ) {
    // Перевіря існування користувача
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error("User already exists");
    }

    // Хешуємо пароль
    const hashedPassword = await bcrypt.hash(password, 10);

    // Створюємо користувача
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name_profile,
        googleId,
      },
    });

    // Генеруємо токени
    const accessToken = tokenService.generateAccessToken(user.id, googleId);
    const refreshToken = tokenService.generateRefreshToken(user.id, googleId);

    await tokenService.saveRefreshToken(user.id, refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        name_profile: user.name_profile,
      },
      accessToken,
      refreshToken,
    };
  },

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      throw new Error("Invalid credentials");
    }

    // Порівнюємо паролі
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    // Генеруємо токени
    const accessToken = tokenService.generateAccessToken(
      user.id,
      user.googleId
    );
    const refreshToken = tokenService.generateRefreshToken(
      user.id,
      user.googleId
    );

    await tokenService.saveRefreshToken(user.id, refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        googleId: user.googleId,
      },
      accessToken,
      refreshToken,
    };
  },

  async refreshAccessToken(refreshToken: string) {
    // Перевіряємо валідність токену
    const decoded = await tokenService.verifyRefreshToken(refreshToken);

    if (!decoded || typeof decoded !== "object" || !("userId" in decoded)) {
      throw new Error("Invalid refresh token");
    }

    // Перевіряємо наявність токену в БД
    const tokenInDb = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!tokenInDb) {
      throw new Error("Refresh token not found");
    }

    // Перевіряємо часовість
    if (new Date() > tokenInDb.expiresAt) {
      throw new Error("Refresh token expired");
    }

    const userId = decoded.userId;
    const googleId = decoded.googleId;
    // Генеруємо новий access token
    const newAccessToken = tokenService.generateAccessToken(userId, googleId);

    return { accessToken: newAccessToken };
  },

  async logout(refreshToken: string) {
    await tokenService.removeRefreshToken(refreshToken);
  },
  async changeProfileInfo(
    userId: string,
    avatar: string,
    name: string,
    last_name: string
  ) {
    const user = await prisma.user.update({
      where: { googleId: userId },
      data: {
        avatar,
        name,
        last_name,
      },
    });

    return {
      id: user.id,
      email: user.email,
      name_profile: user.name_profile,
      avatar: user.avatar,
    };
  },
  async getContacts(name_profile: string, googleId: string) {
    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            name_profile: {
              contains: name_profile, // ✅ Використовуємо параметр
              mode: "insensitive",
            },
          },
          {
            googleId: {
              not: googleId, // ✅ Виключаємо поточного користувача
            },
          },
        ],
      },
      select: {
        // ← Виберемо тільки необхідні поля
        id: true,
        name_profile: true,
        avatar: true,
        email: true,
      },
    });
    return users;
  },
  async getUser(googleId: string) {
    const users = await prisma.user.findMany({
      where: {
        googleId,
      },

      select: {
        id: true,
        name: true,
        last_name: true,
        name_profile: true,
        avatar: true,
        email: true,
      },
    });
    return users;
  },
};
