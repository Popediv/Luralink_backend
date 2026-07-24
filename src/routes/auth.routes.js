import express from 'express';
const router = express.Router();

router.post('/login', (_req, res) => {
  res.status(200).json({ message: 'Auth route placeholder' });
});

export default router;
