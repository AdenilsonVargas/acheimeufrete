#!/bin/bash

# ╔══════════════════════════════════════════════════════════════╗
# ║  SCRIPT DE PARADA SEGURA - Achei Meu Frete                  ║
# ║  Fecha todos os serviços e libera todas as portas           ║
# ╚══════════════════════════════════════════════════════════════╝

# Nota: Sem 'set -e' para permitir limpeza completa mesmo com erros

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo -e "${RED}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${RED}║  🛑 PARANDO TODOS OS SERVIÇOS - ACHEI MEU FRETE             ║${NC}"
echo -e "${RED}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Carregar configurações
if [ -f .env.config ]; then
    source .env.config
    echo -e "${BLUE}✓ Configurações carregadas${NC}"
else
    echo -e "${RED}✗ Arquivo .env.config não encontrado${NC}"
    BACKEND_PORT=5000
    FRONTEND_PORT=3000
    POSTGRES_PORT=5432
fi

# Matar processos na porta
kill_port() {
    local PORT=$1
    local SERVICE=$2
    
    echo -e "${YELLOW}Verificando porta ${PORT} (${SERVICE})...${NC}"
    
    # Encontrar PIDs usando a porta
    PIDS=$(lsof -ti:$PORT 2>/dev/null || true)
    
    if [ -z "$PIDS" ]; then
        echo -e "${GREEN}  ✓ Porta ${PORT} já está livre${NC}"
        return 0
    fi
    
    # Matar processos
    echo -e "${YELLOW}  ⚠ Encerrando processos na porta ${PORT}...${NC}"
    echo "$PIDS" | xargs kill -9 2>/dev/null || true
    
    # Aguardar liberação de socket (TCP TIME-WAIT state)
    sleep 2
    
    # Verificar se foi encerrado
    PIDS_AFTER=$(lsof -ti:$PORT 2>/dev/null || true)
    if [ -z "$PIDS_AFTER" ]; then
        echo -e "${GREEN}  ✓ Porta ${PORT} liberada com sucesso${NC}"
    else
        echo -e "${RED}  ✗ Erro ao liberar porta ${PORT}${NC}"
        return 1
    fi
}

# Função para parar container Docker
stop_docker() {
    local CONTAINER=$1
    
    echo -e "${YELLOW}Verificando container ${CONTAINER}...${NC}"
    
    if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
        echo -e "${YELLOW}  ⚠ Parando container ${CONTAINER}...${NC}"
        docker stop $CONTAINER 2>/dev/null || true
        docker rm $CONTAINER 2>/dev/null || true
        echo -e "${GREEN}  ✓ Container ${CONTAINER} removido${NC}"
    else
        echo -e "${GREEN}  ✓ Container ${CONTAINER} não está rodando${NC}"
    fi
}

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PASSO 1/4: Parando Frontend (Porta ${FRONTEND_PORT})${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
kill_port $FRONTEND_PORT "Frontend"

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PASSO 2/4: Parando Backend (Porta ${BACKEND_PORT})${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
kill_port $BACKEND_PORT "Backend"

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PASSO 3/4: Parando Containers Docker${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

# Usar docker-compose down para limpeza completa
if [ -f "docker-compose.yml" ]; then
    echo -e "${YELLOW}Usando docker-compose down para limpeza...${NC}"
    docker-compose down 2>/dev/null || true
    
    # Verificar containers específicos e remover se necessário
    for CONTAINER in "acheimeufrete-postgres-1" "acheimeufrete-backend-1" "acheimeufrete-frontend-1"; do
        stop_docker "$CONTAINER"
    done
else
    # Fallback se não houver docker-compose.yml
    stop_docker "acheimeufrete-postgres-1"
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PASSO 4/4: Limpando processos Node.js órfãos${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}Procurando processos Node.js relacionados ao projeto...${NC}"

# Matar processos node do projeto
pkill -f "vite" 2>/dev/null || true
pkill -f "node.*acheimeufrete" 2>/dev/null || true

# Aguardar mais tempo para liberação de recursos
sleep 2

echo -e "${GREEN}  ✓ Processos órfãos limpos${NC}"

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Verificação Final${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

# Verificar se todas as portas estão livres
ALL_CLEAR=true

check_port() {
    local PORT=$1
    local SERVICE=$2
    
    if lsof -i:$PORT >/dev/null 2>&1; then
        echo -e "${RED}✗ Porta ${PORT} (${SERVICE}) ainda está ocupada${NC}"
        ALL_CLEAR=false
    else
        echo -e "${GREEN}✓ Porta ${PORT} (${SERVICE}) está livre${NC}"
    fi
}

check_port $FRONTEND_PORT "Frontend"
check_port $BACKEND_PORT "Backend"
check_port $POSTGRES_PORT "PostgreSQL"

# Verificar containers Docker
if docker ps --format '{{.Names}}' | grep -q "acheimeufrete"; then
    echo -e "${RED}✗ Ainda há containers do projeto rodando${NC}"
    docker ps --filter name=acheimeufrete
    ALL_CLEAR=false
else
    echo -e "${GREEN}✓ Nenhum container Docker rodando${NC}"
fi

echo ""
if [ "$ALL_CLEAR" = true ]; then
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✅ TODOS OS SERVIÇOS FORAM ENCERRADOS COM SUCESSO          ║${NC}"
    echo -e "${GREEN}║  Todas as portas estão livres                                ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BLUE}Para iniciar novamente, execute: ${GREEN}./START.sh${NC}"
    exit 0
else
    echo -e "${RED}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ⚠️  ATENÇÃO: Alguns serviços não foram encerrados           ║${NC}"
    echo -e "${RED}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}Tente executar novamente: ${GREEN}./STOP.sh${NC}"
    echo -e "${YELLOW}Ou verifique manualmente os processos acima${NC}"
    exit 1
fi
