const express = require('express');
const router = express.Router();
const { readDb, writeDb, generateId } = require('../db');
const { sendVerificationEmail } = require('../lib/email');

// POST /auth/signup
router.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const db = readDb();
  const existingUser = db.users.find(u => u.email === email);
  
  // If user exists and is already verified, block duplicate signup
  if (existingUser && existingUser.verified) {
    return res.status(400).json({ error: 'An account with this email already exists. Please sign in.' });
  }

  // If user exists but is NOT verified, remove the old entry so they can try again
  if (existingUser && !existingUser.verified) {
    db.users = db.users.filter(u => u.email !== email);
  }

  // Generate a random 6-digit verification code
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

  const user = {
    id: generateId(),
    email,
    password, 
    verified: false,
    verificationCode
  };

  db.users.push(user);
  writeDb(db);

  try {
    await sendVerificationEmail(email, verificationCode);
    res.json({ id: user.id, message: 'Please check your email for a verification code.' });
  } catch (err) {
    // Roll back: remove the user so they can retry
    const dbAfter = readDb();
    dbAfter.users = dbAfter.users.filter(u => u.id !== user.id);
    writeDb(dbAfter);
    res.status(500).json({ error: err.message || 'Could not send verification email.' });
  }
});

// POST /auth/verify
router.post('/verify', (req, res) => {
  const { id, code } = req.body;
  const db = readDb();
  const user = db.users.find(u => u.id === id);

  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.verificationCode !== code) return res.status(400).json({ error: 'Invalid verification code' });

  user.verified = true;
  writeDb(db);

  res.json({ id: user.id, token: user.id, email: user.email }); // token is just the ID locally
});

// POST /auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const db = readDb();
  const user = db.users.find(u => u.email === email && u.password === password);

  if (!user) return res.status(401).json({ error: 'Invalid email or password' });
  if (!user.verified) return res.status(403).json({ error: 'Email not verified', id: user.id });

  res.json({ token: user.id, id: user.id, email: user.email });
});

// GET /auth/me
router.get('/me', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const db = readDb();
  const user = db.users.find(u => u.id === token);
  if (!user) return res.status(401).json({ error: 'User not found' });

  res.json({ id: user.id, email: user.email });
});

module.exports = router;
