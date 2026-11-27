// Casos de teste PetShop Amigo — RF02 Cadastro (CT04 a CT07)
describe('Cadastro', () => {
  beforeEach(() => {
    cy.resetarBanco();
  });

  // Executa os passos 1 a 5 do cadastro, com evidência de cada passo.
  const cadastrar = ({ nome, email, senha, confirmacao, descricaoSenha = 'Senhas preenchidas' }) => {
    cy.visit('/cadastro.html');
    cy.get('h1').should('have.text', 'Criar conta');
    ['#name', '#email', '#password', '#confirm'].forEach((campo) => cy.get(campo).should('be.visible'));
    cy.evidencia(1, 'Tela Criar conta');

    cy.get('#name').type(nome).should('have.value', nome);
    cy.evidencia(2, 'Nome preenchido');

    cy.get('#email').type(email).should('have.value', email);
    cy.evidencia(3, 'E-mail preenchido');

    cy.get('#password').type(senha).should('have.value', senha);
    cy.get('#confirm').type(confirmacao).should('have.value', confirmacao);
    cy.evidencia(4, descricaoSenha);

    cy.get('#register-form button[type="submit"]').click();
  };

  it('CT04 - Validar que o cadastro é realizado ao informar dados válidos', () => {
    cadastrar({ nome: 'Diego Alves', email: 'diego@petshop.com', senha: 'senha123', confirmacao: 'senha123' });

    cy.location('pathname').should('eq', '/index.html');
    cy.get('#nav').deveConterTexto('Olá, Diego');
    cy.get('#products .card').should('have.length', 3);
    cy.evidencia(5, 'Cadastro realizado e vitrine apresentada');

    // Pós-condição: login com o novo usuário passa a ser aceito
    cy.request('POST', '/api/auth/login', { email: 'diego@petshop.com', password: 'senha123' })
      .its('status')
      .should('eq', 200);
  });

  it('CT05 - Validar que o cadastro não é realizado com e-mail já cadastrado', () => {
    cadastrar({ nome: 'Ana Teste', email: 'ana@petshop.com', senha: 'senha123', confirmacao: 'senha123' });

    cy.get('#alert')
      .should('be.visible')
      .and('have.text', 'Já existe um usuário cadastrado com este e-mail.');
    cy.location('pathname').should('eq', '/cadastro.html');
    cy.evidencia(5, 'Mensagem de e-mail já cadastrado');
  });

  it('CT06 - Validar que o cadastro não é realizado quando as senhas informadas não conferem', () => {
    cadastrar({
      nome: 'Elisa Costa',
      email: 'elisa@petshop.com',
      senha: 'senha123',
      confirmacao: 'senha456',
      descricaoSenha: 'Senhas diferentes preenchidas',
    });

    cy.get('#alert').should('be.visible').and('have.text', 'As senhas não conferem.');
    cy.evidencia(5, 'Mensagem de senhas que não conferem');

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
    cadastrar({
      nome: 'Fábio Reis',
      email: 'fabio@petshop.com',
      senha: '12345',
      confirmacao: '12345',
      descricaoSenha: 'Senha curta preenchida',
    });

    cy.get('#alert')
      .should('be.visible')
      .and('have.text', 'Dados de cadastro inválidos. password é obrigatório (mínimo 6 caracteres).');
    cy.evidencia(5, 'Mensagem de senha com menos de 6 caracteres');
  });
});
