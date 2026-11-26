// Comandos customizados da automação do PetShop Amigo.

// Normaliza espaços (o formato de moeda pt-BR usa espaço não separável em "R$ 10,00").
const normalize = (text) => text.replace(/\s+/g, ' ').trim();

/** Restaura o banco para os dados de teste iniciais (rota disponível fora de produção). */
Cypress.Commands.add('resetarBanco', () => {
  cy.request('POST', '/api/test/reset').its('status').should('eq', 200);
});

/** Faz login pela tela de login do site. */
Cypress.Commands.add('loginPelaTela', (email, senha) => {
  cy.visit('/login.html');
  cy.get('#email').type(email);
  cy.get('#password').type(senha, { log: false });
  cy.get('#login-form button[type="submit"]').click();
  cy.location('pathname').should('eq', '/index.html');
});

/** Faz login pela API e devolve o token JWT. */
Cypress.Commands.add('loginApi', (email, senha) => {
  return cy
    .request('POST', '/api/auth/login', { email, password: senha })
    .its('body.token');
});

/** Monta o carrinho do usuário pela API (pré-condição dos testes). */
Cypress.Commands.add('adicionarAoCarrinhoApi', (email, senha, nomeProduto, quantidade = 1) => {
  cy.loginApi(email, senha).then((token) => {
    cy.request('/api/products').then(({ body }) => {
      const produto = body.products.find((p) => p.name === nomeProduto);
      expect(produto, `produto "${nomeProduto}"`).to.exist;
      cy.request({
        method: 'POST',
        url: '/api/cart/items',
        headers: { Authorization: `Bearer ${token}` },
        body: { productId: produto.id, quantity: quantidade },
      });
    });
  });
});

/** Retorna o card de um produto na vitrine pelo nome. */
Cypress.Commands.add('cardDoProduto', (nomeProduto) => {
  return cy.contains('.card', nomeProduto);
});

/** Verifica se o texto do elemento contém o valor esperado (com espaços normalizados). */
Cypress.Commands.add('deveConterTexto', { prevSubject: true }, (subject, esperado) => {
  cy.wrap(subject).should(($el) => {
    expect(normalize($el.text())).to.include(esperado);
  });
});

/** Verifica se o texto do elemento NÃO contém o valor informado. */
Cypress.Commands.add('naoDeveConterTexto', { prevSubject: true }, (subject, valor) => {
  cy.wrap(subject).should(($el) => {
    expect(normalize($el.text())).not.to.include(valor);
  });
});

/** Verifica uma linha do resumo de valores (Subtotal, Frete, Total...). */
Cypress.Commands.add('linhaDoResumo', (container, rotulo, valorEsperado) => {
  cy.get(container)
    .contains('.summary-row', rotulo)
    .deveConterTexto(valorEsperado);
});
