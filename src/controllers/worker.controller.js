import { prisma } from '../config/db.js';
import { successResponse, errorResponse } from '../utils/responseFormatter.js';

export async function getWorkerProfile(req, res, next) {
  try {
    const { id } = req.params;

    const worker = await prisma.worker.findUnique({
      where: { id: Number(id) },
      include: { user: { select: { name: true, email: true } } }
    });

    if (!worker) {
      return errorResponse(res, 404, 'Worker profile not found', 'WORKER_NOT_FOUND');
    }

    return successResponse(res, 200, worker);
  } catch (err) {
    next(err);
  }
}

export async function updateWorkerProfile(req, res, next) {
  try {
    const { id } = req.params;
    const { skills, availability, latitude, longitude } = req.body;

    const worker = await prisma.worker.findUnique({ where: { id: Number(id) } });

    if (!worker) {
      return errorResponse(res, 404, 'Worker profile not found', 'WORKER_NOT_FOUND');
    }

    if (worker.userId !== req.user.id && req.user.role !== 'platform_admin') {
      return errorResponse(res, 403, 'You cannot edit another worker\'s profile', 'FORBIDDEN');
    }

    const updatedWorker = await prisma.worker.update({
      where: { id: Number(id) },
      data: { skills, availability, latitude, longitude }
    });

    return successResponse(res, 200, updatedWorker);
  } catch (err) {
    next(err);
  }
}