const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./routes/auth.routes');
const workerRoutes = require('./routes/worker.routes');
const facilityRoutes = require('./routes/facility.routes');
const shiftRoutes = require('./routes/shift.routes');
const applicationRoutes = require('./routes/application.routes');
const paymentRoutes = require('./routes/payment.routes');
const verificationRoutes = require('./routes/verification.routes');
const ratingRoutes = require('./routes/rating.routes');
const notificationRoutes = require('./routes/notification.routes');
const paystackWebhook = require('./webhooks/paystack.webhook');

const errorMiddleware = require('./middleware/error.middleware');

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'luralink-backend' });
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
app.use('/api/webhooks/paystack', paystackWebhook);

app.use(errorMiddleware);

module.exports = app;
