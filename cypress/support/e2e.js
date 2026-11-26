import 'cypress-mochawesome-reporter/register';
import './commands';

// Evidência: print da tela ao final de cada teste (cypress/screenshots e relatório HTML).
afterEach(function () {
  const titulo = this.currentTest.title.split(' - ')[0]; // ex.: "CT01"
  const status = this.currentTest.state === 'failed' ? 'falhou' : 'passou';
  cy.screenshot(`${titulo} - ${status}`, { capture: 'viewport' });
});
