const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const { seed } = require('../seed');

// Rotas de apoio à automação de testes (desabilitadas quando NODE_ENV=production).
const router = express.Router();

// Restaura o banco para os dados de teste iniciais (3 usuários, 3 produtos, sem carrinhos/pedidos).
router.post(
  '/reset',
  asyncHandler(async (req, res) => {
    await Promise.all([Cart.deleteMany({}), Order.deleteMany({})]);
    const counts = await seed();
    res.json({ status: 'ok', ...counts });
  })
);

module.exports = router;
