import { apiClient } from "./client";

export interface DashboardStatistics {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  totalDepartments: number;
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
}

export interface DashboardDepartment {
  id: number;
  name: string;
  employeeCount: number;
}

interface DashboardResponse {
  success: boolean;
  data: {
    statistics: DashboardStatistics;
    departments: DashboardDepartment[];
  };
}

export async function getDashboard() {
  const response = await apiClient<DashboardResponse>("/dashboard", {
    method: "GET",
    requiresAuth: true,
  });

  return response.data;
}
