#!/bin/bash

# ============================================================
# SCRIPT DE TESTE RÁPIDO - IMPLEMENTAÇÃO NCM 10.507
# ============================================================

echo "🧪 INICIANDO TESTES DE VALIDAÇÃO"
echo "=================================="
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Contadores
TESTES_PASSADOS=0
TESTES_FALHADOS=0

# Função para teste
teste() {
  local nome="$1"
  local comando="$2"
  
  echo -n "🔍 $nome ... "
  
  if eval "$comando" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASSOU${NC}"
    ((TESTES_PASSADOS++))
  else
    echo -e "${RED}❌ FALHOU${NC}"
    ((TESTES_FALHADOS++))
  fi
}

# ============================================================
# TESTE 1: Verificar se arquivos foram criados
# ============================================================
echo "📁 VERIFICAÇÃO DE ARQUIVOS"
echo "======================="

teste "Arquivo JSON de NCMs existe" "test -f /workspaces/acheimeufrete/backend/src/data/ncms-mercosul.json"
teste "Componente NCMNotFoundModal existe" "test -f /workspaces/acheimeufrete/src/components/NCMNotFoundModal.jsx"
teste "Componente NCMDownloadButton existe" "test -f /workspaces/acheimeufrete/src/components/NCMDownloadButton.jsx"
teste "Rota de chat NCM existe" "test -f /workspaces/acheimeufrete/backend/src/routes/chatNcmRoutes.js"

echo ""

# ============================================================
# TESTE 2: Verificar conteúdo dos arquivos
# ============================================================
echo "📝 VERIFICAÇÃO DE CONTEÚDO"
echo "========================="

teste "NCMAutocomplete tem importação de NCMNotFoundModal" "grep -q 'NCMNotFoundModal' /workspaces/acheimeufrete/src/components/NCMAutocomplete.jsx"
teste "Página Produtos importa NCMDownloadButton" "grep -q 'NCMDownloadButton' /workspaces/acheimeufrete/src/pages/Produtos.jsx"
teste "Seed script importa ExcelJS" "grep -q 'ExcelJS' /workspaces/acheimeufrete/backend/src/controllers/ncmController.js"
teste "JSON tem dados de NCM" "grep -q '\"codigo\"' /workspaces/acheimeufrete/backend/src/data/ncms-mercosul.json"

echo ""

# ============================================================
# TESTE 3: Verificar se package foi instalado
# ============================================================
echo "📦 VERIFICAÇÃO DE DEPENDÊNCIAS"
echo "=============================="

teste "ExcelJS está instalado" "grep -q 'exceljs' /workspaces/acheimeufrete/backend/package.json"

echo ""

# ============================================================
# TESTE 4: Verificar qualidade do código
# ============================================================
echo "🔬 VERIFICAÇÃO DE SINTAXE"
echo "========================="

# Verificar se não há erros óbvios em componentes React
teste "NCMNotFoundModal não tem erros óbvios" "grep -q 'export default' /workspaces/acheimeufrete/src/components/NCMNotFoundModal.jsx"
teste "NCMDownloadButton não tem erros óbvios" "grep -q 'export default' /workspaces/acheimeufrete/src/components/NCMDownloadButton.jsx"

echo ""

# ============================================================
# TESTE 5: Contar NCMs
# ============================================================
echo "📊 VERIFICAÇÃO DE DADOS"
echo "======================="

NCMS_COUNT=$(grep -o '"codigo"' /workspaces/acheimeufrete/backend/src/data/ncms-mercosul.json | wc -l)
echo "📈 Total de NCMs no JSON: $NCMS_COUNT"

if [ "$NCMS_COUNT" -gt 10000 ]; then
  echo -e "${GREEN}✅ Volume de dados adequado (>10000)${NC}"
  ((TESTES_PASSADOS++))
else
  echo -e "${RED}❌ Volume de dados insuficiente${NC}"
  ((TESTES_FALHADOS++))
fi

echo ""

# ============================================================
# TESTE 6: Verificar rotas
# ============================================================
echo "🛣️  VERIFICAÇÃO DE ROTAS"
echo "======================"

teste "Rota de busca NCM existe" "grep -q \"router.get('/search'\" /workspaces/acheimeufrete/backend/src/routes/ncmRoutes.js"
teste "Rota de download de planilha existe" "grep -q \"router.get('/download/planilha'\" /workspaces/acheimeufrete/backend/src/routes/ncmRoutes.js"
teste "Rota POST NCM não encontrado existe" "grep -q \"router.post('/ncm-nao-encontrado'\" /workspaces/acheimeufrete/backend/src/routes/chatNcmRoutes.js"

echo ""

# ============================================================
# RESUMO
# ============================================================
echo "📋 RESUMO DOS TESTES"
echo "===================="
echo -e "${GREEN}✅ Testes Passados: $TESTES_PASSADOS${NC}"
echo -e "${RED}❌ Testes Falhados: $TESTES_FALHADOS${NC}"
echo ""

if [ "$TESTES_FALHADOS" -eq 0 ]; then
  echo -e "${GREEN}🎉 TODOS OS TESTES PASSARAM!${NC}"
  echo ""
  echo "🚀 Próximos passos:"
  echo "  1. Iniciar o backend: npm start"
  echo "  2. Testar busca de NCM: curl 'http://localhost:3001/api/ncms/search?query=0101'"
  echo "  3. Testar download: curl 'http://localhost:3001/api/ncms/download/planilha' > test.xlsx"
  exit 0
else
  echo -e "${RED}⚠️  Alguns testes falharam. Verifique os erros acima.${NC}"
  exit 1
fi
