# Backend Achei Meu Frete

Backend da plataforma Achei Meu Frete construído com **Express.js** e **Prisma ORM**.

## 🛠 Tecnologias

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **Prisma ORM** - ORM para PostgreSQL
- **PostgreSQL** - Banco de dados
- **JWT** - Autenticação
- **bcryptjs** - Hash de senhas

## 📋 Pré-requisitos

- Node.js 18+
- PostgreSQL 12+
- npm ou yarn

## 🚀 Instalação e Setup

### 1. Instalar dependências

```bash
cd backend
npm install
```

### 2. Configurar variáveis de ambiente

Criar arquivo `.env` na raiz do `/backend`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/acheimeufrete"
JWT_SECRET="seu_secret_jwt_super_seguro_aqui_2024"
JWT_EXPIRATION="7d"
PORT=5000
NODE_ENV=development
FRONTEND_URL="http://localhost:3002"
```

### 3. Criar banco de dados

```bash
# PostgreSQL
createdb acheimeufrete
```

### 4. Executar Prisma migrations

```bash
npx prisma migrate deploy
```

### 5. Popular banco com dados de teste (opcional)

```bash
npm run prisma:seed
```

## 📦 Estrutura do Projeto

```
backend/
├── src/
│   ├── controllers/          # Lógica de negócio
│   │   ├── authController.js
│   │   ├── produtoController.js
│   │   ├── destinatarioController.js
│   │   ├── ncmController.js
│   │   ├── regioesController.js
│   │   ├── cotacaoController.js
│   │   └── respostaController.js
│   ├── middleware/           # Middlewares (auth, etc)
│   │   └── auth.js
│   ├── routes/               # Rotas da API
│   │   ├── authRoutes.js
│   │   ├── produtoRoutes.js
│   │   ├── destinatarioRoutes.js
│   │   ├── ncmRoutes.js
│   │   ├── regioesRoutes.js
│   │   ├── cotacaoRoutes.js
│   │   └── respostaRoutes.js
│   └── server.js             # Entrada principal
├── prisma/
│   ├── schema.prisma         # Schema do banco de dados
│   └── seed.js              # Dados iniciais
├── .env                      # Variáveis de ambiente
└── package.json
```

## 🌐 Endpoints Principais

### Autenticação
- `POST /api/auth/login` - Fazer login
- `POST /api/auth/register` - Registrar usuário

### Produtos
- `GET /api/produtos/list` - Listar produtos
- `POST /api/produtos/create` - Criar produto
- `PUT /api/produtos/:id` - Atualizar produto
- `DELETE /api/produtos/:id` - Deletar produto

### Destinatários
- `GET /api/destinatarios/list` - Listar destinatários
- `GET /api/destinatarios/cep` - Buscar endereço por CEP (ViaCEP)
- `POST /api/destinatarios/create` - Criar destinatário
- `PUT /api/destinatarios/:id` - Atualizar destinatário
- `DELETE /api/destinatarios/:id` - Deletar destinatário

### NCMs
- `GET /api/ncms/list` - Listar NCMs desativados
- `POST /api/ncms/toggle` - Ativar/desativar NCM
- `DELETE /api/ncms/:id` - Reativar NCM

### Regiões
- `GET /api/regioes/list` - Listar regiões desativadas
- `POST /api/regioes/estado/toggle` - Ativar/desativar estado
- `POST /api/regioes/cep/create` - Criar CEP desativado
- `DELETE /api/regioes/cep/:id` - Reativar CEP

### Cotações
- `GET /api/cotacoes/list` - Listar cotações
- `POST /api/cotacoes/create` - Criar cotação
- `PUT /api/cotacoes/:id` - Atualizar cotação

## 🏃 Executar o Servidor

### Modo desenvolvimento (com nodemon)

```bash
npm run dev
```

### Modo produção

```bash
npm start
```

Servidor estará disponível em: `http://localhost:5000`

## 📊 Prisma Studio (Gerenciador Visual)

Para gerenciar dados visualmente:

```bash
npm run prisma:studio
```

Abrirá interface em: `http://localhost:5555`

## 🔄 Migrations

### Criar nova migration

```bash
npx prisma migrate dev --name nome_da_migracao
```

### Ver histórico

```bash
npx prisma migrate status
```

### Resetar banco (desenvolvimento)

```bash
npx prisma migrate reset
```

## 🐛 Troubleshooting

### Erro de conexão com PostgreSQL

- Verificar se PostgreSQL está rodando
- Verificar `DATABASE_URL` no `.env`
- Verificar credenciais (usuário/senha)

### Erro de prisma client

```bash
npx prisma generate
npm install
```

### Porta 5000 em uso

Mudar `PORT` no `.env` ou liberar a porta:

```bash
lsof -i :5000  # Ver processo
kill -9 <PID>  # Matar processo
```

## 📝 Documentação da API

Ver [DOCUMENTACAO_API.md](./DOCUMENTACAO_API.md) para detalhes completos de cada endpoint.

## 🤝 Contribuindo

1. Criar branch para sua feature (`git checkout -b feature/AmazingFeature`)
2. Commit das mudanças (`git commit -m 'Add some AmazingFeature'`)
3. Push para a branch (`git push origin feature/AmazingFeature`)
4. Abrir Pull Request

## 📄 Licença

Este projeto está sob licença ISC.
