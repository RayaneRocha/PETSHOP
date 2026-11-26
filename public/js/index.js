(async function initProducts() {
  const container = document.getElementById('products');
  const alertBox = document.getElementById('alert');
  await renderHeader();

  let products = [];
  try {
    ({ products } = await api('/api/products'));
  } catch (err) {
    container.innerHTML = '';
    alertBox.textContent = `Não foi possível carregar os produtos: ${err.message}`;
    alertBox.className = 'alert alert-error';
    return;
  }

  container.innerHTML = products
    .map(
      (p) => `
      <article class="card">
        <div class="card-media" aria-hidden="true">${escapeHtml(p.emoji)}</div>
        <div class="card-body">
          <span class="card-category">${escapeHtml(p.category)}</span>
          <h2 class="card-title">${escapeHtml(p.name)}</h2>
          <p class="card-desc">${escapeHtml(p.description)}</p>
          <div class="card-price">${formatBRL(p.price)}</div>
          <div class="stock ${p.inStock ? '' : 'out'}" data-stock="${p.id}">
            ${p.inStock ? `${p.stock} em estoque` : 'Esgotado'}
          </div>
          <form class="card-actions" data-product="${p.id}">
            <input type="number" name="quantity" min="1" max="${p.stock}" value="1"
              aria-label="Quantidade" ${p.inStock ? '' : 'disabled'}>
            <button class="btn" type="submit" ${p.inStock ? '' : 'disabled'}>
              ${p.inStock ? 'Adicionar ao carrinho' : 'Sem estoque'}
            </button>
          </form>
        </div>
      </article>`
    )
    .join('');

  container.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.target;
    const productId = form.dataset.product;

    if (!auth.isLoggedIn()) {
      window.location.href = '/login.html?next=/index.html';
      return;
    }

    const quantity = Number(form.quantity.value);
    const button = form.querySelector('button');
    button.disabled = true;
    try {
      const cart = await api('/api/cart/items', { method: 'POST', body: { productId, quantity } });
      updateCartCount(cart.itemCount);
      const added = cart.items.find((item) => item.productId === productId);
      showToast(`${added ? added.name : 'Produto'} adicionado ao carrinho.`);
    } catch (err) {
      if (err.status === 401) {
        window.location.href = '/login.html?next=/index.html';
        return;
      }
      showToast(errorMessage(err), 'error');
    } finally {
      button.disabled = false;
    }
  });
})();
