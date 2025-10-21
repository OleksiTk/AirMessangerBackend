// src/routes/auth.routes.ts
import express from "express";
import { authController } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh-token", authController.refreshToken);
router.post("/logout", authController.logout);
router.post("/change-profile", authController.changeProfileInfo);
router.get("/get-contacts", authController.getContacts);
router.get("/get-user", authController.getUser);
export default router;
