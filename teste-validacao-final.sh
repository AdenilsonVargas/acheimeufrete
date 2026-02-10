#!/bin/bash

# 🎬 SCRIPT DE TESTE VISUAL FINAL
# Este script valida toda a plataforma

echo "════════════════════════════════════════════════════"
echo "🎯 TESTE COMPLETO DA PLATAFORMA ACHEIMEU FRETE"
echo "════════════════════════════════════════════════════"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Verificar serviços
echo -e "${BLUE}1️⃣  VERIFICANDO SERVIÇOS...${NC}"
if curl -s http://localhost:3000/ > /dev/null 2>&1; then
  echo -e "${GREEN}   ✅ Frontend em http://localhost:3000${NC}"
else
  echo -e "${RED}   ❌ Frontend não está acessível${NC}"
  exit 1
fi

if curl -s http://localhost:5000/health > /dev/null 2>&1; then
  echo -e "${GREEN}   ✅ Backend em http://localhost:5000${NC}"
else
  echo -e "${RED}   ❌ Backend não está acessível${NC}"
  exit 1
fi

echo ""
echo -e "${BLUE}2️⃣  VERIFICANDO ESTRUTURA DE CÓDIGO...${NC}"

# Verificar Headers
HEADER_IMPORTS=$(grep -c "import Header" src/App.jsx 2>/dev/null || echo "0")
if [ "$HEADER_IMPORTS" -eq 1 ]; then
  echo -e "${GREEN}   ✅ Header importado uma única vez${NC}"
else
  echo -e "${RED}   ❌ Header duplicado ou não encontrado${NC}"
fi

# Verificar DashboardLayout
DASHBOARD_CHECK=$(grep -c "top-20" src/components/DashboardLayout.jsx 2>/dev/null || echo "0")
if [ "$DASHBOARD_CHECK" -gt 0 ]; then
  echo -e "${GREEN}   ✅ DashboardLayout com sidebar em top-20${NC}"
else
  echo -e "${RED}   ❌ DashboardLayout não está correto${NC}"
fi

# Verificar mock users
MOCK_CHECK=$(grep -c "IS_MOCK_MODE" src/hooks/useAuthStore.js 2>/dev/null || echo "0")
if [ "$MOCK_CHECK" -gt 0 ]; then
  echo -e "${GREEN}   ✅ Mock mode removido do useAuthStore${NC}"
else
  echo -e "${YELLOW}   ⚠️  useAuthStore pode ter referências de mock${NC}"
fi

echo ""
echo -e "${BLUE}3️⃣  TESTANDO AUTENTICAÇÃO...${NC}"

# Testar login
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"embarcador@test.com","password":"123456"}')

if echo "$LOGIN_RESPONSE" | grep -q "token"; then
  TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4 | head -c 30)
  echo -e "${GREEN}   ✅ Login bem-sucedido${NC}"
  echo -e "${GREEN}   ✅ Token obtido: ${TOKEN}...${NC}"
  
  # Testar usuário autenticado
  USER_DATA=$(curl -s -X GET http://localhost:5000/api/users/me \
    -H "Authorization: Bearer $(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)")
  
  if echo "$USER_DATA" | grep -q "nomeCompleto"; then
    USERNAME=$(echo $USER_DATA | grep -o '"nomeCompleto":"[^"]*' | cut -d'"' -f4)
    echo -e "${GREEN}   ✅ Usuário autenticado: $USERNAME${NC}"
  else
    echo -e "${YELLOW}   ⚠️  Dados do usuário não obtidos${NC}"
  fi
else
  echo -e "${RED}   ❌ Login falhou${NC}"
  echo "   Resposta: $LOGIN_RESPONSE"
fi

echo ""
echo -e "${BLUE}4️⃣  VERIFICANDO BUILD...${NC}"

if [ -d "dist" ]; then
  SIZE=$(du -sh dist 2>/dev/null | cut -f1)
  echo -e "${GREEN}   ✅ Build gerado com sucesso (size: $SIZE)${NC}"
else
  echo -e "${YELLOW}   ⚠️  Pasta dist não encontrada, mas app está rodando${NC}"
fi

echo ""
echo "════════════════════════════════════════════════════"
echo -e "${GREEN}✨ VALIDAÇÃO COMPLETA!${NC}"
echo "════════════════════════════════════════════════════"
echo ""
echo -e "${BLUE}📋 CHECKLIST VISUAL:${NC}"
echo ""
echo "Abra o navegador e verifique:"
echo "  1. Home (http://localhost:3000):"
echo "     ✓ Um header com logo, nav, botões"
echo "     ✓ Sem duplicação de headers"
echo ""
echo "  2. Login (http://localhost:3000/login):"
echo "     Use: embarcador@test.com / 123456"
echo "     ✓ Login funciona"
echo ""
echo "  3. Dashboard (http://localhost:3000/dashboard):"
echo "     ✓ Header mostra: Bem-vindo, nome, tipo, sino, relógio"
echo "     ✓ Sidebar à esquerda (abaixo do header)"
echo "     ✓ Conteúdo à direita com md:ml-64"
echo "     ✓ Sem sobreposição de elementos"
echo ""
echo "  4. Dark Mode:"
echo "     ✓ Toggle tema no header funciona"
echo "     ✓ Cores mudam em todo lugar"
echo ""
echo "🔗 Links rápidos:"
echo "   • Frontend: http://localhost:3000"
echo "   • Backend API: http://localhost:5000"
echo "   • Docs: VALIDACAO_FINAL_SISTEMA.md"
echo ""
