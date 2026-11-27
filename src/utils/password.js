const crypto = require('crypto');
const { promisify } = require('util');

// Hash de senha com scrypt (nativo do Node.js).
// O cálculo roda no pool de threads do Node, fora da thread principal, então logins
// simultâneos não bloqueiam as demais requisições da API (gargalo encontrado no teste de carga
// com bcryptjs, que calcula o hash em JavaScript na thread principal).
const scrypt = promisify(crypto.scrypt);

const KEY_LENGTH = 64;
const SALT_BYTES = 16;

/** Gera o hash no formato "scrypt$<salt>$<hash>" (hexadecimal). */
async function hashPassword(password) {
  const salt = crypto.randomBytes(SALT_BYTES).toString('hex');
  const derived = await scrypt(String(password), salt, KEY_LENGTH);
  return `scrypt$${salt}$${derived.toString('hex')}`;
}

/** Confere a senha com o hash salvo, em tempo constante. */
async function verifyPassword(password, stored) {
  if (typeof stored !== 'string') return false;
  const [scheme, salt, hash] = stored.split('$');
  if (scheme !== 'scrypt' || !salt || !hash) return false;

  const expected = Buffer.from(hash, 'hex');
  const derived = await scrypt(String(password), salt, expected.length);
  return crypto.timingSafeEqual(derived, expected);
}

module.exports = { hashPassword, verifyPassword };
