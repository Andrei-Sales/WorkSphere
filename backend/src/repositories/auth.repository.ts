import prisma from "../config/database.js";

export class AuthRepository {
  async findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        role: true,
        employee: true,
      },
    });
  }

  async findUserById(id: number) {
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

  async findUserStatusById(id: number) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
      },
    });
  }
}

export default new AuthRepository();
