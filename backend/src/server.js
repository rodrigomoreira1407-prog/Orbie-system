require('dotenv').config();

// Map Portuguese env var names to English for Railway compatibility
if (!process.env.DATABASE_URL && process.env.URL_DO_BANCO_DE_DADOS)
  process.env.DATABASE_URL = process.env.URL_DO_BANCO_DE_DADOS;
if (!process.env.FRONTEND_URL && process.env.URL_FRONTEND)
  process.env.FRONTEND_URL = process.env.URL_FRONTEND;
if (!process.env.ANTHROPIC_API_KEY && process.env.ANTROPIC_API_KEY)
  process.env.ANTHROPIC_API_KEY = process.env.ANTROPIC_API_KEY;
if (!process.env.EMAIL_USER && process.env['USUÁRIO_DE_EMAIL'])
  process.env.EMAIL_USER = process.env['USUÁRIO_DE_EMAIL'];
if (process.env.NODE_ENV === 'produção')
  process.env.NODE_ENV = 'production';

const app = require('./app');

const PORT = process.env.PORT || process.env.PORTA || 3001;

app.listen(PORT, () => {
  console.log(`\n🚀 Orbie Backend rodando na porta ${PORT}`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Frontend: ${process.env.FRONTEND_URL || 'http://localhost:3000'}\n`);
});
