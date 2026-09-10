const form = document.getElementById('login-form');
const submitBtn = document.getElementById('submit-btn');
const errorBanner = document.getElementById('error-banner');
const errorMessage = document.getElementById('error-message');
const passwordInput = document.getElementById('password');

function showError(message) {
  errorMessage.textContent = message;
  errorBanner.classList.remove('hidden');
  passwordInput.parentElement.classList.add('has-error');
}

function clearError() {
  errorBanner.classList.add('hidden');
  passwordInput.parentElement.classList.remove('has-error');
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError();

  const email = document.getElementById('email').value.trim();
  const password = passwordInput.value;

  submitBtn.disabled = true;
  submitBtn.textContent = 'Connexion…';

  try {
    const user = await api.post('/connexion', { email, password });
    window.location.href = `/${user.role}/index.html`;
  } catch (err) {
    if (err.status === 403) {
      showError('Votre compte est en attente de validation par un superviseur.');
      submitBtn.textContent = 'En attente de validation';
      submitBtn.disabled = true;
      return;
    }
    showError('E-mail ou mot de passe incorrect.');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Se connecter';
  }
});
