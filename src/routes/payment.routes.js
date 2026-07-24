import express from 'express';
const router = express.Router();

router.get('/', (_req, res) => {
  res.status(200).json({ message: 'Payment route placeholder' });
});

export default router;
