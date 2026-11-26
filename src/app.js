const path = require('path');
const fs = require('fs');
const express = require('express');
const yaml = require('js-yaml');
const swaggerUi = require('swagger-ui-express');

const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/products.routes');
const cartRoutes = require('./routes/cart.routes');
const checkoutRoutes = require('./routes/checkout.routes');
const testRoutes = require('./routes/test.routes');
const errorHandler = require('./middlewares/errorHandler');

const SWAGGER_PATH = path.join(__dirname, '..', 'docs', 'swagger.yaml');

function createApp() {
  const app = express();
  app.use(express.json());

  // API
  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/api/auth', authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/cart', cartRoutes);
  app.use('/api/checkout', checkoutRoutes);
  if (process.env.NODE_ENV !== 'production') {
    app.use('/api/test', testRoutes);
  }
  app.use('/api', (req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));

  // Documentação: YAML bruto e Swagger UI renderizando o YAML
  app.get('/swagger.yaml', (req, res) => {
    res.type('text/yaml').sendFile(SWAGGER_PATH);
  });
  const swaggerDocument = yaml.load(fs.readFileSync(SWAGGER_PATH, 'utf8'));
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, { customSiteTitle: 'PetShop Amigo - API' })
  );

  // Site Web
  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.use(errorHandler);
  return app;
}

module.exports = createApp;
