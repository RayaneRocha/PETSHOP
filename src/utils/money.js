// Arredonda valores monetários para 2 casas decimais, evitando erros de ponto flutuante.
const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

module.exports = { roundMoney };
