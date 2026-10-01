import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import authRepository from "../repositories/auth.repository.js";
import { env } from "../config/env.js";
import { USER_STATUS } from "../constants/user-status.js";
import { AppError } from "../errors/app.error.js";

export class AuthService {
  async login(email: string, password: string) {
    const user = await authRepository.findUserByEmail(email);

    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    if (user.status === USER_STATUS.INACTIVE) {
      throw new AppError(
        "Your account is inactive. Please contact an administrator.",
        403,
      );
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      throw new AppError("Invalid email or password", 401);
    }

    const token = jwt.sign(
      {
        userId: user.id,
        roleId: user.roleId,
      },
      env.jwtSecret,
      {
        expiresIn: "1h",
      },
    );

    const { passwordHash, ...safeUser } = user;

    return {
      user: safeUser,
      token,
    };
  }

  async getCurrentUser(userId: number) {
    const user = await authRepository.findUserById(userId);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  }
}

export default new AuthService();
