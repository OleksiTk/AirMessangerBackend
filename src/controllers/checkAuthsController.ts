import type { Request, Response } from "express";
import { checkAuth } from "../services/checkAuth";
export const checkAuthsController = {
  async checkAuth(req: Request, res: Response) {
    try {
      // middleware check this
      const response = await checkAuth.ChekingAuths();
      if (response) {
        res.status(201).json(response);
      }
    } catch (error) {
      res.status(401).json({ message: "You dont login on site" });
    }
  },
};
