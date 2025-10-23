// src/routes/chat.routes.ts
import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import { chatController } from "../controllers/chatController";

const router = express.Router();

router.get("/",authMiddleware, chatController.getChatByProfileName);
// ✅ Специфічні роути ПЕРЕД параметризованими
router.get("/my-chats",authMiddleware, chatController.getUserChats);
router.get("/:chatId/messages",authMiddleware, chatController.getChatMessages);
router.post("/:chatId/message",authMiddleware, chatController.sendMessage);

// ✅ Параметризований роут В КІНЦІ
// ТРЕБА НЕ ЗАБУТИ ДОДАТИ ПЕРЕВІРКУ НА ТОКЕН
export default router;
