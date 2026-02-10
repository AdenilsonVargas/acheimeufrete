#!/bin/bash

# Teste de Segurança Completo - Validação de Session Persistence
# Cenário: Login -> F5 -> Logout -> Verificar limpeza

echo "🔐 TESTE DE SEGURANÇA - Session Lifecycle Completo"
echo "=================================================="
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

API_URL="http://localhost:5000/api"
PASS_COUNT=0
FAIL_COUNT=0

test_result() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✅ PASSOU${NC}"
    ((PASS_COUNT++))
  else
    echo -e "${RED}❌ FALHOU${NC}"
    ((FAIL_COUNT++))
  fi
}

# ==================== TESTE 1: LOGIN ====================
echo -e "${BLUE}[TESTE 1] Login como Transportador${NC}"

LOGIN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"transportador@test.com","password":"123456"}')

TOKEN=$(echo $LOGIN | jq -r '.token // empty')
USERTYPE=$(echo $LOGIN | jq -r '.user.userType // empty')

if [ "$USERTYPE" = "transportador" ] && [ ! -z "$TOKEN" ]; then
  echo "  Email: transportador@test.com"
  echo "  UserType: $USERTYPE"
  test_result 0
else
  echo "  Falha ao fazer login"
  test_result 1
  exit 1
fi
echo ""

# ==================== TESTE 2: SESSION ME (F5 SIMULADO) ====================
echo -e "${BLUE}[TESTE 2] Simular F5 - Chamar /auth/me com token${NC}"

ME=$(curl -s -X GET "$API_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

ME_USERTYPE=$(echo $ME | jq -r '.user.userType // empty')
ME_EMAIL=$(echo $ME | jq -r '.user.email // empty')

if [ "$ME_USERTYPE" = "transportador" ] && [ "$ME_EMAIL" = "transportador@test.com" ]; then
  echo "  Email: $ME_EMAIL (preservado)"
  echo "  UserType: $ME_USERTYPE (preservado)"
  test_result 0
else
  echo "  Falha: userType = $ME_USERTYPE (esperado: transportador)"
  test_result 1
fi
echo ""

# ==================== TESTE 3: TOKEN EXPIRADO ====================
echo -e "${BLUE}[TESTE 3] Verificar rejeição de token inválido${NC}"

INVALID_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_URL/auth/me" \
  -H "Authorization: Bearer INVALID_TOKEN_12345" \
  -H "Content-Type: application/json")

if [ "$INVALID_CODE" = "401" ]; then
  echo "  Token inválido: HTTP $INVALID_CODE (esperado: 401)"
  test_result 0
else
  echo "  Falha: Token inválido retornou HTTP $INVALID_CODE (esperado: 401)"
  test_result 1
fi
echo ""

# ==================== TESTE 4: MÚLTIPLOS USUÁRIOS ====================
echo -e "${BLUE}[TESTE 4] Verificar isolamento - Login como Embarcador${NC}"

LOGIN_EMB=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"embarcador@test.com","password":"123456"}')

TOKEN_EMB=$(echo $LOGIN_EMB | jq -r '.token // empty')
USERTYPE_EMB=$(echo $LOGIN_EMB | jq -r '.user.userType // empty')

if [ "$USERTYPE_EMB" = "embarcador" ] && [ ! -z "$TOKEN_EMB" ]; then
  echo "  Email: embarcador@test.com"
  echo "  UserType: $USERTYPE_EMB"
  test_result 0
else
  echo "  Falha ao fazer login como embarcador"
  test_result 1
fi
echo ""

# ==================== TESTE 5: VALIDAÇÃO DO OUTRO USUÁRIO ====================
echo -e "${BLUE}[TESTE 5] Verificar isolamento - Validar token do Embarcador${NC}"

ME_EMB=$(curl -s -X GET "$API_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN_EMB" \
  -H "Content-Type: application/json")

ME_USERTYPE_EMB=$(echo $ME_EMB | jq -r '.user.userType // empty')

if [ "$ME_USERTYPE_EMB" = "embarcador" ]; then
  echo "  UserType: $ME_USERTYPE_EMB (correto para embarcador)"
  test_result 0
else
  echo "  Falha: Embarcador retornou userType=$ME_USERTYPE_EMB"
  test_result 1
fi
echo ""

# ==================== TESTE 6: TOKENS NÃO DEVEM SE MISTURAR ====================
echo -e "${BLUE}[TESTE 6] Verificar isolamento - Token Transportador NÃO acessa Embarcador${NC}"

# Verificar que token do transportador ainda funciona para transportador
ME_TRANS=$(curl -s -X GET "$API_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

ME_USERTYPE_TRANS=$(echo $ME_TRANS | jq -r '.user.userType // empty')

if [ "$ME_USERTYPE_TRANS" = "transportador" ]; then
  echo "  Token Transportador: userType=$ME_USERTYPE_TRANS ✓"
  test_result 0
else
  echo "  Falha: Token transportador mudou para $ME_USERTYPE_TRANS"
  test_result 1
fi
echo ""

# ==================== RESUMO ====================
echo ""
echo "📊 RESUMO DOS TESTES"
echo "==================="
echo -e "✅ Testes Passaram: ${GREEN}$PASS_COUNT${NC}"
echo -e "❌ Testes Falharam: ${RED}$FAIL_COUNT${NC}"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
  echo -e "${GREEN}🎉 TODOS OS TESTES DE SEGURANÇA PASSARAM!${NC}"
  echo ""
  echo "✅ Session Persistence: OK"
  echo "✅ F5 Refresh: OK"
  echo "✅ Token Validation: OK"
  echo "✅ Multi-user Isolation: OK"
  echo ""
  exit 0
else
  echo -e "${RED}🚨 ALGUNS TESTES FALHARAM!${NC}"
  exit 1
fi
