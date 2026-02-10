#!/bin/bash

echo "🚀 Configurando AcheimeuFrete Backend..."
echo ""

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verificar Node.js
echo -e "${BLUE}1. Verificando Node.js...${NC}"
node --version
echo ""

# 2. Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
  echo -e "${BLUE}2. Instalando dependências...${NC}"
  npm install
  echo ""
fi

# 3. Verificar se PostgreSQL está rodando
echo -e "${BLUE}3. Verificando PostgreSQL...${NC}"
if ! command -v psql &> /dev/null; then
  echo -e "${YELLOW}   ⚠️  PostgreSQL não encontrado. Use Docker Compose:${NC}"
  echo -e "   ${GREEN}docker-compose up -d${NC}"
  echo ""
fi

# 4. Gerar Prisma Client
echo -e "${BLUE}4. Gerando Prisma Client...${NC}"
npm run prisma:generate
echo ""

# 5. Instruções
echo -e "${GREEN}✅ Setup concluído!${NC}"
echo ""
echo -e "${BLUE}Próximas etapas:${NC}"
echo "1. Inicie o banco de dados (se usar Docker):"
echo -e "   ${GREEN}docker-compose up -d${NC}"
echo ""
echo "2. Execute as migrations:"
echo -e "   ${GREEN}npm run prisma:migrate${NC}"
echo ""
echo "3. Popular dados de teste (opcional):"
echo -e "   ${GREEN}npm run prisma:seed${NC}"
echo ""
echo "4. Inicie o servidor:"
echo -e "   ${GREEN}npm run dev${NC}"
echo ""
