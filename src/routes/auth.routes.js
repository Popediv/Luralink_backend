const express = require('express');
const router = express.Router();

router.post('/login', (_req, res) => {
  res.status(200).json({ message: 'Auth route placeholder' });
});

module.exports = router;
