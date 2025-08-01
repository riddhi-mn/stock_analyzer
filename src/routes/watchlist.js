// src/routes/watchlist.js
const express = require('express');
const auth    = require('../middleware/auth');
const knex    = require('../db/knex');      // adjust path if needed

const router  = express.Router();

// POST /api/watchlist       ← to add a ticker
// GET  /api/watchlist       ← to list all tickers
// DELETE /api/watchlist/:ticker  ← to remove one

// Add ticker to watchlist
router.post('/', auth, async (req, res) => {
  try {
    let { ticker } = req.body;

    // 1. Validate presence and type
    if (!ticker || typeof ticker !== 'string') {
      return res.status(400).json({ error: 'Ticker is required as a string' });
    }

    // 2. Normalize to uppercase & trim whitespace
    ticker = ticker.trim().toUpperCase();

    // 3. Basic format check: letters only, 1–5 chars
    if (!/^[A-Z]{1,5}$/.test(ticker)) {
      return res.status(400).json({ error: 'Ticker must be 1-5 letters only' });
    }

    // 4. Insert into database
    await knex('watchlists').insert({
      user_id: req.user.id,
      ticker
    });

    // 5. Return success
    return res.status(201).json({ ticker });
  } catch (err) {
    // Handle duplicate (unique constraint) error
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Ticker already in your watchlist' });
    }
    console.error('Error adding to watchlist:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});


module.exports = router;
