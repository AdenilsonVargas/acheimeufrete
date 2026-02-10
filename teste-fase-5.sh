#!/bin/bash

# TESTE DE FASE 5 - Chat em Tempo Real
# Este script ajuda a testar a funcionalidade de chat

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  TESTE FASE 5 - Chat em Tempo Real                          ║"
echo "║  Build Frontend + Start Backend + Validação                 ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erro: package.json não encontrado${NC}"
    echo "Execute este script do diretório raiz do projeto"
    exit 1
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}1️⃣  VALIDANDO BUILD DO FRONTEND${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

npm run build
BUILD_RESULT=$?

if [ $BUILD_RESULT -eq 0 ]; then
    echo -e "${GREEN}✅ Build do frontend passou com sucesso!${NC}"
else
    echo -e "${RED}❌ Build do frontend falhou!${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}2️⃣  VERIFICANDO DEPENDÊNCIAS DO BACKEND${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Verificar se socket.io está instalado
cd backend
if grep -q '"socket.io":' package.json; then
    echo -e "${GREEN}✅ socket.io encontrado no package.json${NC}"
else
    echo -e "${YELLOW}⚠️  socket.io não encontrado, instalando...${NC}"
    npm install socket.io --save
fi

# Verificar se node_modules de socket.io existe
if [ -d "node_modules/socket.io" ]; then
    echo -e "${GREEN}✅ socket.io instalado em node_modules${NC}"
else
    echo -e "${YELLOW}⚠️  socket.io não está em node_modules, rodando npm install...${NC}"
    npm install --legacy-peer-deps
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}3️⃣  CHECKLIST IMPLEMENTAÇÃO FASE 5${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Verificar arquivos
CHECKS_PASSED=0
CHECKS_TOTAL=0

# Check 1: WebSocket Handler
CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
if [ -f "src/websocket/socketHandler.js" ]; then
    LINES=$(wc -l < "src/websocket/socketHandler.js")
    echo -e "${GREEN}✅ socketHandler.js (${LINES} linhas)${NC}"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    echo -e "${RED}❌ socketHandler.js NÃO ENCONTRADO${NC}"
fi

# Check 2: Controller de Chat
CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
if [ -f "src/controllers/cotacaoChatController.js" ]; then
    LINES=$(wc -l < "src/controllers/cotacaoChatController.js")
    echo -e "${GREEN}✅ cotacaoChatController.js (${LINES} linhas)${NC}"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    echo -e "${RED}❌ cotacaoChatController.js NÃO ENCONTRADO${NC}"
fi

# Check 3: Rotas de Chat
CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
if [ -f "src/routes/chatCotacaoRoutes.js" ]; then
    LINES=$(wc -l < "src/routes/chatCotacaoRoutes.js")
    echo -e "${GREEN}✅ chatCotacaoRoutes.js (${LINES} linhas)${NC}"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    echo -e "${RED}❌ chatCotacaoRoutes.js NÃO ENCONTRADO${NC}"
fi

# Check 4: Socket.io no server.js
CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
if grep -q "initializeWebSocket" "src/server.js"; then
    echo -e "${GREEN}✅ WebSocket integrado no server.js${NC}"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    echo -e "${RED}❌ WebSocket NÃO integrado no server.js${NC}"
fi

cd ..

# Check 5: Chat Component Frontend
CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
if [ -f "src/pages/Chat.jsx" ]; then
    LINES=$(wc -l < "src/pages/Chat.jsx")
    echo -e "${GREEN}✅ Chat.jsx (${LINES} linhas)${NC}"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    echo -e "${RED}❌ Chat.jsx NÃO ENCONTRADO${NC}"
fi

# Check 6: Rota no App.jsx
CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
if grep -q "chat-cotacao" "src/App.jsx"; then
    echo -e "${GREEN}✅ Rota /chat-cotacao integrada em App.jsx${NC}"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    echo -e "${RED}❌ Rota /chat-cotacao NÃO integrada${NC}"
fi

# Check 7: socket.io-client no frontend
CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
if grep -q '"socket.io-client":' "package.json"; then
    echo -e "${GREEN}✅ socket.io-client no package.json do frontend${NC}"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    echo -e "${RED}❌ socket.io-client NÃO encontrado no package.json${NC}"
fi

echo ""
echo "Testes passados: ${CHECKS_PASSED}/${CHECKS_TOTAL}"

if [ $CHECKS_PASSED -eq $CHECKS_TOTAL ]; then
    echo -e "${GREEN}✅ Todos os checks passaram!${NC}"
else
    FAILED=$((CHECKS_TOTAL - CHECKS_PASSED))
    echo -e "${YELLOW}⚠️  ${FAILED} check(s) falharam${NC}"
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}4️⃣  INSTRUÇÕES PARA INICIAR O SERVIDOR${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

echo "Para iniciar o backend com suporte a WebSocket:"
echo ""
echo -e "${YELLOW}Terminal 1 (Backend):${NC}"
echo "  cd backend"
echo "  npm run dev"
echo ""
echo -e "${YELLOW}Terminal 2 (Frontend - opcional):${NC}"
echo "  npm run dev"
echo ""
echo "O servidor rodará em:"
echo "  - API REST: http://localhost:5000/api"
echo "  - WebSocket: ws://localhost:5000"
echo "  - Frontend: http://localhost:3000 (ou http://localhost:5173)"
echo ""

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}5️⃣  TESTES MANUAIS RECOMENDADOS${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo "Cenário 1: Chat Básico"
echo "  1. Login como embarcador"
echo "  2. Criar nova cotação"
echo "  3. Logout → Login como transportador"
echo "  4. Responder à cotação"
echo "  5. Login como embarcador → Acessar chat"
echo "  6. Verificar se histórico está vazio (primeira conversa)"
echo ""

echo "Cenário 2: Enviar e Receber Mensagens"
echo "  1. Abrir chat em 2 abas (embarcador + transportador)"
echo "  2. Embarcador envia: 'Olá, qual é sua melhor proposta?'"
echo "  3. Verificar se message aparece em tempo real no outro"
echo "  4. Verificar status de lida (checkmark duplo)"
echo ""

echo "Cenário 3: Digitação"
echo "  1. Abrir chat em 2 abas"
echo "  2. Começar a digitar em uma aba"
echo "  3. Verificar se 'está digitando...' aparece na outra aba"
echo ""

echo "Cenário 4: Reconexão"
echo "  1. Abrir chat"
echo "  2. DevTools → Network → Offline"
echo "  3. Esperar 5-10 segundos até desconectar"
echo "  4. Reconectar → Online"
echo "  5. Verificar se status volta para 'Conectado'"
echo ""

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🎉 VOCÊ ESTÁ PRONTO PARA TESTAR A FASE 5!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

exit 0
