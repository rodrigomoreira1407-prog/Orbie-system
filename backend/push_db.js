const { exec } = require('child_process');

console.log("Iniciando Prisma db push...");
const child = exec('npx prisma db push', {
  cwd: '/home/ubuntu/Orbie-system/backend',
  env: { ...process.env, DEBUG: 'prisma:*' }
});

child.stdout.on('data', (data) => {
  console.log(`STDOUT: ${data}`);
});

child.stderr.on('data', (data) => {
  console.error(`STDERR: ${data}`);
});

child.on('close', (code) => {
  console.log(`Processo finalizado com código ${code}`);
});
