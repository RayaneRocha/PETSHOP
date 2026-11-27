// Executa todos os casos de teste (CT01 a CT16) de uma vez na interface do Cypress (npm run cy:open).
// No modo terminal (npm run cy:run) os specs da pasta e2e são executados diretamente.
import '../e2e/01-login.cy.js';
import '../e2e/02-cadastro.cy.js';
import '../e2e/03-carrinho.cy.js';
import '../e2e/04-finalizacao-compra.cy.js';
