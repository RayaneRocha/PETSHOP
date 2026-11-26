// Casos de teste PetShop Amigo — RF03 Carrinho / RN2 Estoque (CT08 a CT12)
describe('Carrinho', () => {
  let ana;
  let produtos;

  before(() => {
    cy.fixture('dados').then((d) => {
      ana = d.usuarios.ana;
      produtos = d.produtos;
    });
  });

  beforeEach(() => {
    cy.resetarBanco();
  });

  it('CT08 - Validar que um produto com estoque é adicionado ao carrinho', () => {
    cy.loginPelaTela(ana.email, ana.senha);

    cy.cardDoProduto(produtos.racao.nome).within(() => {
      cy.get('input[name="quantity"]').should('have.value', '1');
      cy.contains('button', 'Adicionar ao carrinho').click();
    });
    cy.get('#toast').deveConterTexto(`${produtos.racao.nome} adicionado ao carrinho.`);
    cy.get('#cart-count').should('have.text', '1');

    cy.get('#nav').contains('a', 'Carrinho').click();
    cy.get('.cart-item').should('have.length', 1).first().as('item');
    cy.get('@item').deveConterTexto(produtos.racao.nome);
    cy.get('@item').find('.qty span').should('have.text', '1');
    cy.get('@item').find('.line-total').deveConterTexto('R$ 149,90');

    // Pós-condição: estoque permanece 10 (só é baixado na finalização)
    cy.visit('/index.html');
    cy.cardDoProduto(produtos.racao.nome).find('.stock').deveConterTexto('10 em estoque');
  });

  it('CT09 - Validar que o usuário é direcionado ao login ao adicionar produto sem estar autenticado', () => {
    cy.visit('/');
    cy.get('#nav').contains('a', 'Entrar').should('be.visible');
    cy.get('#nav').contains('a', 'Criar conta').should('be.visible');

    cy.cardDoProduto(produtos.arranhador.nome).contains('button', 'Adicionar ao carrinho').click();
    cy.location('pathname').should('eq', '/login.html');

    cy.get('#email').type(ana.email);
    cy.get('#password').type(ana.senha, { log: false });
    cy.get('#login-form button[type="submit"]').click();
    cy.location('pathname').should('eq', '/index.html');
    cy.get('#nav').deveConterTexto('Olá, Ana');

    // Pós-condição: nenhum produto foi adicionado ao carrinho
    cy.get('#cart-count').should('have.text', '0');
  });

  it('CT10 - Validar que não é possível adicionar ao carrinho quantidade maior que o estoque', () => {
    const { nome } = produtos.arranhador;
    cy.loginPelaTela(ana.email, ana.senha);

    cy.cardDoProduto(nome).within(() => {
      cy.get('input[name="quantity"]').clear().type('5');
      cy.contains('button', 'Adicionar ao carrinho').click();
    });
    cy.get('#toast').deveConterTexto(`${nome} adicionado ao carrinho.`);
    cy.get('#cart-count').should('have.text', '5');

    cy.cardDoProduto(nome).within(() => {
      cy.get('input[name="quantity"]').clear().type('1');
      cy.contains('button', 'Adicionar ao carrinho').click();
    });
    cy.get('#toast')
      .should('have.class', 'error')
      .deveConterTexto(`Estoque insuficiente para "${nome}". Disponível: 5, solicitado: 6.`);
    cy.get('#cart-count').should('have.text', '5');

    cy.get('#nav').contains('a', 'Carrinho').click();
    cy.get('.cart-item').should('have.length', 1);
    cy.get('.cart-item .qty span').should('have.text', '5');
    cy.get('.cart-item [data-action="increase"]').should('be.disabled');
  });

  it('CT11 - Validar que um produto sem estoque não pode ser adicionado ao carrinho', () => {
    const { nome } = produtos.coleira;
    cy.loginPelaTela(ana.email, ana.senha);

    cy.cardDoProduto(nome).within(() => {
      cy.get('.stock').should('have.class', 'out').deveConterTexto('Esgotado');
      cy.get('button[type="submit"]').should('be.disabled').deveConterTexto('Sem estoque');
      cy.get('input[name="quantity"]').should('be.disabled');
    });
    cy.get('#cart-count').should('have.text', '0');

    // A API também recusa a adição de produto sem estoque
    cy.loginApi(ana.email, ana.senha).then((token) => {
      cy.request('/api/products').then(({ body }) => {
        const coleira = body.products.find((p) => p.name === nome);
        cy.request({
          method: 'POST',
          url: '/api/cart/items',
          headers: { Authorization: `Bearer ${token}` },
          body: { productId: coleira.id, quantity: 1 },
          failOnStatusCode: false,
        }).then((res) => {
          expect(res.status).to.eq(409);
          expect(res.body.error).to.eq(`O produto "${nome}" está sem estoque.`);
        });
      });
    });
  });

  it('CT12 - Validar que é possível alterar a quantidade e remover um produto do carrinho', () => {
    cy.adicionarAoCarrinhoApi(ana.email, ana.senha, produtos.arranhador.nome, 1);
    cy.loginPelaTela(ana.email, ana.senha);

    cy.get('#nav').contains('a', 'Carrinho').click();
    cy.get('.cart-item .qty span').should('have.text', '1');
    cy.get('.cart-item .line-total').deveConterTexto('R$ 89,90');

    cy.get('.cart-item [data-action="increase"]').click();
    cy.get('.cart-item .qty span').should('have.text', '2');
    cy.get('.cart-item .line-total').deveConterTexto('R$ 179,80');

    cy.get('.cart-item [data-action="decrease"]').click();
    cy.get('.cart-item .qty span').should('have.text', '1');
    cy.get('.cart-item .line-total').deveConterTexto('R$ 89,90');

    cy.get('.cart-item [data-action="remove"]').click();
    cy.get('#cart-items').deveConterTexto('Seu carrinho está vazio.');
    cy.get('#cart-count').should('have.text', '0');
  });
});
