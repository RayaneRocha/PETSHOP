const createApp = require('./app');
const database = require('./database');
const { seed } = require('./seed');
const { port } = require('./config');

async function start() {
  console.log('Iniciando MongoDB em memória...');
  await database.connect();

  const counts = await seed();
  console.log(`Dados de teste carregados: ${counts.products} produtos e ${counts.users} usuários.`);

  const app = createApp();
  const server = app.listen(port, () => {
    console.log(`\nPetShop Amigo rodando em http://localhost:${port}`);
    console.log(`  Site:         http://localhost:${port}/`);
    console.log(`  API:          http://localhost:${port}/api`);
    console.log(`  Swagger UI:   http://localhost:${port}/api-docs`);
    console.log(`  Swagger YAML: http://localhost:${port}/swagger.yaml\n`);
  });

  const shutdown = async () => {
    server.close();
    await database.disconnect();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((err) => {
  console.error('Falha ao iniciar a aplicação:', err);
  process.exit(1);
});
