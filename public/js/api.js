// Utilitários compartilhados pelas páginas do site.
const TOKEN_KEY = 'petshop_token';

const storage = {
  get(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  },
  set(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* ignorado */ }
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch (e) { /* ignorado */ }
  },
};

const auth = {
  getToken: () => storage.get(TOKEN_KEY),
  setToken: (token) => storage.set(TOKEN_KEY, token),
  logout() {
    storage.remove(TOKEN_KEY);
    window.location.href = '/index.html';
  },
  isLoggedIn: () => Boolean(storage.get(TOKEN_KEY)),
};

class ApiError extends Error {
  constructor(status, body) {
    super((body && body.error) || 'Erro inesperado.');
    this.status = status;
    this.details = body && body.details;
  }
}

async function api(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = auth.getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => ({}));

  if (response.status === 401 && token) {
    // Sessão expirada: limpa o token.
    storage.remove(TOKEN_KEY);
  }
  if (!response.ok) throw new ApiError(response.status, data);
  return data;
}

const formatBRL = (value) =>
  Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text == null ? '' : String(text);
  return div.innerHTML;
}

function errorMessage(err) {
  if (Array.isArray(err.details) && err.details.length && typeof err.details[0] === 'string') {
    return `${err.message} ${err.details.join(' ')}`;
  }
  return err.message;
}

let toastTimer;
function showToast(message, type = 'info') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.toggle('error', type === 'error');
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}

// Monta o menu do cabeçalho de acordo com o estado de login.
async function renderHeader() {
  const nav = document.getElementById('nav');
  if (!nav) return null;

  let user = null;
  let cartCount = 0;
  if (auth.isLoggedIn()) {
    try {
      const [{ user: me }, cart] = await Promise.all([api('/api/auth/me'), api('/api/cart')]);
      user = me;
      cartCount = cart.itemCount;
    } catch (e) {
      user = null;
    }
  }

  if (user) {
    nav.innerHTML = `
      <a href="/index.html">Produtos</a>
      <a href="/carrinho.html" class="cart-link">🛒 Carrinho<span class="cart-count" id="cart-count">${cartCount}</span></a>
      <span class="user-chip">Olá, ${escapeHtml(user.name.split(' ')[0])}${user.isVip ? '<span class="badge-vip">VIP</span>' : ''}</span>
      <button class="link-button" id="logout-btn" type="button">Sair</button>
    `;
    document.getElementById('logout-btn').addEventListener('click', auth.logout);
  } else {
    nav.innerHTML = `
      <a href="/index.html">Produtos</a>
      <a href="/login.html">Entrar</a>
      <a href="/cadastro.html" class="btn">Criar conta</a>
    `;
  }
  return user;
}

function updateCartCount(count) {
  const el = document.getElementById('cart-count');
  if (el) el.textContent = count;
}
