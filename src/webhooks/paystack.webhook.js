import express from 'express';
import { secretKey } from '../config/paystack.js';
import { prisma } from '../config/db.js';
import { logger } from '../utils/logger.js';
import crypto from 'crypto';

const router = express.Router();

function verifyPaystackSignature(req) {
  const signature = req.headers['x-paystack-signature'];
  if (!signature || !secretKey) {
    return false;
  }

  const payload = req.rawBody || JSON.stringify(req.body || {});
  const hash = crypto.createHmac('sha512', secretKey).update(payload).digest('hex');
  return signature === hash;
}

router.get('/', (_req, res) => {
  res.status(200).json({ status: true, message: 'Paystack webhook endpoint is live' });
});

router.post('/', express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf.toString();
  },
}), async (req, res) => {
  try {
    if (!verifyPaystackSignature(req)) {
      return res.status(400).json({ status: false, message: 'Invalid signature' });
    }

    const event = req.body;
    const reference = event.data?.reference;
    const status = event.data?.status;

    if (event.event === 'charge.success' && reference) {
      await prisma.payment.updateMany({
        where: { reference },
        data: { escrowStatus: 'funded', releasedAt: null },
      });
    }

    if (event.event === 'transfer.success' && reference) {
      await prisma.payment.updateMany({
        where: { reference },
        data: { escrowStatus: 'released', releasedAt: new Date() },
      });
    }

    return res.status(200).json({ status: true });
  } catch (error) {
    logger.error('Paystack webhook error', { error: error.message });
    return res.status(500).json({ status: false, message: 'Webhook processing failed' });
  }
});

export default router;
