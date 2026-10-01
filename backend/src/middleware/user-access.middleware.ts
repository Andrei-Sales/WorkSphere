import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth.middleware.js";
import { ROLE } from "../constants/roles.js";

export function requireUserAccess(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const requestedUserId = Number(req.params.id);

  if (!Number.isInteger(requestedUserId) || requestedUserId <= 0) {
    res.status(400).json({
      success: false,
      message: "Invalid user ID",
    });
    return;
  }

  // ADMIN can access any user
  if (req.user.roleId === ROLE.ADMIN) {
    next();
    return;
  }

  // Regular users can only access themselves
  if (req.user.userId !== requestedUserId) {
    res.status(403).json({
      success: false,
      message: "Access denied",
    });
    return;
  }

  next();
}
