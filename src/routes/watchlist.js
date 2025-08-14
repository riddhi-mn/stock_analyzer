// src/routes/watchlist.js
const express = require('express');
const auth    = require('../middleware/auth');
const knex    = require('../db/knex');

const { authenticateToken } = require('../middleware/auth'); // or wherever your auth middleware is
const { broadcastToUser, registerConnection, unregisterConnection } = require('../services/sseBroadcaster');

const router  = express.Router();

// SSE stream endpoint
router.get('/stream', auth, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Register connection in central broadcaster service
  registerConnection(req.user.id, res);

  // Send initial connection confirmation
  res.write(`data: ${JSON.stringify({ message: 'connected' })}\n\n`);

  // Remove client on disconnect
  req.on('close', () => {
    unregisterConnection(req.user.id, res);
  });
});

// POST — Add ticker to watchlist
router.post('/', auth, async (req, res) => {
  try {
    let { ticker } = req.body;
    if (!ticker || typeof ticker !== 'string') {
      return res.status(400).json({ error: 'Ticker is required as a string' });
    }

    ticker = ticker.trim().toUpperCase();
    if (!/^[A-Z]{1,10}(?:\.NS)?$/.test(ticker)) {
      return res.status(400).json({ error: 'Ticker must be 1-10 letters' });
    }

    await knex('watchlists').insert({
      user_id: req.user.id,
      ticker
    });

    // Broadcast addition to the user's SSE clients
    broadcastToUser(req.user.id, { action: 'added', ticker });

    return res.status(201).json({ ticker });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Ticker already in your watchlist' });
    }
    console.error('Error adding to watchlist:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET — List all tickers in the user's watchlist
router.get('/', auth, async (req, res) => {
  try {
       console.log("[WATCHLIST] Authenticated user:", req.user); // debug
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const entries = await knex('watchlist')
      .where({ user_id: req.user.id })
      .select('ticker', 'created_at');
    return res.json(entries);
  } catch (err) {
    console.error('Error fetching watchlist:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// DELETE — Remove a ticker from the watchlist
router.delete('/:ticker', auth, async (req, res) => {
  try {
    const ticker = req.params.ticker.toUpperCase();

    const count = await knex('watchlists')
      .where({ user_id: req.user.id, ticker })
      .del();

    if (!count) {
      return res.status(404).json({ error: 'Ticker not found in your watchlist' });
    }

    // Broadcast removal to the user's SSE clients
    broadcastToUser(req.user.id, { action: 'removed', ticker });

    return res.json({ removed: ticker });
  } catch (err) {
    console.error('Error deleting from watchlist:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Debug broadcast endpoint
router.post('/debug/broadcast', auth, (req, res) => {
  const { ticker, price, timestamp } = req.body;
  broadcastToUser(req.user.id, { ticker, price, timestamp });
  res.json({ ok: true, sentTo: req.user.id });
});

module.exports = router;
