const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Tempo máximo para o MongoDB em memória subir. No Windows, a primeira inicialização
// pode demorar (antivírus verificando o mongod.exe), então o padrão de 10s é pouco.
const LAUNCH_TIMEOUT_MS = Number(process.env.MONGO_LAUNCH_TIMEOUT_MS) || 60000;

let memoryServer;

// Sobe um MongoDB em memória: os dados são recriados a cada inicialização.
async function connect() {
  try {
    memoryServer = await MongoMemoryServer.create({
      instance: { launchTimeout: LAUNCH_TIMEOUT_MS },
    });
  } catch (err) {
    console.error(
      '\nNão foi possível iniciar o MongoDB em memória.\n' +
        'Dicas:\n' +
        '  1. Encerre processos do MongoDB que ficaram presos de execuções anteriores:\n' +
        '       Git Bash:   taskkill //F //IM mongod.exe\n' +
        '       PowerShell: taskkill /F /IM mongod.exe\n' +
        '  2. Rode "npm start" novamente.\n' +
        '  3. Se persistir, aumente o tempo limite: MONGO_LAUNCH_TIMEOUT_MS=120000 npm start\n'
    );
    throw err;
  }

  const uri = memoryServer.getUri();
  await mongoose.connect(uri, { dbName: 'petshop' });
  return uri;
}

async function disconnect() {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
}

module.exports = { connect, disconnect };
