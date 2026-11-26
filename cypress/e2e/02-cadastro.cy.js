// Casos de teste PetShop Amigo — RF02 Cadastro (CT04 a CT07)
describe('Cadastro', () => {
  beforeEach(() => {
    cy.resetarBanco();
    cy.visit('/cadastro.html');
  });

  const preencherCadastro = ({ nome, email, senha, confirmacao }) => {
    cy.get('#name').type(nome);
    cy.get('#email').type(email).should('have.value', email);
    cy.get('#password').type(senha).should('have.value', senha);
    cy.get('#confirm').type(confirmacao).should('have.value', confirmacao);
    cy.get('#register-form button[type="submit"]').click();
  };

  it('CT04 - Validar que o cadastro é realizado ao informar dados válidos', () => {
    // Passo 1: tela Criar conta com os campos Nome, E-mail, Senha e Confirmar senha
    cy.get('h1').should('have.text', 'Criar conta');
    ['#name', '#email', '#password', '#confirm'].forEach((campo) => cy.get(campo).should('be.visible'));

    // Passos 2 a 5
    preencherCadastro({
      nome: 'Diego Alves',
      email: 'diego@petshop.com',
      senha: 'senha123',
      confirmacao: 'senha123',
    });

    cy.location('pathname').should('eq', '/index.html');
    cy.get('#nav').deveConterTexto('Olá, Diego');

    // Pós-condição: login com o novo usuário passa a ser aceito
    cy.request('POST', '/api/auth/login', { email: 'diego@petshop.com', password: 'senha123' })
      .its('status')
      .should('eq', 200);
  });

  it('CT05 - Validar que o cadastro não é realizado com e-mail já cadastrado', () => {
    preencherCadastro({
      nome: 'Ana Teste',
      email: 'ana@petshop.com',
      senha: 'senha123',
      confirmacao: 'senha123',
    });

    cy.get('#alert')
      .should('be.visible')
      .and('have.text', 'Já existe um usuário cadastrado com este e-mail.');
    cy.location('pathname').should('eq', '/cadastro.html');
  });

  it('CT06 - Validar que o cadastro não é realizado quando as senhas informadas não conferem', () => {
    preencherCadastro({
      nome: 'Elisa Costa',
      email: 'elisa@petshop.com',
      senha: 'senha123',
      confirmacao: 'senha456',
    });

    cy.get('#alert').should('be.visible').and('have.text', 'As senhas não conferem.');

    // Pós-condição: nenhum usuário criado
    cy.request({
      method: 'POST',
      url: '/api/auth/login',
      body: { email: 'elisa@petshop.com', password: 'senha123' },
      failOnStatusCode: false,
    })
      .its('status')
      .should('eq', 401);
  });

  it('CT07 - Validar que o cadastro não é realizado com senha de menos de 6 caracteres', () => {
    preencherCadastro({
      nome: 'Fábio Reis',
      email: 'fabio@petshop.com',
      senha: '12345',
      confirmacao: '12345',
    });

    cy.get('#alert')
      .should('be.visible')
      .and('have.text', 'Dados de cadastro inválidos. password é obrigatório (mínimo 6 caracteres).');
  });
});
