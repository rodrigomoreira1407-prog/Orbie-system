require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`\n🚀 Orbie Backend rodando na porta ${PORT}`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Frontend: ${process.env.FRONTEND_URL || 'http://localhost:3000'}\n`);

  // Mantém o serviço Render acordado fazendo um self-ping a cada 14 minutos
  if (process.env.NODE_ENV === 'production' && process.env.RENDER_EXTERNAL_URL) {
    const PING_INTERVAL = 14 * 60 * 1000; // 14 minutos
    setInterval(() => {
      fetch(`${process.env.RENDER_EXTERNAL_URL}/api/health`)
        .then(() => console.log('🏓 Keep-alive ping enviado'))
        .catch((err) => console.error('⚠️  Keep-alive ping falhou:', err.message));
    }, PING_INTERVAL);
  }
});
