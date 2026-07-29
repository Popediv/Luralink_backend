import { prisma } from "../config/db.js";

import matchingService from "../services/matching.service.js";

import { successResponse, errorResponse } from "../utils/responseFormatter.js";

function getMatchingOptions(query) {
  const limit = query.limit === undefined ? 20 : Number(query.limit);

  const maximumDistance =
    query.maxDistance === undefined ? 50 : Number(query.maxDistance);

  const validLimit = Number.isInteger(limit) && limit >= 1 && limit <= 50;

  const validDistance =
    Number.isFinite(maximumDistance) &&
    maximumDistance >= 1 &&
    maximumDistance <= 500;

  if (!validLimit || !validDistance) {
    return null;
  }

  return {
    limit,
    maximumDistance,
  };
}

export async function getRecommendedShifts(req, res, next) {
  try {
    const options = getMatchingOptions(req.query);

    if (!options) {
      return errorResponse(
        res,
        400,
        "limit must be 1-50 and maxDistance must be 1-500 kilometres",
        "INVALID_MATCH_OPTIONS",
      );
    }

    const worker = await prisma.worker.findUnique({
      where: {
        userId: req.user.id,
      },
    });

    if (!worker) {
      return errorResponse(
        res,
        404,
        "Worker profile not found",
        "WORKER_NOT_FOUND",
      );
    }

    if (worker.availability !== "available") {
      return successResponse(res, 200, []);
    }

    const matches = await matchingService.recommendShifts(worker, options);

    return successResponse(res, 200, matches);
  } catch (error) {
    next(error);
  }
}

export async function getRecommendedWorkers(req, res, next) {
  try {
    const shiftId = Number(req.params.shiftId);

    if (!Number.isInteger(shiftId) || shiftId < 1) {
      return errorResponse(res, 400, "Invalid shift ID", "INVALID_SHIFT_ID");
    }

    const options = getMatchingOptions(req.query);

    if (!options) {
      return errorResponse(
        res,
        400,
        "limit must be 1-50 and maxDistance must be 1-500 kilometres",
        "INVALID_MATCH_OPTIONS",
      );
    }

    const facility = await prisma.facility.findUnique({
      where: {
        userId: req.user.id,
      },
    });

    const shift = await prisma.shift.findUnique({
      where: {
        id: shiftId,
      },
    });

    if (!shift) {
      return errorResponse(res, 404, "Shift not found", "SHIFT_NOT_FOUND");
    }

    if (!facility || shift.facilityId !== facility.id) {
      return errorResponse(
        res,
        403,
        "You can only match workers to your facility shifts",
        "MATCH_FORBIDDEN",
      );
    }

    if (shift.status !== "open") {
      return errorResponse(
        res,
        409,
        "Workers can only be matched to open shifts",
        "SHIFT_NOT_OPEN",
      );
    }

    const matches = await matchingService.recommendWorkers(shift, options);

    return successResponse(res, 200, matches);
  } catch (error) {
    next(error);
  }
}
