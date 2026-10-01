import { Router } from "express";

import employeeController from "../controllers/employee.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import { ROLE } from "../constants/roles.js";

import {
  createEmployeeSchema,
  updateEmployeeSchema,
} from "../validators/employee.validator.js";

const router = Router();

router.get("/", authenticate, requireRole(ROLE.ADMIN), (req, res) =>
  employeeController.getAllEmployees(req, res),
);

router.post(
  "/",
  authenticate,
  requireRole(ROLE.ADMIN),
  validate(createEmployeeSchema),
  (req, res) => employeeController.createEmployee(req, res),
);

router.get("/:id", authenticate, requireRole(ROLE.ADMIN), (req, res) =>
  employeeController.getEmployeeById(req, res),
);

router.put(
  "/:id",
  authenticate,
  requireRole(ROLE.ADMIN),
  validate(updateEmployeeSchema),
  (req, res) => employeeController.updateEmployee(req, res),
);

router.delete("/:id", authenticate, requireRole(ROLE.ADMIN), (req, res) =>
  employeeController.deleteEmployee(req, res),
);

export default router;
