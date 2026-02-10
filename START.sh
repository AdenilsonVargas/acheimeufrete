#!/bin/bash

# ╔══════════════════════════════════════════════════════════════╗
# ║  SCRIPT DE INICIALIZAÇÃO SEGURA - Achei Meu Frete          ║
# ║  Inicia todos os serviços com verificação de portas         ║
# ╚══════════════════════════════════════════════════════════════╝

set -e  # Para em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  🚀 INICIANDO ACHEI MEU FRETE - Sistema Seguro              ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Carregar configurações
if [ ! -f .env.config ]; then
    echo -e "${RED}✗ Arquivo .env.config não encontrado!${NC}"
    exit 1
fi

source .env.config
echo -e "${GREEN}✓ Configurações carregadas de .env.config${NC}"
echo ""

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker não está instalado!${NC}"
    exit 1
fi

# Verificar se node está instalado
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js não está instalado!${NC}"
    exit 1
fi

# Função para verificar se porta está em uso
check_port_free() {
    local PORT=$1
    local SERVICE=$2
    
    if lsof -i:$PORT >/dev/null 2>&1; then
        echo -e "${RED}✗ ERRO: Porta ${PORT} (${SERVICE}) já está em uso!${NC}"
        echo -e "${YELLOW}  Execute primeiro: ${GREEN}./STOP.sh${NC}"
        return 1
    else
        echo -e "${GREEN}✓ Porta ${PORT} (${SERVICE}) está livre${NC}"
        return 0
    fi
}

# Função para esperar serviço ficar pronto
wait_for_service() {
    local PORT=$1
    local SERVICE=$2
    local URL="http://localhost:${PORT}"
    local MAX_ATTEMPTS=120
    local ATTEMPT=0
    
    echo -e "${YELLOW}  Aguardando ${SERVICE} na porta ${PORT}...${NC}"
    
    while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
        # Tentar uma requisição simples ao serviço
        if timeout 2 curl -s -f "${URL}" > /dev/null 2>&1 || timeout 2 curl -s "${URL}" | grep -q "." 2>/dev/null; then
            echo -e "${GREEN}  ✓ ${SERVICE} está respondendo na porta ${PORT}!${NC}"
            return 0
        fi
        
        # Fallback: verificar se a porta está aberta com lsof
        if lsof -i:${PORT} >/dev/null 2>&1; then
            echo -e "${GREEN}  ✓ ${SERVICE} está rodando na porta ${PORT}!${NC}"
            return 0
        fi
        
        ATTEMPT=$((ATTEMPT + 1))
        if [ $((ATTEMPT % 10)) -eq 0 ]; then
            echo -e "${YELLOW}  ⏳ ${ATTEMPT}s aguardando ${SERVICE}...${NC}"
        fi
        sleep 1
    done
    
    echo -e "${RED}  ✗ Timeout: ${SERVICE} não respondeu após ${MAX_ATTEMPTS}s${NC}"
    return 1
}

# Função para testar conexão HTTP
test_http() {
    local URL=$1
    local SERVICE=$2
    
    echo -e "${YELLOW}  Testando ${SERVICE} em ${URL}...${NC}"
    
    # Usar timeout para não ficar pendurado
    if timeout 5 curl -s -f -o /dev/null -w "%{http_code}" "$URL" 2>/dev/null | grep -qE "200|404|201|204"; then
        echo -e "${GREEN}  ✓ ${SERVICE} respondendo!${NC}"
        return 0
    else
        # Debug: mostrar o que curl retornou
        local RESPONSE=$(timeout 5 curl -s -w "%{http_code}" "$URL" 2>/dev/null | tail -c 3)
        echo -e "${RED}  ✗ ${SERVICE} não respondendo (status: ${RESPONSE})${NC}"
        return 1
    fi
}

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}ETAPA 0: Limpando processos anteriores${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

# Tentar parar tudo primeiro
./STOP.sh 2>/dev/null || true
sleep 2

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}ETAPA 1/5: Verificando portas${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

ALL_PORTS_FREE=true

check_port_free $POSTGRES_PORT "PostgreSQL" || ALL_PORTS_FREE=false
check_port_free $BACKEND_PORT "Backend" || ALL_PORTS_FREE=false
check_port_free $FRONTEND_PORT "Frontend" || ALL_PORTS_FREE=false

if [ "$ALL_PORTS_FREE" = false ]; then
    echo ""
    echo -e "${RED}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ❌ ERRO: Algumas portas estão ocupadas                      ║${NC}"
    echo -e "${RED}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}Execute primeiro: ${GREEN}./STOP.sh${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}ETAPA 2/5: Iniciando PostgreSQL${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

docker-compose up -d postgres

# Aguardar PostgreSQL ficar realmente pronto
echo -e "${YELLOW}  Aguardando PostgreSQL iniciar...${NC}"
MAX_ATTEMPTS=30
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if docker ps | grep -q "acheimeufrete-postgres-1" && \
       docker exec acheimeufrete-postgres-1 pg_isready -U postgres >/dev/null 2>&1; then
        echo -e "${GREEN}  ✓ PostgreSQL está rodando e aceitando conexões!${NC}"
        break
    fi
    
    ATTEMPT=$((ATTEMPT + 1))
    echo -ne "${YELLOW}  Tentativa ${ATTEMPT}/${MAX_ATTEMPTS}...\r${NC}"
    sleep 2
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    echo -e "${RED}  ✗ PostgreSQL não iniciou${NC}"
    echo -e "${YELLOW}  Logs do PostgreSQL:${NC}"
    docker logs acheimeufrete-postgres-1 | tail -20
    exit 1
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}ETAPA 3/5: Iniciando Backend (Docker)${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

# Iniciar backend com docker-compose
docker-compose up -d backend
echo -e "${YELLOW}  ⏳ Aguardando backend inicializar (este pode levar alguns segundos)...${NC}"

# Aguardar backend com mais tolerância
wait_for_service $BACKEND_PORT "Backend"
sleep 2

# Tentar testar backend com retry
RETRY=0
MAX_RETRIES=10  # Aumentado de 5 para 10
while [ $RETRY -lt $MAX_RETRIES ]; do
    if test_http "http://localhost:${BACKEND_PORT}/api" "Backend API"; then
        echo -e "${GREEN}✓ Backend iniciado com sucesso!${NC}"
        break
    fi
    RETRY=$((RETRY + 1))
    if [ $RETRY -lt $MAX_RETRIES ]; then
        echo -e "${YELLOW}  ⏳ Backend ainda iniciando... tentativa $RETRY/$MAX_RETRIES${NC}"
        sleep 3  # Aumentado de 2 para 3 segundos
    fi
done

if [ $RETRY -eq $MAX_RETRIES ]; then
    echo -e "${YELLOW}  ⚠️  Backend não respondeu, continuando mesmo assim...${NC}"
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}ETAPA 4/5: Iniciando Frontend (Node Local)${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

# Verificar se node_modules existe
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}  ⚠ Instalando dependências do frontend...${NC}"
    npm install
fi

# Iniciar frontend em background
npm run dev > logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${CYAN}  Frontend PID: ${FRONTEND_PID}${NC}"

wait_for_service $FRONTEND_PORT "Frontend"
sleep 2

# Testar frontend
test_http "http://localhost:${FRONTEND_PORT}" "Frontend"

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}ETAPA 5/5: Verificação Final${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

ALL_RUNNING=true

# Verificar PostgreSQL
if docker ps | grep -q "acheimeufrete-postgres-1"; then
    echo -e "${GREEN}✓ PostgreSQL rodando (Container)${NC}"
else
    echo -e "${RED}✗ PostgreSQL não está rodando${NC}"
    ALL_RUNNING=false
fi

# Verificar Backend
if docker ps | grep -q "acheimeufrete-backend-1"; then
    echo -e "${GREEN}✓ Backend rodando (Container Docker)${NC}"
else
    echo -e "${RED}✗ Backend não está rodando${NC}"
    ALL_RUNNING=false
fi

# Verificar Frontend  
if lsof -i:$FRONTEND_PORT >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend rodando (Porta ${FRONTEND_PORT})${NC}"
else
    echo -e "${RED}✗ Frontend não está rodando${NC}"
    ALL_RUNNING=false
fi

echo ""
if [ "$ALL_RUNNING" = true ]; then
    # Salvar apenas o PID do frontend já que backend está em Docker
    echo "$FRONTEND_PID" > logs/frontend.pid
    
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✅ SISTEMA INICIADO COM SUCESSO!                            ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║  📊 INFORMAÇÕES DE ACESSO                                    ║${NC}"
    echo -e "${CYAN}╠══════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${CYAN}║                                                              ║${NC}"
    echo -e "${CYAN}║  🌐 Frontend:  ${GREEN}http://localhost:${FRONTEND_PORT}${CYAN}                          ║${NC}"
    echo -e "${CYAN}║  🔧 Backend:   ${GREEN}http://localhost:${BACKEND_PORT}${CYAN}                          ║${NC}"
    echo -e "${CYAN}║  🗄️  Database:  ${GREEN}localhost:${POSTGRES_PORT}${CYAN}                              ║${NC}"
    echo -e "${CYAN}║                                                              ║${NC}"
    echo -e "${CYAN}╠══════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${CYAN}║  🔐 CREDENCIAIS DE TESTE                                     ║${NC}"
    echo -e "${CYAN}╠══════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${CYAN}║                                                              ║${NC}"
    echo -e "${CYAN}║  ${YELLOW}Embarcador:${NC}                                                ║${NC}"
    echo -e "${CYAN}║    Email: ${GREEN}embarcador@test.com${CYAN}                              ║${NC}"
    echo -e "${CYAN}║    Senha: ${GREEN}123456${CYAN}                                            ║${NC}"
    echo -e "${CYAN}║                                                              ║${NC}"
    echo -e "${CYAN}║  ${YELLOW}Transportador PJ:${NC}                                          ║${NC}"
    echo -e "${CYAN}║    Email: ${GREEN}transportador@test.com${CYAN}                           ║${NC}"
    echo -e "${CYAN}║    Senha: ${GREEN}123456${CYAN}                                            ║${NC}"
    echo -e "${CYAN}║                                                              ║${NC}"
    echo -e "${CYAN}║  ${YELLOW}Transportador Autônomo:${NC}                                    ║${NC}"
    echo -e "${CYAN}║    Email: ${GREEN}autonomo@test.com${CYAN}                                 ║${NC}"
    echo -e "${CYAN}║    Senha: ${GREEN}123456${CYAN}                                            ║${NC}"
    echo -e "${CYAN}║                                                              ║${NC}"
    echo -e "${CYAN}╠══════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${CYAN}║  📋 LOGS                                                     ║${NC}"
    echo -e "${CYAN}╠══════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${CYAN}║                                                              ║${NC}"
    echo -e "${CYAN}║  Backend:  ${GREEN}docker logs acheimeufrete-backend-1${CYAN}               ║${NC}"
    echo -e "${CYAN}║  Frontend: ${GREEN}tail -f logs/frontend.log${CYAN}                       ║${NC}"
    echo -e "${CYAN}║  Database: ${GREEN}docker logs acheimeufrete-postgres-1${CYAN}"
    echo -e "${CYAN}║                                                              ║${NC}"
    echo -e "${CYAN}╠══════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${CYAN}║  🛑 Para parar todos os serviços: ${GREEN}./STOP.sh${CYAN}                ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    exit 0
else
    echo -e "${RED}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ❌ ERRO: Alguns serviços não iniciaram                      ║${NC}"
    echo -e "${RED}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}Verifique os logs:${NC}"
    echo -e "${YELLOW}  Backend:  docker logs acheimeufrete-backend-1${NC}"
    echo -e "${YELLOW}  Frontend: tail -f logs/frontend.log${NC}"
    echo -e "${YELLOW}  Database: docker logs acheimeufrete-postgres-1${NC}"
    exit 1
fi
