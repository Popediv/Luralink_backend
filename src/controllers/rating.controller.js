import { prisma } from '../config/db.js';
import { successResponse, errorResponse } from '../utils/responseFormatter.js';

function parsePositiveInteger(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

// Recalculate and persist the worker's average rating
async function refreshWorkerRating(toUserId) {
  const targetWorker = await prisma.worker.findFirst({ where: { userId: toUserId } });
  if (!targetWorker) return;

  const { _avg } = await prisma.rating.aggregate({
    where: { toUserId },
    _avg: { score: true },
  });

  await prisma.worker.update({
    where: { id: targetWorker.id },
    data: { rating: _avg.score ?? 0 },
  });
}

// POST /api/ratings — submit a rating after a completed/paid shift
export async function submitRating(req, res, next) {
  try {
    const { shiftId, toUserId, score, comment } = req.body;

    const parsedShiftId = parsePositiveInteger(shiftId);
    const parsedToUserId = parsePositiveInteger(toUserId);

    if (!parsedShiftId) {
      return errorResponse(res, 400, 'Invalid shiftId', 'INVALID_SHIFT_ID');
    }
    if (!parsedToUserId) {
      return errorResponse(res, 400, 'Invalid toUserId', 'INVALID_USER_ID');
    }
    if (!Number.isInteger(score) || score < 1 || score > 5) {
      return errorResponse(res, 400, 'score must be an integer between 1 and 5', 'INVALID_SCORE');
    }
    if (req.user.id === parsedToUserId) {
      return errorResponse(res, 400, 'You cannot rate yourself', 'SELF_RATING');
    }

    // Shift must be completed or paid before ratings are allowed
    const shift = await prisma.shift.findUnique({
      where: { id: parsedShiftId },
      include: {
        facility: true,
        worker: true,
      },
    });

    if (!shift) {
      return errorResponse(res, 404, 'Shift not found', 'SHIFT_NOT_FOUND');
    }

    if (!['completed', 'paid'].includes(shift.status)) {
      return errorResponse(
        res,
        409,
        'Ratings can only be submitted for completed or paid shifts',
        'SHIFT_NOT_COMPLETE',
      );
    }

    // Caller must have been part of the shift
    const callerIsWorker = shift.worker?.userId === req.user.id;
    const callerIsFacilityAdmin = shift.facility?.userId === req.user.id;

    if (!callerIsWorker && !callerIsFacilityAdmin) {
      return errorResponse(
        res,
        403,
        'You were not part of this shift',
        'RATING_FORBIDDEN',
      );
    }

    // Prevent duplicates: one rating per user per shift
    const existing = await prisma.rating.findFirst({
      where: { fromUserId: req.user.id, shiftId: parsedShiftId },
    });
    if (existing) {
      return errorResponse(
        res,
        409,
        'You have already submitted a rating for this shift',
        'ALREADY_RATED',
      );
    }

    const rating = await prisma.rating.create({
      data: {
        fromUserId: req.user.id,
        toUserId: parsedToUserId,
        shiftId: parsedShiftId,
        score,
        comment: comment?.trim() || null,
      },
    });

    // Recalculate worker average in the background
    refreshWorkerRating(parsedToUserId).catch(() => { });

    return successResponse(res, 201, rating);
  } catch (err) {
    next(err);
  }
}

// GET /api/ratings/user/:userId — all ratings received by a specific user
export async function getUserRatings(req, res, next) {
  try {
    const userId = parsePositiveInteger(req.params.userId);
    if (!userId) {
      return errorResponse(res, 400, 'Invalid user ID', 'INVALID_USER_ID');
    }

    const ratings = await prisma.rating.findMany({
      where: { toUserId: userId },
      include: {
        fromUser: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const avg =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length
        : null;

    return successResponse(res, 200, {
      ratings,
      summary: {
        total: ratings.length,
        average: avg !== null ? Number(avg.toFixed(2)) : null,
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/ratings/my — all ratings the logged-in user has received
export async function getMyRatings(req, res, next) {
  try {
    const ratings = await prisma.rating.findMany({
      where: { toUserId: req.user.id },
      include: {
        fromUser: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(res, 200, ratings);
  } catch (err) {
    next(err);
  }
}
