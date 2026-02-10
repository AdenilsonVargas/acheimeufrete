# Usar uma imagem base do Node.js
FROM node:18-alpine

# Instalar OpenSSL e outras dependências necessárias
RUN apk add --no-cache openssl

# Definir o diretório de trabalho dentro do container
WORKDIR /app

# Copiar os arquivos do backend para o container
COPY package*.json ./
COPY . .

# Instalar as dependências do backend
RUN npm install

# Gerar o Prisma Client
RUN npx prisma generate

# Expor a porta do backend
EXPOSE 5000

# Comando para iniciar o servidor
CMD ["npm", "run", "dev"]