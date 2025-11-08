// src/routes/chat.routes.ts
import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import { chatController } from "../controllers/chatController";
import multer from "multer";
import path from "path";
import fs from "fs";
const router = express.Router();
const ensureDirExists = (dir: string) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

/** 🧱 2. Налаштування multer */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Динамічно визначаємо папку
    let folder = "others";
    if (file.mimetype.startsWith("image/")) folder = "images";
    else if (
      file.mimetype === "application/pdf" ||
      file.mimetype.includes("word") ||
      file.mimetype.includes("officedocument")
    )
      folder = "docs";
    else if (file.mimetype.startsWith("text/")) folder = "texts";

    const uploadPath = path.join("uploads", folder);
    ensureDirExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Генеруємо унікальне ім’я файлу
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({ storage });
router.get("/", authMiddleware, chatController.getChatByProfileName);
router.post(
  "/",
  authMiddleware,
  upload.array("array"),
  chatController.upLoadFile
);
router.post("/create-groups", authMiddleware, chatController.createGroups);
router.post("/add-to-groups", authMiddleware, chatController.addToGroups);
router.get("/get-groups", authMiddleware, chatController.getGroups);
router.get(
  "/GroupsName/:groupName",
  authMiddleware,
  chatController.getGroupsChats
);
router.post(
  "/GroupsName/:groupName",
  authMiddleware,
  upload.array("file"),
  chatController.upLoadFile
);
// ✅ Специфічні роути ПЕРЕД параметризованими
router.get("/my-chats", authMiddleware, chatController.getUserChats);
router.get("/:chatId/messages", authMiddleware, chatController.getChatMessages);
router.post("/:chatId/message", authMiddleware, chatController.sendMessage);

// ✅ Параметризований роут В КІНЦІ
// ТРЕБА НЕ ЗАБУТИ ДОДАТИ ПЕРЕВІРКУ НА ТОКЕН
export default router;
