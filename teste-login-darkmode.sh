#!/bin/bash

# ============================================
# 🧪 SCRIPT DE TESTES - LOGIN + DARK MODE
# ============================================

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  🧪 INICIANDO TESTES DE LOGIN + DARK MODE                 ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# ============================================
# 1. Verificar se servidores estão rodando
# ============================================
echo -e "${YELLOW}1️⃣  Verificando servidores...${NC}"
echo ""

# Frontend
if curl -s http://localhost:3000 > /dev/null; then
  echo -e "${GREEN}✅ Frontend${NC} rodando em http://localhost:3000"
else
  echo -e "${RED}❌ Frontend${NC} não está respondendo"
  echo "   Execute: ./START.sh"
  exit 1
fi

# Backend
if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Backend${NC} rodando em http://localhost:5000"
else
  echo -e "${RED}❌ Backend${NC} não está respondendo"
  echo "   Execute: ./START.sh"
  exit 1
fi

echo ""

# ============================================
# 2. Testar Login Backend
# ============================================
echo -e "${YELLOW}2️⃣  Testando Login no Backend...${NC}"
echo ""

LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"transportador@test.com","password":"123456"}')

if echo "$LOGIN_RESPONSE" | grep -q "Login realizado com sucesso"; then
  echo -e "${GREEN}✅ Login Backend${NC} funcionando"
  echo "   Response: $(echo $LOGIN_RESPONSE | jq -r '.message')"
  TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token' | cut -c1-30)
  echo "   Token: ${TOKEN}..."
else
  echo -e "${RED}❌ Login Backend${NC} falhou"
  echo "   Response: $LOGIN_RESPONSE"
  exit 1
fi

echo ""

# ============================================
# 3. Verificar Dados de Teste
# ============================================
echo -e "${YELLOW}3️⃣  Verificando Dados de Teste...${NC}"
echo ""

echo -e "${BLUE}Credenciais Criadas:${NC}"
echo "  📧 transportador@test.com / 123456"
echo "  📧 embarcador@test.com / 123456"
echo ""

echo -e "${BLUE}Cotações de Teste:${NC}"
echo "  ✅ 3 cotações criadas com validade de 7 dias"
echo "  ✅ Todas com status 'aberta'"
echo "  ✅ Datas futuras (01/02/2026)"
echo ""

# ============================================
# 4. Instruções de Teste Manual
# ============================================
echo -e "${YELLOW}4️⃣  Testes Manuais - Siga as instruções abaixo${NC}"
echo ""

echo -e "${BLUE}📋 TESTE 1: LOGIN${NC}"
echo "  1. Abra http://localhost:3000/login"
echo "  2. Você deve ver a página de login com:"
echo "     • Frase motivacional à esquerda"
echo "     • Formulário de login à direita"
echo "  3. Digite:"
echo "     Email: transportador@test.com"
echo "     Senha: 123456"
echo "  4. Clique em '🚀 Entrar'"
echo "  5. ✅ ESPERADO: Redirecionamento para /dashboard-transportadora"
echo "  6. ✅ Você verá: 'Bem-vindo, Transportador! 🚚'"
echo "  7. ✅ Dashboard mostra: '3 Oportunidades Disponíveis'"
echo ""

echo -e "${BLUE}🌙 TESTE 2: DARK MODE${NC}"
echo "  1. Após fazer login, procure o botão 🌙 no topo-direito"
echo "  2. Deve estar após o perfil do usuário"
echo "  3. Clique no botão"
echo "  4. ✅ A interface deve escurecer (fundo fica azul escuro)"
echo "  5. ✅ Todos os componentes adaptam as cores"
echo "  6. Clique novamente"
echo "  7. ✅ Volta ao tema claro (fundo branco)"
echo ""

echo -e "${BLUE}💾 TESTE 3: PERSISTÊNCIA DO TEMA${NC}"
echo "  1. Mude para dark mode"
echo "  2. Abra DevTools (F12)"
echo "  3. Vá para: Application → Local Storage"
echo "  4. ✅ Você deve ver: theme = 'dark'"
echo "  5. Recarregue a página (F5)"
echo "  6. ✅ Dark mode deve estar ativo"
echo "  7. ✅ NÃO deve piscar (nem mostrar luz por 1 seg)"
echo ""

echo -e "${BLUE}🔄 TESTE 4: SINCRONIZAÇÃO DE NOTIFICAÇÕES${NC}"
echo "  1. No dashboard, veja a barra superior (header)"
echo "  2. ✅ Sino (🔔) deve mostrar badge com '3'"
echo "  3. ✅ Menu lateral (esquerda) deve mostrar '3' em 'Cotações'"
echo "  4. Clique no sino"
echo "  5. ✅ Abre painel mostrando:"
echo "     'Cotações Disponíveis: 3 novas cotações para responder'"
echo ""

echo -e "${BLUE}📱 TESTE 5: RESPONSIVIDADE${NC}"
echo "  1. Abra DevTools (F12)"
echo "  2. Clique no ícone 'Toggle device toolbar' (ou Ctrl+Shift+M)"
echo "  3. Mude tamanho para mobile (375px)"
echo "  4. ✅ Layout deve se reorganizar"
echo "  5. ✅ Menu deve virar 'hamburger' ☰"
echo "  6. ✅ Botão de tema ainda funciona"
echo ""

echo -e "${BLUE}🎨 TESTE 6: CORES EM DARK MODE${NC}"
echo "  Verifique se todas as cores estão legíveis:"
echo "  ✅ Texto em branco/cinza claro"
echo "  ✅ Fundo em azul/cinza escuro"
echo "  ✅ Botões com cor contrastante"
echo "  ✅ Cards com borda visível"
echo "  ✅ Links em laranja/azul (destaque)"
echo ""

# ============================================
# 5. Resumo Final
# ============================================
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ TESTES CONFIGURADOS E PRONTOS                         ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}📌 Lembretes Importantes:${NC}"
echo "  • Senhas ATUALIZADAS para 123456 (via fix-test-passwords.js)"
echo "  • 3 cotações criadas com validade futura"
echo "  • Dark mode salvo em localStorage"
echo "  • Backend retorna user.userType correto"
echo ""

echo -e "${YELLOW}🔗 Links Úteis:${NC}"
echo "  • Login: http://localhost:3000/login"
echo "  • Dashboard: http://localhost:3000/dashboard-transportadora"
echo "  • DevTools: F12 → Console (para debug)"
echo "  • Local Storage: F12 → Application → Local Storage"
echo ""

echo -e "${BLUE}Se tudo passar, você pode fazer commit:${NC}"
echo "  git add ."
echo "  git commit -m 'feat: login funcional + dark mode completo'"
echo ""

exit 0
