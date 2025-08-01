// src/routes/watchlist.js
const express = require('express');
const auth    = require('../middleware/auth');
const knex    = require('../db/knex');      // adjust path if needed

const router  = express.Router();

// POST /api/watchlist       ← to add a ticker
// GET  /api/watchlist       ← to list all tickers
// DELETE /api/watchlist/:ticker  ← to remove one

//POST- Add ticker to watchlist
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
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Ticker already in your watchlist' });
    }
    console.error('Error adding to watchlist:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

//GET- List all tickers in the user's watchlist
router.get('/', auth, async (req, res) => {
  try {
    const entries = await knex('watchlists')
      .where({ user_id: req.user.id })
      .select('ticker', 'created_at');

    // Return an array of { ticker, created_at }
    return res.json(entries);
  } catch (err) {
    console.error('Error fetching watchlist:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

//DELETE - Remove a ticker from the watchlist

// Remove a ticker from the user's watchlist
router.delete('/:ticker', auth, async (req, res) => {
  try {
    const ticker = req.params.ticker.toUpperCase();

    // Attempt to delete the entry
    const count = await knex('watchlists')
      .where({ user_id: req.user.id, ticker })
      .del();

    // If nothing was deleted, the ticker was not found
    if (!count) {
      return res.status(404).json({ error: 'Ticker not found in your watchlist' });
    }

    // Return the removed ticker
    return res.json({ removed: ticker });
  } catch (err) {
    console.error('Error deleting from watchlist:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});



module.exports = router;
