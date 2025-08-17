// src/routes/auth.js
const express  = require('express');
const bcrypt   = require('bcrypt');
const jwt      = require('jsonwebtoken');
const knex     = require('../db/knex');

const router   = express.Router();
const SALT_ROUNDS = 10;

const ACCESS_EXPIRES_IN  = process.env.ACCESS_EXPIRES_IN  || '15m';
const REFRESH_EXPIRES_IN = process.env.REFRESH_EXPIRES_IN || '7d';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: false,            // keep false for http://localhost, true in prod with HTTPS
  sameSite: 'lax',          // allows cross-site cookie on navigation & fetch
  maxAge: 7 * 24 * 60 * 60 * 1000
};


// REGISTER
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return res.status(400).json({ error: 'Invalid email format' });
  if (!password || password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const [user] = await knex('users')
      .insert({ email, password_hash: hash })
      .returning(['id','email']);

    const accessToken = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: ACCESS_EXPIRES_IN });
    const refreshToken = jwt.sign({ id: user.id }, process.env.REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
    return res.json({ accessToken });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Email already registered' });
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });

  try {
    const [user] = await knex('users').select('id','email','password_hash').where({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(400).json({ error: 'Invalid credentials' });

    const accessToken = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: ACCESS_EXPIRES_IN });
    const refreshToken = jwt.sign({ id: user.id }, process.env.REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
    return res.json({ accessToken });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// REFRESH
router.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) return res.status(401).json({ error: 'No refresh token' });

  try {
    const payload = jwt.verify(refreshToken, process.env.REFRESH_SECRET);

    const user = await knex('users').where({ id: payload.id }).first();
    if (!user) return res.status(401).json({ error: 'User not found' });

    const accessToken = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: ACCESS_EXPIRES_IN });
    const newRefreshToken = jwt.sign({ id: user.id }, process.env.REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });

    // rotate cookie & keep same maxAge window
    res.cookie('refreshToken', newRefreshToken, COOKIE_OPTIONS);
    return res.json({ accessToken });
  } catch (err) {
    console.error(err);
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
});

module.exports = router;
