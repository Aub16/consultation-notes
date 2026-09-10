function fmt(n) {
  return Number(n).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function fmtGrade(n) {
  return Number(n).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 1 });
}

function avgClass(avg) {
  if (avg >= 14) return 'good';
  if (avg < 12) return 'mid';
  return 'neutral';
}

function renderCourse(course) {
  const cls = avgClass(course.average);
  const chips = course.grades.map((g) => `<div class="grade-chip">${fmtGrade(g)}</div>`).join('');
  return `
    <div class="card course-row">
      <div class="left">
        <div class="cname">${course.name}</div>
        <div class="cmeta">${course.teacherName} · ${course.grades.length} note${course.grades.length > 1 ? 's' : ''}</div>
      </div>
      <div class="right">
        <div class="grades">${chips || '<span class="cmeta">Aucune note</span>'}</div>
        <div class="course-avg ${cls}">${course.grades.length ? fmt(course.average) : '—'}</div>
      </div>
    </div>
  `;
}

(async function init() {
  const user = await requireRole('etudiant');
  if (!user) return;

  const loading = document.getElementById('loading');
  const statsEl = document.getElementById('stats');
  const coursesTitle = document.getElementById('courses-title');
  const coursesEl = document.getElementById('courses');
  const emptyState = document.getElementById('empty-state');

  try {
    const data = await api.get('/mes-notes');
    loading.classList.add('hidden');

    if (!data.courses || data.courses.length === 0) {
      emptyState.classList.remove('hidden');
      return;
    }

    statsEl.classList.remove('hidden');
    coursesTitle.classList.remove('hidden');

    document.getElementById('stat-average').textContent = `${fmt(data.average)} / 20`;
    document.getElementById('stat-average-sub').textContent =
      data.averageDelta != null
        ? `${data.averageDelta >= 0 ? '+' : ''}${fmt(data.averageDelta)} vs semestre précédent`
        : '';

    document.getElementById('stat-courses').textContent = data.coursesCount;
    document.getElementById('stat-courses-sub').textContent =
      data.coursesWithUpcoming ? `${data.coursesWithUpcoming} avec évaluation à venir` : 'Aucune évaluation à venir';

    document.getElementById('stat-best').textContent = data.best ? fmt(data.best.average) : '—';
    document.getElementById('stat-best-sub').textContent = data.best ? data.best.courseName : '';

    coursesEl.innerHTML = data.courses.map(renderCourse).join('');
  } catch (err) {
    loading.textContent = "Impossible de charger vos notes pour l'instant.";
  }
})();
