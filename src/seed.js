const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Product = require('./models/Product');

const DEFAULT_PASSWORD = 'senha123';

const products = [
  {
    name: 'Ração Premium para Cães Adultos 10kg',
    description: 'Ração completa e balanceada para cães adultos de porte médio.',
    category: 'Cães',
    emoji: '🐶',
    price: 149.9,
    stock: 10,
  },
  {
    name: 'Arranhador para Gatos com Torre',
    description: 'Arranhador de sisal com plataforma e brinquedo pendurado.',
    category: 'Gatos',
    emoji: '🐱',
    price: 89.9,
    stock: 5,
  },
  {
    name: 'Coleira Antipulgas',
    description: 'Proteção contra pulgas e carrapatos por até 8 meses.',
    category: 'Acessórios',
    emoji: '🦮',
    price: 59.9,
    stock: 0, // sem estoque: usado para testar a regra de estoque
  },
];

const users = [
  { name: 'Ana Souza', email: 'ana@petshop.com' },
  { name: 'Bruno Lima', email: 'bruno@petshop.com' },
  { name: 'Carla Mendes', email: 'carla@petshop.com' },
];

async function seed() {
  await Promise.all([User.deleteMany({}), Product.deleteMany({})]);

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  await Product.insertMany(products);
  await User.insertMany(users.map((user) => ({ ...user, passwordHash })));

  return { products: products.length, users: users.length };
}

module.exports = { seed, DEFAULT_PASSWORD };
