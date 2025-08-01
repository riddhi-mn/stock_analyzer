require('dotenv').config();
//console.log('→ JWT_SECRET:', process.env.JWT_SECRET);

const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const authRouter = require('./routes/auth');
const meRouter   = require('./routes/me');

// src/app.js

const watchlistRouter = require('./routes/watchlist');  // ← add this


app.use('/api', authRouter);
app.use('/api', meRouter);

// Mount the watchlist router
app.use('/api/watchlist', watchlistRouter);  // ← mount here


app.get('/health', (_req, res) => res.json({ status: 'OK' }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
