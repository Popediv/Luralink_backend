const express = require('express');
const router = express.Router();

router.post('/', (_req, res) => {
  res.status(200).json({ received: true });
});

module.exports = router;
