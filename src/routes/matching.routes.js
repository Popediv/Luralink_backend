import express from "express";

import {
  getRecommendedShifts,
  getRecommendedWorkers,
} from "../controllers/matching.controller.js";

import { authMiddleware } from "../middleware/auth.middleware.js";

import roleMiddleware from "../middleware/role.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/shifts", roleMiddleware(["worker"]), getRecommendedShifts);

router.get(
  "/shifts/:shiftId/workers",
  roleMiddleware(["facility_admin"]),
  getRecommendedWorkers,
);

export default router;
