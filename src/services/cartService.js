const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const AppError = require('../utils/AppError');
const { roundMoney } = require('../utils/money');
const { calculateTotals, isValidPaymentMethod } = require('./pricing');

const assertProductId = (productId) => {
  if (!mongoose.isValidObjectId(productId)) {
    throw new AppError(400, 'productId inválido.');
  }
};

const assertQuantity = (quantity) => {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new AppError(400, 'quantity deve ser um número inteiro maior ou igual a 1.');
  }
};

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
}

async function findProductOrFail(productId) {
  assertProductId(productId);
  const product = await Product.findById(productId);
  if (!product) throw new AppError(404, 'Produto não encontrado.');
  return product;
}

// Regra 2: produtos esgotados (estoque 0) podem ser adicionados ao carrinho, mas a compra
// só é finalizada com estoque disponível (ver checkoutService). Para produtos com estoque,
// a quantidade no carrinho não pode passar do estoque.
function assertStock(product, desiredQuantity) {
  if (product.stock <= 0) return;
  if (desiredQuantity > product.stock) {
    throw new AppError(
      409,
      `Estoque insuficiente para "${product.name}". Disponível: ${product.stock}, solicitado: ${desiredQuantity}.`
    );
  }
}

/** Monta a visão do carrinho com produtos, totais e o resumo de valores. */
async function buildCartView(user, paymentMethod) {
  if (paymentMethod && !isValidPaymentMethod(paymentMethod)) {
    throw new AppError(400, 'paymentMethod inválido. Use: pix, cartao_credito ou boleto.');
  }

  const cart = await getOrCreateCart(user._id);
  await cart.populate('items.product');

  // Remove itens cujo produto não existe mais.
  const validItems = cart.items.filter((item) => item.product);
  if (validItems.length !== cart.items.length) {
    cart.items = validItems;
    await cart.save();
  }

  const items = validItems.map((item) => ({
    productId: item.product._id.toString(),
    name: item.product.name,
    emoji: item.product.emoji,
    unitPrice: item.product.price,
    quantity: item.quantity,
    stock: item.product.stock,
    lineTotal: roundMoney(item.product.price * item.quantity),
  }));

  return {
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    summary: calculateTotals({ items, paymentMethod }),
  };
}

async function addItem(user, productId, quantity = 1) {
  assertQuantity(quantity);
  const product = await findProductOrFail(productId);
  const cart = await getOrCreateCart(user._id);

  const existing = cart.items.find((item) => item.product.toString() === product._id.toString());
  const desired = (existing ? existing.quantity : 0) + quantity;
  assertStock(product, desired);

  if (existing) existing.quantity = desired;
  else cart.items.push({ product: product._id, quantity });

  await cart.save();
  return buildCartView(user);
}

async function updateItem(user, productId, quantity) {
  assertQuantity(quantity);
  const product = await findProductOrFail(productId);
  const cart = await getOrCreateCart(user._id);

  const existing = cart.items.find((item) => item.product.toString() === product._id.toString());
  if (!existing) throw new AppError(404, 'Produto não está no carrinho.');

  assertStock(product, quantity);
  existing.quantity = quantity;
  await cart.save();
  return buildCartView(user);
}

async function removeItem(user, productId) {
  assertProductId(productId);
  const cart = await getOrCreateCart(user._id);
  const before = cart.items.length;
  cart.items = cart.items.filter((item) => item.product.toString() !== productId);
  if (cart.items.length === before) throw new AppError(404, 'Produto não está no carrinho.');
  await cart.save();
  return buildCartView(user);
}

async function clearCart(user) {
  const cart = await getOrCreateCart(user._id);
  cart.items = [];
  await cart.save();
  return buildCartView(user);
}

module.exports = {
  getOrCreateCart,
  buildCartView,
  addItem,
  updateItem,
  removeItem,
  clearCart,
};
