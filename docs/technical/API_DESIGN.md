# Backend API Design Principles

## RESTful API Standards

### Nomenclatura de Recursos
- Use substantivos no plural para recursos (`/quotations`, `/carriers`, `/shipments`)
- Evite verbos nas URLs - use métodos HTTP
- Hierarquia clara: `/api/v1/shippers/{id}/quotations`

### Verbos HTTP
- **GET**: Leitura de recursos (idempotente)
- **POST**: Criação de novos recursos
- **PUT**: Atualização completa de recursos
- **PATCH**: Atualização parcial de recursos
- **DELETE**: Remoção de recursos

### Versionamento
- Versionamento de API: `/api/v1/` para manter compatibilidade
- Manter versões anteriores ativas durante período de depreciação
- Documentar breaking changes claramente

### Códigos de Status HTTP

#### Sucesso (2xx)
- **200 OK**: Requisição bem-sucedida (GET, PUT, PATCH)
- **201 Created**: Recurso criado com sucesso (POST)
- **204 No Content**: Sucesso sem corpo de resposta (DELETE)

#### Erros de Cliente (4xx)
- **400 Bad Request**: Requisição malformada
- **401 Unauthorized**: Autenticação necessária
- **403 Forbidden**: Sem permissão para o recurso
- **404 Not Found**: Recurso não encontrado
- **422 Unprocessable Entity**: Validações de negócio falharam

#### Erros de Servidor (5xx)
- **500 Internal Server Error**: Erro interno do servidor
- **503 Service Unavailable**: Serviço temporariamente indisponível

## Estrutura de Resposta Padronizada

### Resposta de Sucesso
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "attribute": "value"
  },
  "meta": {
    "timestamp": "2026-01-26T10:30:00Z",
    "requestId": "uuid",
    "version": "v1"
  }
}
```

### Resposta de Erro
```json
{
  "success": false,
  "errors": [
    {
      "code": "VALIDATION_ERROR",
      "message": "Invoice value must be positive",
      "field": "invoiceValue"
    }
  ],
  "meta": {
    "timestamp": "2026-01-26T10:30:00Z",
    "requestId": "uuid"
  }
}
```

### Paginação
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "pagination": {
      "page": 1,
      "perPage": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

## Endpoints Principais

### Cotações (Quotations)

#### Criar Cotação
```
POST /api/v1/quotations
Content-Type: application/json
Authorization: Bearer {token}

{
  "shipperId": "uuid",
  "productId": "uuid",
  "recipientId": "uuid",
  "pickupAddressId": "uuid",
  "invoiceValue": 5000.00,
  "totalWeight": 150.5,
  "volumeCount": 3,
  "freightType": "CIF",
  "pickupDateTime": "2026-02-01T10:00:00Z",
  "requiresPallet": true,
  "isUrgent": false,
  "isFragile": false,
  "requiresDedicatedCargo": false
}
```

#### Listar Cotações
```
GET /api/v1/quotations?status=open&page=1&perPage=20
Authorization: Bearer {token}
```

#### Obter Cotação Específica
```
GET /api/v1/quotations/{id}
Authorization: Bearer {token}
```

#### Atualizar Status da Cotação
```
PATCH /api/v1/quotations/{id}/status
Content-Type: application/json
Authorization: Bearer {token}

{
  "status": "accepted",
  "selectedResponseId": "uuid"
}
```

### Respostas de Transportadoras (Quotation Responses)

#### Criar Resposta
```
POST /api/v1/quotations/{quotationId}/responses
Content-Type: application/json
Authorization: Bearer {token}

{
  "carrierId": "uuid",
  "baseValue": 1500.00,
  "palletValue": 50.00,
  "urgentValue": 0,
  "fragileValue": 0,
  "dedicatedCargoValue": 0,
  "insuranceValue": 75.00,
  "estimatedDeliveryDays": 5
}
```

#### Listar Respostas da Cotação
```
GET /api/v1/quotations/{quotationId}/responses
Authorization: Bearer {token}
```

### Perfis e Autenticação

#### Login
```
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password"
}
```

#### Refresh Token
```
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "token"
}
```

#### Cadastro de Embarcador
```
POST /api/v1/auth/register/shipper
Content-Type: application/json

{
  "profileType": "legal_entity",
  "companyName": "Empresa LTDA",
  "cnpj": "12345678000190",
  "email": "contato@empresa.com",
  "password": "secure_password",
  "phone": "+5511999999999"
}
```

### Chats e Negociações

#### Criar Chat
```
POST /api/v1/chats
Content-Type: application/json
Authorization: Bearer {token}

{
  "quotationId": "uuid",
  "type": "cte_negotiation"
}
```

#### Enviar Mensagem
```
POST /api/v1/chats/{chatId}/messages
Content-Type: application/json
Authorization: Bearer {token}

{
  "message": "Proposta de ajuste no valor",
  "messageType": "proposal",
  "proposedValue": 1400.00
}
```

## Segurança

### Autenticação JWT
- **Access Token**: Expiração curta (15 minutos)
- **Refresh Token**: Expiração longa (7 dias)
- Armazenar refresh tokens em HttpOnly cookies
- Implementar token rotation

### Rate Limiting
- **Não autenticado**: 100 requisições/minuto por IP
- **Autenticado**: 1000 requisições/minuto por usuário
- Headers de resposta:
  ```
  X-RateLimit-Limit: 1000
  X-RateLimit-Remaining: 995
  X-RateLimit-Reset: 1643126400
  ```

### CORS
- Whitelist específica de domínios permitidos
- Não usar `Access-Control-Allow-Origin: *` em produção
- Permitir apenas métodos necessários

### Headers de Segurança (Helmet.js)
```javascript
helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
})
```

### Input Sanitization
- Validar TODOS os inputs
- Sanitizar dados antes de processar
- Usar bibliotecas de validação (Zod, Joi, Yup)
- Escapar outputs para prevenir XSS

### Proteção SQL Injection
- Usar prepared statements
- ORMs com query builders (Prisma, TypeORM, Knex)
- NUNCA concatenar strings SQL com inputs do usuário

## Validação de Dados

### Exemplo com Zod (TypeScript)

```typescript
import { z } from 'zod';

const quotationSchema = z.object({
  shipperId: z.string().uuid('ID do embarcador inválido'),
  productId: z.string().uuid('ID do produto inválido'),
  recipientId: z.string().uuid('ID do destinatário inválido'),
  pickupAddressId: z.string().uuid('ID do endereço inválido'),
  invoiceValue: z.number()
    .positive('Valor da nota fiscal deve ser positivo')
    .max(1000000, 'Valor máximo excedido'),
  totalWeight: z.number()
    .positive('Peso deve ser positivo')
    .max(30000, 'Peso máximo: 30 toneladas'),
  volumeCount: z.number()
    .int('Número de volumes deve ser inteiro')
    .positive('Deve haver pelo menos 1 volume')
    .max(100, 'Máximo de 100 volumes'),
  freightType: z.enum(['CIF', 'FOB'], {
    errorMap: () => ({ message: 'Tipo de frete inválido' })
  }),
  pickupDateTime: z.string()
    .datetime('Data/hora inválida')
    .refine(
      (date) => new Date(date) > new Date(),
      'Data de coleta deve ser no futuro'
    ),
  requiresPallet: z.boolean().optional(),
  isUrgent: z.boolean().optional(),
  isFragile: z.boolean().optional(),
  requiresDedicatedCargo: z.boolean().optional()
});

// Uso em middleware Express
async function validateQuotation(req, res, next) {
  try {
    req.validatedData = await quotationSchema.parseAsync(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(422).json({
        success: false,
        errors: error.errors.map(e => ({
          code: 'VALIDATION_ERROR',
          message: e.message,
          field: e.path.join('.')
        }))
      });
    }
    next(error);
  }
}
```

## Auditoria e Logging

### Estrutura de Log
```javascript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'acheimeufrete-api' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Log de operações críticas
function logCriticalOperation(operation, userId, metadata) {
  logger.info({
    type: 'critical_operation',
    operation,
    userId,
    timestamp: new Date().toISOString(),
    ip: metadata.ip,
    userAgent: metadata.userAgent,
    ...metadata
  });
}
```

### Eventos para Logging
- Criação/atualização/exclusão de cotações
- Aceitação de propostas
- Mudanças de status
- Tentativas de acesso não autorizado
- Falhas de autenticação
- Negociações de CT-e
- Pagamentos processados
- Bloqueios de transportadoras

## Middleware de Autenticação

```javascript
import jwt from 'jsonwebtoken';

async function authenticate(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        errors: [{ code: 'UNAUTHORIZED', message: 'Token não fornecido' }]
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await db('profiles').where('id', decoded.userId).first();
    
    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        errors: [{ code: 'UNAUTHORIZED', message: 'Usuário inativo ou inválido' }]
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        errors: [{ code: 'TOKEN_EXPIRED', message: 'Token expirado' }]
      });
    }
    
    return res.status(401).json({
      success: false,
      errors: [{ code: 'INVALID_TOKEN', message: 'Token inválido' }]
    });
  }
}
```

## Tratamento de Erros Global

```javascript
function errorHandler(err, req, res, next) {
  logger.error({
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    userId: req.user?.id,
    timestamp: new Date().toISOString()
  });
  
  // Não expor detalhes internos em produção
  const message = process.env.NODE_ENV === 'production' 
    ? 'Erro interno do servidor'
    : err.message;
  
  res.status(err.statusCode || 500).json({
    success: false,
    errors: [{
      code: err.code || 'INTERNAL_ERROR',
      message
    }]
  });
}
```
