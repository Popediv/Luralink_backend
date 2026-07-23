const express = require('express');
const router = express.Router();

router.get('/', (_req, res) => {
  res.status(200).json({ message: 'Notification route placeholder' });
});

module.exports = router;
