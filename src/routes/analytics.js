// src/routes/analytics.js
const express = require('express');
const router  = express.Router();
const knex    = require('../db/knex');

// GET /api/analytics/corr/:ticker
// Returns Pearson r between close and 30-day moving average
router.get('/corr/:ticker', async (req, res) => {
  const { ticker } = req.params;
  try {
    // Build a derived table with the moving average
    const subquery = knex('prices')
      .select(
        'timestamp',
        'close',
        knex.raw(`
          AVG(close) OVER (
            ORDER BY timestamp
            ROWS BETWEEN 29 PRECEDING AND CURRENT ROW
          ) AS moving_avg_30
        `)
      )
      .where({ ticker })
      .as('derived');

    // Compute correlation using SQL aggregate function
    const [{ corr }] = await knex
      .select(knex.raw('ROUND(CORR(close, moving_avg_30)::numeric, 4) AS corr'))
      .from(subquery);

    // corr will be null if there are fewer than 2 non-null pairs
    if (corr === null) {
      return res.status(400).json({ error: 'Not enough data to compute correlation' });
    }

    return res.json({ ticker, correlation: corr });
  } catch (err) {
    console.error('Error computing correlation:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
