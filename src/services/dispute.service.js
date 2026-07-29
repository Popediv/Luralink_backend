import { prisma } from '../config/db.js';

const DISPUTABLE_STATUSES = ['completed_pending_confirmation', 'completed'];
const VALID_RULINGS = ['release_to_worker', 'refund_facility'];

class DisputeService {
  // Open a new dispute for a shift (only assigned worker or facility admin)
  static async createDispute({ shiftId, raisedByUserId }) {
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
      include: {
        facility: true,
        worker: true,
        payment: true,
      },
    });

    if (!shift) {
      const err = new Error('Shift not found');
      err.statusCode = 404;
      err.code = 'SHIFT_NOT_FOUND';
      throw err;
    }

    if (!DISPUTABLE_STATUSES.includes(shift.status)) {
      const err = new Error(
        `Disputes can only be raised on shifts in status: ${DISPUTABLE_STATUSES.join(', ')}`,
      );
      err.statusCode = 409;
      err.code = 'SHIFT_NOT_DISPUTABLE';
      throw err;
    }

    const callerIsWorker = shift.worker?.userId === raisedByUserId;
    const callerIsFacility = shift.facility?.userId === raisedByUserId;

    if (!callerIsWorker && !callerIsFacility) {
      const err = new Error('Only the assigned worker or facility admin can raise a dispute');
      err.statusCode = 403;
      err.code = 'DISPUTE_FORBIDDEN';
      throw err;
    }

    // One dispute per shift
    const existing = await prisma.dispute.findFirst({ where: { shiftId } });
    if (existing) {
      const err = new Error('A dispute already exists for this shift');
      err.statusCode = 409;
      err.code = 'DISPUTE_ALREADY_EXISTS';
      throw err;
    }

    // Escrow must be funded before disputing
    if (!shift.payment || shift.payment.escrowStatus !== 'funded') {
      const err = new Error('Escrow must be funded before a dispute can be raised');
      err.statusCode = 409;
      err.code = 'ESCROW_NOT_FUNDED';
      throw err;
    }

    return prisma.dispute.create({ data: { shiftId } });
  }

  // Platform admin rules on a dispute and adjusts payment + shift status
  static async ruleDispute({ disputeId, ruling, adminUserId }) {
    if (!VALID_RULINGS.includes(ruling)) {
      const err = new Error(`Ruling must be one of: ${VALID_RULINGS.join(', ')}`);
      err.statusCode = 400;
      err.code = 'INVALID_RULING';
      throw err;
    }

    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        shift: { include: { payment: true } },
      },
    });

    if (!dispute) {
      const err = new Error('Dispute not found');
      err.statusCode = 404;
      err.code = 'DISPUTE_NOT_FOUND';
      throw err;
    }

    if (dispute.ruling !== null) {
      const err = new Error('This dispute has already been ruled on');
      err.statusCode = 409;
      err.code = 'DISPUTE_ALREADY_RULED';
      throw err;
    }

    const payment = dispute.shift.payment;
    if (!payment || payment.escrowStatus !== 'funded') {
      const err = new Error('Cannot rule: escrow is not in a funded state');
      err.statusCode = 409;
      err.code = 'ESCROW_NOT_FUNDED';
      throw err;
    }

    const newEscrowStatus = ruling === 'release_to_worker' ? 'released' : 'refunded';
    const newShiftStatus = ruling === 'release_to_worker' ? 'paid' : 'completed';

    const [updatedDispute] = await prisma.$transaction([
      prisma.dispute.update({
        where: { id: disputeId },
        data: { ruling, ruledById: adminUserId, ruledAt: new Date() },
      }),
      prisma.payment.update({
        where: { id: payment.id },
        data: { escrowStatus: newEscrowStatus, releasedAt: new Date() },
      }),
      prisma.shift.update({
        where: { id: dispute.shiftId },
        data: { status: newShiftStatus },
      }),
    ]);

    return updatedDispute;
  }

  // List all disputes, optionally filtered by ruling status
  static async listDisputes({ ruled } = {}) {
    const where = {};
    if (ruled === true) where.ruling = { not: null };
    if (ruled === false) where.ruling = null;

    return prisma.dispute.findMany({
      where,
      include: {
        shift: {
          include: {
            facility: { select: { id: true, name: true } },
            worker: { include: { user: { select: { id: true, name: true } } } },
            payment: true,
          },
        },
        ruledBy: { select: { id: true, name: true } },
      },
      orderBy: { raisedAt: 'desc' },
    });
  }

  // Get a single dispute by ID
  static async getDispute(disputeId) {
    return prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        shift: {
          include: {
            facility: { select: { id: true, name: true } },
            worker: { include: { user: { select: { id: true, name: true } } } },
            payment: true,
          },
        },
        ruledBy: { select: { id: true, name: true } },
      },
    });
  }
}

export default DisputeService;
