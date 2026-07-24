import express from 'express';
const router = express.Router();

router.post('/', (_req, res) => {
  res.status(200).json({ received: true });
});

export default router;
