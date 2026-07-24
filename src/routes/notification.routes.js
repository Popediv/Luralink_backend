import express from 'express';
const router = express.Router();

router.get('/', (_req, res) => {
  res.status(200).json({ message: 'Notification route placeholder' });
});

export default router;
