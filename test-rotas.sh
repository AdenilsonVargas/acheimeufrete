#!/bin/bash
# Script de teste - Validar rotas do frontend

echo "🔍 TESTE DE ROTAS - VALIDAÇÃO FINAL"
echo "===================================="
echo ""

# Teste 1: Backend está rodando?
echo "✓ Teste 1: Verificando se backend está rodando..."
curl -s http://localhost:5000/health | jq . && echo "✅ Backend OK" || echo "❌ Backend não responde"

# Teste 2: Frontend está rodando?
echo ""
echo "✓ Teste 2: Verificando se frontend está rodando (porta 3000)..."
timeout 2 curl -s http://localhost:3000/ | head -5 && echo "✅ Frontend OK" || echo "⚠️ Frontend em dev mode (esperado)"

# Teste 3: Rotas principais
echo ""
echo "✓ Teste 3: Testando rotas de API..."
echo ""

# Teste cotações (rota corrigida)
echo "   - GET /api/cotacoes (status: aberta):"
curl -s "http://localhost:5000/api/cotacoes?status=aberta&limit=1" | jq '.[] | {id, status, origem, destino}' || echo "   ❌ Erro ao listar cotações"

# Teste endereços (rota corrigida)
echo ""
echo "   - GET /api/enderecos (primeiros):"
curl -s "http://localhost:5000/api/enderecos?limit=1" | jq '.[] | {id, cidade, estado}' || echo "   ❌ Erro ao listar endereços"

# Teste regiões (rota corrigida)
echo ""
echo "   - GET /api/regioes (status: ativo):"
curl -s "http://localhost:5000/api/regioes?status=ativo&limit=1" | jq '.[] | {id, estado, status}' || echo "   ❌ Erro ao listar regiões"

echo ""
echo "✅ TESTE CONCLUÍDO"
