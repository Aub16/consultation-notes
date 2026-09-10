const ROLE_LABELS = {
  etudiant: 'Étudiant',
  enseignant: 'Enseignant',
  superviseur: 'Superviseur',
};

function initials(firstName, lastName) {
  return `${(firstName || '?')[0]}${(lastName || '?')[0]}`.toUpperCase();
}

function renderTopbar(user) {
  const el = document.getElementById('topbar');
  if (!el) return;
  el.innerHTML = `
    <div class="brand">
      <div class="logo">CN</div>
      <span class="name">Consultation Notes</span>
    </div>
    <div class="user">
      <div class="uinfo">
        <div class="uname">${user.firstName} ${user.lastName}</div>
        <div class="urole">${ROLE_LABELS[user.role] || user.role}</div>
      </div>
      <div class="avatar">${initials(user.firstName, user.lastName)}</div>
      <button class="logout" id="logout-btn" title="Se déconnecter">Déconnexion</button>
    </div>
  `;
  document.getElementById('logout-btn').addEventListener('click', async () => {
    try { await api.post('/deconnexion'); } catch { /* ignore */ }
    window.location.href = '/index.html';
  });
}

/**
 * Guards a page: redirects to login if not authenticated, or to the
 * account's own space if the role does not match. Returns the user.
 */
async function requireRole(expectedRole) {
  let user;
  try {
    user = await api.get('/moi');
  } catch {
    window.location.href = '/index.html';
    return null;
  }
  if (user.role !== expectedRole) {
    window.location.href = `/${user.role}/index.html`;
    return null;
  }
  renderTopbar(user);
  return user;
}
