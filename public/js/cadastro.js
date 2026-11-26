(function initRegister() {
  renderHeader();
  const form = document.getElementById('register-form');
  const alertBox = document.getElementById('alert');

  const showError = (message) => {
    alertBox.textContent = message;
    alertBox.className = 'alert alert-error';
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    alertBox.className = 'alert hidden';

    if (form.password.value !== form.confirm.value) {
      showError('As senhas não conferem.');
      return;
    }

    const button = form.querySelector('button');
    button.disabled = true;
    try {
      const { token } = await api('/api/auth/register', {
        method: 'POST',
        body: {
          name: form.name.value.trim(),
          email: form.email.value.trim(),
          password: form.password.value,
        },
      });
      auth.setToken(token);
      window.location.href = '/index.html';
    } catch (err) {
      showError(errorMessage(err));
      button.disabled = false;
    }
  });
})();
