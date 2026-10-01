import { Request, Response } from "express";
import employeeService from "../services/employee.service.js";

export class EmployeeController {
  async getAllEmployees(_req: Request, res: Response) {
    const employees = await employeeService.getAllEmployees();

    res.status(200).json({
      success: true,
      data: employees,
    });
  }

  async getEmployeeById(req: Request, res: Response) {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid employee ID",
      });
      return;
    }

    const employee = await employeeService.getEmployeeById(id);

    res.status(200).json({
      success: true,
      data: employee,
    });
  }

  async createEmployee(req: Request, res: Response) {
    const employee = await employeeService.createEmployee(req.body);

    res.status(201).json({
      success: true,
      data: employee,
    });
  }

  async updateEmployee(req: Request, res: Response) {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid employee ID",
      });
      return;
    }

    const employee = await employeeService.updateEmployee(id, req.body);

    res.status(200).json({
      success: true,
      data: employee,
    });
  }

  async deleteEmployee(req: Request, res: Response) {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid employee ID",
      });
      return;
    }

    await employeeService.deleteEmployee(id);

    res.status(204).send();
  }
}

export default new EmployeeController();
