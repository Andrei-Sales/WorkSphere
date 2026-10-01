import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth.middleware.js";

export function requireRole(...allowedRoles: number[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    if (!allowedRoles.includes(req.user.roleId)) {
      res.status(403).json({
        success: false,
        message: "Access denied",
      });
      return;
    }

    next();
  };
}
