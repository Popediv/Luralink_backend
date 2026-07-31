import DisputeService from '../services/dispute.service.js';
import { successResponse, errorResponse } from '../utils/responseFormatter.js';

function parsePositiveInteger(value) {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

// POST /api/disputes — worker or facility_admin raises a dispute on a completed shift
export async function createDispute(req, res, next) {
    try {
        const shiftId = parsePositiveInteger(req.body.shiftId);
        if (!shiftId) {
            return errorResponse(res, 400, 'Invalid shiftId', 'INVALID_SHIFT_ID');
        }

        const dispute = await DisputeService.createDispute({
            shiftId,
            raisedByUserId: req.user.id,
        });

        return successResponse(res, 201, dispute);
    } catch (err) {
        if (err.statusCode) {
            return errorResponse(res, err.statusCode, err.message, err.code);
        }
        next(err);
    }
}

// GET /api/disputes — platform admin lists all disputes (optional ?ruled=true|false)
export async function listDisputes(req, res, next) {
    try {
        let ruled;
        if (req.query.ruled === 'true') ruled = true;
        if (req.query.ruled === 'false') ruled = false;

        const disputes = await DisputeService.listDisputes({ ruled });
        return successResponse(res, 200, disputes);
    } catch (err) {
        next(err);
    }
}

// GET /api/disputes/:id — get a single dispute by ID
export async function getDispute(req, res, next) {
    try {
        const id = parsePositiveInteger(req.params.id);
        if (!id) {
            return errorResponse(res, 400, 'Invalid dispute ID', 'INVALID_DISPUTE_ID');
        }

        const dispute = await DisputeService.getDispute(id);
        if (!dispute) {
            return errorResponse(res, 404, 'Dispute not found', 'DISPUTE_NOT_FOUND');
        }

        return successResponse(res, 200, dispute);
    } catch (err) {
        next(err);
    }
}

// PATCH /api/disputes/:id/rule — admin rules on a dispute
export async function ruleDispute(req, res, next) {
    try {
        const id = parsePositiveInteger(req.params.id);
        if (!id) {
            return errorResponse(res, 400, 'Invalid dispute ID', 'INVALID_DISPUTE_ID');
        }

        const { ruling } = req.body;
        if (!ruling) {
            return errorResponse(res, 400, 'ruling is required', 'RULING_REQUIRED');
        }

        const updatedDispute = await DisputeService.ruleDispute({
            disputeId: id,
            ruling,
            adminUserId: req.user.id,
        });

        return successResponse(res, 200, updatedDispute);
    } catch (err) {
        if (err.statusCode) {
            return errorResponse(res, err.statusCode, err.message, err.code);
        }
        next(err);
    }
}
