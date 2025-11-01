import type { Request, Response } from "express";
import { chatService } from "../services/chatService";

export const chatController = {
  // Отримати чат за name_profile: /chat?profileName=alex_lol
  async getChatByProfileName(req: Request, res: Response) {
    try {
      console.log("воно виконується");

      const { profileName } = req.query;
      const googleId = req.googleId; // ✅ Беремо з middleware, не з query
      console.log(googleId);

      // ✅ Типізуємо query параметр
      if (
        !profileName ||
        typeof profileName !== "string" ||
        typeof googleId !== "string"
      ) {
        return res.status(400).json({ message: "Profile name required" });
      }
      console.log("тту ми");

      const chat = await chatService.getChatByProfileName(
        googleId,
        profileName
      );
      res.status(200).json(chat);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to get chat";
      res.status(400).json({ message });
    }
  },
  async upLoadFile(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const file = req.file;

      // Формуємо URL для клієнта
      const relativePath = file.path.replace(/\\/g, "/"); // для Windows
      const fileUrl = `/uploads/${relativePath.split("uploads/")[1]}`;

      // Відповідь клієнту — метадані
      const fileMeta = {
        fileUrl, // URL для доступу (наприклад, /uploads/images/123.jpg)
        fileName: file.originalname, // оригінальне ім’я
        fileType: file.mimetype, // тип MIME
        fileSize: file.size, // розмір у байтах
      };

      console.log("✅ File uploaded:", fileMeta);

      res.json(fileMeta);
    } catch (err) {
      console.error("❌ File upload error:", err);
      res.status(500).json({ error: "File upload failed" });
    }
  },
  async createGroups(req: Request, res: Response) {
    try {
      let { avatar, name_groups } = req.body;
      let googleId = req.googleId;
      if (!googleId) {
        return res.status(400).json({ message: "dont have id" });
      }
      const createGroups = await chatService.creatGroups(
        avatar,
        name_groups,
        googleId
      );
      if (createGroups) {
        return res.json({
          check: "ok",
        });
      }
    } catch (error) {
      res.status(400).json({ message: "Something went wrong" });
    }
  },
  async addToGroups(req: Request, res: Response) {
    try {
      let { name_profile } = req.body;
      let googleId = req.googleId;
      if (!googleId) {
        return res.status(400).json({ message: "dont have id" });
      }
      const createGroups = await chatService.addToGroupsContacts(
        name_profile,
        googleId
      );
      if (createGroups) {
        return res.json({
          check: "ok",
        });
      }
    } catch (error) {
      res.status(400).json({ message: "Something went wrong" });
    }
  },
  async getGroups(req: Request, res: Response) {
    try {
      let googleId = req.googleId;
      if (!googleId) {
        return res.status(400).json({ message: "dont have id" });
      }
      const getGroups = await chatService.getGroups(googleId);
      if (getGroups) {
        return res.json({
          getGroups,
          check: "ok",
        });
      }
    } catch (error) {
      res.status(400).json({ message: "Something went wrong" });
    }
  },
  async getGroupsChats(req: Request, res: Response) {
    try {
      console.log("воно виконується");

      const { groupName } = req.params;
      console.log(groupName);

      const googleId = req.googleId; // ✅ Беремо з middleware, не з query
      console.log(googleId);

      // ✅ Типізуємо query параметр
      if (
        !groupName ||
        typeof groupName !== "string" ||
        typeof googleId !== "string"
      ) {
        return res.status(400).json({ message: "Profile name required" });
      }
      console.log("тту ми");

      const chat = await chatService.getGroupsChats(groupName, googleId);
      res.status(200).json(chat);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to get chat";
      res.status(400).json({ message });
    }
  },
  // Отримати всі чати користувача
  async getUserChats(req: Request, res: Response) {
    try {
      const googleId = req.googleId;

      if (!googleId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const chats = await chatService.getUserChats(String(googleId));
      res.status(200).json(chats);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to get chats";
      res.status(500).json({ message });
    }
  },

  // Отримати повідомлення чату
  async getChatMessages(req: Request, res: Response) {
    try {
      const { chatId } = req.params;
      const { limit = "50", offset = "0" } = req.query;

      // ✅ Типізуємо параметри
      const parsedChatId = parseInt(chatId, 10);
      const parsedLimit = parseInt(
        typeof limit === "string" ? limit : "50",
        10
      );
      const parsedOffset = parseInt(
        typeof offset === "string" ? offset : "0",
        10
      );

      if (isNaN(parsedChatId)) {
        return res.status(400).json({ message: "Invalid chat ID" });
      }

      const messages = await chatService.getChatMessages(
        parsedChatId,
        parsedLimit,
        parsedOffset
      );
      res.status(200).json(messages);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to get messages";
      res.status(500).json({ message });
    }
  },

  // Створити повідомлення
  async sendMessage(req: Request, res: Response) {
    try {
      const { chatId, content } = req.body;
      const googleId = req.googleId;

      if (!chatId || !content) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      if (!googleId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const message = await chatService.sendMessage(
        String(chatId),
        googleId,
        content
      );
      res.status(201).json(message);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to send message";
      res.status(500).json({ message });
    }
  },
};
