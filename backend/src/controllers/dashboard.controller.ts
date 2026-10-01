import { Request, Response } from "express";
import dashboardService from "../services/dashboard.service.js";

export class DashboardController {
  async getDashboard(_req: Request, res: Response) {
    const dashboard = await dashboardService.getDashboard();

    res.status(200).json({
      success: true,
      data: dashboard,
    });
  }
}

export default new DashboardController();
