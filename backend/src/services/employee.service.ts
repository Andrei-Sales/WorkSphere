import employeeRepository from "../repositories/employee.repository.js";
import departmentRepository from "../repositories/department.repository.js";
import userRepository from "../repositories/user.repository.js";
import { EMPLOYEE_STATUS } from "../constants/employee-status.js";
import { AppError } from "../errors/app.error.js";

export class EmployeeService {
  async getAllEmployees() {
    return employeeRepository.findAll();
  }

  async getEmployeeById(id: number) {
    const employee = await employeeRepository.findById(id);

    if (!employee) {
      throw new AppError("Employee not found", 404);
    }

    return employee;
  }

  async createEmployee(data: {
    employeeNumber: string;
    firstName: string;
    lastName: string;
    position: string;
    hireDate: Date;
    status: string;
    userId: number;
    departmentId: number;
  }) {
    const employeeNumber = data.employeeNumber.trim();

    const existingEmployee =
      await employeeRepository.findByEmployeeNumber(employeeNumber);

    if (existingEmployee) {
      throw new AppError("Employee number already exists", 409);
    }

    const user = await userRepository.findById(data.userId);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    const existingEmployeeForUser = await employeeRepository.findByUserId(
      data.userId,
    );

    if (existingEmployeeForUser) {
      throw new AppError("User is already assigned to an employee", 409);
    }

    const department = await departmentRepository.findById(data.departmentId);

    if (!department) {
      throw new AppError("Department not found", 404);
    }

    return employeeRepository.create({
      employeeNumber,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      position: data.position.trim(),
      hireDate: data.hireDate,
      status: data.status || EMPLOYEE_STATUS.ACTIVE,
      userId: data.userId,
      departmentId: data.departmentId,
    });
  }

  async updateEmployee(
    id: number,
    data: {
      employeeNumber?: string;
      firstName?: string;
      lastName?: string;
      position?: string;
      hireDate?: Date;
      status?: string;
      userId?: number;
      departmentId?: number;
    },
  ) {
    const existingEmployee = await employeeRepository.findById(id);

    if (!existingEmployee) {
      throw new AppError("Employee not found", 404);
    }

    if (data.employeeNumber !== undefined) {
      const employeeNumber = data.employeeNumber.trim();

      const employeeWithSameNumber =
        await employeeRepository.findByEmployeeNumber(employeeNumber);

      if (employeeWithSameNumber && employeeWithSameNumber.id !== id) {
        throw new AppError("Employee number already exists", 409);
      }

      data.employeeNumber = employeeNumber;
    }

    if (data.userId !== undefined) {
      const user = await userRepository.findById(data.userId);

      if (!user) {
        throw new AppError("User not found", 404);
      }

      const employeeForUser = await employeeRepository.findByUserId(
        data.userId,
      );

      if (employeeForUser && employeeForUser.id !== id) {
        throw new AppError("User is already assigned to an employee", 409);
      }
    }

    if (data.departmentId !== undefined) {
      const department = await departmentRepository.findById(data.departmentId);

      if (!department) {
        throw new AppError("Department not found", 404);
      }
    }

    const updateData = {
      ...data,
      firstName:
        data.firstName !== undefined ? data.firstName.trim() : undefined,
      lastName: data.lastName !== undefined ? data.lastName.trim() : undefined,
      position: data.position !== undefined ? data.position.trim() : undefined,
    };

    return employeeRepository.update(id, updateData);
  }

  async deleteEmployee(id: number) {
    const employee = await employeeRepository.findById(id);

    if (!employee) {
      throw new AppError("Employee not found", 404);
    }

    await employeeRepository.delete(id);
  }
}

export default new EmployeeService();
