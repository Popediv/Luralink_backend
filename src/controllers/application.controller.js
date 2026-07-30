import { prisma } from '../config/db.js';
import { successResponse, errorResponse } from '../utils/responseFormatter.js';
import NotificationService from '../services/notification.service.js';

const REQUIRED_DOCUMENT_TYPES = ['license', 'government_id', 'photo'];

function parsePositiveInteger(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

async function isWorkerVerified(userId) {
  const verifications = await prisma.verification.findMany({
    where: { userId, status: 'approved' }
  });
  const approvedTypes = new Set(verifications.map((v) => v.documentType));
  return REQUIRED_DOCUMENT_TYPES.every((type) => approvedTypes.has(type));
}

async function notifySafely(payload) {
  try {
    await NotificationService.triggerNotification(payload);
  } catch (err) {
    // Non-blocking: a notification failure should never break the main flow
  }
}

export async function applyToShift(req, res, next) {
  try {
    const shiftId = parsePositiveInteger(req.params.id);
    if (!shiftId) {
      return errorResponse(res, 400, 'Invalid shift ID', 'INVALID_SHIFT_ID');
    }

    const worker = await prisma.worker.findUnique({ where: { userId: req.user.id } });
    if (!worker) {
      return errorResponse(res, 403, 'Worker profile required', 'WORKER_PROFILE_REQUIRED');
    }

    const verified = await isWorkerVerified(req.user.id);
    if (!verified) {
      return errorResponse(res, 403, 'Your credentials must be fully verified before applying', 'WORKER_NOT_VERIFIED');
    }

    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
      include: { payment: true }
    });

    if (!shift) {
      return errorResponse(res, 404, 'Shift not found', 'SHIFT_NOT_FOUND');
    }

    if (shift.status !== 'open') {
      return errorResponse(res, 409, 'This shift is no longer open for applications', 'SHIFT_NOT_OPEN');
    }

    if (shift.payment && shift.payment.escrowStatus !== 'funded') {
      return errorResponse(res, 409, 'This shift is not yet funded', 'SHIFT_NOT_FUNDED');
    }

    const existingApplication = await prisma.application.findFirst({
      where: { shiftId, workerId: worker.id }
    });
    if (existingApplication) {
      return errorResponse(res, 409, 'You have already applied to this shift', 'ALREADY_APPLIED');
    }

    const application = await prisma.application.create({
      data: { shiftId, workerId: worker.id, status: 'applied' }
    });

    const facility = await prisma.facility.findUnique({ where: { id: shift.facilityId } });
    if (facility) {
      await notifySafely({
        recipientId: facility.userId,
        title: 'New shift application',
        message: `A worker applied to your shift "${shift.title}".`,
        type: 'application',
        relatedId: application.id
      });
    }

    return successResponse(res, 201, application);
  } catch (error) {
    next(error);
  }
}

export async function getShiftApplicants(req, res, next) {
  try {
    const shiftId = parsePositiveInteger(req.params.id);
    if (!shiftId) {
      return errorResponse(res, 400, 'Invalid shift ID', 'INVALID_SHIFT_ID');
    }

    const facility = await prisma.facility.findUnique({ where: { userId: req.user.id } });
    if (!facility) {
      return errorResponse(res, 403, 'Facility profile required', 'FACILITY_PROFILE_REQUIRED');
    }

    const shift = await prisma.shift.findUnique({ where: { id: shiftId } });
    if (!shift) {
      return errorResponse(res, 404, 'Shift not found', 'SHIFT_NOT_FOUND');
    }

    if (shift.facilityId !== facility.id) {
      return errorResponse(res, 403, 'You can only view applicants for your own shifts', 'FORBIDDEN');
    }

    const applicants = await prisma.application.findMany({
      where: { shiftId },
      include: {
        worker: { include: { user: { select: { name: true, email: true } } } }
      },
      orderBy: { createdAt: 'asc' }
    });

    return successResponse(res, 200, applicants);
  } catch (error) {
    next(error);
  }
}

export async function selectApplicant(req, res, next) {
  try {
    const applicationId = parsePositiveInteger(req.params.id);
    if (!applicationId) {
      return errorResponse(res, 400, 'Invalid application ID', 'INVALID_APPLICATION_ID');
    }

    const facility = await prisma.facility.findUnique({ where: { userId: req.user.id } });
    if (!facility) {
      return errorResponse(res, 403, 'Facility profile required', 'FACILITY_PROFILE_REQUIRED');
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { shift: true, worker: true }
    });

    if (!application) {
      return errorResponse(res, 404, 'Application not found', 'APPLICATION_NOT_FOUND');
    }

    if (application.shift.facilityId !== facility.id) {
      return errorResponse(res, 403, 'You can only select applicants for your own shifts', 'FORBIDDEN');
    }

    let result;
    try {
      result = await prisma.$transaction(async (tx) => {
        const freshShift = await tx.shift.findUnique({ where: { id: application.shiftId } });

        if (freshShift.status !== 'open' || freshShift.workerId !== null) {
          throw Object.assign(new Error('This shift has already been assigned'), {
            statusCode: 409,
            code: 'SHIFT_ALREADY_ASSIGNED'
          });
        }

        await tx.application.update({
          where: { id: applicationId },
          data: { status: 'accepted' }
        });

        await tx.application.updateMany({
          where: { shiftId: application.shiftId, id: { not: applicationId } },
          data: { status: 'rejected' }
        });

        return tx.shift.update({
          where: { id: application.shiftId },
          data: { workerId: application.workerId, status: 'assigned' }
        });
      });
    } catch (txError) {
      if (txError.statusCode) {
        return errorResponse(res, txError.statusCode, txError.message, txError.code);
      }
      throw txError;
    }

    const rejectedApplications = await prisma.application.findMany({
      where: { shiftId: application.shiftId, status: 'rejected' },
      include: { worker: true }
    });

    await notifySafely({
      recipientId: application.worker.userId,
      title: 'Application accepted',
      message: `You've been selected for the shift "${application.shift.title}".`,
      type: 'application',
      relatedId: application.id
    });

    for (const rejected of rejectedApplications) {
      await notifySafely({
        recipientId: rejected.worker.userId,
        title: 'Application update',
        message: `Your application for "${application.shift.title}" was not selected.`,
        type: 'application',
        relatedId: rejected.id
      });
    }

    return successResponse(res, 200, result);
  } catch (error) {
    next(error);
  }
}

export async function listMyApplications(req, res, next) {
  try {
    const worker = await prisma.worker.findUnique({ where: { userId: req.user.id } });
    if (!worker) {
      return errorResponse(res, 403, 'Worker profile required', 'WORKER_PROFILE_REQUIRED');
    }

    const applications = await prisma.application.findMany({
      where: { workerId: worker.id },
      include: { shift: true },
      orderBy: { createdAt: 'desc' }
    });

    return successResponse(res, 200, applications);
  } catch (error) {
    next(error);
  }
}