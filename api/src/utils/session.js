const crypto = require('crypto');
const pool = require('../config/db');

const COOKIE_NAME = 'session';
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

async function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  await pool.query('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)', [
    token,
    userId,
    expiresAt,
  ]);
  return { token, expiresAt };
}

async function destroySession(token) {
  if (!token) return;
  await pool.query('DELETE FROM sessions WHERE token = ?', [token]);
}

async function getUserBySessionToken(token) {
  if (!token) return null;
  const [rows] = await pool.query(
    `SELECT u.* FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token = ? AND s.expires_at > NOW()`,
    [token]
  );
  return rows[0] || null;
}

module.exports = {
  createSession,
  destroySession,
  getUserBySessionToken,
  COOKIE_NAME,
  SESSION_DURATION_MS,
};
