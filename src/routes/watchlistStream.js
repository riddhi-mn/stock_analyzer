// src/routes/watchlistStream.js
const express = require('express');
const jwt = require('jsonwebtoken');
const knex = require('../db/knex');
const { registerConnection, unregisterConnection, sendSnapshotToUser } = require('../services/sseBroadcaster');


const router = express.Router();

const extractToken = req => {
  if (req.query?.token) return String(req.query.token);
  const h = req.headers?.authorization || req.headers?.Authorization;
  if (h) {
    const p = h.split(' ');
    return p.length === 2 && /^Bearer$/i.test(p[0]) ? p[1] : h;
  }
  return req.cookies?.token || req.cookies?.jwt || null;
};

const verifyToken = req => {
  const token = extractToken(req);
  if (!token) return { error: 'No token' };
  try { return { payload: jwt.verify(token, process.env.JWT_SECRET) }; }
  catch (err) { return { error: 'Invalid token', details: err.message }; }
};

router.get('/stream', async (req, res) => {
  const { payload, error } = verifyToken(req);
  if (error) return res.status(401).json({ error });
  const userId = Number(payload.id || payload.userId || payload.sub);
  if (!userId) return res.status(401).json({ error: 'No user id in token' });

  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
  res.flushHeaders?.();

  try {
    const entries = await knex('watchlists').select('ticker').where({ user_id: userId });
    const tickers = entries.map(x => x.ticker);

    const snapshotList = await Promise.all(tickers.map(async ticker => {
      const row = await knex('prices').where({ ticker }).orderBy('timestamp', 'desc').first();
      return { ticker, currentPrice: row?.close || null };
    }));

    registerConnection(userId, res, tickers);
    await sendSnapshotToUser(userId, { action: 'snapshot', watchlist: snapshotList });

    // Send dummy price updates every 5 seconds from user's real watchlist
    const dummyPriceInterval = setInterval(() => {
      if (tickers.length > 0) {
        const randomTicker = tickers[Math.floor(Math.random() * tickers.length)];
        const priceEvent = {
          action: 'price',
          ticker: randomTicker,
          price: +(Math.random() * 100).toFixed(2),
          timestamp: new Date().toISOString()
        };
        res.write(`event: price\ndata: ${JSON.stringify(priceEvent)}\n\n`);
        console.log("[DUMMY PRICE SENT]", priceEvent);
      }
    }, 5000);

    // Heartbeat every 15s
    const hb = setInterval(() => res.write(`event: ping\ndata: {}\n\n`), 15000);

    req.on('close', () => {
      clearInterval(hb);
      clearInterval(dummyPriceInterval);
      unregisterConnection(userId);
    });

  } catch (err) {
    console.error('SSE stream error:', err);
    if (!res.headersSent) res.status(500).end(); else res.end();
  }
});

module.exports = router;
