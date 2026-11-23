const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { jwtSecret } = require('../config');

// Exige header "Authorization: Bearer <token>" e carrega o usuário em req.user.
module.exports = async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new AppError(401, 'Token de autenticação não informado.');
    }

    let payload;
    try {
      payload = jwt.verify(token, jwtSecret);
    } catch (err) {
      throw new AppError(401, 'Token inválido ou expirado.');
    }

    const user = await User.findById(payload.sub);
    if (!user) throw new AppError(401, 'Usuário do token não encontrado.');

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};
