const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    // A aplicação precisa estar rodando (npm start) antes de executar os testes.
    baseUrl: process.env.CYPRESS_BASE_URL || 'http://localhost:3000',
    // e2e: um spec por funcionalidade; suites: agrupador "todos-os-testes" para a interface do Cypress
    specPattern: ['cypress/e2e/**/*.cy.js', 'cypress/suites/**/*.cy.js'],
    supportFile: 'cypress/support/e2e.js',
    viewportWidth: 1280,
    viewportHeight: 800,
    defaultCommandTimeout: 8000,
    video: false,
  },
});
