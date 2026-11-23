const express = require('express');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const products = await Product.find().sort({ name: 1 });
    res.json({ products: products.map((p) => p.toPublicJSON()) });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw new AppError(400, 'id inválido.');
    const product = await Product.findById(req.params.id);
    if (!product) throw new AppError(404, 'Produto não encontrado.');
    res.json({ product: product.toPublicJSON() });
  })
);

module.exports = router;
