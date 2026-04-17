require('dotenv').config();

// ── Validate required env vars at startup
const REQUIRED_ENV = ['DATABASE_URL', 'JWT_SECRET'];
const missingEnv = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missingEnv.length > 0) {
  console.error('❌ ERRO: Variáveis de ambiente obrigatórias não definidas:', missingEnv.join(', '));
  console.error('   Configure essas variáveis no painel do Railway (Settings → Variables).');
  process.exit(1);
}

const app = require('./app');

const PORT = process.env.PORT || 3001;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Orbie Backend rodando na porta ${PORT}`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Frontend: ${process.env.FRONTEND_URL || 'http://localhost:3000'}\n`);
});
