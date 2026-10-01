import prisma from "../config/database.js";

export class EmployeeRepository {
  async findAll() {
    return prisma.employee.findMany({
      select: {
        id: true,
        employeeNumber: true,
        firstName: true,
        lastName: true,
        position: true,
        hireDate: true,
        status: true,
        userId: true,
        departmentId: true,
        createdAt: true,
        updatedAt: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: {
        id: "desc",
      },
    });
  }

  async findById(id: number) {
    return prisma.employee.findUnique({
      where: { id },
      select: {
        id: true,
        employeeNumber: true,
        firstName: true,
        lastName: true,
        position: true,
        hireDate: true,
        status: true,
        userId: true,
        departmentId: true,
        createdAt: true,
        updatedAt: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
  }

  async findByEmployeeNumber(employeeNumber: string) {
    return prisma.employee.findUnique({
      where: {
        employeeNumber,
      },
    });
  }

  async findByUserId(userId: number) {
    return prisma.employee.findUnique({
      where: {
        userId,
      },
    });
  }

  async create(data: {
    employeeNumber: string;
    firstName: string;
    lastName: string;
    position: string;
    hireDate: Date;
    status: string;
    userId: number;
    departmentId: number;
  }) {
    return prisma.employee.create({
      data,
      select: {
        id: true,
        employeeNumber: true,
        firstName: true,
        lastName: true,
        position: true,
        hireDate: true,
        status: true,
        userId: true,
        departmentId: true,
        createdAt: true,
        updatedAt: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
  }

  async update(
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
    return prisma.employee.update({
      where: {
        id,
      },
      data,
      select: {
        id: true,
        employeeNumber: true,
        firstName: true,
        lastName: true,
        position: true,
        hireDate: true,
        status: true,
        userId: true,
        departmentId: true,
        createdAt: true,
        updatedAt: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
  }

  async delete(id: number) {
    return prisma.employee.delete({
      where: {
        id,
      },
    });
  }
}

export default new EmployeeRepository();
