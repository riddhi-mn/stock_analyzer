const express = require('express');
const router = express.Router();
const knex = require('../db/knex');

// GET /api/prices/:ticker
router.get('/:ticker', async (req, res) => {
  const { ticker } = req.params;

  try {
    const prices = await knex('prices')
      .select('timestamp', 'open', 'high', 'low', 'close')
      .where({ ticker })
      .orderBy('timestamp', 'asc');

    res.json(prices);
  } catch (err) {
    console.error('Error fetching prices:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
