const REQUEST_ROLE_LABELS = { etudiant: 'Étudiant', enseignant: 'Enseignant' };

function initialsOf(firstName, lastName) {
  return `${(firstName || '?')[0]}${(lastName || '?')[0]}`.toUpperCase();
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR');
}

function renderRequest(req) {
  return `
    <div class="card request-row" data-request-id="${req.id}">
      <div class="left">
        <div class="avatar-lg role-${req.role}">${initialsOf(req.firstName, req.lastName)}</div>
        <div>
          <div class="name-line">
            <span class="name">${req.firstName} ${req.lastName}</span>
            <span class="pill role-${req.role}">${REQUEST_ROLE_LABELS[req.role].toUpperCase()}</span>
          </div>
          <div class="meta">${req.email} · Demande le ${formatDate(req.requestedAt)}</div>
        </div>
      </div>
      <div class="actions">
        <button class="btn btn-danger-outline btn-sm" data-action="refuser">Refuser</button>
        <button class="btn btn-success btn-sm" data-action="valider">Valider</button>
      </div>
    </div>
  `;
}

async function loadStats() {
  try {
    const stats = await api.get('/admin/stats');
    document.getElementById('stat-pending').textContent = stats.pending;
    document.getElementById('stat-students').textContent = stats.students;
    document.getElementById('stat-teachers').textContent = stats.teachers;
    document.getElementById('stat-courses').textContent = stats.activeCourses;
  } catch { /* stats are non-critical */ }
}

async function loadRequests() {
  const loading = document.getElementById('loading');
  const requestsEl = document.getElementById('requests');
  const emptyState = document.getElementById('empty-state');
  const pendingPill = document.getElementById('pending-pill');

  try {
    const requests = await api.get('/comptes-en-attente');
    loading.classList.add('hidden');

    pendingPill.textContent = `${requests.length} en attente`;

    if (requests.length === 0) {
      requestsEl.innerHTML = '';
      emptyState.classList.remove('hidden');
      return;
    }

    emptyState.classList.add('hidden');
    requestsEl.innerHTML = requests.map(renderRequest).join('');

    requestsEl.querySelectorAll('[data-action]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const row = btn.closest('.request-row');
        const requestId = row.dataset.requestId;
        const action = btn.dataset.action;
        row.querySelectorAll('button').forEach((b) => (b.disabled = true));
        try {
          await api.post(`/comptes-en-attente/${requestId}/${action}`);
          row.remove();
          loadStats();
          const remaining = requestsEl.querySelectorAll('.request-row').length;
          pendingPill.textContent = `${remaining} en attente`;
          if (remaining === 0) emptyState.classList.remove('hidden');
        } catch {
          row.querySelectorAll('button').forEach((b) => (b.disabled = false));
          alert("Impossible de traiter cette demande pour l'instant.");
        }
      });
    });
  } catch {
    loading.textContent = 'Impossible de charger les demandes.';
  }
}

(async function init() {
  const user = await requireRole('superviseur');
  if (!user) return;
  loadStats();
  loadRequests();
})();
