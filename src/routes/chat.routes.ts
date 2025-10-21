// src/routes/chat.routes.ts
import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import { chatController } from "../controllers/chatController";

const router = express.Router();

router.get("/", chatController.getChatByProfileName);
// ✅ Специфічні роути ПЕРЕД параметризованими
router.get("/my-chats", chatController.getUserChats);
router.get("/:chatId/messages", chatController.getChatMessages);
router.post("/:chatId/message", chatController.sendMessage);

// ✅ Параметризований роут В КІНЦІ
// ТРЕБА НЕ ЗАБУТИ ДОДАТИ ПЕРЕВІРКУ НА ТОКЕН
export default router;
