const express = require('express');
const pool = require('../config/db');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/mes-notes', requireRole('etudiant'), async (req, res, next) => {
  try {
    const studentId = req.user.id;

    const [courses] = await pool.query(
      `SELECT c.id, c.name, c.level, u.first_name AS teacher_first_name, u.last_name AS teacher_last_name
       FROM enrollments e
       JOIN courses c ON c.id = e.course_id
       JOIN users u ON u.id = c.teacher_id
       WHERE e.student_id = ?
       ORDER BY c.name`,
      [studentId]
    );

    const courseResults = [];
    for (const course of courses) {
      const [grades] = await pool.query(
        `SELECT g.value FROM grades g
         JOIN evaluations ev ON ev.id = g.evaluation_id
         WHERE ev.course_id = ? AND g.student_id = ?
         ORDER BY ev.created_at ASC, ev.id ASC`,
        [course.id, studentId]
      );

      const [[{ pendingCount }]] = await pool.query(
        `SELECT COUNT(*) AS pendingCount FROM evaluations ev
         WHERE ev.course_id = ?
           AND ev.id NOT IN (
             SELECT evaluation_id FROM grades WHERE student_id = ?
           )`,
        [course.id, studentId]
      );

      const values = grades.map((g) => Number(g.value));
      const average = values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;

      courseResults.push({
        id: course.id,
        name: course.name,
        teacherName: `Pr. ${course.teacher_last_name}`,
        grades: values,
        average,
        hasUpcoming: pendingCount > 0,
      });
    }

    const withGrades = courseResults.filter((c) => c.average != null);
    const average = withGrades.length
      ? withGrades.reduce((sum, c) => sum + c.average, 0) / withGrades.length
      : null;
    const best = withGrades.length
      ? withGrades.reduce((a, b) => (b.average > a.average ? b : a))
      : null;

    res.json({
      average,
      averageDelta: null,
      coursesCount: courseResults.length,
      coursesWithUpcoming: courseResults.filter((c) => c.hasUpcoming).length,
      best: best ? { average: best.average, courseName: best.name } : null,
      courses: courseResults,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
