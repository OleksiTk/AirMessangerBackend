// src/routes/auth.routes.ts
import express from "express";
import { authController } from "../controllers/authController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh-token", authController.refreshToken);
router.post("/logout", authController.logout);
router.post(
  "/change-profile",
  authMiddleware,
  authController.changeProfileInfo
);
router.get("/get-contacts", authMiddleware, authController.getContacts);
router.get("/get-user", authMiddleware, authController.getUser);
export default router;
