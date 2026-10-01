import { Router } from "express";

import userController from "../controllers/user.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { requireUserAccess } from "../middleware/user-access.middleware.js";
import { validate } from "../middleware/validation.middleware.js";

import {
  createUserSchema,
  updateUserSchema,
} from "../validators/user.validator.js";

import { ROLE } from "../constants/roles.js";

const router = Router();

router.get(
  "/",
  authenticate,
  requireRole(ROLE.ADMIN),
  userController.getAllUsers.bind(userController),
);

router.post(
  "/",
  authenticate,
  requireRole(ROLE.ADMIN),
  validate(createUserSchema),
  userController.createUser.bind(userController),
);

router.get(
  "/:id",
  authenticate,
  requireUserAccess,
  userController.getUserById.bind(userController),
);

router.put(
  "/:id",
  authenticate,
  requireRole(ROLE.ADMIN),
  validate(updateUserSchema),
  userController.updateUser.bind(userController),
);

router.delete(
  "/:id",
  authenticate,
  requireRole(ROLE.ADMIN),
  userController.deleteUser.bind(userController),
);

export default router;
