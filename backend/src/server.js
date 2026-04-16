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
// Derive direct (non-pgBouncer) URL for Prisma migrations from the pooler URL.
// Replaces Supabase pgBouncer port 6543 with session-mode port 5432 and strips query params.
if (!process.env.DIRECT_URL && process.env.DATABASE_URL)
  // Replace any port and strip query params, keeping the database name path.
  process.env.DIRECT_URL = process.env.DATABASE_URL.replace(/:\d+(\/[^?]*)(\?.*)?$/, ':5432$1');

const app = require('./app');

const PORT = process.env.PORT || process.env.PORTA || 3001;

app.listen(PORT, () => {
  console.log(`\n🚀 Orbie Backend rodando na porta ${PORT}`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Frontend: ${process.env.FRONTEND_URL || 'http://localhost:3000'}\n`);
});
