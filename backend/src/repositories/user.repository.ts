import prisma from "../config/database.js";

export class UserRepository {
  async findAll() {
    return prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        roleId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        role: true,
        employee: true,
      },
      orderBy: {
        id: "desc",
      },
    });
  }

  async findById(id: number) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        roleId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        role: true,
        employee: true,
      },
    });
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async create(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    roleId: number;
  }) {
    return prisma.user.create({
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        roleId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        role: true,
        employee: true,
      },
    });
  }

  async update(
    id: number,
    data: {
      email?: string;
      passwordHash?: string;
      firstName?: string;
      lastName?: string;
      roleId?: number;
      status?: string;
    },
  ) {
    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        roleId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        role: true,
        employee: true,
      },
    });
  }

  async delete(id: number) {
    return prisma.user.delete({
      where: { id },
    });
  }
}

export default new UserRepository();
