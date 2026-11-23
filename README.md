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
git clone <url-do-repositorio>
cd petshop-ecommerce
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

> O banco é **em memória**: a cada inicialização ele é recriado do zero com os dados de teste abaixo. Tudo o que for cadastrado/comprado se perde quando a aplicação é encerrada.

## Quais dados de teste estão incluídos

Carregados automaticamente na inicialização (`src/seed.js`).

### Usuários (senha de todos: `senha123`)

| Nome | E-mail | Total já gasto | VIP? | Uso sugerido |
| --- | --- | --- | --- | --- |
| Ana Souza | `ana@petshop.com` | R$ 0,00 | Não | Cliente novo: paga frete |
| Bruno Lima | `bruno@petshop.com` | R$ 250,00 | **Sim** | Cliente VIP: frete grátis |
| Carla Mendes | `carla@petshop.com` | R$ 80,00 | Não | Vira VIP após qualquer compra acima de R$ 20,00 |

### Produtos

| Produto | Categoria | Preço | Estoque | Uso sugerido |
| --- | --- | --- | --- | --- |
| Ração Premium para Cães Adultos 10kg | Cães | R$ 149,90 | 10 | Produto com estoque |
| Arranhador para Gatos com Torre | Gatos | R$ 89,90 | 5 | Estoque baixo (testar limite) |
| Coleira Antipulgas | Acessórios | R$ 59,90 | **0** | Sem estoque: não pode ir para o carrinho |

## Quais são as regras de negócio

1. **Desconto no Pix:** pagamentos com `paymentMethod = pix` recebem **5% de desconto sobre o subtotal dos produtos** (o frete não entra no cálculo do desconto). Formas de pagamento aceitas: `pix`, `cartao_credito` e `boleto`.
2. **Estoque:** um produto só pode ser adicionado ao carrinho se tiver estoque. A quantidade total do produto no carrinho (incluindo o que já estava lá) não pode passar do estoque disponível — caso contrário a API responde `409 Conflict`. O estoque é **revalidado na finalização** da compra e baixado somente quando o pedido é confirmado.
3. **Frete grátis para VIP:** apenas clientes **VIP** têm frete grátis; os demais pagam frete fixo de **R$ 15,00**. O cliente se torna VIP quando a soma do que ele **já pagou** em compras (`totalSpent`) chega a **R$ 100,00** ou mais.
   - O status VIP considerado no frete é o do cliente **antes** da compra atual. A compra que faz o cliente atingir R$ 100,00 ainda paga frete; a partir da próxima, o frete é grátis. A resposta do checkout informa `becameVip: true` nesse caso.
   - O valor somado ao `totalSpent` é o **total pago** no pedido (subtotal − desconto + frete).

Cálculo do pedido:

```
subtotal = Σ (preço × quantidade)
desconto = 5% do subtotal, se pagamento = pix; senão 0
frete    = 0 se o cliente é VIP; senão R$ 15,00
total    = subtotal − desconto + frete
```

Exemplo: Ana (não VIP) compra 1 Arranhador (R$ 89,90) no Pix → desconto R$ 4,50 + frete R$ 15,00 = **R$ 100,40**. Como ela passa a ter gastado R$ 100,40, vira VIP na próxima compra.

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

## Estrutura do projeto

```
petshop-ecommerce/
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
