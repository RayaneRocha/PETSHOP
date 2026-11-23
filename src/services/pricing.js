const { business } = require('../config');
const { roundMoney } = require('../utils/money');

const isValidPaymentMethod = (method) => business.paymentMethods.includes(method);

/**
 * Calcula os valores de uma compra aplicando as regras de negócio.
 *
 * - Regra 1: pagamento em Pix recebe 5% de desconto sobre o subtotal dos produtos.
 * - Regra 3: compras com subtotal dos produtos acima de R$ 100,00 têm frete grátis;
 *   as demais pagam o frete fixo.
 *
 * @param {Object} params
 * @param {Array<{unitPrice:number, quantity:number}>} params.items
 * @param {string} [params.paymentMethod] - pix | cartao_credito | boleto
 */
function calculateTotals({ items, paymentMethod }) {
  const subtotal = roundMoney(
    items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  );
  const freeShipping = subtotal > business.freeShippingThreshold;
  const discount = paymentMethod === 'pix' ? roundMoney(subtotal * business.pixDiscountRate) : 0;
  const shipping = items.length === 0 || freeShipping ? 0 : business.shippingFee;
  const total = roundMoney(subtotal - discount + shipping);

  return {
    paymentMethod: paymentMethod || null,
    subtotal,
    discount,
    shipping,
    total,
    freeShipping,
    freeShippingThreshold: business.freeShippingThreshold,
  };
}

module.exports = { calculateTotals, isValidPaymentMethod };
