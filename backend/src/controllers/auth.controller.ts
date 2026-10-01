import { Request, Response } from "express";
import authService from "../services/auth.service.js";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { AUTH_COOKIE_NAME, authCookieOptions } from "../config/cookie.js";

export class AuthController {
  async login(req: Request, res: Response) {
    const { email, password } = req.body;

    const result = await authService.login(email, password);

    res.cookie(AUTH_COOKIE_NAME, result.token, authCookieOptions);

    res.status(200).json({
      success: true,
      data: {
        user: result.user,
      },
    });
  }

  async logout(_req: Request, res: Response) {
    res.clearCookie(AUTH_COOKIE_NAME, authCookieOptions);

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  }

  async me(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Unauthenticated",
      });
      return;
    }

    const user = await authService.getCurrentUser(req.user.userId);

    res.status(200).json({
      success: true,
      data: user,
    });
  }
}

export default new AuthController();
