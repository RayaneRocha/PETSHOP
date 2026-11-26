// Casos de teste PetShop Amigo — RF01 Login (CT01 a CT03)
describe('Login', () => {
  let ana;

  before(() => {
    cy.fixture('dados').then((d) => {
      ana = d.usuarios.ana;
    });
  });

  beforeEach(() => {
    cy.resetarBanco();
  });

  const acessarLogin = () => {
    cy.visit('/login.html');
    cy.get('h1').should('have.text', 'Entrar');
    cy.get('#email').should('be.visible');
    cy.get('#password').should('be.visible');
    cy.evidencia(1, 'Tela de login');
  };

  it('CT01 - Validar que o login é realizado ao informar e-mail e senha válidos', () => {
    acessarLogin();

    cy.get('#email').type(ana.email).should('have.value', ana.email);
    cy.evidencia(2, 'E-mail preenchido');

    cy.get('#password').type(ana.senha, { log: false }).should('have.value', ana.senha);
    cy.evidencia(3, 'Senha preenchida');

    cy.get('#login-form button[type="submit"]').click();
    cy.location('pathname').should('eq', '/index.html');
    cy.get('#products .card').should('have.length', 3);
    cy.evidencia(4, 'Vitrine de produtos');

    cy.get('#nav').deveConterTexto('Olá, Ana');
    cy.get('#nav').contains('a', 'Carrinho').should('be.visible');
    cy.get('#cart-count').should('have.text', '0');
    cy.get('#logout-btn').should('have.text', 'Sair');
    cy.evidencia(5, 'Cabeçalho com usuária logada');
  });

  it('CT02 - Validar que o login não é realizado ao informar senha inválida', () => {
    acessarLogin();

    cy.get('#email').type(ana.email).should('have.value', ana.email);
    cy.evidencia(2, 'E-mail preenchido');

    cy.get('#password').type('senhaErrada').should('have.value', 'senhaErrada');
    cy.evidencia(3, 'Senha inválida preenchida');

    cy.get('#login-form button[type="submit"]').click();
    cy.get('#alert').should('be.visible').and('have.text', 'E-mail ou senha inválidos.');
    cy.location('pathname').should('eq', '/login.html');
    cy.evidencia(4, 'Mensagem de e-mail ou senha inválidos');
  });

  it('CT03 - Validar que o login não é realizado com os campos E-mail e Senha vazios', () => {
    acessarLogin();

    cy.get('#login-form button[type="submit"]').click();
    cy.get('#alert').should('be.visible').and('have.text', 'email e password são obrigatórios.');
    cy.location('pathname').should('eq', '/login.html');
    cy.evidencia(2, 'Mensagem de campos obrigatórios');
  });
});
