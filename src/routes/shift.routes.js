import express from "express";

import {
  createShift,
  deleteShift,
  getShift,
  listMyShifts,
  listShifts,
  updateShift,
} from "../controllers/shift.controller.js";

import { authMiddleware } from "../middleware/auth.middleware.js";

import roleMiddleware from "../middleware/role.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", listShifts);

router.get("/mine", roleMiddleware(["facility_admin"]), listMyShifts);

router.get("/:id", getShift);

router.post("/", roleMiddleware(["facility_admin"]), createShift);

router.patch("/:id", roleMiddleware(["facility_admin"]), updateShift);

router.delete("/:id", roleMiddleware(["facility_admin"]), deleteShift);

export default router;
