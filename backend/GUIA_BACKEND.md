# 🚀 AcheimeuFrete - Backend - Guia Completo

## Estrutura do Projeto

```
backend/
├── src/
│   ├── server.js                 # Servidor Express
│   ├── controllers/
│   │   ├── authController.js     # Autenticação (register, login, me)
│   │   ├── cotacaoController.js  # CRUD de cotações
│   │   ├── respostaController.js # Respostas de cotações
│   │   └── enderecoController.js # Gerenciamento de endereços
│   ├── routes/
│   │   ├── authRoutes.js         # Rotas de autenticação
│   │   ├── cotacaoRoutes.js      # Rotas de cotações
│   │   ├── respostaRoutes.js     # Rotas de respostas
│   │   └── enderecoRoutes.js     # Rotas de endereços
│   ├── middleware/
│   │   └── auth.js               # Middleware JWT
│   └── utils/
├── prisma/
│   ├── schema.prisma             # Definição do banco de dados
│   └── seed.js                   # Dados iniciais
├── docker-compose.yml            # PostgreSQL
├── .env                          # Variáveis de ambiente
├── package.json
├── README.md                     # Este arquivo
└── test-api.sh                   # Script de testes

```

## Setup Inicial

### 1. Instalar Dependências
```bash
cd backend
npm install
```

### 2. Gerar Prisma Client
```bash
npm run prisma:generate
```

### 3. Configurar Banco de Dados

**Opção A: Usar Docker (Recomendado)**
```bash
# Iniciar PostgreSQL
docker-compose up -d

# Executar migrações
npm run prisma:migrate

# Popularizar dados de teste
npm run prisma:seed
```

**Opção B: PostgreSQL Local**
Se já tem PostgreSQL rodando, atualize `.env`:
```env
DATABASE_URL="postgresql://seu_usuario:sua_senha@localhost:5432/acheimeufrete"
```

Depois:
```bash
npm run prisma:migrate
npm run prisma:seed
```

### 4. Iniciar Servidor
```bash
npm run dev
```

Servidor rodará em `http://localhost:5000`

---

## Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor com nodemon

# Prisma
npm run prisma:generate # Gera Prisma Client
npm run prisma:migrate  # Executa migrações
npm run prisma:seed     # Popula dados de teste
npm run prisma:studio   # Abre Prisma Studio

# Testes
bash test-api.sh        # Testa todos os endpoints
```

---

## Autenticação

Todos os endpoints (exceto `/auth/register` e `/auth/login`) requerem JWT no header:

```bash
Authorization: Bearer {token}
```

### Como Obter Token

1. **Registrar novo usuário**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@email.com",
    "password": "senha123",
    "nomeCompleto": "João Silva",
    "userType": "embarcador",
    ...
  }'
```

2. **Fazer Login**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@email.com",
    "password": "senha123"
  }'
```

Resposta conterá um `token` que deve ser usado em todas as requisições autenticadas.

---

## Endpoints Principais

### Autenticação

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/auth/register` | Registrar novo usuário |
| POST | `/api/auth/login` | Fazer login |
| GET | `/api/auth/me` | Dados do usuário autenticado |

### Cotações

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/cotacoes` | Listar cotações do usuário |
| GET | `/api/cotacoes/disponiveis` | Cotações abertas para transportador |
| GET | `/api/cotacoes/:id` | Obter cotação específica |
| POST | `/api/cotacoes` | Criar nova cotação |
| PUT | `/api/cotacoes/:id` | Atualizar cotação |
| DELETE | `/api/cotacoes/:id` | Cancelar cotação |

### Respostas de Cotações

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/respostas` | Transportador responde cotação |
| GET | `/api/respostas/minhas-respostas` | Respostas do transportador |
| GET | `/api/respostas/cotacao/:cotacaoId` | Respostas de uma cotação |
| PUT | `/api/respostas/:respostaId/aceitar` | Aceitar resposta |

### Endereços

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/enderecos` | Listar endereços do usuário |
| GET | `/api/enderecos/:id` | Obter endereço específico |
| POST | `/api/enderecos` | Criar novo endereço |
| PUT | `/api/enderecos/:id` | Atualizar endereço |
| DELETE | `/api/enderecos/:id` | Deletar endereço |

---

## Modelos de Dados

### User (Usuário)
```json
{
  "id": "uuid",
  "email": "usuario@email.com",
  "nomeCompleto": "João Silva",
  "cpf": "12345678901",
  "cnpj": "12345678901234",
  "telefone": "(11) 98765-4321",
  "userType": "embarcador ou transportador",
  "razaoSocial": "Empresa LTDA"
}
```

### Cotacao (Cotação/Frete)
```json
{
  "id": "uuid",
  "userId": "uuid (embarcador)",
  "titulo": "Frete SP para RJ",
  "descricao": "Máquina de costura",
  "cepColeta": "01310-100",
  "dataColeta": "2024-02-10T10:00:00Z",
  "cepEntrega": "20040020",
  "dataEntregaPrevista": "2024-02-12T15:00:00Z",
  "peso": 50,
  "volume": 1,
  "status": "aberta, aceita, cancelada"
}
```

### RespostaCotacao (Resposta de Transportador)
```json
{
  "id": "uuid",
  "cotacaoId": "uuid",
  "transportadorId": "uuid",
  "valor": 500.00,
  "dataEntrega": "2024-02-12T15:00:00Z",
  "aceita": false
}
```

---

## Fluxo de Uso

### 1️⃣ Embarcador cria cotação
```bash
POST /api/cotacoes
Authorization: Bearer {token_embarcador}
```

### 2️⃣ Transportador vê cotações disponíveis
```bash
GET /api/cotacoes/disponiveis
Authorization: Bearer {token_transportador}
```

### 3️⃣ Transportador responde cotação
```bash
POST /api/respostas
Authorization: Bearer {token_transportador}
{
  "cotacaoId": "...",
  "valor": 500.00,
  "dataEntrega": "..."
}
```

### 4️⃣ Embarcador vê respostas
```bash
GET /api/cotacoes/{id}
Authorization: Bearer {token_embarcador}
```

### 5️⃣ Embarcador aceita uma resposta
```bash
PUT /api/respostas/{id}/aceitar
Authorization: Bearer {token_embarcador}
```

---

## Testes

### Executar Todos os Testes
```bash
bash test-api.sh
```

Este script irá:
1. ✅ Registrar embarcador e transportador
2. ✅ Fazer login
3. ✅ Criar endereços
4. ✅ Criar cotação
5. ✅ Listar cotações
6. ✅ Responder cotação
7. ✅ Aceitar resposta

### Testes Manuais com cURL

**Registrar:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@email.com",
    "password": "senha123",
    "nomeCompleto": "João Silva",
    "userType": "embarcador"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@email.com",
    "password": "senha123"
  }'
```

**Criar Cotação:**
```bash
curl -X POST http://localhost:5000/api/cotacoes \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Frete SP para RJ",
    "descricao": "Máquina",
    "cepColeta": "01310-100",
    "enderecoColeta": "Rua X, 123",
    "dataColeta": "2024-02-10T10:00:00Z",
    "cepEntrega": "20040020",
    "enderecoEntrega": "Av Y, 456",
    "dataEntregaPrevista": "2024-02-12T15:00:00Z",
    "peso": 50,
    "volume": 1
  }'
```

---

## Variáveis de Ambiente (.env)

```env
# Banco de Dados
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/acheimeufrete"

# JWT
JWT_SECRET="seu_secret_super_seguro_aqui_2024"

# Servidor
PORT=5000
NODE_ENV="development"

# Frontend
FRONTEND_URL="http://localhost:3002"
```

---

## Integração com Frontend

O frontend em React deve usar:

```javascript
const API_URL = 'http://localhost:5000/api';

// Registrar
fetch(`${API_URL}/auth/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ ... })
})

// Com autenticação
fetch(`${API_URL}/cotacoes`, {
  headers: {
    'Authorization': `Bearer ${token}`,
  }
})
```

---

## Troubleshooting

### Erro: "DATABASE_URL is invalid"
- Verifique se PostgreSQL está rodando
- Confirme credenciais em `.env`
- Execute `docker-compose up -d` se usar Docker

### Erro: "Cannot find module"
```bash
npm install
npm run prisma:generate
```

### Servidor não inicia
```bash
# Verifique porta 5000
lsof -i :5000

# Mate processo se necessário
kill -9 <PID>
```

### JWT Token inválido
- Token pode ter expirado
- Faça login novamente
- Verifique JWT_SECRET em `.env`

---

## Próximas Etapas

- [ ] Implementar chat em tempo real (Socket.io)
- [ ] Adicionar confirmação de email
- [ ] Implementar recuperação de senha
- [ ] Adicionar testes unitários
- [ ] Configurar autorizações mais granulares
- [ ] Implementar paginação avançada
- [ ] Adicionar filtros de busca

---

## Contato & Suporte

Para dúvidas ou problemas, abra uma issue no repositório.
