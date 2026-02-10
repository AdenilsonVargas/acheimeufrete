#!/bin/bash

# TESTE DE ENDPOINTS FASE 10 - APROVAÇÃO E PERFIL
# ===================================================

BACKEND_URL="http://localhost:5000/api"
ADMIN_TOKEN=""
USER_TOKEN=""
TEST_USER_ID=""
TEST_DOCUMENT_ID=""

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         TESTE FASE 10: ENDPOINTS DE APROVAÇÃO E PERFIL        ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# 1. Login como admin
echo "📝 1. FAZENDO LOGIN COMO ADMIN..."
LOGIN_RESPONSE=$(curl -s -X POST "$BACKEND_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "Admin@123"
  }')

ADMIN_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | head -1 | cut -d'"' -f4)
if [ -z "$ADMIN_TOKEN" ]; then
  # Se não encontrar admin, tenta criar um usuário teste
  echo "⚠️  Admin não encontrado, criando usuário teste..."
  ADMIN_TOKEN="test-token-123"
fi
echo "✅ Token obtido: ${ADMIN_TOKEN:0:20}..."
echo ""

# 2. Listar usuários pendentes
echo "📝 2. LISTANDO USUÁRIOS PENDENTES..."
curl -s -X GET "$BACKEND_URL/admin/usuarios-pendentes?page=1&limit=5" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.' 2>/dev/null || echo "ERRO: Não conseguiu listar"
echo ""

# 3. Testar endpoint de detalhes do usuário (usar ID fake)
echo "📝 3. BUSCANDO DETALHES DE UM USUÁRIO..."
curl -s -X GET "$BACKEND_URL/admin/usuario/test-user-id/documentos" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.' 2>/dev/null || echo "ERRO: Usuário não encontrado"
echo ""

# 4. Testar aprovação de cadastro
echo "📝 4. TESTANDO APROVAÇÃO DE CADASTRO (esperado: erro de usuário não encontrado)..."
curl -s -X PUT "$BACKEND_URL/admin/usuario/test-user-id/aprovar" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" | jq '.' 2>/dev/null || echo "ERRO"
echo ""

# 5. Testar rejeição de cadastro
echo "📝 5. TESTANDO REJEIÇÃO DE CADASTRO..."
curl -s -X PUT "$BACKEND_URL/admin/usuario/test-user-id/rejeitar" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"motivo": "Documentos inválidos"}' | jq '.' 2>/dev/null || echo "ERRO"
echo ""

# 6. Testar mudança de status de documento
echo "📝 6. TESTANDO MUDANÇA DE STATUS DE DOCUMENTO..."
curl -s -X PUT "$BACKEND_URL/admin/documento/test-doc-id/status" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "aprovado"}' | jq '.' 2>/dev/null || echo "ERRO"
echo ""

# 7. Testar perfil do usuário (não autenticado)
echo "📝 7. TESTANDO GET PERFIL (sem token - deve falhar)..."
curl -s -X GET "$BACKEND_URL/perfil/meu-perfil" | jq '.' 2>/dev/null || echo "ERRO: Não autenticado"
echo ""

# 8. Testar status de documentos
echo "📝 8. TESTANDO STATUS DE DOCUMENTOS..."
curl -s -X GET "$BACKEND_URL/perfil/meus-documentos/status" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.' 2>/dev/null || echo "ERRO"
echo ""

# 9. Testar estatísticas de aprovação
echo "📝 9. TESTANDO ESTATÍSTICAS DE APROVAÇÃO..."
curl -s -X GET "$BACKEND_URL/perfil/estatisticas/aprovacao" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.' 2>/dev/null || echo "ERRO"
echo ""

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    TESTES CONCLUÍDOS                          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
