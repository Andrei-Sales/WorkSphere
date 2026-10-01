import prisma from "../config/database.js";

export class DepartmentRepository {
  async findAll() {
    return prisma.department.findMany({
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            employees: true,
          },
        },
      },
      orderBy: {
        id: "desc",
      },
    });
  }

  async findById(id: number) {
    return prisma.department.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            employees: true,
          },
        },
      },
    });
  }

  async findByName(name: string) {
    return prisma.department.findUnique({
      where: { name },
    });
  }

  async create(data: { name: string }) {
    return prisma.department.create({
      data,
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            employees: true,
          },
        },
      },
    });
  }

  async update(
    id: number,
    data: {
      name?: string;
    },
  ) {
    return prisma.department.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            employees: true,
          },
        },
      },
    });
  }

  async delete(id: number) {
    return prisma.department.delete({
      where: { id },
    });
  }
}

export default new DepartmentRepository();
