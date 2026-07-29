import express from "express";
import cors from "cors";
import helmet from "helmet";

import authRoutes from "./routes/auth.routes.js";
import workerRoutes from "./routes/worker.routes.js";
import facilityRoutes from "./routes/facility.routes.js";
import shiftRoutes from "./routes/shift.routes.js";
import applicationRoutes from "./routes/application.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import verificationRoutes from "./routes/verification.routes.js";
import ratingRoutes from "./routes/rating.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import paystackWebhook from "./webhooks/paystack.webhook.js";
import matchingRoutes from "./routes/matching.routes.js";

import errorMiddleware from "./middleware/error.middleware.js";

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "luralink-backend" });
});

app.use("/api/auth", authRoutes);
app.use("/api/workers", workerRoutes);
app.use("/api/facilities", facilityRoutes);
app.use("/api/shifts", shiftRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/verification", verificationRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/webhooks/paystack", paystackWebhook);
app.use("/api/matching", matchingRoutes);

app.use(errorMiddleware);

export default app;
