import { Router } from "express";

import departmentController from "../controllers/department.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import { ROLE } from "../constants/roles.js";
import {
  createDepartmentSchema,
  updateDepartmentSchema,
} from "../validators/department.validator.js";

const router = Router();

router.get("/", authenticate, requireRole(ROLE.ADMIN), (req, res) =>
  departmentController.getAllDepartments(req, res),
);

router.post(
  "/",
  authenticate,
  requireRole(ROLE.ADMIN),
  validate(createDepartmentSchema),
  (req, res) => departmentController.createDepartment(req, res),
);

router.get("/:id", authenticate, requireRole(ROLE.ADMIN), (req, res) =>
  departmentController.getDepartmentById(req, res),
);

router.put(
  "/:id",
  authenticate,
  requireRole(ROLE.ADMIN),
  validate(updateDepartmentSchema),
  (req, res) => departmentController.updateDepartment(req, res),
);

router.delete("/:id", authenticate, requireRole(ROLE.ADMIN), (req, res) =>
  departmentController.deleteDepartment(req, res),
);

export default router;
