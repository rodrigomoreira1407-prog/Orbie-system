require('dotenv').config();
const { execSync } = require('child_process');
const path = require('path');

// Ensure DB schema is up to date (creates new tables like Convenio when first deployed)
try {
  execSync('npx prisma db push --skip-generate', {
    cwd: path.join(__dirname, '..'),
    stdio: 'pipe',
    timeout: 60000,
  });
  console.log('✅ Database schema sincronizado');
} catch (e) {
  console.warn('⚠️ DB push aviso (continuando):', (e.stderr || e.message || '').toString().substring(0, 300));
}

const app = require('./app');

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`\n🚀 Orbie Backend rodando na porta ${PORT}`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Frontend: ${process.env.FRONTEND_URL || 'http://localhost:3000'}\n`);
});
