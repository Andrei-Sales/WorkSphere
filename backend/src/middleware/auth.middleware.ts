import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import { env } from "../config/env.js";
import { AUTH_COOKIE_NAME, authCookieOptions } from "../config/cookie.js";
import authRepository from "../repositories/auth.repository.js";
import { USER_STATUS } from "../constants/user-status.js";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    roleId: number;
  };
}

export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const token = req.cookies?.[AUTH_COOKIE_NAME];

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const decoded = jwt.verify(token, env.jwtSecret);

    if (
      typeof decoded !== "object" ||
      decoded === null ||
      typeof decoded.userId !== "number" ||
      typeof decoded.roleId !== "number"
    ) {
      res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
      return;
    }

    const user = await authRepository.findUserStatusById(decoded.userId);

    if (!user) {
      res.clearCookie(AUTH_COOKIE_NAME, authCookieOptions);

      res.status(401).json({
        success: false,
        message: "User account no longer exists",
      });
      return;
    }

    if (user.status === USER_STATUS.INACTIVE) {
      res.clearCookie(AUTH_COOKIE_NAME, authCookieOptions);

      res.status(403).json({
        success: false,
        message: "Your account is inactive. Please contact an administrator.",
      });
      return;
    }

    req.user = {
      userId: decoded.userId,
      roleId: decoded.roleId,
    };

    next();
  } catch (error) {
    console.error("Authentication failed:", error);

    res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token",
    });
  }
}
