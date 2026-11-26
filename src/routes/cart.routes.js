const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const authenticate = require('../middlewares/auth');
const cartService = require('../services/cartService');

const router = express.Router();
router.use(authenticate);

// Consulta o carrinho. ?paymentMethod=pix simula o desconto do Pix no resumo.
router.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json(await cartService.buildCartView(req.user, req.query.paymentMethod));
  })
);

// Adiciona um produto (soma à quantidade se ele já estiver no carrinho).
router.post(
  '/items',
  asyncHandler(async (req, res) => {
    const { productId, quantity = 1 } = req.body || {};
    res.status(201).json(await cartService.addItem(req.user, productId, quantity));
  })
);

// Altera a quantidade de um produto do carrinho.
router.put(
  '/items/:productId',
  asyncHandler(async (req, res) => {
    const { quantity } = req.body || {};
    res.json(await cartService.updateItem(req.user, req.params.productId, quantity));
  })
);

// Remove um produto do carrinho.
router.delete(
  '/items/:productId',
  asyncHandler(async (req, res) => {
    res.json(await cartService.removeItem(req.user, req.params.productId));
  })
);

// Esvazia o carrinho.
router.delete(
  '/',
  asyncHandler(async (req, res) => {
    res.json(await cartService.clearCart(req.user));
  })
);

module.exports = router;
