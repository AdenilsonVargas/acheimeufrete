#!/bin/bash

# Script de testes para API AcheimeuFrete
# Use: bash test-api.sh

BASE_URL="http://localhost:5000/api"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}========== TESTES DA API ACHEIMEUFRETE ==========${NC}\n"

# 1. TESTE: Registrar Embarcador
echo -e "${YELLOW}1. Registrando embarcador...${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "embarcador@test.com",
    "nomeCompleto": "João da Silva",
    "razaoSocial": "JS Transportes LTDA",
    "cpf": "12345678901",
    "cnpj": "12345678901234",
    "telefone": "(11) 98765-4321",
    "userType": "embarcador",
    "cep": "01310-100",
    "rua": "Rua das Flores",
    "numero": "123",
    "complemento": "Apt 456",
    "bairro": "Centro",
    "cidade": "São Paulo",
    "estado": "SP",
    "password": "senha123",
    "confirmPassword": "senha123"
  }')

echo "$REGISTER_RESPONSE" | jq '.'
TOKEN_EMBARCADOR=$(echo "$REGISTER_RESPONSE" | jq -r '.token')
echo -e "${GREEN}Token: $TOKEN_EMBARCADOR${NC}\n"

# 2. TESTE: Registrar Transportador
echo -e "${YELLOW}2. Registrando transportador...${NC}"
REGISTER_TRANSP=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "transportador@test.com",
    "nomeCompleto": "Carlos Transporte",
    "razaoSocial": "CT Transportes LTDA",
    "cnpj": "98765432101234",
    "telefone": "(11) 91234-5678",
    "userType": "transportador",
    "cep": "20040020",
    "rua": "Av. Rio Branco",
    "numero": "456",
    "bairro": "Centro",
    "cidade": "Rio de Janeiro",
    "estado": "RJ",
    "password": "senha456",
    "confirmPassword": "senha456"
  }')

echo "$REGISTER_TRANSP" | jq '.'
TOKEN_TRANSPORTADOR=$(echo "$REGISTER_TRANSP" | jq -r '.token')
echo -e "${GREEN}Token: $TOKEN_TRANSPORTADOR${NC}\n"

# 3. TESTE: Obter dados do usuário autenticado
echo -e "${YELLOW}3. Obtendo dados do usuário autenticado...${NC}"
curl -s -X GET "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN_EMBARCADOR" | jq '.'
echo ""

# 4. TESTE: Criar endereço
echo -e "${YELLOW}4. Criando endereço...${NC}"
ENDERECO_RESPONSE=$(curl -s -X POST "$BASE_URL/enderecos" \
  -H "Authorization: Bearer $TOKEN_EMBARCADOR" \
  -H "Content-Type: application/json" \
  -d '{
    "cep": "01310-100",
    "rua": "Rua Nova",
    "numero": "789",
    "complemento": "Sala 101",
    "bairro": "Centro",
    "cidade": "São Paulo",
    "estado": "SP",
    "tipo": "comercial"
  }')

echo "$ENDERECO_RESPONSE" | jq '.'
echo ""

# 5. TESTE: Listar endereços
echo -e "${YELLOW}5. Listando endereços...${NC}"
curl -s -X GET "$BASE_URL/enderecos" \
  -H "Authorization: Bearer $TOKEN_EMBARCADOR" | jq '.'
echo ""

# 6. TESTE: Criar cotação (Embarcador)
echo -e "${YELLOW}6. Criando cotação...${NC}"
COTACAO_RESPONSE=$(curl -s -X POST "$BASE_URL/cotacoes" \
  -H "Authorization: Bearer $TOKEN_EMBARCADOR" \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Frete SP para RJ",
    "descricao": "Máquina de costura industrial",
    "cepColeta": "01310-100",
    "enderecoColeta": "Rua das Flores, 123",
    "dataColeta": "2024-02-10T10:00:00Z",
    "cepEntrega": "20040020",
    "enderecoEntrega": "Av. Rio Branco, 456",
    "dataEntregaPrevista": "2024-02-12T15:00:00Z",
    "peso": 50,
    "volume": 1,
    "descricaoConteudo": "Máquina de costura 220v"
  }')

echo "$COTACAO_RESPONSE" | jq '.'
COTACAO_ID=$(echo "$COTACAO_RESPONSE" | jq -r '.cotacao.id')
echo -e "${GREEN}Cotação ID: $COTACAO_ID${NC}\n"

# 7. TESTE: Listar cotações do embarcador
echo -e "${YELLOW}7. Listando cotações do embarcador...${NC}"
curl -s -X GET "$BASE_URL/cotacoes" \
  -H "Authorization: Bearer $TOKEN_EMBARCADOR" | jq '.'
echo ""

# 8. TESTE: Listar cotações disponíveis (para transportador)
echo -e "${YELLOW}8. Listando cotações disponíveis para transportador...${NC}"
curl -s -X GET "$BASE_URL/cotacoes/disponiveis" \
  -H "Authorization: Bearer $TOKEN_TRANSPORTADOR" | jq '.'
echo ""

# 9. TESTE: Transportador responde cotação
echo -e "${YELLOW}9. Transportador respondendo cotação...${NC}"
RESPOSTA_RESPONSE=$(curl -s -X POST "$BASE_URL/respostas" \
  -H "Authorization: Bearer $TOKEN_TRANSPORTADOR" \
  -H "Content-Type: application/json" \
  -d "{
    \"cotacaoId\": \"$COTACAO_ID\",
    \"valor\": 500.00,
    \"dataEntrega\": \"2024-02-12T15:00:00Z\",
    \"descricao\": \"Entrega com rastreamento\"
  }")

echo "$RESPOSTA_RESPONSE" | jq '.'
echo ""

# 10. TESTE: Listar respostas da cotação
echo -e "${YELLOW}10. Listando respostas da cotação...${NC}"
curl -s -X GET "$BASE_URL/cotacoes/$COTACAO_ID" \
  -H "Authorization: Bearer $TOKEN_EMBARCADOR" | jq '.'
echo ""

# 11. TESTE: Listar respostas do transportador
echo -e "${YELLOW}11. Listando respostas do transportador...${NC}"
curl -s -X GET "$BASE_URL/respostas/minhas-respostas" \
  -H "Authorization: Bearer $TOKEN_TRANSPORTADOR" | jq '.'
echo ""

# 12. TESTE: Atualizar cotação
echo -e "${YELLOW}12. Atualizando cotação...${NC}"
curl -s -X PUT "$BASE_URL/cotacoes/$COTACAO_ID" \
  -H "Authorization: Bearer $TOKEN_EMBARCADOR" \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Frete SP para RJ - URGENTE"
  }' | jq '.'
echo ""

echo -e "${GREEN}========== TESTES CONCLUÍDOS ==========${NC}"
