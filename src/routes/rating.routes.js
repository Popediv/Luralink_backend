import express from 'express';
const router = express.Router();

router.get('/', (_req, res) => {
  res.status(200).json({ message: 'Rating route placeholder' });
});

export default router;
