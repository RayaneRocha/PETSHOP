// Teste de carga (load test) da API do PetShop Amigo com k6.
//
// Simula clientes usando a loja ao mesmo tempo. Cada usuário virtual (VU):
//   1. consulta a vitrine de produtos;
//   2. faz login;
//   3. adiciona um produto ao carrinho;
//   4. consulta o carrinho com o resumo do Pix (desconto e frete);
//   5. esvazia o carrinho.
// A finalização de compra não entra na carga para não esgotar o estoque (10 unidades),
// o que geraria erros 409 que não são de performance.
//
// Executar (com a aplicação rodando em http://localhost:3000):
//   k6 run performance/load-test.js
// Parâmetros opcionais (variáveis de ambiente do k6):
//   k6 run -e VUS=50 -e DURACAO=2m -e BASE_URL=http://localhost:3000 performance/load-test.js

import http from 'k6/http';
import { check, group, sleep, fail } from 'k6';
import { Trend } from 'k6/metrics';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const VUS = Number(__ENV.VUS || 20);
const DURACAO = __ENV.DURACAO || '1m';

const JSON_HEADERS = { 'Content-Type': 'application/json' };
const SENHA = 'senha123';

// Tempo da jornada completa de um cliente (todas as requisições de uma iteração)
const jornada = new Trend('tempo_jornada_cliente', true);

export const options = {
  scenarios: {
    carga: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: VUS }, // sobe gradualmente até a carga esperada
        { duration: DURACAO, target: VUS }, // mantém a carga
        { duration: '15s', target: 0 }, // desce
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    // Critérios de aceite: se algum falhar, o k6 encerra com erro
    http_req_failed: ['rate<0.01'], // menos de 1% de erros
    checks: ['rate>0.99'], // mais de 99% das validações OK
    http_req_duration: ['p(95)<500'], // 95% das requisições em menos de 500 ms
    // Consultas (leitura): 300 ms
    'http_req_duration{name:produtos}': ['p(95)<300'],
    'http_req_duration{name:consultar_carrinho}': ['p(95)<300'],
    // Operações que gravam no banco: 500 ms
    'http_req_duration{name:adicionar_carrinho}': ['p(95)<500'],
    'http_req_duration{name:esvaziar_carrinho}': ['p(95)<500'],
    // Login: hash de senha (scrypt) é intencionalmente custoso
    'http_req_duration{name:login}': ['p(95)<800'],
  },
};

// Executa uma vez antes da carga: restaura o banco e descobre o produto usado no teste.
export function setup() {
  const health = http.get(`${BASE_URL}/api/health`);
  if (health.status !== 200) {
    fail(`A aplicação não está respondendo em ${BASE_URL}. Rode "npm start" antes do teste.`);
  }

  http.post(`${BASE_URL}/api/test/reset`);

  const produtos = http.get(`${BASE_URL}/api/products`).json('products');
  const racao = produtos.find((p) => p.name.startsWith('Ração Premium'));
  if (!racao) fail('Produto "Ração Premium" não encontrado.');

  return { productId: racao.id };
}

// Cada usuário virtual cria a própria conta na primeira iteração (carrinhos independentes).
let email = null;

function garantirUsuario() {
  if (email) return;
  email = `carga_vu${__VU}_${Date.now()}@petshop.com`;
  const res = http.post(
    `${BASE_URL}/api/auth/register`,
    JSON.stringify({ name: `Cliente Carga ${__VU}`, email, password: SENHA }),
    { headers: JSON_HEADERS, tags: { name: 'cadastro' } }
  );
  check(res, { 'cadastro: status 201': (r) => r.status === 201 });
}

export default function (data) {
  garantirUsuario();
  const inicio = Date.now();
  let token;

  group('01 - Vitrine de produtos', () => {
    const res = http.get(`${BASE_URL}/api/products`, { tags: { name: 'produtos' } });
    check(res, {
      'produtos: status 200': (r) => r.status === 200,
      'produtos: 3 produtos': (r) => r.json('products').length === 3,
    });
  });

  group('02 - Login', () => {
    const res = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({ email, password: SENHA }), {
      headers: JSON_HEADERS,
      tags: { name: 'login' },
    });
    check(res, {
      'login: status 200': (r) => r.status === 200,
      'login: retornou token': (r) => Boolean(r.json('token')),
    });
    token = res.json('token');
  });

  if (!token) return;
  const authHeaders = { ...JSON_HEADERS, Authorization: `Bearer ${token}` };

  group('03 - Adicionar ao carrinho', () => {
    const res = http.post(
      `${BASE_URL}/api/cart/items`,
      JSON.stringify({ productId: data.productId, quantity: 1 }),
      { headers: authHeaders, tags: { name: 'adicionar_carrinho' } }
    );
    check(res, {
      'adicionar: status 201': (r) => r.status === 201,
      'adicionar: 1 item no carrinho': (r) => r.json('itemCount') === 1,
    });
  });

  group('04 - Consultar carrinho (Pix)', () => {
    const res = http.get(`${BASE_URL}/api/cart?paymentMethod=pix`, {
      headers: authHeaders,
      tags: { name: 'consultar_carrinho' },
    });
    check(res, {
      'carrinho: status 200': (r) => r.status === 200,
      'carrinho: desconto Pix de R$ 7,50': (r) => r.json('summary.discount') === 7.5,
      'carrinho: frete grátis': (r) => r.json('summary.shipping') === 0,
      'carrinho: total R$ 142,40': (r) => r.json('summary.total') === 142.4,
    });
  });

  group('05 - Esvaziar carrinho', () => {
    const res = http.del(`${BASE_URL}/api/cart`, null, {
      headers: authHeaders,
      tags: { name: 'esvaziar_carrinho' },
    });
    check(res, {
      'esvaziar: status 200': (r) => r.status === 200,
      'esvaziar: carrinho vazio': (r) => r.json('itemCount') === 0,
    });
  });

  jornada.add(Date.now() - inicio);
  sleep(1); // tempo de "pensar" do cliente entre uma jornada e outra
}

// Gera o relatório HTML e o resumo em JSON ao final do teste.
export function handleSummary(data) {
  return {
    'performance/reports/load-test.html': htmlReport(data, { title: 'PetShop Amigo - Teste de carga' }),
    'performance/reports/load-test-summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}
