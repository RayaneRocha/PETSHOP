const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    // A aplicação precisa estar rodando (npm start) antes de executar os testes.
    baseUrl: process.env.CYPRESS_BASE_URL || 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: 'cypress/support/e2e.js',
    viewportWidth: 1280,
    viewportHeight: 800,
    defaultCommandTimeout: 8000,
    video: false,
    // Habilita o botão "Run all specs" na interface do Cypress (npm run cy:open)
    experimentalRunAllSpecs: true,
  },
});
