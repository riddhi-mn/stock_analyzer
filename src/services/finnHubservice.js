// src/services/finnhubService.js
const axios = require('axios');

const FINNHUB_BASE = 'https://finnhub.io/api/v1';
const API_KEY = process.env.FINNHUB_API_KEY;

console.log('→ FINNHUB_API_KEY:', API_KEY);

// Fetch OHLCV for a single ticker over the past day
async function fetchOHLCV(ticker) {
  if (!API_KEY) {
    throw new Error('Missing FINNHUB_API_KEY in environment');
  }
  // Define the resolution (e.g., 5-minute bars)
  const resolution = '5';
  // Use current time and 24h ago
  const to = Math.floor(Date.now() / 1000);
  const from = to - 24 * 60 * 60;

  const url = `${FINNHUB_BASE}/stock/candle`;
  const params = {
    symbol: ticker,
    resolution,
    from,
    to,
    token: API_KEY
  };

  const resp = await axios.get(url, { params });
  const data = resp.data;

  if (data.s !== 'ok') {
    throw new Error(`Finnhub error: ${data.s}`);
  }

  // Map Finnhub’s arrays into array of objects
  return data.t.map((timestamp, i) => ({
    ticker,
    timestamp: new Date(timestamp * 1000),
    open:    data.o[i],
    high:    data.h[i],
    low:     data.l[i],
    close:   data.c[i],
    volume:  data.v[i]
  }));
}

// below your fetchOHLCV function
async function fetchQuote(ticker) {
  if (!API_KEY) throw new Error('Missing API key');
  const resp = await axios.get(`${FINNHUB_BASE}/quote`, {
    params: { symbol: ticker, token: API_KEY }
  });
  const data = resp.data;
  return {
    ticker,
    timestamp: new Date(data.t * 1000),
    open:  data.o,
    high:  data.h,
    low:   data.l,
    close: data.c,
    volume: null  // free tier doesn’t give volume here
  };
}

module.exports = { fetchOHLCV, fetchQuote };

