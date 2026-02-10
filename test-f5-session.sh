#!/bin/bash

# Teste de persistência de sessão F5
# Este script testa se a sessão é mantida após F5 (reload)

echo "🧪 TESTE F5 - Session Persistence"
echo "=================================="
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

API_URL="http://localhost:5000/api"

echo -e "${BLUE}1. Login como transportador@test.com${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"transportador@test.com","password":"123456"}')

echo "Response: $LOGIN_RESPONSE"

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
USER=$(echo $LOGIN_RESPONSE | grep -o '"userType":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Falha ao fazer login${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Login sucesso!${NC}"
echo "   Token: ${TOKEN:0:20}..."
echo "   UserType: $USER"
echo ""

echo -e "${BLUE}2. Validar sessão com /auth/me (simulando F5)${NC}"
ME_RESPONSE=$(curl -s -X GET "$API_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Response: $ME_RESPONSE"

ME_USER=$(echo $ME_RESPONSE | grep -o '"userType":"[^"]*' | cut -d'"' -f4)
ME_EMAIL=$(echo $ME_RESPONSE | grep -o '"email":"[^"]*' | cut -d'"' -f4)

if [ "$ME_USER" != "$USER" ]; then
  echo -e "${RED}❌ ERRO: userType mudou após /auth/me!${NC}"
  echo "   Antes: $USER"
  echo "   Depois: $ME_USER"
  exit 1
fi

echo -e "${GREEN}✅ Session validado com sucesso!${NC}"
echo "   Email: $ME_EMAIL"
echo "   UserType: $ME_USER"
echo ""

echo -e "${GREEN}✅ TESTE PASSOU - Session persistence OK${NC}"
echo ""
echo "Próxima ação: Abra http://localhost:3000 e teste F5 manualmente"
echo "Verifique no console do navegador os logs de inicialização"
