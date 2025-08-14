const express = require('express');
const { broadcastToUser } = require('./watchlist');

const router = express.Router();

router.post('/broadcast', (req, res) => {
  const { ticker, price, timestamp, insert } = req.body;

  // Change 4 to your actual user ID
  broadcastToUser(4, { ticker, price, timestamp });

  console.log(`Debug broadcast to user 4:`, { ticker, price, timestamp });

  // Optional: insert into DB if requested
  if (insert) {
    // ...knex insert code...
  }

  res.json({ status: 'ok', sent: { ticker, price, timestamp } });
});

module.exports = router;
