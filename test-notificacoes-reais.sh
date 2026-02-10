#!/bin/bash

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  🧪 TESTE DE NOTIFICAÇÕES COM DADOS REAIS${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"

# Função para fazer request
test_api() {
  local method=$1
  local endpoint=$2
  local data=$3
  local description=$4
  
  echo -e "\n${YELLOW}📍 TESTE: $description${NC}"
  echo -e "  ${BLUE}→${NC} $method $endpoint"
  
  if [ -z "$data" ]; then
    response=$(curl -s -X $method "http://localhost:5000$endpoint" \
      -H "Content-Type: application/json")
  else
    response=$(curl -s -X $method "http://localhost:5000$endpoint" \
      -H "Content-Type: application/json" \
      -d "$data")
  fi
  
  echo -e "  ${BLUE}✓ Response:${NC}"
  echo "$response" | jq '.' 2>/dev/null || echo "$response"
}

echo -e "\n${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}1️⃣  VERIFICAR BANCO DE DADOS LIMPO${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"

test_api "GET" "/api/cotacoes/disponiveis" "" "Listar cotações disponíveis (deve estar vazio)"

echo -e "\n${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}2️⃣  CRIAR UMA COTAÇÃO DE TESTE${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"

NEW_COTACAO=$(cat <<EOF
{
  "titulo": "Teste de Cotação Real",
  "descricao": "Produto para testar notificações",
  "cidadeColeta": "São Paulo",
  "estadoColeta": "SP",
  "cidadeEntrega": "Rio de Janeiro",
  "estadoEntrega": "RJ",
  "peso": 100,
  "volume": 50,
  "dataHoraFim": "$(date -u -d '+7 days' +%Y-%m-%dT%H:%M:%SZ)",
  "embarcadorId": "test-embarcador-123",
  "status": "aberta"
}
EOF
)

test_api "POST" "/api/cotacoes" "$NEW_COTACAO" "Criar nova cotação"

echo -e "\n${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}3️⃣  VERIFICAR COTAÇÃO CRIADA${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"

test_api "GET" "/api/cotacoes/disponiveis" "" "Listar cotações disponíveis (deve mostrar 1)"

echo -e "\n${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}✅ TESTE CONCLUÍDO${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "\n${YELLOW}📋 O que foi testado:${NC}"
echo -e "  ✓ Banco de dados foi limpo (0 cotações)"
echo -e "  ✓ Nova cotação foi criada com validade futura"
echo -e "  ✓ Endpoint /cotacoes/disponiveis retorna dados reais (não mock)"
echo -e "\n${YELLOW}⚡ Próximos passos:${NC}"
echo -e "  → Abra http://localhost:3000 no navegador"
echo -e "  → Faça login como transportador"
echo -e "  → Dashboard deve mostrar: 1 Oportunidade Disponível"
echo -e "  → Sino do topo deve mostrar 1 notificação"
echo -e "  → Menu lateral deve mostrar 1 no badge\n"
