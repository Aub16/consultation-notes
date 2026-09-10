const express = require('express');
const pool = require('../config/db');
const { requireRole } = require('../middleware/auth');

const router = express.Router();
const requireTeacher = requireRole('enseignant');

async function loadOwnedCourse(teacherId, courseId) {
  const [rows] = await pool.query('SELECT * FROM courses WHERE id = ? AND teacher_id = ?', [
    courseId,
    teacherId,
  ]);
  return rows[0] || null;
}

router.get('/mes-cours', requireTeacher, async (req, res, next) => {
  try {
    const [courses] = await pool.query(
      `SELECT c.id, c.name, c.level, COUNT(e.id) AS studentsCount
       FROM courses c
       LEFT JOIN enrollments e ON e.course_id = c.id
       WHERE c.teacher_id = ?
       GROUP BY c.id
       ORDER BY c.name`,
      [req.user.id]
    );
    res.json(courses);
  } catch (err) {
    next(err);
  }
});

router.get('/cours/:id/notes', requireTeacher, async (req, res, next) => {
  try {
    const course = await loadOwnedCourse(req.user.id, req.params.id);
    if (!course) return res.status(404).json({ message: 'Cours introuvable.' });

    const [[currentEvaluation]] = await pool.query(
      'SELECT id, label FROM evaluations WHERE course_id = ? ORDER BY created_at DESC, id DESC LIMIT 1',
      [course.id]
    );

    const [students] = await pool.query(
      `SELECT u.id, u.first_name, u.last_name, u.level, u.student_number, e.colle_hours
       FROM enrollments e
       JOIN users u ON u.id = e.student_id
       WHERE e.course_id = ?
       ORDER BY u.last_name`,
      [course.id]
    );

    const studentResults = [];
    for (const student of students) {
      const [grades] = await pool.query(
        `SELECT g.value FROM grades g
         JOIN evaluations ev ON ev.id = g.evaluation_id
         WHERE ev.course_id = ? AND g.student_id = ?`,
        [course.id, student.id]
      );
      const values = grades.map((g) => Number(g.value));
      const average = values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;

      let currentGrade = null;
      if (currentEvaluation) {
        const [[row]] = await pool.query(
          'SELECT value FROM grades WHERE evaluation_id = ? AND student_id = ?',
          [currentEvaluation.id, student.id]
        );
        currentGrade = row ? Number(row.value) : null;
      }

      studentResults.push({
        id: student.id,
        firstName: student.first_name,
        lastName: student.last_name,
        level: student.level,
        studentNumber: student.student_number,
        colleHours: student.colle_hours,
        average,
        currentGrade,
      });
    }

    res.json({
      id: course.id,
      name: course.name,
      level: course.level,
      currentEvaluation: currentEvaluation || null,
      students: studentResults,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/cours/:id/evaluations', requireTeacher, async (req, res, next) => {
  try {
    const course = await loadOwnedCourse(req.user.id, req.params.id);
    if (!course) return res.status(404).json({ message: 'Cours introuvable.' });

    const { label } = req.body;
    if (!label) return res.status(400).json({ message: 'Le nom de l’évaluation est requis.' });

    const [result] = await pool.query('INSERT INTO evaluations (course_id, label) VALUES (?, ?)', [
      course.id,
      label,
    ]);
    res.status(201).json({ id: result.insertId, label });
  } catch (err) {
    next(err);
  }
});

router.put('/cours/:id/etudiants/:studentId/note', requireTeacher, async (req, res, next) => {
  try {
    const course = await loadOwnedCourse(req.user.id, req.params.id);
    if (!course) return res.status(404).json({ message: 'Cours introuvable.' });

    const { evaluationId, value } = req.body;
    if (!evaluationId) return res.status(400).json({ message: 'evaluationId requis.' });

    if (value === null || value === undefined || value === '') {
      await pool.query('DELETE FROM grades WHERE evaluation_id = ? AND student_id = ?', [
        evaluationId,
        req.params.studentId,
      ]);
      return res.json({ message: 'Note supprimée.' });
    }

    const numericValue = Number(value);
    if (Number.isNaN(numericValue) || numericValue < 0 || numericValue > 20) {
      return res.status(400).json({ message: 'La note doit être comprise entre 0 et 20.' });
    }

    await pool.query(
      `INSERT INTO grades (evaluation_id, student_id, value) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE value = VALUES(value)`,
      [evaluationId, req.params.studentId, numericValue]
    );
    res.json({ message: 'Note enregistrée.' });
  } catch (err) {
    next(err);
  }
});

router.put('/cours/:id/etudiants/:studentId/colle', requireTeacher, async (req, res, next) => {
  try {
    const course = await loadOwnedCourse(req.user.id, req.params.id);
    if (!course) return res.status(404).json({ message: 'Cours introuvable.' });

    const hours = Number(req.body.hours);
    if (Number.isNaN(hours) || hours < 0) {
      return res.status(400).json({ message: 'Nombre d’heures invalide.' });
    }

    await pool.query('UPDATE enrollments SET colle_hours = ? WHERE course_id = ? AND student_id = ?', [
      hours,
      course.id,
      req.params.studentId,
    ]);
    res.json({ message: 'Heures de colle enregistrées.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
