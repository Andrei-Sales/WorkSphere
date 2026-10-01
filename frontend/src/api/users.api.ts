import { apiClient } from "./client";
import type { User } from "./auth.api";
import type { UserStatus } from "../constants/user-status";

interface GetUsersResponse {
  success: boolean;
  data: User[];
}

interface GetUserResponse {
  success: boolean;
  data: User;
}

interface CreateUserResponse {
  success: boolean;
  data: User;
}

interface UpdateUserResponse {
  success: boolean;
  data: User;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleId: number;
}

export interface UpdateUserRequest {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  roleId?: number;
  status?: UserStatus;
}

export async function getUsers(): Promise<User[]> {
  const response = await apiClient<GetUsersResponse>("/users", {
    method: "GET",
    requiresAuth: true,
  });

  return response.data;
}

export async function getUserById(id: number): Promise<User> {
  const response = await apiClient<GetUserResponse>(`/users/${id}`, {
    method: "GET",
    requiresAuth: true,
  });

  return response.data;
}

export async function createUser(data: CreateUserRequest): Promise<User> {
  const response = await apiClient<CreateUserResponse>("/users", {
    method: "POST",
    requiresAuth: true,
    body: JSON.stringify(data),
  });

  return response.data;
}

export async function updateUser(
  id: number,
  data: UpdateUserRequest,
): Promise<User> {
  const response = await apiClient<UpdateUserResponse>(`/users/${id}`, {
    method: "PUT",
    requiresAuth: true,
    body: JSON.stringify(data),
  });

  return response.data;
}

export async function deleteUser(id: number): Promise<void> {
  await apiClient<void>(`/users/${id}`, {
    method: "DELETE",
    requiresAuth: true,
  });
}
