import { prisma } from '../config/db.js';
import { logger } from '../utils/logger.js';

// Auto-confirm shifts that have been in completed_pending_confirmation for > 48h
async function checkDisputeWindows() {
  try {
    const windowHours = 48;
    const cutoffDate = new Date(Date.now() - windowHours * 60 * 60 * 1000);

    const pendingShifts = await prisma.shift.findMany({
      where: {
        status: 'completed_pending_confirmation',
        completedAt: {
          lte: cutoffDate,
        },
        disputes: {
          none: {},
        },
      },
    });

    if (pendingShifts.length === 0) {
      return 0;
    }

    const shiftIds = pendingShifts.map((s) => s.id);

    const result = await prisma.shift.updateMany({
      where: {
        id: { in: shiftIds },
      },
      data: {
        status: 'completed',
      },
    });

    logger.info(`Auto-confirmed ${result.count} completed shifts past dispute window`);
    return result.count;
  } catch (error) {
    logger.error('Error running dispute window check job', { error: error.message });
    return 0;
  }
}

export { checkDisputeWindows };
