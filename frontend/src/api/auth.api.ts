import { apiClient } from "./client";
import type { UserStatus } from "../constants/user-status";

export interface Role {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: number;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  position: string;
  hireDate: string;
  status: string;
  userId: number;
  departmentId: number;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  roleId: number;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  role: Role;
  employee: Employee | null;
}

export interface UpdateUserRequest {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  roleId?: number;
  status?: UserStatus;
}

interface LoginResponse {
  success: boolean;
  data: {
    user: User;
  };
}

interface MeResponse {
  success: boolean;
  data: User;
}

export async function login(
  email: string,
  password: string,
): Promise<LoginResponse["data"]> {
  const response = await apiClient<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  });

  return response.data;
}

export async function logout(): Promise<void> {
  await apiClient("/auth/logout", {
    method: "POST",
    requiresAuth: true,
  });
}

export async function getCurrentUser(): Promise<User> {
  const response = await apiClient<MeResponse>("/auth/me", {
    method: "GET",
    requiresAuth: true,
  });

  return response.data;
}
