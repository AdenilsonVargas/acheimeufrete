# Database Best Practices

## Escolha do Banco de Dados

### PostgreSQL (Recomendado para Dados Relacionais)

**Por que PostgreSQL?**
- **ACID Compliance**: Essencial para transações financeiras
- **JSON/JSONB Support**: Dados semi-estruturados (configurações, metadados)
- **Full-text Search**: Busca nativa em textos (nomes de empresas, produtos)
- **Excelente Performance**: Com índices apropriados
- **PostGIS**: Extensão para dados geoespaciais (rotas, distâncias)
- **Extensível**: Tipos personalizados, funções, triggers

### Redis (Cache e Sessões)

**Casos de Uso:**
- Cache de cotações ativas (TTL baseado em `tempoCotacaoMinutos`)
- Sessões de usuário (access tokens)
- Rate limiting counters
- Filas de notificações (pub/sub)
- Dados temporários (OTPs, tokens de redefinição)

**Exemplo de Cache:**
```javascript
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD
});

// Cache de cotação ativa
async function cacheActiveQuotation(quotation) {
  const key = `quotation:${quotation.id}`;
  const ttl = quotation.tempoCotacaoMinutos * 60; // converter para segundos
  
  await redis.setex(
    key,
    ttl,
    JSON.stringify(quotation)
  );
}

// Recuperar do cache
async function getQuotationFromCache(quotationId) {
  const key = `quotation:${quotationId}`;
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
}
```

## Schema Design Principles

### 1. Normalização Apropriada (3NF)

**Evitar redundância de dados:**
```sql
-- ❌ Redundante
CREATE TABLE quotations (
  id UUID PRIMARY KEY,
  shipper_name VARCHAR(255),
  shipper_email VARCHAR(255),
  shipper_phone VARCHAR(50)
  -- ...
);

-- ✅ Normalizado
CREATE TABLE shippers (
  id UUID PRIMARY KEY,
  company_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50)
);

CREATE TABLE quotations (
  id UUID PRIMARY KEY,
  shipper_id UUID REFERENCES shippers(id)
  -- ...
);
```

### 2. Desnormalização Estratégica

**Cache de dados frequentemente acessados:**
```sql
-- Adicionar campos calculados para evitar JOINs pesados
CREATE TABLE quotations (
  id UUID PRIMARY KEY,
  shipper_id UUID REFERENCES shippers(id),
  -- Dados normalizados
  
  -- Cache (desnormalizado)
  shipper_company_name VARCHAR(255), -- para listagens
  response_count INTEGER DEFAULT 0, -- atualizado via trigger
  final_value DECIMAL(10,2), -- valor final calculado
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Trigger para manter response_count atualizado
CREATE OR REPLACE FUNCTION update_response_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE quotations
  SET response_count = (
    SELECT COUNT(*) 
    FROM quotation_responses 
    WHERE quotation_id = NEW.quotation_id
  )
  WHERE id = NEW.quotation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_response_count
AFTER INSERT OR DELETE ON quotation_responses
FOR EACH ROW EXECUTE FUNCTION update_response_count();
```

### 3. Soft Deletes

**Nunca deletar dados permanentemente:**
```sql
CREATE TABLE carriers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name VARCHAR(255) NOT NULL,
  cnpj VARCHAR(14) NOT NULL,
  
  -- Soft delete
  deleted_at TIMESTAMP NULL,
  deleted_by UUID REFERENCES profiles(id),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- View para dados ativos
CREATE VIEW active_carriers AS
SELECT * FROM carriers WHERE deleted_at IS NULL;
```

### 4. Timestamps Obrigatórios

**Sempre incluir:**
```sql
created_at TIMESTAMP DEFAULT NOW() NOT NULL,
updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
deleted_at TIMESTAMP NULL
```

### 5. UUIDs vs Auto-increment

**UUIDs para IDs públicos:**
- Segurança (não sequencial)
- Geração distribuída
- Merge de dados de múltiplas fontes

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- ...
);
```

## Índices Críticos

### Índices Simples
```sql
-- Busca por status
CREATE INDEX idx_quotations_status ON quotations(status);

-- Busca por data
CREATE INDEX idx_quotations_created_at ON quotations(created_at DESC);

-- Soft deletes
CREATE INDEX idx_quotations_deleted_at ON quotations(deleted_at) 
WHERE deleted_at IS NULL;
```

### Índices Compostos
```sql
-- Queries frequentes com múltiplas condições
CREATE INDEX idx_quotations_shipper_status 
ON quotations(shipper_id, status) 
WHERE deleted_at IS NULL;

CREATE INDEX idx_quotation_responses_carrier_status 
ON quotation_responses(carrier_id, status);

-- Paginação ordenada
CREATE INDEX idx_quotations_status_created 
ON quotations(status, created_at DESC);
```

### Índices Parciais
```sql
-- Apenas cotações ativas
CREATE INDEX idx_quotations_active 
ON quotations(pickup_datetime) 
WHERE status IN ('open', 'in_progress') 
AND deleted_at IS NULL;

-- Apenas transportadoras não bloqueadas
CREATE INDEX idx_carriers_active 
ON carriers(id) 
WHERE blocked_from_quotations = FALSE 
AND deleted_at IS NULL;
```

### Índices de Texto (Full-text Search)
```sql
-- Busca em nomes de empresas
CREATE INDEX idx_carriers_name_gin 
ON carriers 
USING gin(to_tsvector('portuguese', company_name));

-- Busca em produtos
CREATE INDEX idx_products_description_gin 
ON products 
USING gin(to_tsvector('portuguese', description));

-- Query de busca
SELECT * FROM carriers
WHERE to_tsvector('portuguese', company_name) 
@@ to_tsquery('portuguese', 'transporte');
```

### Índices Geoespaciais (PostGIS)
```sql
CREATE EXTENSION IF NOT EXISTS postgis;

-- Adicionar coluna de localização
ALTER TABLE recipients 
ADD COLUMN location GEOGRAPHY(POINT, 4326);

-- Índice espacial
CREATE INDEX idx_recipients_location 
ON recipients 
USING GIST(location);

-- Query de proximidade
SELECT id, company_name,
  ST_Distance(location, ST_MakePoint(-46.6333, -23.5505)::geography) / 1000 AS distance_km
FROM recipients
WHERE ST_DWithin(
  location, 
  ST_MakePoint(-46.6333, -23.5505)::geography, 
  50000 -- 50km em metros
)
ORDER BY distance_km;
```

## Constraints para Integridade

### Foreign Keys
```sql
-- Integridade referencial
ALTER TABLE quotations 
ADD CONSTRAINT fk_quotation_shipper 
FOREIGN KEY (shipper_id) 
REFERENCES shippers(id) 
ON DELETE RESTRICT; -- Impedir deleção se houver cotações

-- Permitir NULL se referência for opcional
ALTER TABLE quotations 
ADD CONSTRAINT fk_quotation_selected_response 
FOREIGN KEY (selected_response_id) 
REFERENCES quotation_responses(id) 
ON DELETE SET NULL;
```

### Check Constraints
```sql
-- Valores positivos
ALTER TABLE quotations 
ADD CONSTRAINT chk_invoice_value_positive 
CHECK (invoice_value > 0);

ALTER TABLE quotations 
ADD CONSTRAINT chk_total_weight_positive 
CHECK (total_weight > 0);

-- Enums
ALTER TABLE quotations 
ADD CONSTRAINT chk_freight_type 
CHECK (freight_type IN ('CIF', 'FOB'));

ALTER TABLE quotations 
ADD CONSTRAINT chk_status 
CHECK (status IN (
  'open', 'in_progress', 'awaiting_payment', 
  'accepted', 'awaiting_pickup', 'in_transit',
  'awaiting_cte_approval', 'completed', 
  'cancelled', 'disputed'
));

-- Lógica de negócio
ALTER TABLE chats 
ADD CONSTRAINT chk_max_negotiation_attempts 
CHECK (negotiation_attempts <= 2);

-- Datas no futuro
ALTER TABLE quotations 
ADD CONSTRAINT chk_pickup_datetime_future 
CHECK (pickup_datetime > NOW());
```

### Unique Constraints
```sql
-- Email único
ALTER TABLE profiles 
ADD CONSTRAINT uq_profile_email 
UNIQUE (access_email);

-- CNPJ/CPF únicos (considerando soft delete)
CREATE UNIQUE INDEX uq_carriers_cnpj_active 
ON carriers(cnpj) 
WHERE deleted_at IS NULL;

-- Evitar respostas duplicadas
CREATE UNIQUE INDEX uq_quotation_response_carrier 
ON quotation_responses(quotation_id, carrier_id);
```

## Transações para Operações Críticas

### Exemplo: Aceitar Cotação com Pagamento
```javascript
import { db } from './database';

async function acceptQuotation(quotationId, responseId, shipperId) {
  return await db.transaction(async (trx) => {
    // 1. Verificar se cotação ainda está aberta
    const quotation = await trx('quotations')
      .where('id', quotationId)
      .where('shipper_id', shipperId)
      .first();
    
    if (!quotation) {
      throw new Error('Cotação não encontrada');
    }
    
    if (quotation.status !== 'open' && quotation.status !== 'in_progress') {
      throw new Error('Cotação não está mais disponível');
    }
    
    // 2. Buscar resposta selecionada
    const response = await trx('quotation_responses')
      .where('id', responseId)
      .where('quotation_id', quotationId)
      .first();
    
    if (!response) {
      throw new Error('Resposta não encontrada');
    }
    
    // 3. Calcular valor total
    const totalValue = response.base_value + 
      (response.pallet_value || 0) +
      (response.urgent_value || 0) +
      (response.fragile_value || 0) +
      (response.dedicated_cargo_value || 0) +
      (response.insurance_value || 0);
    
    // 4. Atualizar cotação
    await trx('quotations')
      .where('id', quotationId)
      .update({
        status: 'awaiting_payment',
        selected_response_id: responseId,
        final_value: totalValue,
        acceptance_datetime: new Date(),
        updated_at: new Date()
      });
    
    // 5. Atualizar resposta
    await trx('quotation_responses')
      .where('id', responseId)
      .update({
        status: 'accepted',
        updated_at: new Date()
      });
    
    // 6. Rejeitar outras respostas
    await trx('quotation_responses')
      .where('quotation_id', quotationId)
      .where('id', '!=', responseId)
      .update({
        status: 'rejected',
        updated_at: new Date()
      });
    
    // 7. Criar registro de pagamento
    const [payment] = await trx('payments')
      .insert({
        shipper_id: shipperId,
        quotation_id: quotationId,
        amount: totalValue,
        status: 'pending',
        payment_method: 'credit_card',
        created_at: new Date()
      })
      .returning('*');
    
    // 8. Notificar transportadora
    await trx('notifications').insert({
      user_id: response.carrier_id,
      type: 'quotation_accepted',
      title: 'Cotação Aceita',
      message: `Sua proposta foi aceita para a cotação #${quotation.sequential_number}`,
      data: JSON.stringify({ quotationId, responseId }),
      read: false,
      created_at: new Date()
    });
    
    // 9. Notificar embarcador
    await trx('notifications').insert({
      user_id: shipperId,
      type: 'payment_pending',
      title: 'Pagamento Pendente',
      message: `Finalize o pagamento de R$ ${totalValue.toFixed(2)}`,
      data: JSON.stringify({ quotationId, paymentId: payment.id }),
      read: false,
      created_at: new Date()
    });
    
    return { quotation, response, payment };
  });
}
```

## Otimização de Queries

### Problema N+1
```javascript
// ❌ N+1 Query Problem - Executa 1 + N queries
const quotations = await db('quotations')
  .where('shipper_id', shipperId);

for (const quotation of quotations) {
  // Query adicional para cada cotação!
  quotation.responses = await db('quotation_responses')
    .where('quotation_id', quotation.id);
}
```

### Solução: Eager Loading
```javascript
// ✅ Solução 1: JOIN com agregação
const quotations = await db('quotations')
  .where('quotations.shipper_id', shipperId)
  .leftJoin(
    'quotation_responses', 
    'quotations.id', 
    'quotation_responses.quotation_id'
  )
  .select(
    'quotations.*',
    db.raw(`
      COALESCE(
        json_agg(
          json_build_object(
            'id', quotation_responses.id,
            'carrierId', quotation_responses.carrier_id,
            'baseValue', quotation_responses.base_value,
            'totalValue', quotation_responses.total_value,
            'status', quotation_responses.status
          )
        ) FILTER (WHERE quotation_responses.id IS NOT NULL),
        '[]'
      ) as responses
    `)
  )
  .groupBy('quotations.id');

// ✅ Solução 2: Dataloader (para GraphQL)
import DataLoader from 'dataloader';

const responseLoader = new DataLoader(async (quotationIds) => {
  const responses = await db('quotation_responses')
    .whereIn('quotation_id', quotationIds);
  
  const grouped = quotationIds.map(id => 
    responses.filter(r => r.quotation_id === id)
  );
  
  return grouped;
});
```

### Paginação Eficiente
```javascript
// ✅ Cursor-based pagination (melhor para grandes datasets)
async function getQuotationsCursor(cursor = null, limit = 20) {
  let query = db('quotations')
    .where('deleted_at', null)
    .orderBy('created_at', 'desc')
    .limit(limit + 1); // +1 para saber se há mais páginas
  
  if (cursor) {
    query = query.where('created_at', '<', cursor);
  }
  
  const results = await query;
  const hasMore = results.length > limit;
  const items = hasMore ? results.slice(0, limit) : results;
  
  return {
    items,
    nextCursor: hasMore ? items[items.length - 1].created_at : null,
    hasMore
  };
}
```

### SELECT Específico
```javascript
// ❌ Seleciona todas as colunas (incluindo blobs, textos longos)
const quotations = await db('quotations');

// ✅ Seleciona apenas colunas necessárias
const quotations = await db('quotations')
  .select(
    'id',
    'sequential_number',
    'shipper_id',
    'status',
    'final_value',
    'created_at'
  )
  .where('deleted_at', null);
```

## Backup e Disaster Recovery

### Estratégia de Backup

```bash
# Backup diário automatizado (cron)
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/postgresql"
DB_NAME="acheimeufrete"

# Backup completo
pg_dump -h localhost -U postgres -d $DB_NAME \
  -F c -b -v \
  -f "$BACKUP_DIR/backup_$TIMESTAMP.dump"

# Comprimir
gzip "$BACKUP_DIR/backup_$TIMESTAMP.dump"

# Manter apenas últimos 30 dias
find $BACKUP_DIR -name "backup_*.dump.gz" -mtime +30 -delete

# Upload para S3/cloud storage
aws s3 cp "$BACKUP_DIR/backup_$TIMESTAMP.dump.gz" \
  "s3://acheimeufrete-backups/daily/"
```

### Point-in-Time Recovery (PITR)
```bash
# Configurar no postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'cp %p /backup/archive/%f'
max_wal_senders = 3
```

### Restore
```bash
# Restore de backup
pg_restore -h localhost -U postgres -d acheimeufrete_new \
  -v backup_20260126.dump

# Point-in-time recovery
# 1. Restore do último backup completo
# 2. Aplicar WAL logs até o ponto desejado
```

## Migrations

### Estrutura de Migration
```javascript
// migrations/20260126_create_quotations_table.js
exports.up = async function(knex) {
  await knex.schema.createTable('quotations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('shipper_id').notNullable();
    table.uuid('product_id').notNullable();
    table.uuid('recipient_id').notNullable();
    table.uuid('pickup_address_id').notNullable();
    table.uuid('selected_response_id').nullable();
    
    table.decimal('invoice_value', 10, 2).notNullable();
    table.decimal('total_weight', 10, 2).notNullable();
    table.integer('volume_count').notNullable();
    table.enum('freight_type', ['CIF', 'FOB']).notNullable();
    table.timestamp('pickup_datetime').notNullable();
    
    table.boolean('requires_pallet').defaultTo(false);
    table.boolean('is_urgent').defaultTo(false);
    table.boolean('is_fragile').defaultTo(false);
    table.boolean('requires_dedicated_cargo').defaultTo(false);
    
    table.enum('status', [
      'open', 'in_progress', 'awaiting_payment',
      'accepted', 'awaiting_pickup', 'in_transit',
      'awaiting_cte_approval', 'completed',
      'cancelled', 'disputed'
    ]).defaultTo('open');
    
    table.timestamps(true, true);
    table.timestamp('deleted_at').nullable();
    
    // Foreign keys
    table.foreign('shipper_id').references('shippers.id');
    table.foreign('product_id').references('products.id');
    table.foreign('recipient_id').references('recipients.id');
    table.foreign('pickup_address_id').references('addresses.id');
    
    // Indexes
    table.index(['shipper_id', 'status']);
    table.index('created_at');
    table.index('deleted_at');
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTable('quotations');
};
```
