import { Router } from "express";

import dashboardController from "../controllers/dashboard.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.get(
  "/",
  authenticate,
  dashboardController.getDashboard.bind(dashboardController),
);

export default router;
