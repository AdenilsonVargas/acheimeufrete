#!/bin/bash

# ================================================
# AGENT INITIALIZATION SCRIPT
# Achei Meu Frete Development Environment
# MUST be run before any agent code changes
# ================================================

set -e

cat << "EOF"

╔════════════════════════════════════════════════════════════════╗
║                 🤖 AGENTE OPERACIONAL INICIANDO              ║
║            Achei Meu Frete Development Environment            ║
║                                                                ║
║  ⚠️  LEITURA OBRIGATÓRIA DO GUIDEBOOK ANTES DE COMEÇAR       ║
╚════════════════════════════════════════════════════════════════╝

EOF

# =================================================
# STEP 1: Verify critical files exist
# =================================================

echo "📋 PASSO 1: Verificando arquivos críticos..."
echo ""

CRITICAL_FILES=(
    "AGENT_OPERATIONAL_GUIDEBOOK.md"
    ".agent-config.json"
    "GUIA_BOAS_PRATICAS.md"
    "POLITICA_AUTENTICACAO.md"
    "src/App.jsx"
    "src/hooks/useAuthStore.js"
    "src/components/Header.jsx"
    "src/components/DashboardLayout.jsx"
    "package.json"
)

MISSING=0
for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        printf "  ✅ %-45s\n" "$file"
    else
        printf "  ❌ %-45s (MISSING!)\n" "$file"
        MISSING=$((MISSING+1))
    fi
done

if [ $MISSING -gt 0 ]; then
    echo ""
    echo "❌ $MISSING arquivo(s) crítico(s) não encontrado(s)!"
    echo "Não pode continuar sem todos os arquivos."
    exit 1
fi

# =================================================
# STEP 2: Display critical sections to read
# =================================================

echo ""
echo "📖 PASSO 2: SEÇÕES OBRIGATÓRIAS DO GUIDEBOOK"
echo ""

cat << "EOF"
  ┌─────────────────────────────────────────────────────────┐
  │ Section 1: FORBIDDEN OPERATIONS (Nunca fazer isso!)     │
  │ ├─ 12 operações que causam vulnerabilidades             │
  │ ├─ Exemplos de código ERRADO e POR QUÊ                 │
  │ └─ Impacto: Crash, segurança, perda de sessão          │
  │                                                          │
  │ Section 2: MANDATORY PATTERNS (Sempre fazer assim!)     │
  │ ├─ Como fazer autenticação corretamente                 │
  │ ├─ 3 scenarios do Header (código completo)             │
  │ ├─ DashboardLayout pattern (top-20 crítico)            │
  │ └─ Dark mode pattern (todos color classes)             │
  │                                                          │
  │ Section 3: ARCHITECTURE GUARANTEES (O que garantimos)  │
  │ ├─ Header renders ONCE, em App.jsx apenas              │
  │ ├─ Sidebar SEMPRE em top-20 (80px offset)             │
  │ ├─ Session SOBREVIVE F5 refresh                        │
  │ └─ UserType NUNCA muda sem logout                      │
  └─────────────────────────────────────────────────────────┘

EOF

echo "👉 LEIA ESTAS SEÇÕES COMPLETAMENTE ANTES DE CONTINUAR!"
echo ""

# =================================================
# STEP 3: Show test commands available
# =================================================

echo "🧪 PASSO 3: Comandos de teste disponíveis"
echo ""

cat << "EOF"
  npm run build
    └─ Valida TypeScript, compila para produção
       DEVE PASSAR antes de qualquer commit

  bash test-security-complete.sh
    └─ Valida 6 cenários críticos de segurança:
       1. Login transportador
       2. Login embarcador
       3. F5 refresh mantém session
       4. Token inválido = logout
       5. Multi-user isolation
       6. F5 não mistura usuários
    └─ DEVE PASSAR: 6/6 testes

  bash test-f5-advanced.sh
    └─ Específico: F5 refresh mantém sessão
       CRÍTICO para auth changes

EOF

# =================================================
# STEP 4: Show dangerous operations to avoid
# =================================================

echo "⚠️  PASSO 4: Operações PERIGOSAS (NUNCA FAZER!)"
echo ""

cat << "EOF"
  ❌ NUNCA:
     • Importe Header em pages/ (renderiza em App.jsx apenas)
     • Limpe localStorage em erro (mata sessão no F5)
     • Hardcode userType="embarcador"
     • Use user?.role (campo correto é userType)
     • Crie usuários mock em useAuthStore
     • Sidebar comece em top-0 (DEVE ser top-20)
     • Color class sem dark: prefix
     • Logout sem limpar localStorage
     • Valide user === null sem API_CALL
     • Auto-login sem credenciais do usuário

EOF

# =================================================
# STEP 5: Show mandatory patterns
# =================================================

echo "✅ PASSO 5: Padrões OBRIGATÓRIOS (SEMPRE FAZER!)"
echo ""

cat << "EOF"
  ✓ Authentication:
    1. localStorage = { auth_token: JWT, user: userObj }
    2. useAuthStore.js carrega localStorage no init
    3. checkAuth() valida JWT sem limpar storage
    4. F5 refresh restaura sessão automaticamente

  ✓ Header Rendering:
    1. Header renderiza ONCE em App.jsx
    2. 3 scenarios: not-auth/auth-public/auth-dashboard
    3. Cada scenario mostra elementos corretos
    4. Props definem comportamento

  ✓ Protected Pages:
    1. Wrap com <ProtectedRoute>
    2. Wrap com <DashboardLayout userType={userType}>
    3. Sidebar começa em top-20
    4. Main content ML-64 (sidebar width)

  ✓ Dark Mode:
    1. Texto: text-slate-900 dark:text-white
    2. Background: bg-white dark:bg-slate-800
    3. Borders: border-slate-200 dark:border-slate-700
    4. NUNCA hardcode cor sem dark: variant

EOF

# =================================================
# STEP 6: Load configuration
# =================================================

echo "⚙️  PASSO 6: Carregando configuração agente..."
echo ""

if [ -f ".agent-config.json" ]; then
    echo "  ✅ .agent-config.json"
    
    # Extract key info from config
    INIT_MSG=$(grep -o '"on_start"' .agent-config.json)
    if [ -n "$INIT_MSG" ]; then
        echo "  ✅ Configuração de inicialização carregada"
    fi
    
    CRITICAL_RULES=$(grep -c '"rules":' .agent-config.json || true)
    echo "  ✅ $CRITICAL_RULES conjuntos de regras críticas"
else
    echo "  ❌ .agent-config.json não encontrado!"
fi

# =================================================
# STEP 7: Validation script available
# =================================================

echo ""
echo "🔍 PASSO 7: Sistema de validação"
echo ""

if [ -f "agent-rules-validator.sh" ]; then
    echo "  ✅ agent-rules-validator.sh"
    echo "     Executa: bash agent-rules-validator.sh"
    echo "     Valida código antes de commit"
else
    echo "  ⚠️  agent-rules-validator.sh (criar com npm run agent:validate)"
fi

# =================================================
# STEP 8: Pre-commit hook
# =================================================

echo ""
echo "🚫 PASSO 8: Git Pre-commit Hook"
echo ""

if [ -f ".git/hooks/pre-commit" ]; then
    echo "  ✅ Pre-commit hook instalado"
    echo "     Bloqueia commits que violam regras"
else
    echo "  ⚠️  Pre-commit hook não configurado"
fi

# =================================================
# SUMMARY & CHECKLIST
# =================================================

echo ""
echo "════════════════════════════════════════════════════════════"
echo "✨ CHECKLIST PRÉ-AGENTE (Marque quando completado)"
echo "════════════════════════════════════════════════════════════"
echo ""

CHECKLIST=(
    "Leu AGENT_OPERATIONAL_GUIDEBOOK.md seções 1-3 COMPLETAMENTE"
    "Memoriza os 12 FORBIDDEN OPERATIONS"
    "Entende os MANDATORY PATTERNS (Auth, Header, Layout, Dark Mode)"
    "Conhece os 3 scenarios do Header de cor"
    "Sabe por que localStorage.clear() no erro MATA a sessão"
    "Sabe por que F5 refresh DEVE manter session"
    "Sabe por que Header renderiza ONCE em App.jsx apenas"
    "Sabe por que sidebar DEVE estar em top-20 (não top-0)"
    "Conhece os 4 SKILLS críticos (Auth, Components, Testing, Ops)"
    "Pronto para rodar testes antes de QUALQUER commit"
)

for i in "${!CHECKLIST[@]}"; do
    echo "  [ ] ${CHECKLIST[$((i+1))]}"
done

# =================================================
# READY TO PROCEED
# =================================================

echo ""
echo "════════════════════════════════════════════════════════════"

cat << "EOF"

✅ AGENTE INICIALIZADO COM SUCESSO!

Próximas ações:

1. LEIA COMPLETAMENTE (Essencial):
   cat AGENT_OPERATIONAL_GUIDEBOOK.md | head -200

2. TESTE SE TUDO FUNCIONA:
   npm run build

3. ABRA SEU EDITOR:
   code .

4. COMECE A TRABALHAR:
   Lembre-se sempre:
   • Read guidebook sections 1-3 first
   • Follow mandatory patterns
   • Avoid forbidden operations
   • Run tests before commit

═══════════════════════════════════════════════════════════════════

🚀 VOCÊ ESTÁ PRONTO PARA COMEÇAR!

Para mais detalhes: cat AGENT_OPERATIONAL_GUIDEBOOK.md

═══════════════════════════════════════════════════════════════════

EOF

exit 0
