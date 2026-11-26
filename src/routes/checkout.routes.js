const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const authenticate = require('../middlewares/auth');
const { checkout } = require('../services/checkoutService');

const router = express.Router();

// Finaliza a compra do carrinho atual.
router.post(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const { paymentMethod } = req.body || {};
    res.status(201).json(await checkout(req.user, paymentMethod));
  })
);

module.exports = router;
