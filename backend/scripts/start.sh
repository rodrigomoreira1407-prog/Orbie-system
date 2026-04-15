#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ]; then
  echo ""
  echo "❌ ERRO: A variável de ambiente DATABASE_URL não está definida."
  echo ""
  echo "Para corrigir no Railway:"
  echo "  1. Acesse o dashboard do Railway"
  echo "  2. Selecione o seu serviço"
  echo "  3. Vá em 'Variables'"
  echo "  4. Adicione DATABASE_URL com a string de conexão PostgreSQL"
  echo "     Exemplo: postgresql://usuario:senha@host:5432/banco"
  echo ""
  exit 1
fi

echo "✅ DATABASE_URL encontrado. Iniciando..."

echo "▶ Executando prisma db push..."
npx prisma db push

echo "▶ Iniciando servidor..."
exec node src/server.js
