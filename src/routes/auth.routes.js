const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const authenticate = require('../middlewares/auth');
const { jwtSecret, jwtExpiresIn } = require('../config');

const router = express.Router();
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const issueToken = (user) =>
  jwt.sign({ sub: user._id.toString(), email: user.email }, jwtSecret, { expiresIn: jwtExpiresIn });

// Cadastro
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body || {};
    const errors = [];
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      errors.push('name é obrigatório (mínimo 2 caracteres).');
    }
    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
      errors.push('email é obrigatório e deve ser válido.');
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      errors.push('password é obrigatório (mínimo 6 caracteres).');
    }
    if (errors.length) throw new AppError(400, 'Dados de cadastro inválidos.', errors);

    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) throw new AppError(409, 'Já existe um usuário cadastrado com este e-mail.');

    const user = await User.create({
      name: name.trim(),
      email,
      passwordHash: await bcrypt.hash(password, 10),
    });

    res.status(201).json({ token: issueToken(user), user: user.toPublicJSON() });
  })
);

// Login
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) throw new AppError(400, 'email e password são obrigatórios.');

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    const valid = user && (await bcrypt.compare(String(password), user.passwordHash));
    if (!valid) throw new AppError(401, 'E-mail ou senha inválidos.');

    res.json({ token: issueToken(user), user: user.toPublicJSON() });
  })
);

// Usuário autenticado
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user.toPublicJSON() });
});

module.exports = router;
