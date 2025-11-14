// cypress.config.js

const { defineConfig } = require('cypress');

module.exports = defineConfig({
  chromeWebSecurity: false,
  e2e: {
    baseUrl: 'http://127.0.0.1:5000/static/index.html', // Altere para o seu localhost e porta desejados
    setupNodeEvents(on, config) {
      // implementação de eventos de nó aqui
    },
  },
});
