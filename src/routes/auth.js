const express  = require('express');
const bcrypt   = require('bcrypt');
const jwt      = require('jsonwebtoken');
const knex     = require('../db/knex'); 

const router   = express.Router();
const SALT_ROUNDS = 10;

router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  // Email format validation, maybe made into middleware module

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Bad email, not valid format' });
  }

  // Password length validation…
  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'Password too short' });
  }

  // Basic validation
  if (!email || !password || password.length < 8) {
    return res.status(400).json({ error: 'Invalid email or password too short' });
  }
  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const [user] = await knex('users')
      .insert({ email, password_hash: hash })
      .returning(['id','email']);
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    return res.json({ token });
  } catch (err) {
    if (err.code === '23505') { // unique_violation
      return res.status(400).json({ error: 'Email already registered' });
    }
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});


router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email or password' });
  }
  try {
    const [user] = await knex('users')
      .select('id','email','password_hash')
      .where({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    return res.json({ token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});


//LOGIN ROUTE
/** 
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email or password' });
  }
  try {
    const [user] = await knex('users')
      .select('id','email','password_hash')
      .where({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    return res.json({ token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}); */



module.exports = router;
