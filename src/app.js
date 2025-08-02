    require('dotenv').config();
    //console.log('→ JWT_SECRET:', process.env.JWT_SECRET);

    const express = require('express');
    const cors = require('cors');

    const cron     = require('node-cron');
    const { fetchQuote } = require('./services/finnHubservice'); // or your renamed service
    const knex     = require('./db/knex');

    const lastClose = {};

    const app = express();
    app.use(cors());
    app.use(express.json());

    const authRouter = require('./routes/auth');
    const meRouter   = require('./routes/me');

    const priceRoutes = require('./routes/prices');
    app.use('/api/prices', priceRoutes);

    // src/app.js

    //const watchlistRouter = require('./routes/watchlists');  // ← add this

    const watchlistsRouter = require('./routes/watchlists');

    app.use('/api/watchlists', watchlistsRouter);

    app.use('/api', authRouter);
    app.use('/api', meRouter);

    const analyticsRouter = require('./routes/analytics');
    app.use('/api/analytics', analyticsRouter);


    // Mount the watchlist router
    //app.use('/api/watchlists', watchlistsRouter);  // ← mount here


    app.get('/health', (_req, res) => res.json({ status: 'OK' }));

    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

    //CRON JOB TO POLL PRICES
    // Schedule a task every 30 seconds
    cron.schedule('*/30 * * * * *', async () => {
    try {
        console.log('Polling prices at', new Date().toISOString());

        // 1. Get all unique tickers across all watchlists
        const rows = await knex('watchlists')
        .distinct('ticker')
        .select('ticker');

        // 2. For each ticker, fetch quote and insert into prices
        for (const row of rows) {
        const { ticker } = row;
        try {  
            const quote = await fetchQuote(ticker);
           /**  await knex('prices').insert({
            ticker:    quote.ticker,
            timestamp: quote.timestamp,
            open:      quote.open,
            high:      quote.high,
            low:       quote.low,
            close:     quote.close,
            volume:    quote.volume // ?? 0     // may be null on free tier
            }); **/
            // Only insert if the close price has changed since last time
    if (lastClose[ticker] !== quote.close) {
    await knex('prices').insert({
        ticker:    quote.ticker,
        timestamp: quote.timestamp,
        open:      quote.open,
        high:      quote.high,
        low:       quote.low,
        close:     quote.close,
        volume:    quote.volume
    });
    console.log(`Inserted new price for ${ticker}:`, quote.close);
    // Update cache
    lastClose[ticker] = quote.close;
    } else {
    console.log(`No change for ${ticker} (still ${quote.close}), skipping insert.`);
    }

        } catch (err) {
            console.error(`Error fetching/inserting for ${ticker}:`, err.message);
        }
        }
    } catch (err) {
        console.error('Error in price polling job:', err);
    }
    });

