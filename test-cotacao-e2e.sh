#!/bin/bash
# 🧪 Script de Testes API - Cotações End-to-End
# Uso: bash test-cotacao-e2e.sh

set -e

API_URL="http://localhost:5000/api"
TOKEN=""  # Será preenchido após login

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 📝 Logs
LOG_FILE="/tmp/cotacao-test.log"
echo "🧪 Iniciando Testes de Cotação E2E" > $LOG_FILE
echo "Data: $(date)" >> $LOG_FILE
echo "---" >> $LOG_FILE

# Função para testar
test_endpoint() {
  local method=$1
  local endpoint=$2
  local data=$3
  local description=$4
  
  echo -e "${YELLOW}[TEST]${NC} $description"
  
  if [ "$method" = "GET" ]; then
    local response=$(curl -s -X GET "$API_URL$endpoint" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json")
  else
    local response=$(curl -s -X POST "$API_URL$endpoint" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "$data")
  fi
  
  if echo "$response" | grep -q "error\|erro"; then
    echo -e "${RED}❌ ERRO${NC}: $response" | head -c 100
    echo "" >> $LOG_FILE
    echo "$response" >> $LOG_FILE
    return 1
  else
    echo -e "${GREEN}✅ OK${NC}: $(echo $response | jq . | head -c 80)..."
    echo "" >> $LOG_FILE
    echo "$response" >> $LOG_FILE
    return 0
  fi
}

echo -e "\n${YELLOW}=== FASE 2: Teste de Produtos ===${NC}\n"

# Teste 1: Listar produtos
test_endpoint "GET" "/produtos?limit=5" "" "Listar produtos existentes" || true

# Teste 2: Criar produto
PRODUTO_DATA='{
  "nome": "Eletrônico Teste 123",
  "ncmCode": "8471301000",
  "ncmClassificacao": "Computadores",
  "unidadeMedida": "kg",
  "peso": "5.5",
  "descricao": "Notebook para teste",
  "flags": ["fragil", "alto_valor"]
}'

echo ""
echo -e "\n${YELLOW}=== Criando Produto ===${NC}"
curl -s -X POST "$API_URL/produtos" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$PRODUTO_DATA" | jq . | head -30

echo ""
echo -e "\n${YELLOW}=== FASE 3: Teste de Destinatários ===${NC}\n"

# Teste 3: Listar destinatários
test_endpoint "GET" "/destinatarios?limit=5" "" "Listar destinatários" || true

# Teste 4: Criar destinatário
DESTINATARIO_DATA='{
  "nomeCompleto": "João Silva Teste",
  "cep": "01310100",
  "logradouro": "Avenida Paulista",
  "numero": "1000",
  "complemento": "Apt 1000",
  "bairro": "Bela Vista",
  "cidade": "São Paulo",
  "estado": "SP",
  "telefone": "(11) 99999-8888",
  "email": "teste@example.com"
}'

echo ""
echo -e "\n${YELLOW}=== Criando Destinatário ===${NC}"
curl -s -X POST "$API_URL/destinatarios" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$DESTINATARIO_DATA" | jq . | head -30

echo ""
echo -e "\n${YELLOW}=== FASE 4: Teste de Cotação ===${NC}\n"

# Teste 5: Criar cotação
COTACAO_DATA='{
  "tipoFrete": "CIF",
  "produtos": [
    {
      "produtoId": "id_produto_aqui",
      "quantidade": 2,
      "peso": 11,
      "valor": 1000
    }
  ],
  "destinatarioId": "id_destinatario_aqui",
  "enderecoCoordenadas": {
    "lat": -23.5505,
    "lng": -46.6333
  },
  "servicosAdicionais": {
    "ehFragil": true,
    "precisaSeguro": false
  },
  "tipoVeiculo": "caminhao"
}'

echo -e "\n${YELLOW}=== Criando Cotação ===${NC}"
echo "❗ Nota: Esta é uma simulação. IDs reais seriam necessários."
echo ""

# Teste 6: Listar cotações
test_endpoint "GET" "/cotacoes?status=aberta&limit=10" "" "Listar cotações abertas" || true

echo ""
echo -e "\n${GREEN}✅ Testes de API concluídos!${NC}"
echo "📝 Detalhes em: $LOG_FILE"
echo ""
echo "Próximos passos:"
echo "1. Obter ID de produto criado"
echo "2. Obter ID de destinatário criado"
echo "3. Usar em teste de cotação"
echo "4. Testar como transportador"
echo "5. Testar como embarcador"
