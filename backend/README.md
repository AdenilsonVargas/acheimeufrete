# Backend AcheimeuFrete

Backend Node.js com Express e PostgreSQL para a plataforma AcheimeuFrete.

## 🚀 Instalação e Configuração

### Pré-requisitos
- Node.js 18+
- PostgreSQL 12+ (ou Docker)

### 1. Instalar Dependências

```bash
cd backend
npm install
```

### 2. Configurar PostgreSQL

#### Opção A: Usando Docker

```bash
# Na raiz do projeto
docker-compose up -d
```

#### Opção B: PostgreSQL Local

Certifique-se de que o PostgreSQL está rodando em `localhost:5432` com:
- Usuário: `postgres`
- Senha: `postgres`
- Database: `acheimeufrete`

### 3. Configurar Variáveis de Ambiente

Um arquivo `.env` já foi criado. Verifique se as configurações estão corretas:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/acheimeufrete"
JWT_SECRET="seu_secret_jwt_super_seguro_aqui_2024"
JWT_EXPIRATION="7d"
PORT=5000
NODE_ENV=development
FRONTEND_URL="http://localhost:3002"
```

### 4. Criar Banco de Dados e Migrations

```bash
# Gerar Prisma Client
npm run prisma:generate

# Executar migrations
npm run prisma:migrate

# Populate com dados de teste
npm run prisma:seed
```

## 📝 Scripts Disponíveis

```bash
# Iniciar servidor em modo desenvolvimento (com hot reload)
npm run dev

# Iniciar servidor em produção
npm start

# Gerar Prisma Client
npm run prisma:generate

# Executar migrations do banco
npm run prisma:migrate

# Abrir Prisma Studio (interface visual do banco)
npm run prisma:studio

# Popular banco com dados de teste
npm run prisma:seed
```

## 🔐 Autenticação

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "embarcador@test.com",
  "password": "123456"
}
```

Resposta:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "embarcador@test.com",
    "userType": "embarcador"
  }
}
```

### Registro
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "novo@test.com",
  "password": "123456",
  "telefone": "(11) 98765-4321",
  "userType": "embarcador",
  "nomeCompleto": "João Silva",
  "cpfOuCnpj": "123.456.789-01",
  "cep": "01310-100",
  "logradouro": "Av. Paulista",
  "numero": "1000",
  "bairro": "Bela Vista",
  "cidade": "São Paulo",
  "estado": "SP"
}
```

### Obter Dados do Usuário
```bash
GET /api/auth/me
Authorization: Bearer {token}
```

## 📚 Endpoints

### Auth
- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Fazer login
- `GET /api/auth/me` - Obter dados do usuário autenticado

## 🗂️ Estrutura do Projeto

```
backend/
├── src/
│   ├── controllers/        # Controladores (lógica da aplicação)
│   ├── routes/            # Definição de rotas
│   ├── middleware/        # Middlewares (autenticação, etc)
│   ├── models/            # Modelos de dados
│   ├── utils/             # Utilidades
│   └── server.js          # Servidor principal
├── prisma/
│   ├── schema.prisma      # Schema do banco de dados
│   └── seed.js            # Dados para popular banco
├── .env                   # Variáveis de ambiente
├── package.json
└── README.md
```

## 🗄️ Banco de Dados

O projeto usa **Prisma ORM** com PostgreSQL.

### Modelos Principais
- `User` - Usuários (Embarcadores e Transportadores)
- `Endereco` - Endereços dos usuários
- `Cotacao` - Cotações de frete
- `RespostaCotacao` - Respostas dos transportadores
- `Pagamento` - Registro de pagamentos
- `Chat` - Chats entre usuários
- `Mensagem` - Mensagens dos chats

### Ver Banco Visualmente
```bash
npm run prisma:studio
```

## 🧪 Dados de Teste

Após rodar `npm run prisma:seed`, os seguintes usuários estarão disponíveis:

### Embarcador
- Email: `embarcador@test.com`
- Senha: `123456`

### Transportador (PJ)
- Email: `transportador@test.com`
- Senha: `123456`

### Transportador (Autônomo)
- Email: `autonomo@test.com`
- Senha: `123456`

## 🔧 Troubleshooting

### Erro de conexão com banco de dados
```
Error: Client is not available in the build process.
```
Solução: Certifique-se de que `npm run prisma:generate` foi executado.

### Porta 5432 já em uso
Se o Docker não funcionar porque a porta está em uso:
```bash
# Mudar porta no docker-compose.yml
ports:
  - "5433:5432"  # Use 5433 em vez de 5432
```

E atualizar `DATABASE_URL`:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/acheimeufrete"
```

### Erro de permissão no PostgreSQL
Limpar dados e recríar:
```bash
# No PostgreSQL
DROP DATABASE acheimeufrete;
CREATE DATABASE acheimeufrete;

# Depois rodar migrations
npm run prisma:migrate
npm run prisma:seed
```

## 📦 Dependências Principais

- **Express** - Framework web
- **Prisma** - ORM para banco de dados
- **PostgreSQL** - Banco de dados
- **JWT** - Autenticação por token
- **bcryptjs** - Hash de senhas
- **CORS** - Cross-Origin Resource Sharing
- **dotenv** - Variáveis de ambiente

## 📄 Licença

MIT
