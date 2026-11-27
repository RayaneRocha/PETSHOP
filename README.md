# 🐾 PetShop Amigo

API REST e site Web de um e-commerce de pet shop.

## O que é esta aplicação

O **PetShop Amigo** é uma loja virtual simples de produtos para pets, composta por:

- **API REST** em Node.js (Express) com banco de dados **MongoDB em memória** ([mongodb-memory-server](https://github.com/typegoose/mongodb-memory-server)) e Mongoose.
- **Site Web** (HTML, CSS e JavaScript puro) servido pela própria API, que consome os endpoints REST.
- **Documentação da API** em OpenAPI/Swagger (`docs/swagger.yaml`), renderizada pelo Swagger UI.

A aplicação tem apenas 4 funcionalidades:

| Funcionalidade | Site | API |
| --- | --- | --- |
| Cadastro | `/cadastro.html` | `POST /api/auth/register` |
| Login | `/login.html` | `POST /api/auth/login` |
| Carrinho | `/index.html` (adicionar) e `/carrinho.html` | `GET/DELETE /api/cart`, `POST /api/cart/items`, `PUT/DELETE /api/cart/items/{productId}` |
| Finalização de compra | `/carrinho.html` | `POST /api/checkout` |

Endpoints de apoio: `GET /api/products`, `GET /api/products/{id}`, `GET /api/auth/me` e `GET /api/health`.

A autenticação usa **JWT**: o login/cadastro devolve um `token`, que deve ser enviado no header `Authorization: Bearer <token>` nas rotas de carrinho e checkout.

## Como instalar

Pré-requisitos:

- [Node.js](https://nodejs.org/) 18 ou superior (recomendado 20+)
- npm
- Acesso à internet na **primeira** instalação: o `mongodb-memory-server` baixa o binário do MongoDB automaticamente (fica em cache para as próximas execuções).

```bash
git clone https://github.com/RayaneRocha/PETSHOP.git
cd PETSHOP
npm install
```

## Como executar

```bash
npm start
```

Para desenvolvimento, com reinício automático ao salvar arquivos:

```bash
npm run dev
```

A aplicação sobe na porta **3000** por padrão. Variáveis de ambiente opcionais:

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `PORT` | `3000` | Porta HTTP |
| `JWT_SECRET` | `petshop-dev-secret` | Chave de assinatura do JWT |
| `JWT_EXPIRES_IN` | `8h` | Validade do token |
| `MONGO_LAUNCH_TIMEOUT_MS` | `60000` | Tempo máximo (ms) para o MongoDB em memória iniciar |

### Problemas comuns

- **`Instance failed to start within ...ms`** ao rodar `npm start`: o MongoDB em memória demorou para subir ou ficou um processo preso de uma execução anterior. Encerre-o com `taskkill //F //IM mongod.exe` (Git Bash) ou `taskkill /F /IM mongod.exe` (PowerShell) e rode `npm start` de novo.
- **`ERR_CONNECTION_REFUSED`** no navegador: a aplicação não está rodando; execute `npm start` e mantenha o terminal aberto.

> O banco é **em memória**: a cada inicialização ele é recriado do zero com os dados de teste abaixo. Tudo o que for cadastrado/comprado se perde quando a aplicação é encerrada.

## Quais dados de teste estão incluídos

Carregados automaticamente na inicialização (`src/seed.js`).

### Usuários (senha de todos: `senha123`)

| Nome | E-mail |
| --- | --- |
| Ana Souza | `ana@petshop.com` |
| Bruno Lima | `bruno@petshop.com` |
| Carla Mendes | `carla@petshop.com` |

### Produtos

| Produto | Categoria | Preço | Estoque | Uso sugerido |
| --- | --- | --- | --- | --- |
| Ração Premium para Cães Adultos 10kg | Cães | R$ 149,90 | 10 | Produto com estoque |
| Arranhador para Gatos com Torre | Gatos | R$ 89,90 | 5 | Estoque baixo (testar limite) |
| Coleira Antipulgas | Acessórios | R$ 59,90 | **0** | Sem estoque: não pode ir para o carrinho |

## Quais são as regras de negócio

1. **Desconto no Pix:** pagamentos com `paymentMethod = pix` recebem **5% de desconto sobre o subtotal dos produtos** (o frete não entra no cálculo do desconto). Formas de pagamento aceitas: `pix`, `cartao_credito` e `boleto`.
2. **Estoque:** um produto só pode ser adicionado ao carrinho se tiver estoque. A quantidade total do produto no carrinho (incluindo o que já estava lá) não pode passar do estoque disponível — caso contrário a API responde `409 Conflict`. O estoque é **revalidado na finalização** da compra e baixado somente quando o pedido é confirmado.
3. **Frete grátis acima de R$ 100,00:** compras cujo **subtotal dos produtos** passa de **R$ 100,00** têm frete grátis, para qualquer cliente. As demais pagam frete fixo de **R$ 15,00**.
   - A comparação usa o subtotal **antes** do desconto do Pix.
   - Exatamente R$ 100,00 não conta como "acima": paga frete.

Cálculo do pedido:

```
subtotal = Σ (preço × quantidade)
desconto = 5% do subtotal, se pagamento = pix; senão 0
frete    = 0 se subtotal > R$ 100,00; senão R$ 15,00
total    = subtotal − desconto + frete
```

Exemplos:

- 1 Arranhador (R$ 89,90) no Pix → R$ 89,90 − R$ 4,50 + R$ 15,00 de frete = **R$ 100,40**.
- 2 Arranhadores (R$ 179,80) no Pix → R$ 179,80 − R$ 8,99 + frete grátis = **R$ 170,81**.
- 1 Ração (R$ 149,90) no boleto → R$ 149,90 + frete grátis = **R$ 149,90**.

## Quais são as URLs importantes para acessar a aplicação

Com a aplicação rodando localmente:

| O quê | URL |
| --- | --- |
| Site (loja / produtos) | http://localhost:3000/ |
| Login | http://localhost:3000/login.html |
| Cadastro | http://localhost:3000/cadastro.html |
| Carrinho e finalização de compra | http://localhost:3000/carrinho.html |
| Swagger UI (documentação interativa) | http://localhost:3000/api-docs |
| Especificação Swagger em YAML | http://localhost:3000/swagger.yaml |
| Base da API REST | http://localhost:3000/api |
| Health check | http://localhost:3000/api/health |

### Exemplo rápido com `curl`

```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ana@petshop.com","password":"senha123"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).token')

# Lista os produtos e pega o id do primeiro
PRODUCT_ID=$(curl -s http://localhost:3000/api/products | node -pe 'JSON.parse(require("fs").readFileSync(0)).products[0].id')

# Adiciona ao carrinho
curl -s -X POST http://localhost:3000/api/cart/items \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"productId\":\"$PRODUCT_ID\",\"quantity\":1}"

# Finaliza a compra no Pix
curl -s -X POST http://localhost:3000/api/checkout \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"paymentMethod":"pix"}'
```

## Testes automatizados (Cypress)

A pasta `cypress/` contém a automação E2E do site, baseada no documento de casos de teste do PetShop Amigo (CT01 a CT16).

| Arquivo | Casos |
| --- | --- |
| `cypress/e2e/01-login.cy.js` | CT01 a CT03 — Login |
| `cypress/e2e/02-cadastro.cy.js` | CT04 a CT07 — Cadastro |
| `cypress/e2e/03-carrinho.cy.js` | CT08 a CT12 — Carrinho e estoque |
| `cypress/e2e/04-finalizacao-compra.cy.js` | CT13 a CT16 — Finalização de compra, Pix e frete |

Antes de cada teste, a automação chama `POST /api/test/reset`, que restaura o banco para os dados de teste iniciais. Essa rota só existe quando `NODE_ENV` não é `production`.

### Como executar

1. Instale as dependências (inclui o Cypress) e o binário do Cypress:

   ```bash
   npm install
   npx cypress install
   ```

   > Versões recentes do npm não executam scripts de instalação automaticamente; por isso o `npx cypress install` baixa o binário do Cypress (só na primeira vez).

2. Em um terminal, suba a aplicação e deixe-o aberto:

   ```bash
   npm start
   ```

3. Em **outro** terminal, rode os testes:

   ```bash
   npm run cy:run          # todos os testes sem abrir janela; resultado no terminal
   npm run cy:run:headed   # todos os testes vendo o Chrome executar
   npm run cy:open         # interface do Cypress
   ```

   Na interface do Cypress, clique em **`todos-os-testes.cy.js`** (pasta `cypress/suites`) para rodar os 16 testes de uma vez, ou em um spec da pasta `cypress/e2e` para rodar só uma funcionalidade.

### Evidências dos testes

Ao rodar `npm run cy:run` (ou `npm run cy:run:headed`), as evidências ficam em:

| Evidência | Onde fica |
| --- | --- |
| Relatório HTML com resultado e print de cada teste | `cypress/reports/index.html` (abra no navegador) |
| Print de **cada passo** dos casos de teste (`CT01/Passo 01 - Tela de login.png`, ...) | `cypress/screenshots/<spec>/<CTxx>/` |
| Vídeo da execução de cada spec | `cypress/videos/` |

> O Cypress apaga as evidências anteriores a cada nova execução de `cy:run`. Copie a pasta para outro lugar se quiser guardar o histórico.
> Na interface (`npm run cy:open`) são gerados apenas os prints; vídeo e relatório HTML só no modo `cy:run`.
> Em caso de falha, o Cypress também salva um print do momento do erro (`... (failed).png`).

## Teste de performance (k6)

O arquivo `performance/load-test.js` contém um **teste de carga** da API feito com [k6](https://grafana.com/docs/k6/latest/).

Cada usuário virtual cria a própria conta e repete a jornada de um cliente: consultar produtos → login → adicionar ao carrinho → consultar o carrinho com Pix → esvaziar o carrinho. A finalização de compra fica de fora para não esgotar o estoque durante a carga.

**Perfil padrão:** sobe até 20 usuários em 30s, mantém por 1 minuto e desce em 15s.

**Critérios de aceite (thresholds):**

| Métrica | Limite |
| --- | --- |
| Requisições com erro | < 1% |
| Validações (checks) com sucesso | > 99% |
| Tempo de resposta p(95), geral | < 500 ms |
| p(95) de produtos, carrinho (adicionar, consultar, esvaziar) | < 300 ms |
| p(95) do login (hash de senha com scrypt) | < 800 ms |

### Como executar

1. Instale o k6 (uma vez). No Windows:

   ```bash
   winget install k6 --source winget
   ```

   Feche e abra o terminal depois da instalação e confira com `k6 version`.

2. Suba a aplicação em um terminal (`npm start`).
3. Em outro terminal, rode:

   ```bash
   npm run perf:load
   # ou personalizando a carga:
   k6 run -e VUS=50 -e DURACAO=2m performance/load-test.js
   ```

O resultado aparece no terminal e também é salvo em:

- `performance/reports/load-test.html`: relatório HTML (abra no navegador)
- `performance/reports/load-test-summary.json`: métricas completas em JSON

> O teste de carga zera o banco no início (`POST /api/test/reset`) e cria vários usuários de teste. Reinicie a aplicação depois, se quiser voltar aos dados originais.

## Estrutura do projeto

```
PETSHOP/
├── cypress/                  # Automação E2E (Cypress)
│   ├── e2e/                  # Specs: login, cadastro, carrinho, finalização de compra
│   ├── suites/               # todos-os-testes.cy.js (roda tudo na interface)
│   ├── fixtures/dados.json   # Usuário e produtos de teste
│   └── support/commands.js   # Comandos customizados
├── cypress.config.js
├── performance/
│   └── load-test.js          # Teste de carga (k6)
├── docs/
│   └── swagger.yaml          # Especificação OpenAPI 3 da API
├── public/                   # Site Web (estático)
│   ├── index.html            # Vitrine de produtos
│   ├── login.html
│   ├── cadastro.html
│   ├── carrinho.html         # Carrinho + finalização de compra
│   ├── css/styles.css
│   └── js/                   # api.js (utilitários) + script de cada página
└── src/
    ├── server.js             # Inicialização: banco em memória, seed e servidor HTTP
    ├── app.js                # Express: rotas da API, Swagger e site
    ├── config.js             # Porta, JWT e parâmetros das regras de negócio
    ├── database.js           # Conexão com o mongodb-memory-server
    ├── seed.js               # Dados de teste (3 usuários e 3 produtos)
    ├── models/               # User, Product, Cart, Order (Mongoose)
    ├── services/             # pricing (regras), cartService, checkoutService
    ├── routes/               # auth, products, cart, checkout
    ├── middlewares/          # autenticação JWT e tratamento de erros
    └── utils/
```
