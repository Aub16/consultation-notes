const form = document.getElementById('signup-form');
const submitBtn = document.getElementById('submit-btn');
const errorBanner = document.getElementById('error-banner');
const errorMessage = document.getElementById('error-message');
const successBanner = document.getElementById('success-banner');
const roleSelect = document.getElementById('role');
const levelField = document.getElementById('level-field');

roleSelect.addEventListener('change', () => {
  levelField.classList.toggle('hidden', roleSelect.value === 'enseignant');
});

function showError(message) {
  errorMessage.textContent = message;
  errorBanner.classList.remove('hidden');
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorBanner.classList.add('hidden');

  const payload = {
    firstName: document.getElementById('firstName').value.trim(),
    lastName: document.getElementById('lastName').value.trim(),
    email: document.getElementById('email').value.trim(),
    password: document.getElementById('password').value,
    role: roleSelect.value,
    level: document.getElementById('level').value.trim() || null,
  };

  submitBtn.disabled = true;
  submitBtn.textContent = 'Envoi…';

  try {
    await api.post('/inscription', payload);
    form.classList.add('hidden');
    successBanner.classList.remove('hidden');
  } catch (err) {
    showError(err.data && err.data.message ? err.data.message : 'Une erreur est survenue, réessayez.');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Créer mon compte';
  }
});
