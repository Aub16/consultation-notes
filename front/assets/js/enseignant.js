function fmt(n) {
  return Number(n).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function avgClass(avg) {
  if (avg == null) return '';
  if (avg >= 14) return 'good';
  if (avg < 12) return 'mid';
  return '';
}

let currentCourseId = null;
let courses = [];

const sidebar = document.getElementById('sidebar');
const panelTitle = document.getElementById('panel-title');
const panelSub = document.getElementById('panel-sub');
const panelLoading = document.getElementById('panel-loading');
const panelEmpty = document.getElementById('panel-empty');
const tableWrap = document.getElementById('table-wrap');
const tbody = document.getElementById('students-tbody');
const newEvalHeader = document.getElementById('new-eval-header');
const addEvaluationBtn = document.getElementById('add-evaluation-btn');

function renderSidebar() {
  const items = courses
    .map(
      (c) => `
      <button class="nav-item ${c.id === currentCourseId ? 'active' : ''}" data-course-id="${c.id}">
        <span class="n-name">${c.name}</span>
        <span class="n-meta">${c.level} · ${c.studentsCount} étudiant${c.studentsCount > 1 ? 's' : ''}</span>
      </button>
    `
    )
    .join('');
  sidebar.innerHTML = `<div class="side-title">Mes cours</div>${items}`;
  sidebar.querySelectorAll('.nav-item').forEach((btn) => {
    btn.addEventListener('click', () => selectCourse(Number(btn.dataset.courseId)));
  });
}

function studentRow(course, student) {
  const cls = avgClass(student.average);
  return `
    <tr data-student-id="${student.id}">
      <td>
        <div class="s-name">${student.firstName} ${student.lastName}</div>
        <div class="s-meta">${student.level} · ${student.studentNumber}</div>
      </td>
      <td class="c-avg ${cls}">${student.average != null ? fmt(student.average) : '—'}</td>
      <td>
        <input
          class="table-input note-input"
          type="number" min="0" max="20" step="0.5"
          placeholder="Saisir…"
          value="${student.currentGrade != null ? student.currentGrade : ''}"
          ${course.currentEvaluation ? '' : 'disabled'}
        />
      </td>
      <td>
        <input class="table-input colle-input" type="number" min="0" step="1" value="${student.colleHours || 0}" />
      </td>
    </tr>
  `;
}

function bindRowEvents(course) {
  tbody.querySelectorAll('tr').forEach((row) => {
    const studentId = Number(row.dataset.studentId);

    const noteInput = row.querySelector('.note-input');
    noteInput.addEventListener('change', async () => {
      const value = noteInput.value === '' ? null : Number(noteInput.value);
      try {
        await api.put(`/cours/${course.id}/etudiants/${studentId}/note`, {
          evaluationId: course.currentEvaluation.id,
          value,
        });
        flashSaved(noteInput);
        selectCourse(course.id, { silent: true });
      } catch {
        noteInput.classList.add('has-error');
      }
    });

    const colleInput = row.querySelector('.colle-input');
    colleInput.addEventListener('change', async () => {
      try {
        await api.put(`/cours/${course.id}/etudiants/${studentId}/colle`, {
          hours: Number(colleInput.value || 0),
        });
        flashSaved(colleInput);
      } catch {
        colleInput.classList.add('has-error');
      }
    });
  });
}

function flashSaved(input) {
  input.classList.add('saved');
  setTimeout(() => input.classList.remove('saved'), 900);
}

async function selectCourse(courseId, opts = {}) {
  currentCourseId = courseId;
  if (!opts.silent) renderSidebar();

  panelLoading.classList.remove('hidden');
  panelEmpty.classList.add('hidden');
  tableWrap.classList.add('hidden');

  try {
    const course = await api.get(`/cours/${courseId}/notes`);
    panelLoading.classList.add('hidden');

    panelTitle.textContent = `${course.name} · ${course.level}`;
    panelSub.textContent = `${course.students.length} étudiant${course.students.length > 1 ? 's' : ''} · ${
      course.currentEvaluation ? course.currentEvaluation.label : 'Aucune évaluation en cours'
    }`;
    newEvalHeader.textContent = course.currentEvaluation ? course.currentEvaluation.label.toUpperCase() : 'NOUVELLE NOTE';

    if (course.students.length === 0) {
      panelEmpty.classList.remove('hidden');
      return;
    }

    tbody.innerHTML = course.students.map((s) => studentRow(course, s)).join('');
    tableWrap.classList.remove('hidden');
    bindRowEvents(course);
  } catch {
    panelLoading.textContent = 'Impossible de charger ce cours.';
  }
}

addEvaluationBtn.addEventListener('click', async () => {
  if (!currentCourseId) return;
  const label = prompt('Nom de la nouvelle évaluation (ex. Contrôle continu #2)');
  if (!label) return;
  try {
    await api.post(`/cours/${currentCourseId}/evaluations`, { label });
    selectCourse(currentCourseId);
  } catch {
    alert("Impossible de créer l'évaluation.");
  }
});

(async function init() {
  const user = await requireRole('enseignant');
  if (!user) return;

  const loading = document.getElementById('loading');
  const emptyCourses = document.getElementById('empty-courses');
  const teacherBody = document.getElementById('teacher-body');

  try {
    courses = await api.get('/mes-cours');
    loading.classList.add('hidden');

    if (courses.length === 0) {
      emptyCourses.classList.remove('hidden');
      return;
    }

    teacherBody.classList.remove('hidden');
    renderSidebar();
    await selectCourse(courses[0].id);
  } catch {
    loading.textContent = 'Impossible de charger vos cours pour le moment.';
  }
})();
