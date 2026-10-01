import { apiClient } from "./client";

export interface Department {
  id: number;
  name: string;
  employeeCount: number;
  createdAt: string;
  updatedAt: string;
}

interface GetDepartmentsResponse {
  success: boolean;
  data: Department[];
}

interface GetDepartmentResponse {
  success: boolean;
  data: Department;
}

interface CreateDepartmentResponse {
  success: boolean;
  data: Department;
}

interface UpdateDepartmentResponse {
  success: boolean;
  data: Department;
}

export interface CreateDepartmentRequest {
  name: string;
}

export interface UpdateDepartmentRequest {
  name: string;
}

export async function getDepartments(): Promise<Department[]> {
  const response = await apiClient<GetDepartmentsResponse>("/departments", {
    method: "GET",
    requiresAuth: true,
  });

  return response.data;
}

export async function getDepartmentById(id: number): Promise<Department> {
  const response = await apiClient<GetDepartmentResponse>(
    `/departments/${id}`,
    {
      method: "GET",
      requiresAuth: true,
    },
  );

  return response.data;
}

export async function createDepartment(
  data: CreateDepartmentRequest,
): Promise<Department> {
  const response = await apiClient<CreateDepartmentResponse>("/departments", {
    method: "POST",
    requiresAuth: true,
    body: JSON.stringify(data),
  });

  return response.data;
}

export async function updateDepartment(
  id: number,
  data: UpdateDepartmentRequest,
): Promise<Department> {
  const response = await apiClient<UpdateDepartmentResponse>(
    `/departments/${id}`,
    {
      method: "PUT",
      requiresAuth: true,
      body: JSON.stringify(data),
    },
  );

  return response.data;
}

export async function deleteDepartment(id: number): Promise<void> {
  await apiClient<void>(`/departments/${id}`, {
    method: "DELETE",
    requiresAuth: true,
  });
}
