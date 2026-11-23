(function initLogin() {
  renderHeader();
  const form = document.getElementById('login-form');
  const alertBox = document.getElementById('alert');
  const next = new URLSearchParams(window.location.search).get('next');
  const redirectTo = next && next.startsWith('/') && !next.startsWith('//') ? next : '/index.html';

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    alertBox.className = 'alert hidden';
    const button = form.querySelector('button');
    button.disabled = true;

    try {
      const { token } = await api('/api/auth/login', {
        method: 'POST',
        body: { email: form.email.value.trim(), password: form.password.value },
      });
      auth.setToken(token);
      window.location.href = redirectTo;
    } catch (err) {
      alertBox.textContent = errorMessage(err);
      alertBox.className = 'alert alert-error';
      button.disabled = false;
    }
  });
})();
