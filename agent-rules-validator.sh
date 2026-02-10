#!/bin/bash

# ================================================
# AGENT RULES VALIDATOR
# Validates code against AGENT_OPERATIONAL_GUIDEBOOK rules
# Run before commit: bash agent-rules-validator.sh
# ================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🔍 VALIDANDO CÓDIGO CONTRA REGRAS DO AGENTE${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""

# ================================================
# RULE 1: Header not imported in pages/
# ================================================

echo -e "${BLUE}Rule 1:${NC} Verificando importação de Header em pages/"

HEADER_IMPORTS=$(find src/pages -name "*.jsx" -exec grep -l "import.*Header" {} \; 2>/dev/null | wc -l)

if [ "$HEADER_IMPORTS" -gt 0 ]; then
    echo -e "${RED}❌ FALHOU: Header importado em pages/${NC}"
    find src/pages -name "*.jsx" -exec grep -n "import.*Header" {} + | head -5
    ERRORS=$((ERRORS+1))
else
    echo -e "${GREEN}✅ OK: Header não importado em pages/${NC}"
fi

echo ""

# ================================================
# RULE 2: Hardcoded userType
# ================================================

echo -e "${BLUE}Rule 2:${NC} Verificando userType hardcoded"

HARDCODED=$(find src -name "*.jsx" -o -name "*.js" | xargs grep -h 'userType="' 2>/dev/null | grep -v "user?.userType" | wc -l || true)

if [ "$HARDCODED" -gt 0 ]; then
    echo -e "${RED}❌ FALHOU: userType hardcoded encontrado${NC}"
    find src -name "*.jsx" -o -name "*.js" | xargs grep -n 'userType="' 2>/dev/null | grep -v "user?.userType" | head -5
    ERRORS=$((ERRORS+1))
else
    echo -e "${GREEN}✅ OK: Nenhum userType hardcoded${NC}"
fi

echo ""

# ================================================
# RULE 3: localStorage.clear() in wrong place
# ================================================

echo -e "${BLUE}Rule 3:${NC} Verificando localStorage.clear() perigoso"

if [ -f "src/hooks/useAuthStore.js" ]; then
    # Check if there's a localStorage.clear() outside of logout function
    DANGEROUS=$(grep -n "localStorage.clear()" src/hooks/useAuthStore.js 2>/dev/null | grep -v "logout" | wc -l || true)
    
    if [ "$DANGEROUS" -gt 0 ]; then
        echo -e "${RED}❌ FALHOU: localStorage.clear() fora do logout${NC}"
        grep -n "localStorage.clear()" src/hooks/useAuthStore.js | grep -v "logout"
        echo -e "${YELLOW}⚠️  localStorage.clear() DEVE estar APENAS na função logout()${NC}"
        ERRORS=$((ERRORS+1))
    else
        echo -e "${GREEN}✅ OK: localStorage.clear() apenas em logout${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  useAuthStore.js não encontrado${NC}"
fi

echo ""

# ================================================
# RULE 4: user?.role (wrong field name)
# ================================================

echo -e "${BLUE}Rule 4:${NC} Verificando campo user?.role (deve ser userType)"

WRONG_FIELD=$(find src -name "*.jsx" -o -name "*.js" | xargs grep -h "user?.role" 2>/dev/null | wc -l || true)

if [ "$WRONG_FIELD" -gt 0 ]; then
    echo -e "${RED}❌ FALHOU: user?.role encontrado (campo correto é userType)${NC}"
    find src -name "*.jsx" -o -name "*.js" | xargs grep -n "user?.role" 2>/dev/null | head -5
    ERRORS=$((ERRORS+1))
else
    echo -e "${GREEN}✅ OK: Usando user?.userType corretamente${NC}"
fi

echo ""

# ================================================
# RULE 5: Sidebar positioning
# ================================================

echo -e "${BLUE}Rule 5:${NC} Verificando sidebar positioning (deve ser top-20)"

if [ -f "src/components/DashboardLayout.jsx" ]; then
    # Check for correct positioning
    WRONG_POS=$(grep -n "top-0" src/components/DashboardLayout.jsx 2>/dev/null | grep -i sidebar | wc -l || true)
    
    if [ "$WRONG_POS" -gt 0 ]; then
        echo -e "${RED}❌ FALHOU: Sidebar em top-0 (deve estar em top-20)${NC}"
        grep -n "top-0" src/components/DashboardLayout.jsx | head -3
        ERRORS=$((ERRORS+1))
    else
        CORRECT=$(grep "top-20" src/components/DashboardLayout.jsx | wc -l || true)
        if [ "$CORRECT" -gt 0 ]; then
            echo -e "${GREEN}✅ OK: Sidebar corretamente posicionado em top-20${NC}"
        else
            echo -e "${YELLOW}⚠️  Verificar positioning manualmente${NC}"
        fi
    fi
else
    echo -e "${YELLOW}⚠️  DashboardLayout.jsx não encontrado${NC}"
fi

echo ""

# ================================================
# RULE 6: Dark mode colors (sample check)
# ================================================

echo -e "${BLUE}Rule 6:${NC} Verificando dark mode (amostra de color classes)"

# Just sample check - look for common missing patterns
MISSING_DARK=$(find src/pages -name "*.jsx" 2>/dev/null | xargs grep -h "text-white[^:]" 2>/dev/null | wc -l || true)

if [ "$MISSING_DARK" -gt 3 ]; then
    echo -e "${YELLOW}⚠️  AVISO: Alguns colors podem estar sem dark: prefix${NC}"
    echo "   Exemplo:"
    find src/pages -name "*.jsx" 2>/dev/null | xargs grep -n "text-white[^:]" 2>/dev/null | head -3
    WARNINGS=$((WARNINGS+1))
else
    echo -e "${GREEN}✅ OK: Dark mode colors parecem corretos${NC}"
fi

echo ""

# ================================================
# RULE 7: useAuthStore.js has checkAuth()
# ================================================

echo -e "${BLUE}Rule 7:${NC} Verificando useAuthStore.js tem checkAuth()"

if [ -f "src/hooks/useAuthStore.js" ]; then
    CHECKAUTH=$(grep -c "checkAuth:" src/hooks/useAuthStore.js 2>/dev/null || true)
    
    if [ "$CHECKAUTH" -gt 0 ]; then
        echo -e "${GREEN}✅ OK: checkAuth() implementado${NC}"
    else
        echo -e "${RED}❌ FALHOU: checkAuth() não encontrado${NC}"
        ERRORS=$((ERRORS+1))
    fi
else
    echo -e "${RED}❌ FALHOU: useAuthStore.js não encontrado${NC}"
    ERRORS=$((ERRORS+1))
fi

echo ""

# ================================================
# RULE 8: Header.jsx exists and has 3 scenarios
# ================================================

echo -e "${BLUE}Rule 8:${NC} Verificando Header.jsx implementação"

if [ -f "src/components/Header.jsx" ]; then
    echo -e "${GREEN}✅ OK: Header.jsx existe${NC}"
else
    echo -e "${RED}❌ FALHOU: Header.jsx não encontrado${NC}"
    ERRORS=$((ERRORS+1))
fi

echo ""

# ================================================
# RULE 9: App.jsx renders Header only once
# ================================================

echo -e "${BLUE}Rule 9:${NC} Verificando App.jsx renderiza Header ONCE"

if [ -f "src/App.jsx" ]; then
    HEADER_COUNT=$(grep -c "<Header" src/App.jsx 2>/dev/null || true)
    
    if [ "$HEADER_COUNT" -eq 1 ]; then
        echo -e "${GREEN}✅ OK: Header renderizado apenas ONCE em App.jsx${NC}"
    else
        echo -e "${YELLOW}⚠️  AVISO: Header renderizado $HEADER_COUNT vezes${NC}"
        grep -n "<Header" src/App.jsx
        WARNINGS=$((WARNINGS+1))
    fi
else
    echo -e "${RED}❌ FALHOU: App.jsx não encontrado${NC}"
    ERRORS=$((ERRORS+1))
fi

echo ""

# ================================================
# RULE 10: Build passes
# ================================================

echo -e "${BLUE}Rule 10:${NC} Verificando TypeScript build"

echo "          Rodando: npm run build..."

if npm run build > /tmp/build.log 2>&1; then
    echo -e "${GREEN}✅ OK: Build passou${NC}"
else
    echo -e "${RED}❌ FALHOU: Build tem erros${NC}"
    tail -20 /tmp/build.log
    ERRORS=$((ERRORS+1))
fi

echo ""

# ================================================
# SUMMARY
# ================================================

echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo "📊 RESUMO DA VALIDAÇÃO"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ TODAS AS VALIDAÇÕES PASSARAM!${NC}"
    echo ""
    echo "Seu código está pronto para commit:"
    echo "  git add ."
    echo "  git commit -m 'mensagem do commit'"
    echo ""
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  VALIDAÇÃO COM $WARNINGS AVISOS${NC}"
    echo ""
    echo "Considere revisar os avisos, mas pode commitar se desejar."
    echo ""
    exit 0
else
    echo -e "${RED}❌ VALIDAÇÃO FALHOU COM $ERRORS ERRO(S)${NC}"
    echo ""
    echo "AÇÕES NECESSÁRIAS:"
    echo "1. Leia AGENT_OPERATIONAL_GUIDEBOOK.md Section 1 (FORBIDDEN)"
    echo "2. Corrija os erros acima"
    echo "3. Execute novamente: bash agent-rules-validator.sh"
    echo ""
    echo "Você NÃO pode fazer commit enquanto houver erros!"
    echo ""
    exit 1
fi
