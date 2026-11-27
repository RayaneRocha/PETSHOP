const { defineConfig } = require('cypress');

module.exports = defineConfig({
  // Relatório HTML com as evidências (gerado em cypress/reports/index.html ao rodar "npm run cy:run")
  reporter: 'cypress-mochawesome-reporter',
  reporterOptions: {
    reportDir: 'cypress/reports',
    reportPageTitle: 'PetShop Amigo - Evidências dos testes',
    reportTitle: 'PetShop Amigo - Evidências dos testes',
    charts: true,
    embeddedScreenshots: true,
    inlineAssets: true,
    saveAllAttempts: false,
  },

  e2e: {
    // A aplicação precisa estar rodando (npm start) antes de executar os testes.
    baseUrl: process.env.CYPRESS_BASE_URL || 'http://localhost:3000',
    // e2e: um spec por funcionalidade; suites: agrupador "todos-os-testes" para a interface do Cypress
    specPattern: ['cypress/e2e/**/*.cy.js', 'cypress/suites/**/*.cy.js'],
    supportFile: 'cypress/support/e2e.js',
    viewportWidth: 1280,
    viewportHeight: 800,
    defaultCommandTimeout: 8000,

    // Evidências: vídeo de cada spec (cypress/videos) e prints (cypress/screenshots)
    video: true,
    screenshotOnRunFailure: true,
    screenshotsFolder: 'cypress/screenshots',
    videosFolder: 'cypress/videos',

    setupNodeEvents(on, config) {
      require('cypress-mochawesome-reporter/plugin')(on);
      return config;
    },
  },
});
