#!/bin/bash

# ╔══════════════════════════════════════════════════════════════╗
# ║  STATUS DO SISTEMA - Achei Meu Frete                        ║
# ║  Verifica o status de todos os serviços                     ║
# ╚══════════════════════════════════════════════════════════════╝

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Carregar configurações
if [ -f .env.config ]; then
    source .env.config
else
    echo -e "${RED}❌ Arquivo .env.config não encontrado!${NC}"
    exit 1
fi

echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║           STATUS DO SISTEMA ACHEI MEU FRETE                  ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ========================================
# FUNÇÃO: Verificar porta
# ========================================
check_service() {
    local PORT=$1
    local SERVICE=$2
    
    if lsof -ti:$PORT >/dev/null 2>&1; then
        PID=$(lsof -ti:$PORT)
        echo -e "${GREEN}✅ $SERVICE${NC}"
        echo -e "   Porta: ${WHITE}$PORT${NC}"
        echo -e "   PID: ${WHITE}$PID${NC}"
        
        # Pegar comando do processo
        PROC_CMD=$(ps -p $PID -o comm= 2>/dev/null || echo "desconhecido")
        echo -e "   Processo: ${WHITE}$PROC_CMD${NC}"
        
        return 0
    else
        echo -e "${RED}❌ $SERVICE${NC}"
        echo -e "   Porta: ${WHITE}$PORT${NC}"
        echo -e "   Status: ${RED}NÃO ESTÁ RODANDO${NC}"
        
        return 1
    fi
}

# ========================================
# 1. POSTGRESQL
# ========================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${WHITE}PostgreSQL${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if docker ps | grep -q acheimeufrete-postgres-1; then
    echo -e "${GREEN}✅ PostgreSQL (Docker)${NC}"
    echo -e "   Container: ${WHITE}acheimeufrete-postgres-1${NC}"
    echo -e "   Porta: ${WHITE}$POSTGRES_PORT${NC}"
    
    # Testar conexão
    if docker exec acheimeufrete-postgres-1 pg_isready -U postgres >/dev/null 2>&1; then
        echo -e "   Status: ${GREEN}ACEITANDO CONEXÕES${NC}"
        
        # Contar usuários
        USER_COUNT=$(docker exec acheimeufrete-postgres-1 psql -U postgres -d acheimeufrete -t -c "SELECT COUNT(*) FROM \"User\";" 2>/dev/null | tr -d ' ' || echo "0")
        echo -e "   Usuários: ${WHITE}$USER_COUNT${NC}"
        
        # Contar NCMs
        NCM_COUNT=$(docker exec acheimeufrete-postgres-1 psql -U postgres -d acheimeufrete -t -c "SELECT COUNT(*) FROM \"NCM\";" 2>/dev/null | tr -d ' ' || echo "0")
        echo -e "   NCMs: ${WHITE}$NCM_COUNT${NC}"
    else
        echo -e "   Status: ${YELLOW}INICIANDO...${NC}"
    fi
else
    echo -e "${RED}❌ PostgreSQL (Docker)${NC}"
    echo -e "   Status: ${RED}NÃO ESTÁ RODANDO${NC}"
fi

echo ""

# ========================================
# 2. BACKEND
# ========================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${WHITE}Backend (Node.js)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if check_service $BACKEND_PORT "Backend"; then
    # Testar API
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$BACKEND_PORT/api/ 2>/dev/null || echo "000")
    
    if [ "$HTTP_CODE" != "000" ]; then
        echo -e "   API: ${GREEN}RESPONDENDO (HTTP $HTTP_CODE)${NC}"
        echo -e "   URL: ${WHITE}http://localhost:$BACKEND_PORT${NC}"
    else
        echo -e "   API: ${RED}NÃO RESPONDE${NC}"
    fi
    
    # Verificar logs
    if [ -f backend.log ]; then
        LAST_LOG=$(tail -1 backend.log 2>/dev/null || echo "")
        if [ ! -z "$LAST_LOG" ]; then
            echo -e "   Último log: ${WHITE}${LAST_LOG:0:50}...${NC}"
        fi
    fi
fi

echo ""

# ========================================
# 3. FRONTEND
# ========================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${WHITE}Frontend (Vite)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if check_service $FRONTEND_PORT "Frontend"; then
    echo -e "   URL: ${WHITE}http://localhost:$FRONTEND_PORT${NC}"
    
    # Verificar logs
    if [ -f frontend.log ]; then
        LAST_LOG=$(tail -1 frontend.log 2>/dev/null || echo "")
        if [ ! -z "$LAST_LOG" ]; then
            echo -e "   Último log: ${WHITE}${LAST_LOG:0:50}...${NC}"
        fi
    fi
fi

echo ""

# ========================================
# 4. RESUMO
# ========================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${WHITE}Resumo${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Contar serviços rodando
SERVICES_RUNNING=0
TOTAL_SERVICES=3

if docker ps | grep -q acheimeufrete-postgres-1; then
    SERVICES_RUNNING=$((SERVICES_RUNNING + 1))
fi

if lsof -ti:$BACKEND_PORT >/dev/null 2>&1; then
    SERVICES_RUNNING=$((SERVICES_RUNNING + 1))
fi

if lsof -ti:$FRONTEND_PORT >/dev/null 2>&1; then
    SERVICES_RUNNING=$((SERVICES_RUNNING + 1))
fi

echo ""

if [ $SERVICES_RUNNING -eq $TOTAL_SERVICES ]; then
    echo -e "${GREEN}✅ Sistema operacional: $SERVICES_RUNNING/$TOTAL_SERVICES serviços rodando${NC}"
    echo ""
    echo -e "${WHITE}🌐 Acesse:${NC} ${CYAN}http://localhost:$FRONTEND_PORT${NC}"
    echo ""
elif [ $SERVICES_RUNNING -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Sistema parcialmente operacional: $SERVICES_RUNNING/$TOTAL_SERVICES serviços rodando${NC}"
    echo ""
    echo -e "${YELLOW}💡 Execute:${NC} ${BLUE}./INICIAR.sh${NC}"
    echo ""
else
    echo -e "${RED}❌ Sistema parado: 0/$TOTAL_SERVICES serviços rodando${NC}"
    echo ""
    echo -e "${YELLOW}💡 Execute:${NC} ${BLUE}./INICIAR.sh${NC}"
    echo ""
fi

# ========================================
# 5. PORTAS CONFIGURADAS
# ========================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${WHITE}Portas Configuradas (FIXAS)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "   PostgreSQL: ${WHITE}$POSTGRES_PORT${NC}"
echo -e "   Backend:    ${WHITE}$BACKEND_PORT${NC}"
echo -e "   Frontend:   ${WHITE}$FRONTEND_PORT${NC}"
echo ""

# ========================================
# 6. COMANDOS ÚTEIS
# ========================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${WHITE}Comandos Úteis${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ $SERVICES_RUNNING -eq $TOTAL_SERVICES ]; then
    echo -e "   ${BLUE}Parar tudo:${NC}        ${WHITE}./PARAR.sh${NC}"
    echo -e "   ${BLUE}Reiniciar:${NC}         ${WHITE}./PARAR.sh && ./INICIAR.sh${NC}"
    echo -e "   ${BLUE}Logs backend:${NC}      ${WHITE}tail -f backend.log${NC}"
    echo -e "   ${BLUE}Logs frontend:${NC}     ${WHITE}tail -f frontend.log${NC}"
else
    echo -e "   ${BLUE}Iniciar tudo:${NC}      ${WHITE}./INICIAR.sh${NC}"
    echo -e "   ${BLUE}Verificar status:${NC}  ${WHITE}./STATUS.sh${NC}"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
