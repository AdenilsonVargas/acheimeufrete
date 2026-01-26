# Visão Geral Técnica - Achei Meu Frete

## Introdução

Este documento fornece uma visão geral da arquitetura técnica, decisões de design e padrões implementados no sistema Achei Meu Frete - uma plataforma para conectar embarcadores e transportadoras.

## Arquitetura do Sistema

### Arquitetura de 3 Camadas

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Client)                     │
│  React/Next.js + Tailwind CSS + State Management        │
└─────────────────────────────────────────────────────────┘
                           ↕ HTTPS/REST
┌─────────────────────────────────────────────────────────┐
│                   BACKEND (API Server)                   │
│  Node.js/Express + JWT Auth + Business Logic            │
└─────────────────────────────────────────────────────────┘
                           ↕
┌──────────────────────┐          ┌────────────────────────┐
│   PostgreSQL         │          │      Redis             │
│  (Dados Principais)  │          │  (Cache + Sessões)     │
└──────────────────────┘          └────────────────────────┘
```

### Componentes Principais

1. **API REST** - Servidor de aplicação com endpoints documentados
2. **Banco de Dados** - PostgreSQL para dados relacionais + Redis para cache
3. **Autenticação** - Sistema JWT com access e refresh tokens
4. **Cache** - Redis para cotações ativas, sessões e rate limiting
5. **Notificações** - Sistema de notificações em tempo real
6. **Pagamentos** - Integração com gateway de pagamento
7. **Storage** - Armazenamento de documentos (CT-e, notas fiscais)

## Fluxos Principais

### 1. Fluxo de Cotação

```mermaid
sequenceDiagram
    Embarcador->>API: POST /quotations (criar cotação)
    API->>PostgreSQL: Salvar cotação
    API->>Redis: Cache cotação ativa
    API->>Embarcador: 201 Created
    
    loop Durante tempo_cotacao_minutos
        Transportadora->>API: POST /quotations/{id}/responses
        API->>PostgreSQL: Salvar resposta
        API->>Embarcador: Notificação (nova proposta)
    end
    
    Embarcador->>API: PATCH /quotations/{id}/status (aceitar)
    API->>PostgreSQL: Atualizar cotação + criar pagamento
    API->>Transportadora: Notificação (proposta aceita)
```

### 2. Fluxo de Negociação CT-e

```
1. Transportadora inicia CT-e com valor diferente
2. Embarcador recebe notificação
3. Embarcador pode:
   - Aceitar (finaliza negociação)
   - Rejeitar com contraproposta (tentativa 1)
   - Rejeitar sem contraproposta (tentativa 1)
4. Se rejeitado, transportadora pode fazer nova proposta
5. Após 2 tentativas rejeitadas → cotação cancelada automaticamente
```

### 3. Sistema de Bloqueio por Atrasos

```
Atraso registrado → Incrementa contador mensal
                 ↓
        contador >= 3 no mês?
                 ↓
              Sim → Bloquear transportadora
                 ↓
         Notificar e registrar no histórico
                 ↓
      Impedido de receber novas cotações
```

## Stack Tecnológica Recomendada

### Backend
```javascript
{
  "runtime": "Node.js 18+",
  "framework": "Express ou Fastify",
  "language": "TypeScript",
  "orm": "Prisma ou Knex.js",
  "validation": "Zod",
  "authentication": "jsonwebtoken + bcrypt",
  "testing": "Jest + Supertest",
  "logging": "Winston ou Pino",
  "monitoring": "PM2 + Prometheus"
}
```

### Frontend
```javascript
{
  "framework": "Next.js 14+",
  "language": "TypeScript",
  "styling": "Tailwind CSS",
  "state": "Zustand ou Redux Toolkit",
  "http": "Axios",
  "forms": "React Hook Form + Zod",
  "testing": "Jest + React Testing Library"
}
```

### Infraestrutura
```yaml
database:
  primary: PostgreSQL 15+
  cache: Redis 7+
  
deployment:
  containerization: Docker
  orchestration: Docker Compose (dev) / Kubernetes (prod)
  ci_cd: GitHub Actions
  hosting: AWS/GCP/Azure
  
monitoring:
  apm: New Relic ou Datadog
  logs: ELK Stack ou CloudWatch
  errors: Sentry
```

## Segurança

### Camadas de Segurança

1. **Autenticação**
   - JWT com access token (15min) e refresh token (7d)
   - Bcrypt para hashing de senhas (cost factor 12)
   - 2FA opcional para contas premium

2. **Autorização**
   - RBAC (Role-Based Access Control)
   - Verificação de ownership em recursos
   - Rate limiting por IP e por usuário

3. **Proteção de Dados**
   - HTTPS obrigatório
   - Helmet.js para headers de segurança
   - CORS configurado com whitelist
   - Input sanitization em todos os endpoints
   - Prepared statements (proteção SQL injection)
   - CSP (Content Security Policy)

4. **Auditoria**
   - Logging de todas operações críticas
   - Tracking de mudanças (quem, quando, o quê)
   - Retenção de logs por 90 dias

### Dados Sensíveis

```javascript
// Nunca armazenar em plain text:
- Senhas (hash com bcrypt)
- Tokens de pagamento (tokenização)
- Dados bancários (criptografia AES-256)
- CPF/CNPJ (hash ou criptografia)

// Variáveis de ambiente (.env):
- Credenciais de banco de dados
- Chaves de API
- Secrets JWT
- Chaves de criptografia
```

## Performance

### Otimizações Implementadas

1. **Database**
   - Índices em colunas de busca frequente
   - Índices compostos para queries complexas
   - Connection pooling (20-100 conexões)
   - Query optimization (evitar N+1)

2. **Caching**
   - Redis para cotações ativas (TTL dinâmico)
   - Cache de sessões de usuário
   - Cache de dados de perfil
   - Invalidação inteligente

3. **API**
   - Paginação em todas listagens
   - Compressão de respostas (gzip)
   - Lazy loading de relacionamentos
   - Rate limiting para prevenir abuso

4. **Frontend**
   - Code splitting
   - Lazy loading de componentes
   - Otimização de imagens
   - Service Workers para cache

### Metas de Performance

| Métrica | Objetivo |
|---------|----------|
| Tempo de resposta API | < 200ms (p95) |
| Tempo de resposta queries DB | < 50ms (p95) |
| Tempo de carregamento página | < 2s (FCP) |
| Uptime | > 99.9% |
| Taxa de erro | < 0.1% |

## Escalabilidade

### Estratégias de Escala

**Horizontal Scaling**
- API stateless (múltiplas instâncias)
- Load balancer (Nginx/ALB)
- Sessões em Redis (compartilhado)

**Database Scaling**
- Read replicas para queries de leitura
- Particionamento de tabelas grandes
- Archive de dados antigos (> 2 anos)

**Caching**
- Multi-layer cache (L1: memory, L2: Redis)
- CDN para assets estáticos
- Edge caching para APIs geográficas

## Monitoramento e Observabilidade

### Métricas Chave

```yaml
application:
  - Requests per second (RPS)
  - Response time (p50, p95, p99)
  - Error rate
  - Active users
  - Cache hit ratio

business:
  - Cotações criadas/hora
  - Taxa de conversão (cotação → aceite)
  - Tempo médio de resposta das transportadoras
  - Valor médio de fretes
  - Taxa de cancelamento

infrastructure:
  - CPU usage
  - Memory usage
  - Database connections
  - Disk I/O
  - Network throughput
```

### Alertas

```javascript
// Alertas críticos (PagerDuty/Slack)
- API down (5xx > 1% por 5min)
- Database connection pool esgotado
- Disco > 85% cheio
- Falha em pagamentos críticos

// Alertas de aviso
- API lenta (p95 > 500ms)
- Taxa de erro aumentada
- Cache hit ratio baixo
- Aumento anormal de tráfego
```

## Testes

### Estratégia de Testes

```
┌─────────────────────────────────────────┐
│  E2E Tests (5%)                         │ ← Cypress
├─────────────────────────────────────────┤
│  Integration Tests (15%)                │ ← Supertest
├─────────────────────────────────────────┤
│  Unit Tests (80%)                       │ ← Jest
└─────────────────────────────────────────┘
```

**Cobertura Mínima**: 80% para código crítico

### Tipos de Teste

1. **Unit Tests** - Funções puras, cálculos, validações
2. **Integration Tests** - Endpoints API, banco de dados
3. **E2E Tests** - Fluxos completos (criar cotação → aceitar → pagar)
4. **Performance Tests** - Load testing com Artillery/K6
5. **Security Tests** - OWASP ZAP, dependency scanning

## CI/CD Pipeline

```yaml
name: CI/CD Pipeline

on: [push, pull_request]

jobs:
  test:
    - Lint (ESLint + Prettier)
    - Type check (TypeScript)
    - Unit tests
    - Integration tests
    - Security scan (npm audit, Snyk)
    
  build:
    - Build Docker image
    - Tag with commit SHA
    - Push to registry
    
  deploy:
    staging:
      - Deploy to staging
      - Run E2E tests
      - Smoke tests
      
    production:
      - Manual approval required
      - Blue-green deployment
      - Health check
      - Rollback automático se falhar
```

## Backup e Disaster Recovery

### Estratégia de Backup

```yaml
postgresql:
  full_backup:
    frequency: daily
    retention: 30 days
    storage: AWS S3
    
  incremental_backup:
    frequency: every 6 hours
    retention: 7 days
    
  wal_archiving:
    enabled: true
    pitr_window: 7 days

redis:
  rdb_snapshot:
    frequency: every 1 hour
    retention: 24 hours
    
  aof:
    enabled: true
    fsync: everysec
```

### RTO/RPO

| Componente | RTO | RPO |
|------------|-----|-----|
| API Server | 5 min | 0 (stateless) |
| PostgreSQL | 15 min | 1 hour |
| Redis | 5 min | 1 hour (aceitável) |

## Conformidade e Regulamentação

### LGPD (Lei Geral de Proteção de Dados)

- Consentimento explícito para coleta de dados
- Direito ao esquecimento (soft delete com anonimização)
- Portabilidade de dados (export JSON/CSV)
- Criptografia de dados sensíveis
- Logs de acesso a dados pessoais
- DPO (Data Protection Officer) designado

### Nota Fiscal Eletrônica

- Integração com API da SEFAZ
- Validação de CT-e (Conhecimento de Transporte Eletrônico)
- Armazenamento seguro de XMLs
- Assinatura digital com certificado A1/A3

## Documentação

### Documentação Técnica Disponível

1. **[API Design](API_DESIGN.md)** - Padrões de API REST, autenticação, validação
2. **[Database Best Practices](DATABASE.md)** - Otimização, índices, transações
3. **[Database Schema](DATABASE_SCHEMA.md)** - Schema completo com todas as tabelas
4. **[Business Rules](BUSINESS_RULES.md)** - Regras de negócio críticas
5. **[Project Structure](../PROJECT_STRUCTURE.md)** - Organização do código

### Documentação Adicional Necessária

- [ ] Guia de instalação e setup local
- [ ] Documentação de API (Swagger/OpenAPI)
- [ ] Runbook operacional
- [ ] Guia de contribuição para desenvolvedores
- [ ] Troubleshooting guide
- [ ] Architecture Decision Records (ADRs)

## Roadmap Técnico

### Fase 1 - MVP (3 meses)
- [x] Documentação técnica e regras de negócio
- [ ] Setup do projeto e infraestrutura
- [ ] Autenticação e perfis
- [ ] CRUD de cotações
- [ ] Sistema de respostas
- [ ] Pagamentos básicos

### Fase 2 - Core Features (3 meses)
- [ ] Negociação de CT-e
- [ ] Sistema de bloqueio por atrasos
- [ ] Notificações em tempo real
- [ ] Sistema de avaliações
- [ ] Dashboard para embarcadores
- [ ] Dashboard para transportadoras

### Fase 3 - Advanced Features (3 meses)
- [ ] Integração com gateway de pagamento
- [ ] Sistema de cashback
- [ ] Planos premium
- [ ] Integração com SEFAZ (CT-e)
- [ ] Rastreamento de cargas
- [ ] Analytics avançado

### Fase 4 - Scale & Optimization (Contínuo)
- [ ] Otimização de performance
- [ ] Implementação de cache avançado
- [ ] Read replicas
- [ ] CDN para assets
- [ ] Auto-scaling
- [ ] Disaster recovery testing

---

**Última atualização**: 2026-01-26  
**Versão**: 1.0.0  
**Mantenedor**: Equipe Achei Meu Frete
