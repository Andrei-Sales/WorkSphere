import bcrypt from "bcrypt";
import userRepository from "../repositories/user.repository.js";
import { AppError } from "../errors/app.error.js";

export class UserService {
  async getAllUsers() {
    return userRepository.findAll();
  }

  async getUserById(id: number) {
    const user = await userRepository.findById(id);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  }

  async createUser(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    roleId: number;
  }) {
    const existingUser = await userRepository.findByEmail(data.email);

    if (existingUser) {
      throw new AppError("Email already exists", 409);
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    return userRepository.create({
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      roleId: data.roleId,
    });
  }

  async updateUser(
    id: number,
    data: {
      email?: string;
      password?: string;
      firstName?: string;
      lastName?: string;
      roleId?: number;
      status?: string;
    },
    currentUserId?: number,
  ) {
    const existingUser = await userRepository.findById(id);

    if (!existingUser) {
      throw new AppError("User not found", 404);
    }

    if (currentUserId === id && data.status === "INACTIVE") {
      throw new AppError("You cannot deactivate your own account", 400);
    }

    if (data.email) {
      const emailOwner = await userRepository.findByEmail(data.email);

      if (emailOwner && emailOwner.id !== id) {
        throw new AppError("Email already exists", 409);
      }
    }

    const updateData: {
      email?: string;
      passwordHash?: string;
      firstName?: string;
      lastName?: string;
      roleId?: number;
      status?: string;
    } = {};

    if (data.email !== undefined) {
      updateData.email = data.email;
    }

    if (data.firstName !== undefined) {
      updateData.firstName = data.firstName;
    }

    if (data.lastName !== undefined) {
      updateData.lastName = data.lastName;
    }

    if (data.roleId !== undefined) {
      updateData.roleId = data.roleId;
    }

    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 12);
    }

    if (data.status !== undefined) {
      updateData.status = data.status;
    }

    return userRepository.update(id, updateData);
  }

  async deleteUser(id: number, currentUserId?: number) {
    const existingUser = await userRepository.findById(id);

    if (!existingUser) {
      throw new AppError("User not found", 404);
    }

    if (currentUserId === id) {
      throw new AppError("You cannot delete your own account", 400);
    }

    await userRepository.delete(id);
  }
}

export default new UserService();
