const express = require('express');
const auth    = require('../middleware/auth');
const router  = express.Router();

router.get('/me', auth, (req, res) => {
  res.json({ id: req.user.id, email: req.user.email });
});

module.exports = router;
