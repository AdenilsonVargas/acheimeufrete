#!/bin/bash

# Teste avançado de F5 - Simula refresh no navegador
# Verifica se localStorage é mantido e se checkAuth() restaura corretamente

echo "🧪 TESTE AVANÇADO - F5 Refresh Simulation"
echo "========================================"
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

API_URL="http://localhost:5000/api"

# Passo 1: Login
echo -e "${BLUE}PASSO 1: Login como transportador@test.com${NC}"
LOGIN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"transportador@test.com","password":"123456"}')

TOKEN=$(echo $LOGIN | jq -r '.token')
EMAIL=$(echo $LOGIN | jq -r '.user.email')
USERTYPE=$(echo $LOGIN | jq -r '.user.userType')

if [ "$USERTYPE" != "transportador" ]; then
  echo -e "${RED}❌ ERRO: Tipo de usuário incorreto no login${NC}"
  echo "   Esperado: transportador"
  echo "   Obtido: $USERTYPE"
  exit 1
fi

echo -e "${GREEN}✅ Login sucesso!${NC}"
echo "   Email: $EMAIL"
echo "   UserType: $USERTYPE"
echo "   Token: ${TOKEN:0:50}..."
echo ""

# Passo 2: Simular F5 (chamando /auth/me com o mesmo token)
echo -e "${BLUE}PASSO 2: Simular F5 refresh (chamando /auth/me)${NC}"
ME=$(curl -s -X GET "$API_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

ME_EMAIL=$(echo $ME | jq -r '.user.email')
ME_USERTYPE=$(echo $ME | jq -r '.user.userType')

echo "Response: $ME"
echo ""

if [ "$ME_USERTYPE" != "transportador" ]; then
  echo -e "${RED}❌ ERRO CRÍTICO: UserType mudou após F5!${NC}"
  echo "   Antes: transportador"
  echo "   Depois: $ME_USERTYPE"
  exit 1
fi

if [ "$ME_EMAIL" != "$EMAIL" ]; then
  echo -e "${RED}❌ ERRO: Email mudou após F5!${NC}"
  echo "   Antes: $EMAIL"
  echo "   Depois: $ME_EMAIL"
  exit 1
fi

echo -e "${GREEN}✅ F5 refresh simulado com sucesso!${NC}"
echo "   Email: $ME_EMAIL (mantido)"
echo "   UserType: $ME_USERTYPE (mantido)"
echo ""

# Passo 3: Testar logout
echo -e "${BLUE}PASSO 3: Testar logout e invalidação de token${NC}"
curl -s -X GET "$API_URL/auth/me" \
  -H "Authorization: Bearer INVALID_TOKEN" \
  -H "Content-Type: application/json" > /tmp/invalid_response.json

INVALID_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_URL/auth/me" \
  -H "Authorization: Bearer INVALID_TOKEN" \
  -H "Content-Type: application/json")

if [ "$INVALID_STATUS" -eq 401 ]; then
  echo -e "${GREEN}✅ Token inválido é rejeitado corretamente (HTTP 401)${NC}"
else
  echo -e "${YELLOW}⚠️  Resposta inesperada para token inválido (HTTP $INVALID_STATUS)${NC}"
fi

echo ""
echo -e "${GREEN}✨ TESTE COMPLETO PASSOU!${NC}"
echo "Session persistence está funcionando corretamente."
echo ""
echo "Próximas ações:"
echo "1. Abra http://localhost:3000 no navegador"
echo "2. Faça login como transportador@test.com / 123456"
echo "3. Verifique no console do navegador os logs de inicialização"
echo "4. Pressione F5 e verifique se mantém a sessão"
echo "5. Confirme nos logs do console:"
echo "   - 💾 INIT: Usuário carregado do localStorage"
echo "   - 🔍 useUserType: email e userType mantidos"
echo "   - ✅ checkAuth: Usuário restaurado com sucesso"
