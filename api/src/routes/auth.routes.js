const express = require('express');
const pool = require('../config/db');
const { hashPassword, verifyPassword } = require('../utils/password');
const { createSession, destroySession, COOKIE_NAME, SESSION_DURATION_MS } = require('../utils/session');
const { toSafeUser } = require('../utils/mappers');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const VALID_SIGNUP_ROLES = ['etudiant', 'enseignant'];

router.post('/connexion', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'E-mail et mot de passe requis.' });
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];

    if (!user || !verifyPassword(password, user.password_hash, user.password_salt)) {
      return res.status(401).json({ message: 'E-mail ou mot de passe incorrect.' });
    }

    if (user.status === 'pending') {
      return res.status(403).json({ message: 'Votre compte est en attente de validation par un superviseur.' });
    }
    if (user.status === 'rejected') {
      return res.status(403).json({ message: 'Votre demande de compte a été refusée.' });
    }

    const { token } = await createSession(user.id);
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: SESSION_DURATION_MS,
    });

    res.json(toSafeUser(user));
  } catch (err) {
    next(err);
  }
});

router.post('/inscription', async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, role, level } = req.body;

    if (!firstName || !lastName || !email || !password || !role) {
      return res.status(400).json({ message: 'Tous les champs sont requis.' });
    }
    if (!VALID_SIGNUP_ROLES.includes(role)) {
      return res.status(400).json({ message: 'Rôle invalide.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 8 caractères.' });
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Un compte existe déjà avec cette adresse e-mail.' });
    }

    const { hash, salt } = hashPassword(password);

    const [result] = await pool.query(
      `INSERT INTO users (first_name, last_name, email, password_hash, password_salt, role, status, level)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [firstName, lastName, email, hash, salt, role, level || null]
    );

    if (role === 'etudiant') {
      const studentNumber = `#${new Date().getFullYear()}-${String(result.insertId).padStart(3, '0')}`;
      await pool.query('UPDATE users SET student_number = ? WHERE id = ?', [studentNumber, result.insertId]);
    }

    res.status(201).json({ message: 'Demande de compte envoyée.' });
  } catch (err) {
    next(err);
  }
});

router.post('/deconnexion', async (req, res, next) => {
  try {
    await destroySession(req.cookies[COOKIE_NAME]);
    res.clearCookie(COOKIE_NAME);
    res.json({ message: 'Déconnecté.' });
  } catch (err) {
    next(err);
  }
});

router.get('/moi', requireAuth, (req, res) => {
  res.json(toSafeUser(req.user));
});

module.exports = router;
