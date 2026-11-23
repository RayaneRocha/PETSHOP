module.exports = {
  port: Number(process.env.PORT) || 3000,
  jwtSecret: process.env.JWT_SECRET || 'petshop-dev-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',

  // Regras de negócio
  business: {
    pixDiscountRate: 0.05, // 5% de desconto para pagamentos em Pix
    shippingFee: 15.0, // frete fixo (R$)
    freeShippingThreshold: 100.0, // frete grátis para compras com subtotal acima deste valor (R$)
    paymentMethods: ['pix', 'cartao_credito', 'boleto'],
  },
};
