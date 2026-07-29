import { prisma } from "../config/db.js";
import { successResponse, errorResponse } from "../utils/responseFormatter.js";

const SHIFT_STATUSES = [
  "open",
  "assigned",
  "in_progress",
  "completed_pending_confirmation",
  "completed",
  "paid",
];

const facilityInclude = {
  facility: {
    select: {
      id: true,
      name: true,
      type: true,
      address: true,
      latitude: true,
      longitude: true,
    },
  },
};

function parsePositiveInteger(value, fallback) {
  if (value === undefined) return fallback;

  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function validateShift(data, partial = false) {
  const errors = [];
  const requiredFields = [
    "title",
    "specialty",
    "payRate",
    "startTime",
    "endTime",
  ];

  if (!partial) {
    for (const field of requiredFields) {
      if (
        data[field] === undefined ||
        data[field] === null ||
        data[field] === ""
      ) {
        errors.push(`${field} is required`);
      }
    }
  }

  for (const field of ["title", "specialty"]) {
    if (
      data[field] !== undefined &&
      (typeof data[field] !== "string" || data[field].trim().length < 2)
    ) {
      errors.push(`${field} must contain at least 2 characters`);
    }
  }

  if (
    data.payRate !== undefined &&
    (!Number.isFinite(Number(data.payRate)) || Number(data.payRate) <= 0)
  ) {
    errors.push("payRate must be greater than 0");
  }

  for (const field of ["startTime", "endTime"]) {
    if (
      data[field] !== undefined &&
      Number.isNaN(new Date(data[field]).getTime())
    ) {
      errors.push(`${field} must be a valid date`);
    }
  }

  if (
    data.startTime !== undefined &&
    data.endTime !== undefined &&
    !Number.isNaN(new Date(data.startTime).getTime()) &&
    !Number.isNaN(new Date(data.endTime).getTime()) &&
    new Date(data.endTime) <= new Date(data.startTime)
  ) {
    errors.push("endTime must be after startTime");
  }

  if (
    data.latitude !== undefined &&
    (!Number.isFinite(Number(data.latitude)) ||
      Number(data.latitude) < -90 ||
      Number(data.latitude) > 90)
  ) {
    errors.push("latitude must be between -90 and 90");
  }

  if (
    data.longitude !== undefined &&
    (!Number.isFinite(Number(data.longitude)) ||
      Number(data.longitude) < -180 ||
      Number(data.longitude) > 180)
  ) {
    errors.push("longitude must be between -180 and 180");
  }

  return errors;
}

function formatShiftData(body) {
  const data = {};

  for (const field of ["title", "specialty"]) {
    if (body[field] !== undefined) {
      data[field] = body[field].trim();
    }
  }

  for (const field of ["payRate", "latitude", "longitude"]) {
    if (body[field] !== undefined) {
      data[field] = Number(body[field]);
    }
  }

  for (const field of ["startTime", "endTime"]) {
    if (body[field] !== undefined) {
      data[field] = new Date(body[field]);
    }
  }

  return data;
}

async function getAuthenticatedFacility(userId) {
  return prisma.facility.findUnique({
    where: { userId },
  });
}

export async function createShift(req, res, next) {
  try {
    const errors = validateShift(req.body);

    if (errors.length > 0) {
      return errorResponse(
        res,
        400,
        errors.join(", "),
        "SHIFT_VALIDATION_FAILED",
      );
    }

    const facility = await getAuthenticatedFacility(req.user.id);

    if (!facility) {
      return errorResponse(
        res,
        403,
        "Complete your facility profile first",
        "FACILITY_PROFILE_REQUIRED",
      );
    }

    const shift = await prisma.shift.create({
      data: {
        ...formatShiftData(req.body),
        facilityId: facility.id,
      },
      include: facilityInclude,
    });

    return successResponse(res, 201, shift);
  } catch (error) {
    next(error);
  }
}

export async function listShifts(req, res, next) {
  try {
    const page = parsePositiveInteger(req.query.page, 1);
    const limit = parsePositiveInteger(req.query.limit, 20);

    if (!page || !limit || limit > 100) {
      return errorResponse(
        res,
        400,
        "page and limit must be positive integers; limit cannot exceed 100",
        "INVALID_PAGINATION",
      );
    }

    if (req.query.status && !SHIFT_STATUSES.includes(req.query.status)) {
      return errorResponse(
        res,
        400,
        "Invalid shift status",
        "INVALID_SHIFT_STATUS",
      );
    }

    const where = {
      status: req.query.status || "open",
    };

    if (req.query.specialty) {
      where.specialty = {
        contains: req.query.specialty.trim(),
        mode: "insensitive",
      };
    }

    if (req.query.minPay || req.query.maxPay) {
      where.payRate = {};

      if (req.query.minPay) {
        where.payRate.gte = Number(req.query.minPay);
      }

      if (req.query.maxPay) {
        where.payRate.lte = Number(req.query.maxPay);
      }

      const invalidNumber = Object.values(where.payRate).some(
        (value) => !Number.isFinite(value),
      );

      const invalidRange =
        where.payRate.gte !== undefined &&
        where.payRate.lte !== undefined &&
        where.payRate.gte > where.payRate.lte;

      if (invalidNumber || invalidRange) {
        return errorResponse(
          res,
          400,
          "Invalid pay range",
          "INVALID_PAY_RANGE",
        );
      }
    }

    if (req.query.from || req.query.to) {
      where.startTime = {};

      if (req.query.from) {
        where.startTime.gte = new Date(req.query.from);
      }

      if (req.query.to) {
        where.startTime.lte = new Date(req.query.to);
      }

      const invalidDate = Object.values(where.startTime).some((date) =>
        Number.isNaN(date.getTime()),
      );

      if (invalidDate) {
        return errorResponse(
          res,
          400,
          "Invalid date range",
          "INVALID_DATE_RANGE",
        );
      }
    }

    const [items, total] = await prisma.$transaction([
      prisma.shift.findMany({
        where,
        include: facilityInclude,
        orderBy: {
          startTime: "asc",
        },
        skip: (page - 1) * limit,
        take: limit,
      }),

      prisma.shift.count({
        where,
      }),
    ]);

    return successResponse(res, 200, {
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getShift(req, res, next) {
  try {
    const id = parsePositiveInteger(req.params.id, null);

    if (!id) {
      return errorResponse(res, 400, "Invalid shift ID", "INVALID_SHIFT_ID");
    }

    const shift = await prisma.shift.findUnique({
      where: { id },
      include: facilityInclude,
    });

    if (!shift) {
      return errorResponse(res, 404, "Shift not found", "SHIFT_NOT_FOUND");
    }

    return successResponse(res, 200, shift);
  } catch (error) {
    next(error);
  }
}

export async function listMyShifts(req, res, next) {
  try {
    const facility = await getAuthenticatedFacility(req.user.id);

    if (!facility) {
      return errorResponse(
        res,
        403,
        "Facility profile required",
        "FACILITY_PROFILE_REQUIRED",
      );
    }

    if (req.query.status && !SHIFT_STATUSES.includes(req.query.status)) {
      return errorResponse(
        res,
        400,
        "Invalid shift status",
        "INVALID_SHIFT_STATUS",
      );
    }

    const shifts = await prisma.shift.findMany({
      where: {
        facilityId: facility.id,
        ...(req.query.status ? { status: req.query.status } : {}),
      },
      include: facilityInclude,
      orderBy: {
        createdAt: "desc",
      },
    });

    return successResponse(res, 200, shifts);
  } catch (error) {
    next(error);
  }
}

export async function updateShift(req, res, next) {
  try {
    const id = parsePositiveInteger(req.params.id, null);

    if (!id) {
      return errorResponse(res, 400, "Invalid shift ID", "INVALID_SHIFT_ID");
    }

    const errors = validateShift(req.body, true);

    if (errors.length > 0) {
      return errorResponse(
        res,
        400,
        errors.join(", "),
        "SHIFT_VALIDATION_FAILED",
      );
    }

    const updateData = formatShiftData(req.body);

    if (Object.keys(updateData).length === 0) {
      return errorResponse(
        res,
        400,
        "No valid fields supplied",
        "SHIFT_NO_CHANGES",
      );
    }

    const facility = await getAuthenticatedFacility(req.user.id);

    const existingShift = await prisma.shift.findUnique({
      where: { id },
    });

    if (!existingShift) {
      return errorResponse(res, 404, "Shift not found", "SHIFT_NOT_FOUND");
    }

    if (!facility || existingShift.facilityId !== facility.id) {
      return errorResponse(
        res,
        403,
        "You can only update your facility shifts",
        "SHIFT_FORBIDDEN",
      );
    }

    if (existingShift.status !== "open") {
      return errorResponse(
        res,
        409,
        "Only open shifts can be updated",
        "SHIFT_NOT_EDITABLE",
      );
    }

    const mergedErrors = validateShift({
      ...existingShift,
      ...req.body,
    });

    if (mergedErrors.length > 0) {
      return errorResponse(
        res,
        400,
        mergedErrors.join(", "),
        "SHIFT_VALIDATION_FAILED",
      );
    }

    const updatedShift = await prisma.shift.update({
      where: { id },
      data: updateData,
      include: facilityInclude,
    });

    return successResponse(res, 200, updatedShift);
  } catch (error) {
    next(error);
  }
}

export async function deleteShift(req, res, next) {
  try {
    const id = parsePositiveInteger(req.params.id, null);

    if (!id) {
      return errorResponse(res, 400, "Invalid shift ID", "INVALID_SHIFT_ID");
    }

    const facility = await getAuthenticatedFacility(req.user.id);

    const shift = await prisma.shift.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    if (!shift) {
      return errorResponse(res, 404, "Shift not found", "SHIFT_NOT_FOUND");
    }

    if (!facility || shift.facilityId !== facility.id) {
      return errorResponse(
        res,
        403,
        "You can only delete your facility shifts",
        "SHIFT_FORBIDDEN",
      );
    }

    if (shift.status !== "open" || shift._count.applications > 0) {
      return errorResponse(
        res,
        409,
        "Only open shifts without applications can be deleted",
        "SHIFT_NOT_DELETABLE",
      );
    }

    await prisma.shift.delete({
      where: { id },
    });

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
}


// Worker marks shift as complete → moves to completed_pending_confirmation
export async function markShiftComplete(req, res, next) {
  try {
    const id = parsePositiveInteger(req.params.id, null);
    if (!id) {
      return errorResponse(res, 400, 'Invalid shift ID', 'INVALID_SHIFT_ID');
    }

    const worker = await prisma.worker.findUnique({ where: { userId: req.user.id } });
    if (!worker) {
      return errorResponse(res, 403, 'Worker profile required', 'WORKER_PROFILE_REQUIRED');
    }

    const shift = await prisma.shift.findUnique({ where: { id } });
    if (!shift) {
      return errorResponse(res, 404, 'Shift not found', 'SHIFT_NOT_FOUND');
    }
    if (shift.workerId !== worker.id) {
      return errorResponse(res, 403, 'You are not assigned to this shift', 'SHIFT_FORBIDDEN');
    }
    if (shift.status !== 'in_progress') {
      return errorResponse(
        res, 409,
        'Only in-progress shifts can be marked as complete',
        'SHIFT_NOT_IN_PROGRESS',
      );
    }

    const updated = await prisma.shift.update({
      where: { id },
      data: { status: 'completed_pending_confirmation', completedAt: new Date() },
      include: facilityInclude,
    });

    return successResponse(res, 200, updated);
  } catch (err) {
    next(err);
  }
}

// Facility confirms shift completion → moves to completed
export async function confirmShiftComplete(req, res, next) {
  try {
    const id = parsePositiveInteger(req.params.id, null);
    if (!id) {
      return errorResponse(res, 400, 'Invalid shift ID', 'INVALID_SHIFT_ID');
    }

    const facility = await getAuthenticatedFacility(req.user.id);
    if (!facility) {
      return errorResponse(res, 403, 'Facility profile required', 'FACILITY_PROFILE_REQUIRED');
    }

    const shift = await prisma.shift.findUnique({ where: { id } });
    if (!shift) {
      return errorResponse(res, 404, 'Shift not found', 'SHIFT_NOT_FOUND');
    }
    if (shift.facilityId !== facility.id) {
      return errorResponse(res, 403, 'This shift does not belong to your facility', 'SHIFT_FORBIDDEN');
    }
    if (shift.status !== 'completed_pending_confirmation') {
      return errorResponse(
        res, 409,
        'Shift must be in completed_pending_confirmation state to confirm',
        'SHIFT_NOT_PENDING_CONFIRMATION',
      );
    }

    const updated = await prisma.shift.update({
      where: { id },
      data: { status: 'completed' },
      include: facilityInclude,
    });

    return successResponse(res, 200, updated);
  } catch (err) {
    next(err);
  }
}

export { SHIFT_STATUSES, validateShift };
