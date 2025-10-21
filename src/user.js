// src/user.js
import { Router } from "express";
import prisma from "./db.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
const router = Router();

const uploadDir = "./uploads/avatars";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Налаштування Multer для завантаження файлів
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Унікальна назва файлу: timestamp + оригінальна назва
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueName + ext);
  },
});
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Тільки зображення дозволені (jpg, png, gif, webp)"));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Максимум 5MB
});
router.post("/user", upload.single("avatar"), async (req, res) => {
  try {
    const { email, name, last_name, phone_number } = req.body;
    let uuid = uuidv4();
    // Шлях до аватарки (якщо завантажено)
    const avatarPath = req.file
      ? `/uploads/avatars/${req.file.filename}`
      : null;

    const user = await prisma.user.create({
      data: {
        uniq_id: uuid,
        email,
        name,
        name_profile: "alex_hello",
        last_name,
        phone_number,
        avatar: avatarPath,
      },
    });

    res.json({
      success: true,
      user,
      message: "Користувача створено успішно",
    });
  } catch (error) {
    // Видалити файл якщо помилка БД
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/users", async (req, res) => {
  try {
    const allUsers = await prisma.user.findMany();
    res.json(allUsers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/chat/:id", async (req, res) => {
  try {
    const allUsers = await prisma.chat.findMany();
    res.json(allUsers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/chat/:id", async (req, res) => {
  try {
    const { content, username } = req.body;

    const user = await prisma.chat.create({
      data: {
        content: content,
        username: username,
      },
    });

    res.json({
      success: true,
      user,
      message: "Повідомлення відпоаврденго",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

export default router; // ← Експортуй роутер!
