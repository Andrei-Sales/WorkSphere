import prisma from "../config/database.js";

export class DashboardRepository {
  async getStatistics() {
    const [
      totalEmployees,
      activeEmployees,
      inactiveEmployees,
      totalDepartments,
      totalUsers,
      activeUsers,
      inactiveUsers,
    ] = await Promise.all([
      prisma.employee.count(),

      prisma.employee.count({
        where: {
          status: "ACTIVE",
        },
      }),

      prisma.employee.count({
        where: {
          status: "INACTIVE",
        },
      }),

      prisma.department.count(),

      prisma.user.count(),

      prisma.user.count({
        where: {
          status: "ACTIVE",
        },
      }),

      prisma.user.count({
        where: {
          status: "INACTIVE",
        },
      }),
    ]);

    return {
      totalEmployees,
      activeEmployees,
      inactiveEmployees,
      totalDepartments,
      totalUsers,
      activeUsers,
      inactiveUsers,
    };
  }

  async getEmployeesByDepartment() {
    return prisma.department.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            employees: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });
  }
}

export default new DashboardRepository();
