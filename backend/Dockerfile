FROM node:20-alpine

WORKDIR /app

# Instalar dependências
COPY package.json ./
RUN npm install --omit=dev

# Copiar código fonte
COPY . .

# Gerar Prisma Client
RUN npx prisma generate

EXPOSE 3001

# Aplicar schema no banco e iniciar o servidor
CMD ["sh", "-c", "npx prisma db push && node src/server.js"]
