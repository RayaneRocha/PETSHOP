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

  const abrirCarrinho = () => {
    cy.get('#nav').contains('a', 'Carrinho').click();
    cy.location('pathname').should('eq', '/carrinho.html');
    cy.get('#cart-items').should('not.contain', 'Carregando');
  };

  it('CT08 - Validar que um produto com estoque é adicionado ao carrinho', () => {
    cy.loginComEvidencia(ana.email, ana.senha); // Passos 1 e 2

    cy.cardDoProduto(produtos.racao.nome).within(() => {
      cy.get('input[name="quantity"]').should('have.value', '1');
      cy.contains('button', 'Adicionar ao carrinho').click();
    });
    cy.get('#toast').deveConterTexto(`${produtos.racao.nome} adicionado ao carrinho.`);
    cy.get('#cart-count').should('have.text', '1');
    cy.evidencia(3, 'Produto adicionado ao carrinho');

    abrirCarrinho();
    cy.get('.cart-item').should('have.length', 1).first().as('item');
    cy.get('@item').deveConterTexto(produtos.racao.nome);
    cy.get('@item').find('.qty span').should('have.text', '1');
    cy.get('@item').find('.line-total').deveConterTexto('R$ 149,90');
    cy.evidencia(4, 'Produto listado no carrinho');

    // Pós-condição: estoque permanece 10 (só é baixado na finalização)
    cy.visit('/index.html');
    cy.cardDoProduto(produtos.racao.nome).find('.stock').deveConterTexto('10 em estoque');
  });

  it('CT09 - Validar que o usuário é direcionado ao login ao adicionar produto sem estar autenticado', () => {
    cy.visit('/');
    cy.get('#nav').contains('a', 'Entrar').should('be.visible');
    cy.get('#nav').contains('a', 'Criar conta').should('be.visible');
    cy.get('#products .card').should('have.length', 3);
    cy.evidencia(1, 'Vitrine sem usuário logado');

    cy.cardDoProduto(produtos.arranhador.nome).contains('button', 'Adicionar ao carrinho').click();
    cy.location('pathname').should('eq', '/login.html');
    cy.get('#email').should('be.visible');
    cy.evidencia(2, 'Direcionado para a tela de login');

    cy.get('#email').type(ana.email);
    cy.get('#password').type(ana.senha, { log: false });
    cy.get('#login-form button[type="submit"]').click();
    cy.location('pathname').should('eq', '/index.html');
    cy.get('#nav').deveConterTexto('Olá, Ana');
    cy.get('#cart-count').should('have.text', '0'); // pós-condição: nada adicionado
    cy.evidencia(3, 'Login realizado e carrinho vazio');
  });

  it('CT10 - Validar que não é possível adicionar ao carrinho quantidade maior que o estoque', () => {
    const { nome } = produtos.arranhador;
    cy.loginComEvidencia(ana.email, ana.senha); // Passos 1 e 2

    cy.cardDoProduto(nome).within(() => {
      cy.get('input[name="quantity"]').clear().type('5');
      cy.contains('button', 'Adicionar ao carrinho').click();
    });
    cy.get('#toast').deveConterTexto(`${nome} adicionado ao carrinho.`);
    cy.get('#cart-count').should('have.text', '5');
    cy.evidencia(3, '5 unidades adicionadas');

    cy.cardDoProduto(nome).within(() => {
      cy.get('input[name="quantity"]').clear().type('1');
      cy.contains('button', 'Adicionar ao carrinho').click();
    });
    cy.get('#toast')
      .should('have.class', 'error')
      .deveConterTexto(`Estoque insuficiente para "${nome}". Disponível: 5, solicitado: 6.`);
    cy.get('#cart-count').should('have.text', '5');
    cy.evidencia(4, 'Mensagem de estoque insuficiente');

    abrirCarrinho();
    cy.get('.cart-item').should('have.length', 1);
    cy.get('.cart-item .qty span').should('have.text', '5');
    cy.get('.cart-item [data-action="increase"]').should('be.disabled');
    cy.evidencia(5, 'Carrinho no limite do estoque');
  });

  it('CT11 - Validar que um produto sem estoque não pode ser adicionado ao carrinho', () => {
    const { nome } = produtos.coleira;
    cy.loginComEvidencia(ana.email, ana.senha); // Passos 1 e 2

    cy.cardDoProduto(nome).find('.stock').should('have.class', 'out').deveConterTexto('Esgotado');
    cy.cardDoProduto(nome).scrollIntoView();
    cy.evidencia(3, 'Produto exibido como esgotado');

    cy.cardDoProduto(nome).within(() => {
      cy.get('button[type="submit"]').should('be.disabled').deveConterTexto('Sem estoque');
      cy.get('input[name="quantity"]').should('be.disabled');
    });
    cy.evidencia(4, 'Botão Sem estoque desabilitado');

    cy.scrollTo('top');
    cy.get('#cart-count').should('have.text', '0');
    cy.evidencia(5, 'Contador do carrinho em 0');

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
    cy.loginComEvidencia(ana.email, ana.senha); // Passos 1 e 2

    abrirCarrinho();
    cy.get('.cart-item .qty span').should('have.text', '1');
    cy.get('.cart-item .line-total').deveConterTexto('R$ 89,90');
    cy.evidencia(3, 'Carrinho com 1 Arranhador');

    cy.get('.cart-item [data-action="increase"]').click();
    cy.get('.cart-item .qty span').should('have.text', '2');
    cy.get('.cart-item .line-total').deveConterTexto('R$ 179,80');
    cy.evidencia(4, 'Quantidade aumentada para 2');

    cy.get('.cart-item [data-action="decrease"]').click();
    cy.get('.cart-item .qty span').should('have.text', '1');
    cy.get('.cart-item .line-total').deveConterTexto('R$ 89,90');
    cy.evidencia(5, 'Quantidade reduzida para 1');

    cy.get('.cart-item [data-action="remove"]').click();
    cy.get('#cart-items').deveConterTexto('Seu carrinho está vazio.');
    cy.get('#cart-count').should('have.text', '0');
    cy.evidencia(6, 'Produto removido e carrinho vazio');
  });
});
