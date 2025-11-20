import type { Request, Response } from "express";
import { contactsService } from "../services/contactsService";

export const contactsController = {
  async addContacts(req: Request, res: Response) {
    try {
      const { name_profile } = req.body;
      const userId = req.googleId;
      if (!name_profile || !userId) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      const result = await contactsService.addContacts(name_profile, userId);
      res.status(201).json({
        message: "Add success contacts",
        data: result,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Faild search Contacts";
      res.status(401).json({ message });
    }
  },

  async getAllContacts(req: Request, res: Response) {
    try {
      const userId = req.googleId;
      if (!userId || typeof userId !== "string") {
        return res.status(400).json({ message: "Missing or invalid userId" });
      }
      const getContacts = await contactsService.getContacts(userId);
      res.status(201).json({
        message: "getConcats",
        data: getContacts,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Faild search Contacts";
      res.status(401).json({ message });
    }
  },
  async getAllGroups(req: Request, res: Response) {
    try {
      const { nameGroups } = req.body;
      const userId = req.googleId;

      console.log("nameGroups:", nameGroups);
      console.log("userId:", userId);
      console.log("req.body:", req.body);

      if (!userId || !nameGroups) {
        return res.status(400).json({
          message: "Missing or invalid userId",
          debug: { userId, nameGroups }, // Додайте для дебагу
        });
      }

      const getGroups = await contactsService.getGroups(nameGroups);
      res.status(201).json({
        message: "getGroups",
        data: getGroups,
      });
    } catch (error) {
      const message =
        error instanceof Error ? "Groups not found" : "Failed search Contacts";
      res.status(500).json({ message }); // Змініть на 500, бо 401 - це проблема авторизації
    }
  },
};
