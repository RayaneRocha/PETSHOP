const Product = require('../models/Product');
const Order = require('../models/Order');
const AppError = require('../utils/AppError');
const { roundMoney } = require('../utils/money');
const { calculateTotals, isValidPaymentMethod } = require('./pricing');
const { getOrCreateCart } = require('./cartService');

/**
 * Finaliza a compra do carrinho do usuário:
 * 1. valida a forma de pagamento e o estoque de cada item;
 * 2. calcula os valores (desconto Pix e frete conforme status VIP ANTES da compra);
 * 3. baixa o estoque, cria o pedido, soma o total gasto do cliente e esvazia o carrinho.
 */
async function checkout(user, paymentMethod) {
  if (!isValidPaymentMethod(paymentMethod)) {
    throw new AppError(400, 'paymentMethod é obrigatório. Use: pix, cartao_credito ou boleto.');
  }

  const cart = await getOrCreateCart(user._id);
  await cart.populate('items.product');
  const cartItems = cart.items.filter((item) => item.product);

  if (cartItems.length === 0) {
    throw new AppError(400, 'O carrinho está vazio.');
  }

  // Regra 2 (revalidação): o estoque pode ter mudado desde que o item foi adicionado.
  const unavailable = cartItems
    .filter((item) => item.quantity > item.product.stock)
    .map((item) => ({
      productId: item.product._id.toString(),
      name: item.product.name,
      requested: item.quantity,
      available: item.product.stock,
    }));
  if (unavailable.length > 0) {
    throw new AppError(409, 'Alguns produtos não têm estoque suficiente.', unavailable);
  }

  const items = cartItems.map((item) => ({
    product: item.product._id,
    name: item.product.name,
    unitPrice: item.product.price,
    quantity: item.quantity,
    lineTotal: roundMoney(item.product.price * item.quantity),
  }));

  const totals = calculateTotals({ items, paymentMethod, totalSpent: user.totalSpent });

  // Baixa de estoque condicional (só baixa se ainda houver quantidade suficiente).
  const decremented = [];
  for (const item of items) {
    const updated = await Product.findOneAndUpdate(
      { _id: item.product, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity } },
      { new: true }
    );
    if (!updated) {
      // Desfaz as baixas já feitas para manter a consistência.
      await Promise.all(
        decremented.map((done) =>
          Product.updateOne({ _id: done.product }, { $inc: { stock: done.quantity } })
        )
      );
      throw new AppError(409, `Estoque insuficiente para "${item.name}".`);
    }
    decremented.push(item);
  }

  const order = await Order.create({
    user: user._id,
    items,
    paymentMethod,
    subtotal: totals.subtotal,
    discount: totals.discount,
    shipping: totals.shipping,
    total: totals.total,
    vipAtPurchase: totals.isVip,
  });

  // Regra 3: o valor pago entra no total gasto, que define o status VIP para as próximas compras.
  const wasVip = user.isVip;
  user.totalSpent = roundMoney(user.totalSpent + totals.total);
  await user.save();

  cart.items = [];
  await cart.save();

  return {
    order: order.toPublicJSON(),
    user: user.toPublicJSON(),
    becameVip: !wasVip && user.isVip,
  };
}

module.exports = { checkout };
