import 'cypress-mochawesome-reporter/register';
import './commands';

// Evidências: cada passo dos casos de teste tira um print com cy.evidencia(passo, descricao).
// Em caso de falha, o Cypress também salva automaticamente um print do momento do erro.
