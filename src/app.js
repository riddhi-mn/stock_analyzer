// src/app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const knex = require('./db/knex');
const { fetchQuote } = require('./services/finnHubservice');
const cookieParser = require('cookie-parser');

const app = express(); // ✅ declare first

app.use(cookieParser());

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));




// routers
const watchlistStreamRouter = require('./routes/watchlistStream');
const authRouter = require('./routes/auth');
const meRouter = require('./routes/me');
const priceRoutes = require('./routes/prices');
const analyticsRouter = require('./routes/analytics');

// sse broadcaster (for programmatic broadcasts)
const { broadcastToTicker } = require('./services/sseBroadcaster');
const { broadcastToUser } = require('./services/sseBroadcaster');


//app.use(express.json());
app.use(express.json());
// mount API routes
app.use('/api/auth', authRouter);
app.use('/api/prices', priceRoutes);
app.use('/api', meRouter);
app.use('/api/analytics', analyticsRouter);

const auth = require('./middleware/auth'); //middleware
app.use('/api/watchlists', auth, watchlistStreamRouter);

app.get('/health', (_req, res) => res.json({ status: 'OK' }));

// Debug broadcast endpoint (dev friendly)
const allowDebug = (process.env.NODE_ENV !== 'production') || process.env.ENABLE_DEBUG_BROADCAST === 'true';
if (allowDebug) {
  // This endpoint simply broadcasts to subscribers of the given ticker.
  app.post('/debug/broadcast', (req, res) => {
    const { ticker, price, timestamp } = req.body || {};
    if (!ticker) return res.status(400).json({ error: 'ticker required' });

    const payload = {
      ticker: String(ticker).toUpperCase(),
      price: typeof price === 'number' ? price : null,
      timestamp: timestamp || new Date().toISOString()
    };

    try {
      broadcastToTicker(payload.ticker, payload);
      console.log(`[DEBUG] broadcastToTicker ${payload.ticker}`, payload);
      return res.json({ ok: true, payload });
    } catch (err) {
      console.error('Debug broadcast error:', err);
      return res.status(500).json({ ok: false, error: err.message });
    }
  });

  console.log('DEBUG: /debug/broadcast enabled');
}

// track last close per ticker (normalized uppercase)
const lastClose = {};

// Poll prices every 10 seconds (dev) — adjust frequency for production/limits
cron.schedule('*/10 * * * * *', async () => {
  try {
    console.log('Polling prices at', new Date().toISOString());

    const rows = await knex('watchlists').distinct('ticker').select('ticker');

    for (const row of rows) {
      const rawTicker = row.ticker;
      const tk = String(rawTicker).toUpperCase();

      try {
        const quote = await fetchQuote(tk);
        if (!quote || typeof quote.close === 'undefined') {
          console.warn('fetchQuote returned no close for', tk);
          continue;
        }

        if (lastClose[tk] !== quote.close) {
          // persist price
          await knex('prices').insert({
            ticker:    tk,
            timestamp: quote.timestamp,
            open:      quote.open,
            high:      quote.high,
            low:       quote.low,
            close:     quote.close,
            volume:    quote.volume
          });
          lastClose[tk] = quote.close;
          console.log(`Inserted new price for ${tk}:`, quote.close);

          // broadcast to any subscribers of this ticker
          try {
            broadcastToTicker(tk, {
              action: 'price',
              ticker: tk,
              price: quote.close,
              timestamp: quote.timestamp
            });
          } catch (e) {
            console.error('broadcastToTicker failed:', e);
          }
        } else {
          // no change
        }
      } catch (err) {
        console.error(`Error fetching/inserting for ${tk}:`, err && err.message ? err.message : err);
      }
    }
  } catch (err) {
    console.error('Error in price polling job:', err);
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

