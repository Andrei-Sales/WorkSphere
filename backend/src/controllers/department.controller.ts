import { Request, Response } from "express";
import departmentService from "../services/department.service.js";

export class DepartmentController {
  async getAllDepartments(_req: Request, res: Response) {
    const departments = await departmentService.getAllDepartments();

    res.status(200).json({
      success: true,
      data: departments,
    });
  }

  async getDepartmentById(req: Request, res: Response) {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid department ID",
      });
      return;
    }

    const department = await departmentService.getDepartmentById(id);

    res.status(200).json({
      success: true,
      data: department,
    });
  }

  async createDepartment(req: Request, res: Response) {
    const department = await departmentService.createDepartment(req.body.name);

    res.status(201).json({
      success: true,
      data: department,
    });
  }

  async updateDepartment(req: Request, res: Response) {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid department ID",
      });
      return;
    }

    const department = await departmentService.updateDepartment(
      id,
      req.body.name,
    );

    res.status(200).json({
      success: true,
      data: department,
    });
  }

  async deleteDepartment(req: Request, res: Response) {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid department ID",
      });
      return;
    }

    await departmentService.deleteDepartment(id);

    res.status(204).send();
  }
}

export default new DepartmentController();
