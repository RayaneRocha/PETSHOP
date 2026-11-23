const { business } = require('../config');
const { roundMoney } = require('../utils/money');

const isValidPaymentMethod = (method) => business.paymentMethods.includes(method);

const isVip = (totalSpent) => Number(totalSpent) >= business.vipThreshold;

/**
 * Calcula os valores de uma compra aplicando as regras de negócio.
 *
 * - Regra 1: pagamento em Pix recebe 5% de desconto sobre o subtotal dos produtos.
 * - Regra 3: clientes VIP (que já gastaram R$ 100,00 ou mais) têm frete grátis;
 *   os demais pagam o frete fixo.
 *
 * @param {Object} params
 * @param {Array<{unitPrice:number, quantity:number}>} params.items
 * @param {string} [params.paymentMethod] - pix | cartao_credito | boleto
 * @param {number} params.totalSpent - total já gasto pelo cliente antes desta compra
 */
function calculateTotals({ items, paymentMethod, totalSpent }) {
  const subtotal = roundMoney(
    items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  );
  const vip = isVip(totalSpent);
  const discount = paymentMethod === 'pix' ? roundMoney(subtotal * business.pixDiscountRate) : 0;
  const shipping = items.length === 0 || vip ? 0 : business.shippingFee;
  const total = roundMoney(subtotal - discount + shipping);

  return {
    paymentMethod: paymentMethod || null,
    subtotal,
    discount,
    shipping,
    total,
    isVip: vip,
    freeShipping: vip,
  };
}

module.exports = { calculateTotals, isValidPaymentMethod, isVip };
