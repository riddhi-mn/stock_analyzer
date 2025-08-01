require('dotenv').config();
const axios = require('axios');

const API_KEY = process.env.FINNHUB_API_KEY;

async function testQuote() {
  try {
    const res = await axios.get('https://finnhub.io/api/v1/quote', {
      params: {
        symbol: 'AAPL',
        token: API_KEY,
      },
    });
    console.log(res.data);
  } catch (error) {
    console.error(error.response?.data || error.message);
  }
}

testQuote();
