# 📘 DOCUMENTAÇÃO COMPLETA - Achei Meu Frete

> **Sistema de Cotação e Gestão de Fretes**  
> Última atualização: 20 de Janeiro de 2026

---

## 📋 Índice

1. [Sobre o Sistema](#sobre-o-sistema)
2. [Tecnologias](#tecnologias)
3. [Configuração do Ambiente](#configuração-do-ambiente)
4. [Como Usar](#como-usar)
5. [Estrutura do Projeto](#estrutura-do-projeto)
6. [API e Rotas](#api-e-rotas)
7. [Banco de Dados](#banco-de-dados)
8. [NCM - Códigos MERCOSUL](#ncm---códigos-mercosul)
9. [Sistema de Segurança](#sistema-de-segurança)
10. [Testes](#testes)
11. [Solução de Problemas](#solução-de-problemas)

---

## 🎯 Sobre o Sistema

**Achei Meu Frete** é uma plataforma completa para gestão de fretes que conecta embarcadores e transportadores.

### Funcionalidades Principais

#### Para Embarcadores:
- ✅ Criar cotações de frete
- ✅ Buscar produtos por NCM (10.507 códigos MERCOSUL)
- ✅ Receber e comparar propostas
- ✅ Chat em tempo real com transportadores
- ✅ Rastreamento de entregas
- ✅ Sistema de pagamentos
- ✅ Avaliação de transportadores
- ✅ Dashboard financeiro

#### Para Transportadores:
- ✅ Visualizar cotações disponíveis
- ✅ Enviar propostas
- ✅ Chat com embarcadores
- ✅ Gerenciar entregas
- ✅ Emissão de documentos (CT-e, CIOT, MDF-e)
- ✅ Sistema de pagamentos
- ✅ Dashboard de faturamento

---

## 🛠️ Tecnologias

### Backend
- **Node.js** 18+
- **Express** 4.18
- **PostgreSQL** 15
- **Prisma ORM** 5.8
- **JWT** para autenticação
- **bcryptjs** para hash de senhas

### Frontend
- **React** 18.2
- **Vite** 5.4
- **Tailwind CSS** 3.4
- **React Router** 6
- **Axios** para requisições HTTP
- **Lucide React** para ícones

### Infraestrutura
- **Docker** para PostgreSQL
- **Docker Compose** para orquestração

---

## ⚙️ Configuração do Ambiente

### Pré-requisitos

- Node.js 18+ instalado
- Docker e Docker Compose instalados
- Git instalado

### Instalação Rápida

```bash
# 1. Clone o repositório
git clone https://github.com/AdenilsonVargas/acheimeufrete.git
cd acheimeufrete

# 2. Inicie o sistema completo
./START.sh
```

Pronto! O sistema estará disponível em:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000

### Configuração Manual (se necessário)

```bash
# Instalar dependências do backend
cd backend
npm install

# Instalar dependências do frontend
cd ..
npm install

# Configurar banco de dados
cd backend
npx prisma generate
npx prisma migrate deploy
node prisma/seed.js  # Criar usuários de teste

# Iniciar PostgreSQL
docker-compose up -d postgres

# Iniciar Backend (em um terminal)
cd backend
npm start

# Iniciar Frontend (em outro terminal)
npm run dev
```

---

## 🚀 Como Usar

### Iniciar o Sistema

```bash
./START.sh
```

Este comando irá:
1. Parar todos os serviços anteriores
2. Validar que as portas estão livres
3. Iniciar PostgreSQL (porta 5432)
4. Iniciar Backend (porta 5000)
5. Iniciar Frontend (porta 3000)
6. Testar conectividade
7. Mostrar credenciais de acesso

### Parar o Sistema

```bash
./STOP.sh
```

Este comando irá:
1. Parar Frontend
2. Parar Backend
3. Parar PostgreSQL
4. Remover containers Docker
5. Limpar processos órfãos

### Credenciais de Teste

**Embarcador:**
- Email: `embarcador@test.com`
- Senha: `123456`

**Transportador PJ:**
- Email: `transportador@test.com`
- Senha: `123456`

**Transportador Autônomo:**
- Email: `autonomo@test.com`
- Senha: `123456`

### Ver Logs

```bash
# Backend
tail -f logs/backend.log

# Frontend
tail -f logs/frontend.log

# Ambos ao mesmo tempo
tail -f logs/*.log
```

---

## 📁 Estrutura do Projeto

```
acheimeufrete/
├── backend/                    # Backend Node.js/Express
│   ├── prisma/
│   │   ├── schema.prisma      # Schema do banco de dados
│   │   ├── seed.js            # Dados iniciais
│   │   └── seed-ncms.js       # 10.507 NCMs MERCOSUL
│   ├── src/
│   │   ├── server.js          # Servidor Express
│   │   ├── controllers/       # Lógica de negócio
│   │   ├── routes/            # Rotas da API
│   │   ├── middleware/        # Middleware (auth, etc)
│   │   └── data/              # Dados estáticos
│   └── package.json
│
├── src/                       # Frontend React
│   ├── api/                   # Cliente API
│   ├── components/            # Componentes React
│   ├── pages/                 # Páginas
│   ├── context/               # Context API
│   └── App.jsx               # Componente principal
│
├── .env.config               # Configuração centralizada
├── docker-compose.yml        # Docker Compose
├── START.sh                  # Script de inicialização
├── STOP.sh                   # Script de parada
├── logs/                     # Logs do sistema
└── README.md                 # Este arquivo
```

---

## 🔌 API e Rotas

### Base URL

```
http://localhost:5000/api
```

### Autenticação

#### POST `/api/auth/register`
Registrar novo usuário (embarcador ou transportador)

**Body:**
```json
{
  "email": "usuario@exemplo.com",
  "password": "senha123",
  "telefone": "(11) 98765-4321",
  "userType": "embarcador",
  "nomeCompleto": "João Silva",
  "cpfOuCnpj": "123.456.789-01"
}
```

#### POST `/api/auth/login`
Fazer login

**Body:**
```json
{
  "email": "embarcador@test.com",
  "password": "123456"
}
```

**Response:**
```json
{
  "message": "Login realizado com sucesso",
  "token": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "embarcador@test.com",
    "userType": "embarcador"
  }
}
```

#### GET `/api/auth/me`
Obter dados do usuário autenticado

**Headers:**
```
Authorization: Bearer {token}
```

### Cotações

#### GET `/api/cotacoes`
Listar todas as cotações

**Query params:**
- `status`: filtrar por status (aberta, em_andamento, concluida)
- `page`: número da página
- `limit`: itens por página

#### POST `/api/cotacoes`
Criar nova cotação

**Body:**
```json
{
  "titulo": "Frete São Paulo - Rio",
  "descricao": "Transporte de máquinas",
  "cepColeta": "01310-100",
  "enderecoColeta": "Av. Paulista, 1000",
  "dataColeta": "2026-01-25T10:00:00Z",
  "cepEntrega": "20000-000",
  "enderecoEntrega": "Centro - Rio de Janeiro",
  "peso": 500,
  "altura": 2.5,
  "largura": 1.5,
  "profundidade": 1.5,
  "valorEstimado": 2500
}
```

### NCM (Nomenclatura Comum do MERCOSUL)

#### GET `/api/ncm/search`
Buscar NCMs

**Query params:**
- `q`: termo de busca (código ou descrição)
- `page`: número da página (padrão: 1)
- `limit`: itens por página (padrão: 20, máximo: 100)

**Exemplo:**
```
GET /api/ncm/search?q=cafe&page=1&limit=20
```

**Response:**
```json
{
  "ncms": [
    {
      "id": "uuid",
      "codigo": "09011100",
      "descricao": "Café não torrado, não descafeinado",
      "ativo": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 10507,
    "totalPages": 526
  }
}
```

---

## 🗄️ Banco de Dados

### Comandos Úteis

```bash
# Acessar PostgreSQL
docker exec -it acheimeufrete-postgres-1 psql -U postgres -d acheimeufrete

# Ver usuários
SELECT id, email, "userType" FROM "User";

# Ver NCMs (primeiros 10)
SELECT codigo, descricao FROM ncm LIMIT 10;

# Contar NCMs
SELECT COUNT(*) FROM ncm;

# Recriar dados de teste
cd backend && node prisma/seed.js
```

---

## 📊 NCM - Códigos MERCOSUL

O sistema possui **10.507 códigos NCM reais** do MERCOSUL.

### O que é NCM?

NCM (Nomenclatura Comum do MERCOSUL) é um código de 8 dígitos usado para classificar mercadorias no comércio internacional.

### Por que 15.149 linhas no Excel vs 10.507 no Banco?

A tabela oficial possui estrutura hierárquica:

- **Capítulos** (2 dígitos): 01, 02, 03... (Categorias gerais)
- **Posições** (4 dígitos): 0101, 0102... (Subcategorias)
- **Subposições** (6 dígitos): 010110, 010120... (Grupos)
- **NCM Final** (8 dígitos): 01011000, 01012100... (Produtos específicos) ✅

**Apenas os códigos de 8 dígitos são válidos para uso no sistema.**

---

## 🔒 Sistema de Segurança

### Configuração Centralizada

Todas as portas estão fixas no arquivo `.env.config`:

```bash
# Portas fixas (NÃO MODIFICAR)
POSTGRES_PORT=5432
BACKEND_PORT=5000
FRONTEND_PORT=3000

# Origens permitidas pelo CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Validação rigorosa
STRICT_PORT_CHECK=true
```

### Camadas de Segurança

1. **Portas Fixas**: Sistema não inicia se portas estiverem erradas
2. **CORS Restrito**: Apenas origens autorizadas
3. **Autenticação JWT**: Token para rotas protegidas
4. **Senhas Hash**: bcrypt com salt de 10 rounds
5. **Validação de Entrada**: Proteção contra SQL Injection e XSS

---

## 🧪 Testes

### Testar Login via cURL

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"embarcador@test.com","password":"123456"}'
```

### Buscar NCM

```bash
curl "http://localhost:5000/api/ncm/search?q=cafe&limit=5"
```

---

## 🔧 Solução de Problemas

### Erro: "Porta já está em uso"

```bash
./STOP.sh && ./START.sh
```

### Erro: "Backend não conecta"

```bash
tail -f logs/backend.log
./START.sh
```

### Limpar Tudo e Recomeçar

```bash
./STOP.sh
docker-compose down -v
docker-compose up -d postgres
cd backend && npx prisma migrate deploy && node prisma/seed.js && cd ..
./START.sh
```

---

## 📞 Comandos Rápidos

```bash
# Iniciar
./START.sh

# Parar
./STOP.sh

# Logs
tail -f logs/*.log

# Verificar portas
lsof -i:3000 && lsof -i:5000 && lsof -i:5432
```

---

## 🎯 Acesso Rápido

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Login**: `embarcador@test.com` / `123456`

---

**Sistema desenvolvido para ser seguro, confiável e funcionar como em produção! 🚀**