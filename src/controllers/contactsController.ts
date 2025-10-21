import type { Request, Response } from "express";
import { contactsService } from "../services/contactsService";

export const contactsController = {
  async addContacts(req: Request, res: Response) {
    try {
      const { name_profile, userId } = req.body;
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
      const { userId } = req.query;
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
};
