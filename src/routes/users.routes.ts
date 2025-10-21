// src/routes/users.routes.ts
import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import { contactsController } from "../controllers/contactsController";
const router = express.Router();

router.post("/contacts-add", contactsController.addContacts);
router.get("/contacts-get", contactsController.getAllContacts);

export default router;
