const express = require('express');
const pool = require('../config/db');
const { requireRole } = require('../middleware/auth');

const router = express.Router();
const requireSupervisor = requireRole('superviseur');

router.get('/comptes-en-attente', requireSupervisor, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, first_name, last_name, email, role, created_at
       FROM users WHERE status = 'pending'
       ORDER BY created_at ASC`
    );
    res.json(
      rows.map((r) => ({
        id: r.id,
        firstName: r.first_name,
        lastName: r.last_name,
        email: r.email,
        role: r.role,
        requestedAt: r.created_at,
      }))
    );
  } catch (err) {
    next(err);
  }
});

router.post('/comptes-en-attente/:id/valider', requireSupervisor, async (req, res, next) => {
  try {
    const [result] = await pool.query(
      "UPDATE users SET status = 'active' WHERE id = ? AND status = 'pending'",
      [req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Demande introuvable.' });
    res.json({ message: 'Compte validé.' });
  } catch (err) {
    next(err);
  }
});

router.post('/comptes-en-attente/:id/refuser', requireSupervisor, async (req, res, next) => {
  try {
    const [result] = await pool.query(
      "UPDATE users SET status = 'rejected' WHERE id = ? AND status = 'pending'",
      [req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Demande introuvable.' });
    res.json({ message: 'Demande refusée.' });
  } catch (err) {
    next(err);
  }
});

router.get('/admin/stats', requireSupervisor, async (req, res, next) => {
  try {
    const [[{ pending }]] = await pool.query(
      "SELECT COUNT(*) AS pending FROM users WHERE status = 'pending'"
    );
    const [[{ students }]] = await pool.query(
      "SELECT COUNT(*) AS students FROM users WHERE role = 'etudiant' AND status = 'active'"
    );
    const [[{ teachers }]] = await pool.query(
      "SELECT COUNT(*) AS teachers FROM users WHERE role = 'enseignant' AND status = 'active'"
    );
    const [[{ activeCourses }]] = await pool.query('SELECT COUNT(*) AS activeCourses FROM courses');

    res.json({ pending, students, teachers, activeCourses });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
