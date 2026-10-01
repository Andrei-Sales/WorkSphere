import departmentRepository from "../repositories/department.repository.js";
import { AppError } from "../errors/app.error.js";

export class DepartmentService {
  async getAllDepartments() {
    const departments = await departmentRepository.findAll();

    return departments.map((department) => ({
      id: department.id,
      name: department.name,
      employeeCount: department._count.employees,
      createdAt: department.createdAt,
      updatedAt: department.updatedAt,
    }));
  }

  async getDepartmentById(id: number) {
    const department = await departmentRepository.findById(id);

    if (!department) {
      throw new AppError("Department not found", 404);
    }

    return {
      id: department.id,
      name: department.name,
      employeeCount: department._count.employees,
      createdAt: department.createdAt,
      updatedAt: department.updatedAt,
    };
  }

  async createDepartment(name: string) {
    const normalizedName = name.trim();

    if (!normalizedName) {
      throw new AppError("Department name is required", 400);
    }

    const existingDepartment =
      await departmentRepository.findByName(normalizedName);

    if (existingDepartment) {
      throw new AppError("Department already exists", 409);
    }

    const department = await departmentRepository.create({
      name: normalizedName,
    });

    return {
      id: department.id,
      name: department.name,
      employeeCount: department._count.employees,
      createdAt: department.createdAt,
      updatedAt: department.updatedAt,
    };
  }

  async updateDepartment(id: number, name: string) {
    const existingDepartment = await departmentRepository.findById(id);

    if (!existingDepartment) {
      throw new AppError("Department not found", 404);
    }

    const normalizedName = name.trim();

    if (!normalizedName) {
      throw new AppError("Department name is required", 400);
    }

    const departmentWithSameName =
      await departmentRepository.findByName(normalizedName);

    if (departmentWithSameName && departmentWithSameName.id !== id) {
      throw new AppError("Department already exists", 409);
    }

    const department = await departmentRepository.update(id, {
      name: normalizedName,
    });

    return {
      id: department.id,
      name: department.name,
      employeeCount: department._count.employees,
      createdAt: department.createdAt,
      updatedAt: department.updatedAt,
    };
  }

  async deleteDepartment(id: number) {
    const department = await departmentRepository.findById(id);

    if (!department) {
      throw new AppError("Department not found", 404);
    }

    if (department._count.employees > 0) {
      throw new AppError(
        "Cannot delete a department with assigned employees",
        409,
      );
    }

    await departmentRepository.delete(id);
  }
}

export default new DepartmentService();
