/* EcoRise — Auth routes */
const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const { getDb } = require('../db');
const { signToken, authMiddleware } = require('../middleware/auth');
const { issueCsrf } = require('../middleware/csrf');
const { body } = require('../utils/validate');

const router = express.Router();
const COOKIE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

function setSession(res, userId) {
  res.cookie('token', signToken(userId), COOKIE);
  issueCsrf(res);
}

router.post('/signup', body('signup'), async (req, res) => {
  try {
    const { email, password, name } = req.valid;
    const db = getDb();
    if (db.prepare('SELECT id FROM users WHERE email = ?').get(email)) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const id = uuid();
    const passwordHash = await bcrypt.hash(password, 12);
    const base = '@' + (name || email.split('@')[0]).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15);
    const displayName = name || email.split('@')[0];
    let handle = base, attempt = 0;
    while (db.prepare('SELECT id FROM users WHERE handle = ?').get(handle)) handle = base + (++attempt);

    db.prepare('INSERT INTO users (id, email, password_hash, name, handle) VALUES (?, ?, ?, ?, ?)')
      .run(id, email, passwordHash, displayName, handle);

    setSession(res, id);
    res.json({ user: { id, email, name: displayName, handle, avatar: '' } });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', body('login'), async (req, res) => {
  try {
    const { email, password } = req.valid;
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    // Constant-ish: always run a compare to reduce user-enumeration timing.
    const ok = user ? await bcrypt.compare(password, user.password_hash || '') : await bcrypt.compare(password, '$2a$12$0000000000000000000000000000000000000000000000000000');
    if (!user || !ok) return res.status(401).json({ error: 'Invalid email or password' });

    setSession(res, user.id);
    res.json({ user: { id: user.id, email: user.email, name: user.name, handle: user.handle, avatar: user.avatar } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.clearCookie('csrf');
  res.json({ success: true });
});

router.get('/me', authMiddleware, (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT id, email, name, handle, avatar, created_at FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  issueCsrf(res); // refresh CSRF token on session bootstrap
  res.json({ user });
});

module.exports = router;
