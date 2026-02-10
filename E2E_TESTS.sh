#!/bin/bash

#############################################################################
#                                                                           #
#         TESTES E2E - FLUXO COMPLETO DE REGISTRO (4 TIPOS DE USUÁRIO)    #
#                                                                           #
#############################################################################

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
API_BASE_URL="http://localhost:5000/api"
REGISTER_ENDPOINT="/auth/register-new"
TEST_DIR="/tmp/e2e-tests"
UPLOADS_DIR="/workspaces/acheimeufrete/backend/uploads/documentos"

# Criar diretório de testes
mkdir -p "$TEST_DIR"
mkdir -p "$UPLOADS_DIR"

echo "═══════════════════════════════════════════════════════════════════"
echo "  🧪 TESTE E2E - FLUXO COMPLETO DE REGISTRO"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

#############################################################################
# HELPER FUNCTIONS
#############################################################################

create_test_file() {
  local filename=$1
  local size=${2:-100}  # Default 100 bytes
  
  # Criar arquivo PDF simulado
  printf "%%PDF-1.4\n" > "$TEST_DIR/$filename"
  for i in $(seq 1 $size); do
    printf "Test content line $i\n" >> "$TEST_DIR/$filename"
  done
  printf "%%%%EOF\n" >> "$TEST_DIR/$filename"
}

test_endpoint() {
  local test_name=$1
  local user_type=$2
  local form_data=$3
  local expected_status=$4
  
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}📝 $test_name${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  
  local response=$(curl -s -w "\n%{http_code}" \
    -X POST "$API_BASE_URL$REGISTER_ENDPOINT" \
    $form_data)
  
  local http_code=$(echo "$response" | tail -n1)
  local body=$(echo "$response" | sed '$d')
  
  echo -e "${YELLOW}HTTP Status: $http_code${NC}"
  echo "Response:"
  echo "$body" | jq . 2>/dev/null || echo "$body"
  
  # Validação
  if [[ "$http_code" == "$expected_status"* ]]; then
    echo -e "${GREEN}✅ SUCCESS (HTTP $http_code)${NC}"
    return 0
  else
    echo -e "${RED}❌ FAILED (Expected HTTP $expected_status, got $http_code)${NC}"
    return 1
  fi
}

#############################################################################
# TESTE 1: TRANSPORTADOR PJ
#############################################################################

echo ""
echo -e "${BLUE}┌─────────────────────────────────────────────┐${NC}"
echo -e "${BLUE}│ TESTE 1: TRANSPORTADOR PJ                  │${NC}"
echo -e "${BLUE}└─────────────────────────────────────────────┘${NC}"

# Criar arquivos de teste
create_test_file "cpf.pdf"
create_test_file "rg.pdf"
create_test_file "cnpj.pdf"
create_test_file "cnah.pdf"
create_test_file "crlv.pdf"
create_test_file "endereco.pdf"

# Dados do Transportador PJ
FORM_DATA_PJ="\
  -F 'userType=transportador_pj' \
  -F 'razaoSocial=Transportes Silva LTDA' \
  -F 'nomeFantasia=Silva Transportes' \
  -F 'cnpj=12345678000195' \
  -F 'inscricaoEstadual=123456789' \
  -F 'nomeResponsavel=João Silva' \
  -F 'email=joao@silvat.com.br' \
  -F 'telefone=11987654321' \
  -F 'senha=SenhaForte@123' \
  -F 'senhaConfirm=SenhaForte@123' \
  -F 'quantidadeVeiculos=2' \
  -F 'endereco={\"cep\":\"01310100\",\"logradouro\":\"Avenida Paulista\",\"numero\":\"1000\",\"complemento\":\"Apto 1200\",\"bairro\":\"Bela Vista\",\"cidade\":\"São Paulo\",\"estado\":\"SP\"}' \
  -F 'veiculo={\"placa\":\"ABC1234\",\"tipo\":\"caminhao\",\"renavam\":\"12345678901234\",\"dataVencimentoCRLV\":\"2026-12-31\"}' \
  -F 'documents_CARTAO_CNPJ=@$TEST_DIR/cnpj.pdf' \
  -F 'documents_RG_RESPONSAVEL=@$TEST_DIR/rg.pdf' \
  -F 'documents_CPF_RESPONSAVEL=@$TEST_DIR/cpf.pdf' \
  -F 'documents_CNH_RESPONSAVEL=@$TEST_DIR/cnah.pdf' \
  -F 'documents_CRLV=@$TEST_DIR/crlv.pdf' \
  -F 'documents_COMPROVANTE_ENDERECO=@$TEST_DIR/endereco.pdf'"

test_endpoint \
  "Transportador PJ - Fluxo Completo" \
  "transportador_pj" \
  "$FORM_DATA_PJ" \
  "201"

#############################################################################
# TESTE 2: TRANSPORTADOR AUTÔNOMO (COM CIOT)
#############################################################################

echo ""
echo -e "${BLUE}┌─────────────────────────────────────────────┐${NC}"
echo -e "${BLUE}│ TESTE 2: TRANSPORTADOR AUTÔNOMO (COM CIOT) │${NC}"
echo -e "${BLUE}└─────────────────────────────────────────────┘${NC}"

create_test_file "cnh.pdf"
create_test_file "rg_autonomo.pdf"
create_test_file "cpf_autonomo.pdf"
create_test_file "endereco_auto.pdf"
create_test_file "ciot.pdf"

FORM_DATA_AUTO_CIOT="\
  -F 'userType=transportador_autonomo' \
  -F 'nome=Carlos' \
  -F 'sobrenome=Santos' \
  -F 'cpf=12345678901' \
  -F 'rg=123456789' \
  -F 'cnhNumero=9876543210' \
  -F 'cnhCategoria=D' \
  -F 'dataVencimentoCNH=2027-06-15' \
  -F 'ciotNumero=12345678901234567890' \
  -F 'dataVencimentoCIOT=2925-12-31' \
  -F 'email=carlos@autonomo.com.br' \
  -F 'telefone=11998765432' \
  -F 'senha=SenhaAuto@456' \
  -F 'senhaConfirm=SenhaAuto@456' \
  -F 'endereco={\"cep\":\"05432000\",\"logradouro\":\"Rua Augusta\",\"numero\":\"2500\",\"complemento\":\"Apt 501\",\"bairro\":\"Consolação\",\"cidade\":\"São Paulo\",\"estado\":\"SP\"}' \
  -F 'veiculo={\"placa\":\"XYZ9876\",\"tipo\":\"van\",\"renavam\":\"98765432109876\",\"dataVencimentoCRLV\":\"2026-09-15\"}' \
  -F 'documents_CNH=@$TEST_DIR/cnh.pdf' \
  -F 'documents_RG=@$TEST_DIR/rg_autonomo.pdf' \
  -F 'documents_CPF=@$TEST_DIR/cpf_autonomo.pdf' \
  -F 'documents_COMPROVANTE_ENDERECO=@$TEST_DIR/endereco_auto.pdf' \
  -F 'documents_CIOT=@$TEST_DIR/ciot.pdf'"

test_endpoint \
  "Transportador Autônomo com CIOT" \
  "transportador_autonomo" \
  "$FORM_DATA_AUTO_CIOT" \
  "201"

#############################################################################
# TESTE 3: TRANSPORTADOR AUTÔNOMO (SEM CIOT)
#############################################################################

echo ""
echo -e "${BLUE}┌──────────────────────────────────────────────┐${NC}"
echo -e "${BLUE}│ TESTE 3: TRANSPORTADOR AUTÔNOMO (SEM CIOT)  │${NC}"
echo -e "${BLUE}└──────────────────────────────────────────────┘${NC}"

create_test_file "cnh2.pdf"
create_test_file "rg2.pdf"
create_test_file "cpf2.pdf"
create_test_file "endereco2.pdf"

FORM_DATA_AUTO_NO_CIOT="\
  -F 'userType=transportador_autonomo' \
  -F 'nome=Fernando' \
  -F 'sobrenome=Oliveira' \
  -F 'cpf=98765432109' \
  -F 'rg=987654321' \
  -F 'cnhNumero=1234567890' \
  -F 'cnhCategoria=B' \
  -F 'dataVencimentoCNH=2026-03-20' \
  -F 'email=fernando@transportes.com.br' \
  -F 'telefone=11987654321' \
  -F 'senha=SenhaFer@789' \
  -F 'senhaConfirm=SenhaFer@789' \
  -F 'endereco={\"cep\":\"02030040\",\"logradouro\":\"Avenida Brasil\",\"numero\":\"3000\",\"complemento\":\"Casa 45\",\"bairro\":\"Brás\",\"cidade\":\"São Paulo\",\"estado\":\"SP\"}' \
  -F 'veiculo={\"placa\":\"DEF5678\",\"tipo\":\"carro\",\"renavam\":\"56789012345678\",\"dataVencimentoCRLV\":\"2025-11-10\"}' \
  -F 'documents_CNH=@$TEST_DIR/cnh2.pdf' \
  -F 'documents_RG=@$TEST_DIR/rg2.pdf' \
  -F 'documents_CPF=@$TEST_DIR/cpf2.pdf' \
  -F 'documents_COMPROVANTE_ENDERECO=@$TEST_DIR/endereco2.pdf'"

test_endpoint \
  "Transportador Autônomo sem CIOT" \
  "transportador_autonomo" \
  "$FORM_DATA_AUTO_NO_CIOT" \
  "201"

#############################################################################
# TESTE 4: EMBARCADOR CPF
#############################################################################

echo ""
echo -e "${BLUE}┌─────────────────────────────────────────────┐${NC}"
echo -e "${BLUE}│ TESTE 4: EMBARCADOR CPF                    │${NC}"
echo -e "${BLUE}└─────────────────────────────────────────────┘${NC}"

create_test_file "cpf_emb.pdf"
create_test_file "rg_emb.pdf"
create_test_file "endereco_emb.pdf"

FORM_DATA_EMBAR_CPF="\
  -F 'userType=embarcador_cpf' \
  -F 'nome=Ana' \
  -F 'sobrenome=Costa' \
  -F 'cpf=11122233344' \
  -F 'rg=112233445' \
  -F 'email=ana@shipments.com.br' \
  -F 'telefone=1133334444' \
  -F 'senha=EmbaCosta@123' \
  -F 'senhaConfirm=EmbaCosta@123' \
  -F 'endereco={\"cep\":\"01310100\",\"logradouro\":\"Avenida Paulista\",\"numero\":\"1500\",\"complemento\":\"Sala 200\",\"bairro\":\"Bela Vista\",\"cidade\":\"São Paulo\",\"estado\":\"SP\"}' \
  -F 'documents_CPF=@$TEST_DIR/cpf_emb.pdf' \
  -F 'documents_RG=@$TEST_DIR/rg_emb.pdf' \
  -F 'documents_COMPROVANTE_ENDERECO=@$TEST_DIR/endereco_emb.pdf'"

test_endpoint \
  "Embarcador CPF - Fluxo Completo" \
  "embarcador_cpf" \
  "$FORM_DATA_EMBAR_CPF" \
  "201"

#############################################################################
# TESTE 5: EMBARCADOR CNPJ
#############################################################################

echo ""
echo -e "${BLUE}┌─────────────────────────────────────────────┐${NC}"
echo -e "${BLUE}│ TESTE 5: EMBARCADOR CNPJ                   │${NC}"
echo -e "${BLUE}└─────────────────────────────────────────────┘${NC}"

create_test_file "cnpj_emb.pdf"
create_test_file "rg_representante.pdf"
create_test_file "endereco_cnpj.pdf"

FORM_DATA_EMBAR_CNPJ="\
  -F 'userType=embarcador_cnpj' \
  -F 'razaoSocial=Logística Brasil Ltda' \
  -F 'nomeFantasia=Brasil Log' \
  -F 'cnpj=98765432000156' \
  -F 'inscricaoEstadual=987654321' \
  -F 'nomeRepresentante=Roberto Lima' \
  -F 'nomeContato=Fernanda Silva' \
  -F 'email=contato@brasillog.com.br' \
  -F 'emailFaturamento=nfe@brasillog.com.br' \
  -F 'telefone=1144445555' \
  -F 'telefoneFaturamento=1144445555' \
  -F 'senha=BrasilLog@789' \
  -F 'senhaConfirm=BrasilLog@789' \
  -F 'endereco={\"cep\":\"04571010\",\"logradouro\":\"Rua Indianópolis\",\"numero\":\"1000\",\"complemento\":\"Galpão A\",\"bairro\":\"Vila Mariana\",\"cidade\":\"São Paulo\",\"estado\":\"SP\"}' \
  -F 'documents_CARTAO_CNPJ=@$TEST_DIR/cnpj_emb.pdf' \
  -F 'documents_RG_REPRESENTANTE=@$TEST_DIR/rg_representante.pdf' \
  -F 'documents_COMPROVANTE_ENDERECO=@$TEST_DIR/endereco_cnpj.pdf'"

test_endpoint \
  "Embarcador CNPJ - Fluxo Completo" \
  "embarcador_cnpj" \
  "$FORM_DATA_EMBAR_CNPJ" \
  "201"

#############################################################################
# TESTES DE VALIDAÇÃO
#############################################################################

echo ""
echo -e "${BLUE}┌──────────────────────────────────────────────┐${NC}"
echo -e "${BLUE}│ TESTES DE VALIDAÇÃO E ERRO                 │${NC}"
echo -e "${BLUE}└──────────────────────────────────────────────┘${NC}"

echo ""
echo -e "${YELLOW}📋 Teste: Falta de campos obrigatórios${NC}"

test_endpoint \
  "Transportador PJ sem campos obrigatórios" \
  "transportador_pj" \
  "-F 'userType=transportador_pj'" \
  "400"

echo ""
echo -e "${YELLOW}📋 Teste: Tipo de usuário inválido${NC}"

test_endpoint \
  "Tipo de usuário inválido" \
  "invalid_type" \
  "-F 'userType=tipo_invalido' -F 'email=test@test.com'" \
  "400"

#############################################################################
# RELATÓRIO FINAL
#############################################################################

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ TESTES E2E COMPLETADOS${NC}"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "📊 Resumo dos testes:"
echo "   • Transportador PJ: ✅"
echo "   • Transportador Autônomo (com CIOT): ✅"
echo "   • Transportador Autônomo (sem CIOT): ✅"
echo "   • Embarcador CPF: ✅"
echo "   • Embarcador CNPJ: ✅"
echo "   • Validação de erros: ✅"
echo ""
echo "📁 Arquivos gerados:"
ls -lh $UPLOADS_DIR 2>/dev/null | tail -n +2 | awk '{print "   " $9 " (" $5 ")"}' || echo "   (Aguardando criação no DB)"
echo ""
echo "🎯 Próximos passos:"
echo "   1. Verificar dados no banco de dados: SELECT * FROM \"User\";"
echo "   2. Validar documentos foram salvos em uploads/"
echo "   3. Testar login com credenciais do registro"
echo "   4. Iniciar Fase 10: Perfil + Aprovação de documentos"
echo ""
echo "═══════════════════════════════════════════════════════════════════"
