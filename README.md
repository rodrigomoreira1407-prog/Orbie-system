# 🌀 Orbie — Sistema de Gestão Clínica

SaaS completo para psicólogos com IA, assinaturas e banco de dados.

## Arquitetura

```
orbie-saas/
├── backend/          → Node.js + Express + Prisma + PostgreSQL
│   ├── src/
│   │   ├── routes/   → auth, patients, appointments, records, financial, subscriptions, ai
│   │   ├── controllers/
│   │   ├── middleware/
│   │   └── services/ → email, stripe
│   ├── prisma/schema.prisma
│   └── package.json
└── frontend/
    └── index.html    → SPA completa (login, cadastro, app)
```

## Deploy em 5 passos

### 1. Banco de dados — Supabase (grátis)
1. Crie conta em supabase.com
2. Crie um novo projeto
3. Copie a `DATABASE_URL` de Settings → Database → Connection string (URI)

### 2. Backend — Render.com (grátis)
1. Crie conta em render.com
2. New → Web Service → conecte seu GitHub
3. Root Directory: `backend`
4. Build Command: `npm install && npx prisma generate && npx prisma db push`
5. Start Command: `npm start`
6. Adicione as variáveis de ambiente do `.env.example`
7. Copie a URL do serviço (ex: `https://orbie-api.onrender.com`)

### 3. Frontend — Vercel (grátis)
1. Crie conta em vercel.com
2. Import do GitHub
3. Root Directory: `frontend`
4. No `index.html`, linha `const API = ...`, certifique que aponta para a URL do backend
5. Deploy!

### 4. Stripe (pagamentos)
1. Crie conta em stripe.com
2. Dashboard → Products → Crie 2 produtos:
   - Orbie Basic: R$ 29,90/mês
   - Orbie PRO+IA: R$ 59,90/mês
3. Copie os Price IDs para `.env`
4. Configure Webhook: `https://seu-backend.onrender.com/api/subscriptions/webhook`
   - Eventos: `checkout.session.completed`, `customer.subscription.deleted`, `invoice.payment_succeeded`
5. Copie o Webhook Secret para `.env`

### 5. Email (Gmail)
1. Acesse myaccount.google.com → Segurança → Verificação em 2 etapas
2. Senhas de app → Criar senha para "Orbie"
3. Cole no `.env` como EMAIL_USER e EMAIL_PASS

## Variáveis de ambiente

Copie `.env.example` para `.env` e preencha todos os valores.

## Fluxo do usuário

1. Acessa o site → vê tela de login/cadastro
2. Cadastra conta → recebe email de verificação
3. Clica no link → email confirmado → redirecionado para escolher plano
4. Escolhe plano → Stripe Checkout → paga
5. Stripe webhook ativa o plano → acesso liberado ao sistema
6. Usa o sistema completo com IA (plano PRO)

## Planos

| Plano | Preço | IA |
|-------|-------|-----|
| Basic | R$ 29,90/mês | ❌ |
| PRO + IA | R$ 59,90/mês | ✅ |

## Suporte
contato@orbie.com.br
