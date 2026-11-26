(async function initCart() {
  if (!auth.isLoggedIn()) {
    window.location.href = '/login.html?next=/carrinho.html';
    return;
  }

  const itemsEl = document.getElementById('cart-items');
  const summaryEl = document.getElementById('summary');
  const alertBox = document.getElementById('alert');
  const form = document.getElementById('checkout-form');
  const checkoutBtn = document.getElementById('checkout-btn');
  const shippingInfo = document.getElementById('shipping-info');
  const successEl = document.getElementById('order-success');
  const layout = document.getElementById('cart-layout');

  const paymentLabels = { pix: 'Pix', cartao_credito: 'Cartão de crédito', boleto: 'Boleto' };

  const selectedPayment = () => form.paymentMethod.value;

  const showAlert = (message, type = 'error') => {
    alertBox.textContent = message;
    alertBox.className = `alert alert-${type}`;
  };
  const hideAlert = () => { alertBox.className = 'alert hidden'; };

  function renderShippingInfo(summary, isEmpty) {
    const threshold = formatBRL(summary.freeShippingThreshold);
    if (isEmpty) {
      shippingInfo.textContent = `Frete grátis em compras acima de ${threshold}.`;
    } else if (summary.freeShipping) {
      shippingInfo.textContent = '🚚 Sua compra tem frete grátis!';
    } else {
      const missing = Math.max(summary.freeShippingThreshold - summary.subtotal, 0);
      shippingInfo.textContent = `Faltam ${formatBRL(missing)} em produtos para passar de ${threshold} e ganhar frete grátis.`;
    }
  }

  function renderItems(cart) {
    if (cart.items.length === 0) {
      itemsEl.innerHTML = `
        <div class="empty">
          <div class="big">🛒</div>
          <p>Seu carrinho está vazio.</p>
          <a class="btn" href="/index.html">Ver produtos</a>
        </div>`;
      return;
    }

    itemsEl.innerHTML = cart.items
      .map((item) => {
        const overStock = item.quantity > item.stock;
        return `
        <div class="cart-item" data-product="${item.productId}">
          <div class="cart-item-emoji" aria-hidden="true">${escapeHtml(item.emoji)}</div>
          <div>
            <div class="cart-item-name">${escapeHtml(item.name)}</div>
            <div class="cart-item-meta">${formatBRL(item.unitPrice)} cada · ${item.stock} em estoque</div>
            ${overStock ? '<div class="stock out">Quantidade maior que o estoque atual</div>' : ''}
          </div>
          <div class="cart-item-controls">
            <div class="qty">
              <button type="button" data-action="decrease" aria-label="Diminuir" ${item.quantity <= 1 ? 'disabled' : ''}>−</button>
              <span>${item.quantity}</span>
              <button type="button" data-action="increase" aria-label="Aumentar" ${item.quantity >= item.stock ? 'disabled' : ''}>+</button>
            </div>
            <span class="line-total">${formatBRL(item.lineTotal)}</span>
            <button type="button" class="link-button" data-action="remove">Remover</button>
          </div>
        </div>`;
      })
      .join('');
  }

  function renderSummary(summary, isEmpty) {
    summaryEl.innerHTML = `
      <div class="summary-row"><span>Subtotal</span><span>${formatBRL(summary.subtotal)}</span></div>
      ${summary.discount > 0
        ? `<div class="summary-row discount"><span>Desconto Pix (5%)</span><span>− ${formatBRL(summary.discount)}</span></div>`
        : ''}
      <div class="summary-row">
        <span>Frete</span>
        <span>${isEmpty ? '—' : summary.freeShipping ? 'Grátis' : formatBRL(summary.shipping)}</span>
      </div>
      <div class="summary-row total"><span>Total</span><span>${formatBRL(summary.total)}</span></div>`;
    checkoutBtn.disabled = isEmpty;
    renderShippingInfo(summary, isEmpty);
  }

  async function loadCart() {
    const cart = await api(`/api/cart?paymentMethod=${encodeURIComponent(selectedPayment())}`);
    renderItems(cart);
    renderSummary(cart.summary, cart.items.length === 0);
    updateCartCount(cart.itemCount);
    return cart;
  }

  async function refresh() {
    try {
      await loadCart();
    } catch (err) {
      if (err.status === 401) {
        window.location.href = '/login.html?next=/carrinho.html';
        return;
      }
      showAlert(errorMessage(err));
    }
  }

  await renderHeader();
  await refresh();

  form.addEventListener('change', (event) => {
    if (event.target.name === 'paymentMethod') refresh();
  });

  itemsEl.addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const row = button.closest('.cart-item');
    const productId = row.dataset.product;
    const current = Number(row.querySelector('.qty span').textContent);
    hideAlert();
    button.disabled = true;

    try {
      if (button.dataset.action === 'remove') {
        await api(`/api/cart/items/${productId}`, { method: 'DELETE' });
      } else {
        const quantity = button.dataset.action === 'increase' ? current + 1 : current - 1;
        await api(`/api/cart/items/${productId}`, { method: 'PUT', body: { quantity } });
      }
      await refresh();
    } catch (err) {
      showAlert(errorMessage(err));
      button.disabled = false;
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    hideAlert();
    checkoutBtn.disabled = true;
    checkoutBtn.textContent = 'Processando...';

    try {
      const { order } = await api('/api/checkout', {
        method: 'POST',
        body: { paymentMethod: selectedPayment() },
      });

      layout.classList.add('hidden');
      successEl.classList.remove('hidden');
      successEl.innerHTML = `
        <h2>✅ Compra finalizada!</h2>
        <p>Pedido <strong>#${escapeHtml(order.id.slice(-6).toUpperCase())}</strong> · pagamento via ${paymentLabels[order.paymentMethod]}</p>
        <ul class="order-items">
          ${order.items.map((i) => `<li>${i.quantity}× ${escapeHtml(i.name)} — ${formatBRL(i.lineTotal)}</li>`).join('')}
        </ul>
        <div class="summary-row"><span>Subtotal</span><span>${formatBRL(order.subtotal)}</span></div>
        ${order.discount > 0 ? `<div class="summary-row discount"><span>Desconto Pix (5%)</span><span>− ${formatBRL(order.discount)}</span></div>` : ''}
        <div class="summary-row"><span>Frete</span><span>${order.freeShipping ? 'Grátis' : formatBRL(order.shipping)}</span></div>
        <div class="summary-row total"><span>Total pago</span><span>${formatBRL(order.total)}</span></div>
        <p><a class="btn" href="/index.html">Continuar comprando</a></p>`;

      shippingInfo.textContent = '';
      await renderHeader();
    } catch (err) {
      showAlert(errorMessage(err));
      checkoutBtn.textContent = 'Finalizar compra';
      await refresh();
    }
  });
})();
