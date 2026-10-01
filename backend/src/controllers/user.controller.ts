import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import userService from "../services/user.service.js";

export class UserController {
  async getAllUsers(_req: Request, res: Response) {
    const users = await userService.getAllUsers();

    res.status(200).json({
      success: true,
      data: users,
    });
  }

  async getUserById(req: Request, res: Response) {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
      return;
    }

    const user = await userService.getUserById(id);

    res.status(200).json({
      success: true,
      data: user,
    });
  }

  async createUser(req: Request, res: Response) {
    const user = await userService.createUser(req.body);

    res.status(201).json({
      success: true,
      data: user,
    });
  }

  async updateUser(req: AuthenticatedRequest, res: Response) {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
      return;
    }

    const user = await userService.updateUser(id, req.body, req.user?.userId);

    res.status(200).json({
      success: true,
      data: user,
    });
  }

  async deleteUser(req: AuthenticatedRequest, res: Response) {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
      return;
    }

    await userService.deleteUser(id, req.user?.userId);

    res.status(204).send();
  }
}

export default new UserController();
