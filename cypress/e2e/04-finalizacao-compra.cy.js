// Casos de teste PetShop Amigo — RF04 Finalização de Compra / RN1 Pix / RN3 Frete (CT13 a CT16)
describe('Finalização de compra', () => {
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

  // Passos 1 a 3: login e abertura do carrinho
  const loginEAbrirCarrinho = (nomeProduto) => {
    cy.loginComEvidencia(ana.email, ana.senha);
    cy.get('#nav').contains('a', 'Carrinho').click();
    cy.location('pathname').should('eq', '/carrinho.html');
    cy.get('.cart-item').should('have.length', 1).first().deveConterTexto(nomeProduto);
    cy.evidencia(3, 'Carrinho apresentado');
  };

  const finalizarCompra = (passo) => {
    cy.get('#checkout-btn').should('be.enabled').click();
    cy.get('#order-success').should('be.visible').deveConterTexto('Compra finalizada!');
    cy.evidencia(passo, 'Compra finalizada');
  };

  const estoqueNaVitrine = (nomeProduto, esperado) => {
    cy.visit('/index.html');
    cy.cardDoProduto(nomeProduto).find('.stock').deveConterTexto(esperado);
  };

  it('CT13 - Validar que a compra no Pix recebe 5% de desconto e paga frete quando o subtotal é de até R$ 100,00', () => {
    cy.adicionarAoCarrinhoApi(ana.email, ana.senha, produtos.arranhador.nome, 1);
    loginEAbrirCarrinho(produtos.arranhador.nome);

    cy.get('input[name="paymentMethod"][value="pix"]').check();
    cy.linhaDoResumo('#summary', 'Subtotal', 'R$ 89,90');
    cy.linhaDoResumo('#summary', 'Desconto Pix (5%)', '− R$ 4,50');
    cy.linhaDoResumo('#summary', 'Frete', 'R$ 15,00');
    cy.linhaDoResumo('#summary', 'Total', 'R$ 100,40');
    cy.evidencia(4, 'Pix selecionado com desconto e frete');

    cy.get('#shipping-info').deveConterTexto(
      'Faltam R$ 10,10 em produtos para passar de R$ 100,00 e ganhar frete grátis.'
    );
    cy.evidencia(5, 'Aviso de quanto falta para o frete grátis');

    finalizarCompra(6);
    cy.get('#order-success').deveConterTexto('pagamento via Pix');
    cy.linhaDoResumo('#order-success', 'Total pago', 'R$ 100,40');

    // Pós-condições: carrinho vazio e estoque do Arranhador passa de 5 para 4
    cy.get('#cart-count').should('have.text', '0');
    estoqueNaVitrine(produtos.arranhador.nome, '4 em estoque');
  });

  it('CT14 - Validar que a compra com subtotal acima de R$ 100,00 tem frete grátis', () => {
    cy.adicionarAoCarrinhoApi(ana.email, ana.senha, produtos.arranhador.nome, 2);
    loginEAbrirCarrinho(produtos.arranhador.nome);
    cy.get('.cart-item .qty span').should('have.text', '2');

    cy.get('input[name="paymentMethod"][value="boleto"]').check();
    cy.get('#summary').naoDeveConterTexto('Desconto');
    cy.linhaDoResumo('#summary', 'Subtotal', 'R$ 179,80');
    cy.linhaDoResumo('#summary', 'Frete', 'Grátis');
    cy.linhaDoResumo('#summary', 'Total', 'R$ 179,80');
    cy.evidencia(4, 'Boleto selecionado com frete grátis');

    cy.get('#shipping-info').deveConterTexto('Sua compra tem frete grátis!');
    cy.evidencia(5, 'Aviso de frete grátis');

    finalizarCompra(6);
    cy.get('#order-success').deveConterTexto('pagamento via Boleto');
    cy.linhaDoResumo('#order-success', 'Frete', 'Grátis');
    cy.linhaDoResumo('#order-success', 'Total pago', 'R$ 179,80');

    estoqueNaVitrine(produtos.arranhador.nome, '3 em estoque');
  });

  it('CT15 - Validar que a compra no Pix com subtotal acima de R$ 100,00 recebe o desconto de 5% e frete grátis', () => {
    cy.adicionarAoCarrinhoApi(ana.email, ana.senha, produtos.racao.nome, 1);
    loginEAbrirCarrinho(produtos.racao.nome);

    cy.get('input[name="paymentMethod"][value="pix"]').check();
    cy.linhaDoResumo('#summary', 'Subtotal', 'R$ 149,90');
    cy.linhaDoResumo('#summary', 'Desconto Pix (5%)', '− R$ 7,50');
    cy.linhaDoResumo('#summary', 'Frete', 'Grátis');
    cy.linhaDoResumo('#summary', 'Total', 'R$ 142,40');
    cy.evidencia(4, 'Pix selecionado com desconto e frete grátis');

    finalizarCompra(5);
    cy.get('#order-success').deveConterTexto('pagamento via Pix');
    cy.linhaDoResumo('#order-success', 'Total pago', 'R$ 142,40');

    estoqueNaVitrine(produtos.racao.nome, '9 em estoque');
  });

  it('CT16 - Validar que o pagamento com cartão de crédito não recebe desconto', () => {
    cy.adicionarAoCarrinhoApi(ana.email, ana.senha, produtos.arranhador.nome, 1);
    loginEAbrirCarrinho(produtos.arranhador.nome);

    cy.get('input[name="paymentMethod"][value="cartao_credito"]').check();
    cy.get('#summary').naoDeveConterTexto('Desconto');
    cy.linhaDoResumo('#summary', 'Subtotal', 'R$ 89,90');
    cy.linhaDoResumo('#summary', 'Frete', 'R$ 15,00');
    cy.linhaDoResumo('#summary', 'Total', 'R$ 104,90');
    cy.evidencia(4, 'Cartão de crédito selecionado sem desconto');

    finalizarCompra(5);
    cy.get('#order-success').deveConterTexto('pagamento via Cartão de crédito');
    cy.linhaDoResumo('#order-success', 'Total pago', 'R$ 104,90');
    cy.get('#cart-count').should('have.text', '0');
  });
});
