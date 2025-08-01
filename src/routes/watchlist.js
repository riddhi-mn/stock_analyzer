// src/routes/watchlist.js
const express = require('express');
const auth    = require('../middleware/auth');
const knex    = require('../db/knex');      // adjust path if needed

const router  = express.Router();

// POST /api/watchlist       ← to add a ticker
// GET  /api/watchlist       ← to list all tickers
// DELETE /api/watchlist/:ticker  ← to remove one

module.exports = router;
