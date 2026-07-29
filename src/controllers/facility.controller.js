import { prisma } from '../config/db.js';
import { successResponse, errorResponse } from '../utils/responseFormatter.js';

export async function getFacilityProfile(req, res, next) {
  try {
    const { id } = req.params;

    const facility = await prisma.facility.findUnique({
      where: { id: Number(id) },
      include: { user: { select: { name: true, email: true } } }
    });

    if (!facility) {
      return errorResponse(res, 404, 'Facility profile not found', 'FACILITY_NOT_FOUND');
    }

    return successResponse(res, 200, facility);
  } catch (err) {
    next(err);
  }
}

export async function updateFacilityProfile(req, res, next) {
  try {
    const { id } = req.params;
    const { name, type, address, latitude, longitude } = req.body;

    const facility = await prisma.facility.findUnique({ where: { id: Number(id) } });

    if (!facility) {
      return errorResponse(res, 404, 'Facility profile not found', 'FACILITY_NOT_FOUND');
    }

    if (facility.userId !== req.user.id && req.user.role !== 'platform_admin') {
      return errorResponse(res, 403, 'You cannot edit another facility\'s profile', 'FORBIDDEN');
    }

    const updatedFacility = await prisma.facility.update({
      where: { id: Number(id) },
      data: { name, type, address, latitude, longitude }
    });

    return successResponse(res, 200, updatedFacility);
  } catch (err) {
    next(err);
  }
}