import { apiClient } from "./client";

export interface EmployeeDepartment {
  id: number;
  name: string;
}

export interface EmployeeUser {
  id: number;
  email: string;
}

export interface Employee {
  id: number;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  position: string;
  hireDate: string;
  status: "ACTIVE" | "INACTIVE";
  userId: number;
  departmentId: number;
  createdAt: string;
  updatedAt: string;
  department: EmployeeDepartment;
  user: EmployeeUser;
}

interface GetEmployeesResponse {
  success: boolean;
  data: Employee[];
}

interface GetEmployeeResponse {
  success: boolean;
  data: Employee;
}

interface CreateEmployeeResponse {
  success: boolean;
  data: Employee;
}

interface UpdateEmployeeResponse {
  success: boolean;
  data: Employee;
}

export interface CreateEmployeeRequest {
  employeeNumber: string;
  firstName: string;
  lastName: string;
  position: string;
  hireDate: string;
  status: "ACTIVE" | "INACTIVE";
  userId: number;
  departmentId: number;
}

export interface UpdateEmployeeRequest {
  employeeNumber?: string;
  firstName?: string;
  lastName?: string;
  position?: string;
  hireDate?: string;
  status?: "ACTIVE" | "INACTIVE";
  userId?: number;
  departmentId?: number;
}

export async function getEmployees(): Promise<Employee[]> {
  const response = await apiClient<GetEmployeesResponse>("/employees", {
    method: "GET",
    requiresAuth: true,
  });

  return response.data;
}

export async function getEmployeeById(id: number): Promise<Employee> {
  const response = await apiClient<GetEmployeeResponse>(`/employees/${id}`, {
    method: "GET",
    requiresAuth: true,
  });

  return response.data;
}

export async function createEmployee(
  data: CreateEmployeeRequest,
): Promise<Employee> {
  const response = await apiClient<CreateEmployeeResponse>("/employees", {
    method: "POST",
    requiresAuth: true,
    body: JSON.stringify(data),
  });

  return response.data;
}

export async function updateEmployee(
  id: number,
  data: UpdateEmployeeRequest,
): Promise<Employee> {
  const response = await apiClient<UpdateEmployeeResponse>(`/employees/${id}`, {
    method: "PUT",
    requiresAuth: true,
    body: JSON.stringify(data),
  });

  return response.data;
}

export async function deleteEmployee(id: number): Promise<void> {
  await apiClient<void>(`/employees/${id}`, {
    method: "DELETE",
    requiresAuth: true,
  });
}
