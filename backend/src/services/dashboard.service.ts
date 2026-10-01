import dashboardRepository from "../repositories/dashboard.repository.js";

export class DashboardService {
  async getDashboard() {
    const [statistics, departmentData] = await Promise.all([
      dashboardRepository.getStatistics(),
      dashboardRepository.getEmployeesByDepartment(),
    ]);

    const departments = departmentData.map((department) => ({
      id: department.id,
      name: department.name,
      employeeCount: department._count.employees,
    }));

    return {
      statistics,
      departments,
    };
  }
}

export default new DashboardService();
