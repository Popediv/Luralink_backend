import express from 'express';
import cors from 'cors';
import { errorMiddleware } from './middleware/error.middleware.js';
import helmet from 'helmet';

import authRoutes from './routes/auth.routes.js';
import workerRoutes from './routes/worker.routes.js';
import facilityRoutes from './routes/facility.routes.js';
import shiftRoutes from './routes/shift.routes.js';
import applicationRoutes from './routes/application.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import verificationRoutes from './routes/verification.routes.js';
import ratingRoutes from './routes/rating.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import matchingRoutes from './routes/matching.routes.js';
import disputeRoutes from './routes/dispute.routes.js';
import paystackWebhook from './webhooks/paystack.webhook.js';

const app = express();

app.use(cors());
app.use(helmet());

// ⚠️  Paystack webhook MUST be mounted before express.json().
//     The handler uses express.raw() to read the raw body bytes for HMAC verification.
//     If express.json() runs first it consumes the body and verification always fails.
app.use('/api/webhooks/paystack', paystackWebhook);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'LuraLink API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/facilities', facilityRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/disputes', disputeRoutes);

app.use(errorMiddleware);


export default app;
