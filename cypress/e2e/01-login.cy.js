// Casos de teste PetShop Amigo — RF01 Login (CT01 a CT03)
describe('Login', () => {
  let dados;

  before(() => {
    cy.fixture('dados').then((d) => {
      dados = d;
    });
  });

  beforeEach(() => {
    cy.resetarBanco();
    cy.visit('/login.html');
  });

  it('CT01 - Validar que o login é realizado ao informar e-mail e senha válidos', () => {
    const { ana } = dados.usuarios;

    // Passo 1: tela de login com os campos E-mail e Senha
    cy.get('h1').should('have.text', 'Entrar');
    cy.get('#email').should('be.visible');
    cy.get('#password').should('be.visible');

    // Passo 2: sistema permite o preenchimento do email
    cy.get('#email').type(ana.email).should('have.value', ana.email);

    // Passo 3: sistema permite o preenchimento da senha
    cy.get('#password').type(ana.senha, { log: false }).should('have.value', ana.senha);

    // Passo 4: vitrine de produtos é apresentada
    cy.get('#login-form button[type="submit"]').click();
    cy.location('pathname').should('eq', '/index.html');
    cy.get('#products .card').should('have.length', 3);

    // Passo 5: cabeçalho com "Olá, Ana", Carrinho com contador e Sair
    cy.get('#nav').deveConterTexto('Olá, Ana');
    cy.get('#nav').contains('a', 'Carrinho').should('be.visible');
    cy.get('#cart-count').should('have.text', '0');
    cy.get('#logout-btn').should('have.text', 'Sair');
  });

  it('CT02 - Validar que o login não é realizado ao informar senha inválida', () => {
    const { ana } = dados.usuarios;

    cy.get('#email').type(ana.email).should('have.value', ana.email);
    cy.get('#password').type('senhaErrada').should('have.value', 'senhaErrada');
    cy.get('#login-form button[type="submit"]').click();

    cy.get('#alert').should('be.visible').and('have.text', 'E-mail ou senha inválidos.');
    cy.location('pathname').should('eq', '/login.html');
  });

  it('CT03 - Validar que o login não é realizado com os campos E-mail e Senha vazios', () => {
    cy.get('#login-form button[type="submit"]').click();

    cy.get('#alert').should('be.visible').and('have.text', 'email e password são obrigatórios.');
    cy.location('pathname').should('eq', '/login.html');
  });
});
