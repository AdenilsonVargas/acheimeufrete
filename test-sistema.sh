#!/bin/bash

# 🧪 Script de testes para validar sistema de cotações com favoritas

BASE_URL="http://localhost:5000/api"
FRONTEND_URL="http://localhost:5173"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  🧪 Testes - Sistema de Cotações com Favoritas               ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
PASSED=0
FAILED=0

# Função para testar endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo -e "${BLUE}→${NC} $description"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -X GET "$BASE_URL$endpoint" \
            -H "Authorization: Bearer test_token" \
            -H "Content-Type: application/json")
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -X POST "$BASE_URL$endpoint" \
            -H "Authorization: Bearer test_token" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    echo "  Status: $response" | head -c 80
    echo "..."
}

echo -e "${YELLOW}1. Verificações de Estrutura${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. Verificar se backend está rodando
echo -e "${BLUE}→${NC} Backend rodando na porta 5000"
if curl -s http://localhost:5000/health >/dev/null 2>&1 || curl -s http://localhost:5000/api/auth/me >/dev/null 2>&1; then
    echo "  ✓ Backend está respondendo"
    ((PASSED++))
else
    echo "  ✗ Backend não responde"
    ((FAILED++))
fi

# 2. Verificar se frontend está rodando
echo -e "${BLUE}→${NC} Frontend rodando na porta 5173"
if curl -s http://localhost:5173 >/dev/null 2>&1; then
    echo "  ✓ Frontend está disponível"
    ((PASSED++))
else
    echo "  ✗ Frontend não responde"
    ((FAILED++))
fi

# 3. Verificar arquivos críticos
echo ""
echo -e "${YELLOW}2. Verificações de Arquivos${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

files_to_check=(
    "backend/src/controllers/cotacaoFavoritaController.js"
    "backend/src/routes/cotacaoFavoritaRoutes.js"
    "src/api/favoritas.js"
    "src/pages/DetalheCotacao.jsx"
    "src/pages/Cotacoes.jsx"
)

for file in "${files_to_check[@]}"; do
    if [ -f "/workspaces/acheimeufrete/$file" ]; then
        echo -e "  ${GREEN}✓${NC} $file"
        ((PASSED++))
    else
        echo -e "  ${RED}✗${NC} $file não encontrado"
        ((FAILED++))
    fi
done

# 4. Verificar schema Prisma
echo ""
echo -e "${YELLOW}3. Verificações de Banco de Dados${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if grep -q "model CotacaoFavorita" /workspaces/acheimeufrete/backend/prisma/schema.prisma; then
    echo -e "  ${GREEN}✓${NC} Modelo CotacaoFavorita definido"
    ((PASSED++))
else
    echo -e "  ${RED}✗${NC} Modelo CotacaoFavorita não encontrado"
    ((FAILED++))
fi

if grep -q "cotacoesFavoritas" /workspaces/acheimeufrete/backend/prisma/schema.prisma; then
    echo -e "  ${GREEN}✓${NC} Relações de favorita configuradas"
    ((PASSED++))
else
    echo -e "  ${RED}✗${NC} Relações não encontradas"
    ((FAILED++))
fi

# 5. Verificar imports e exports
echo ""
echo -e "${YELLOW}4. Verificações de Código${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if grep -q "cotacaoFavoritaRoutes" /workspaces/acheimeufrete/backend/src/server.js; then
    echo -e "  ${GREEN}✓${NC} Rotas de favorita registradas no server"
    ((PASSED++))
else
    echo -e "  ${RED}✗${NC} Rotas não registradas"
    ((FAILED++))
fi

if grep -q "handleFavoritarCotacao" /workspaces/acheimeufrete/src/pages/DetalheCotacao.jsx; then
    echo -e "  ${GREEN}✓${NC} Função de favorita em DetalheCotacao"
    ((PASSED++))
else
    echo -e "  ${RED}✗${NC} Função não encontrada"
    ((FAILED++))
fi

if grep -q "listarFavoritas" /workspaces/acheimeufrete/src/api/favoritas.js; then
    echo -e "  ${GREEN}✓${NC} API de favoritas exportadas"
    ((PASSED++))
else
    echo -e "  ${RED}✗${NC} APIs não encontradas"
    ((FAILED++))
fi

# Resultado final
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                      📊 RESULTADO DOS TESTES                   ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${GREEN}✓ Testes passados: $PASSED${NC}"
echo -e "${RED}✗ Testes falhados: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║        ✨ TODOS OS TESTES PASSARAM COM SUCESSO! ✨            ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "${RED}Alguns testes falharam. Verifique os erros acima.${NC}"
    exit 1
fi
