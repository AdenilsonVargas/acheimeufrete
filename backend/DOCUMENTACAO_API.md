# Documentação da API - AcheimeuFrete Backend

## URL Base
```
http://localhost:5000/api
```

## Autenticação
Todas as rotas (exceto login e register) requerem header JWT:
```
Authorization: Bearer {token}
```

---

## 1. AUTENTICAÇÃO

### POST `/auth/register`
Registra um novo usuário no sistema.

**Request Body:**
```json
{
  "email": "usuario@email.com",
  "nomeCompleto": "João Silva",
  "razaoSocial": "JS Transportes LTDA", // Opcional
  "cpf": "12345678901",
  "cnpj": "12345678901234", // Opcional
  "telefone": "(11) 98765-4321",
  "userType": "embarcador", // ou "transportador"
  "cep": "01310-100",
  "rua": "Rua das Flores",
  "numero": "123",
  "complemento": "Apt 456",
  "bairro": "Centro",
  "cidade": "São Paulo",
  "estado": "SP",
  "password": "senha123",
  "confirmPassword": "senha123"
}
```

**Response (201):**
```json
{
  "message": "Cadastro realizado com sucesso",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "usuario@email.com",
    "nomeCompleto": "João Silva",
    "userType": "embarcador"
  }
}
```

---

### POST `/auth/login`
Faz login do usuário.

**Request Body:**
```json
{
  "email": "usuario@email.com",
  "password": "senha123"
}
```

**Response (200):**
```json
{
  "message": "Login realizado com sucesso",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "usuario@email.com",
    "nomeCompleto": "João Silva",
    "userType": "embarcador"
  }
}
```

---

### GET `/auth/me`
Retorna dados do usuário autenticado.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "usuario@email.com",
    "nomeCompleto": "João Silva",
    "userType": "embarcador",
    "cpf": "12345678901",
    "telefone": "(11) 98765-4321",
    "perfilCliente": {
      "id": "uuid",
      "avaliacaoMedia": 4.5,
      "totalCotacoes": 10
    }
  }
}
```

---

## 2. COTAÇÕES

### GET `/cotacoes`
Lista cotações do usuário autenticado (embarcador).

**Query Parameters:**
```
?page=1&limit=10&status=aberta
```

**Response (200):**
```json
{
  "cotacoes": [
    {
      "id": "uuid",
      "titulo": "Frete SP para RJ",
      "descricao": "Máquina de costura",
      "cepColeta": "01310-100",
      "enderecoColeta": "Rua das Flores, 123",
      "dataColeta": "2024-02-10T10:00:00Z",
      "cepEntrega": "20040020",
      "enderecoEntrega": "Av. Rio Branco, 456",
      "dataEntregaPrevista": "2024-02-12T15:00:00Z",
      "peso": 50,
      "volume": 1,
      "status": "aberta",
      "respostas": [
        {
          "id": "uuid",
          "transportador": {
            "id": "uuid",
            "razaoSocial": "TT Transportes"
          },
          "valor": 500.00,
          "dataEntrega": "2024-02-12T15:00:00Z"
        }
      ],
      "createdAt": "2024-02-09T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 15,
    "page": 1,
    "limit": 10,
    "pages": 2
  }
}
```

---

### GET `/cotacoes/disponiveis`
Lista cotações disponíveis para responder (para transportadores).

**Response (200):**
```json
{
  "cotacoes": [
    {
      "id": "uuid",
      "titulo": "Frete SP para RJ",
      "emitente": {
        "nomeCompleto": "João Silva",
        "telefone": "(11) 98765-4321"
      },
      "dataColeta": "2024-02-10T10:00:00Z",
      "jaRespondeu": false,
      "totalRespostas": 5
    }
  ]
}
```

---

### GET `/cotacoes/:id`
Obtém detalhes de uma cotação específica.

**Response (200):**
```json
{
  "cotacao": {
    "id": "uuid",
    "titulo": "Frete SP para RJ",
    "descricao": "Máquina de costura",
    "status": "aberta",
    "respostas": []
  }
}
```

---

### POST `/cotacoes`
Cria uma nova cotação.

**Request Body:**
```json
{
  "titulo": "Frete SP para RJ",
  "descricao": "Máquina de costura industrial",
  "cepColeta": "01310-100",
  "enderecoColeta": "Rua das Flores, 123",
  "dataColeta": "2024-02-10T10:00:00Z",
  "cepEntrega": "20040020",
  "enderecoEntrega": "Av. Rio Branco, 456",
  "dataEntregaPrevista": "2024-02-12T15:00:00Z",
  "peso": 50,
  "volume": 1,
  "descricaoConteudo": "Máquina de costura 220v"
}
```

**Response (201):**
```json
{
  "message": "Cotação criada com sucesso",
  "cotacao": {
    "id": "uuid",
    "titulo": "Frete SP para RJ",
    "status": "aberta"
  }
}
```

---

### PUT `/cotacoes/:id`
Atualiza uma cotação existente.

**Request Body:**
```json
{
  "titulo": "Frete SP para RJ - URGENTE",
  "dataEntregaPrevista": "2024-02-11T15:00:00Z"
}
```

**Response (200):**
```json
{
  "message": "Cotação atualizada com sucesso",
  "cotacao": { ... }
}
```

---

### DELETE `/cotacoes/:id`
Cancela uma cotação.

**Response (200):**
```json
{
  "message": "Cotação cancelada com sucesso"
}
```

---

## 3. RESPOSTAS DE COTAÇÕES

### POST `/respostas`
Transportador responde uma cotação.

**Request Body:**
```json
{
  "cotacaoId": "uuid",
  "valor": 500.00,
  "dataEntrega": "2024-02-12T15:00:00Z",
  "descricao": "Entrega com rastreamento"
}
```

**Response (201):**
```json
{
  "message": "Resposta enviada com sucesso",
  "resposta": {
    "id": "uuid",
    "valor": 500.00,
    "transportador": {
      "razaoSocial": "TT Transportes"
    }
  }
}
```

---

### GET `/respostas/minhas-respostas`
Lista respostas do transportador autenticado.

**Query Parameters:**
```
?page=1&limit=10
```

**Response (200):**
```json
{
  "respostas": [
    {
      "id": "uuid",
      "valor": 500.00,
      "aceita": false,
      "cotacao": {
        "titulo": "Frete SP para RJ"
      }
    }
  ],
  "pagination": { ... }
}
```

---

### GET `/respostas/cotacao/:cotacaoId`
Lista todas as respostas para uma cotação (apenas para o dono).

**Response (200):**
```json
{
  "respostas": [
    {
      "id": "uuid",
      "valor": 500.00,
      "transportador": {
        "razaoSocial": "TT Transportes",
        "perfilTransportadora": {
          "avaliacaoMedia": 4.8
        }
      }
    }
  ]
}
```

---

### PUT `/respostas/:respostaId/aceitar`
Aceita uma resposta de cotação.

**Response (200):**
```json
{
  "message": "Resposta aceita com sucesso"
}
```

---

## 4. ENDEREÇOS

### GET `/enderecos`
Lista endereços salvos do usuário.

**Response (200):**
```json
{
  "enderecos": [
    {
      "id": "uuid",
      "cep": "01310-100",
      "rua": "Rua das Flores",
      "numero": "123",
      "bairro": "Centro",
      "cidade": "São Paulo",
      "estado": "SP",
      "tipo": "residencial"
    }
  ]
}
```

---

### POST `/enderecos`
Cria um novo endereço.

**Request Body:**
```json
{
  "cep": "01310-100",
  "rua": "Rua das Flores",
  "numero": "123",
  "complemento": "Apt 456",
  "bairro": "Centro",
  "cidade": "São Paulo",
  "estado": "SP",
  "tipo": "comercial"
}
```

**Response (201):**
```json
{
  "message": "Endereço criado com sucesso",
  "endereco": { ... }
}
```

---

### GET `/enderecos/:id`
Obtém um endereço específico.

**Response (200):**
```json
{
  "endereco": { ... }
}
```

---

### PUT `/enderecos/:id`
Atualiza um endereço.

**Request Body:**
```json
{
  "rua": "Rua Nova",
  "numero": "456"
}
```

**Response (200):**
```json
{
  "message": "Endereço atualizado com sucesso",
  "endereco": { ... }
}
```

---

### DELETE `/enderecos/:id`
Deleta um endereço.

**Response (200):**
```json
{
  "message": "Endereço deletado com sucesso"
}
```

---

## Códigos de Status HTTP

- `200` - OK (Sucesso)
- `201` - Created (Criado com sucesso)
- `400` - Bad Request (Dados inválidos)
- `403` - Forbidden (Não autorizado)
- `404` - Not Found (Não encontrado)
- `500` - Internal Server Error (Erro do servidor)

---

## Exemplo: Fluxo Completo

### 1. Registrar
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"senha123",...}'
```

### 2. Fazer Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"senha123"}'
```

### 3. Criar Cotação (Embarcador)
```bash
curl -X POST http://localhost:5000/api/cotacoes \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

### 4. Responder Cotação (Transportador)
```bash
curl -X POST http://localhost:5000/api/respostas \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{...}'
```
