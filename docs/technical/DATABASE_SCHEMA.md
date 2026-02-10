# Database Schema - Achei Meu Frete

## Visão Geral

Este documento descreve o schema do banco de dados PostgreSQL para o sistema Achei Meu Frete.

## Entidades Principais

### Profiles (Perfis)
Tabela base para todos os usuários do sistema.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_type VARCHAR(50) NOT NULL CHECK (profile_type IN ('physical_person', 'legal_entity')),
  access_email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  
  -- Pessoa Física
  cpf VARCHAR(11),
  full_name VARCHAR(255),
  birth_date DATE,
  
  -- Pessoa Jurídica
  cnpj VARCHAR(14),
  company_name VARCHAR(255),
  state_registration VARCHAR(50),
  municipal_registration VARCHAR(50),
  
  -- Contato
  phone VARCHAR(20),
  whatsapp VARCHAR(20),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,
  
  -- Auditoria
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMP,
  
  -- Constraints
  CONSTRAINT chk_person_type_data CHECK (
    (profile_type = 'physical_person' AND cpf IS NOT NULL) OR
    (profile_type = 'legal_entity' AND cnpj IS NOT NULL)
  )
);

CREATE INDEX idx_profiles_email ON profiles(access_email) WHERE deleted_at IS NULL;
CREATE INDEX idx_profiles_cpf ON profiles(cpf) WHERE deleted_at IS NULL;
CREATE INDEX idx_profiles_cnpj ON profiles(cnpj) WHERE deleted_at IS NULL;
```

### Shippers (Embarcadores)
```sql
CREATE TABLE shippers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id),
  
  -- Autorização de pagamento
  boleto_authorized BOOLEAN DEFAULT false,
  boleto_authorized_at TIMESTAMP,
  boleto_authorized_by UUID REFERENCES profiles(id),
  
  -- Estatísticas
  quotations_count INTEGER DEFAULT 0,
  completed_quotations INTEGER DEFAULT 0,
  cancelled_quotations INTEGER DEFAULT 0,
  pending_ratings_count INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2),
  rating_count INTEGER DEFAULT 0,
  
  -- Financeiro
  total_spent DECIMAL(12,2) DEFAULT 0.00,
  
  -- Auditoria
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMP,
  
  UNIQUE(profile_id)
);

CREATE INDEX idx_shippers_profile ON shippers(profile_id);
CREATE INDEX idx_shippers_boleto_auth ON shippers(boleto_authorized) WHERE deleted_at IS NULL;
CREATE INDEX idx_shippers_pending_ratings ON shippers(pending_ratings_count) WHERE pending_ratings_count > 0;
```

### Carriers (Transportadoras)
```sql
CREATE TABLE carriers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id),
  
  -- Informações da empresa
  trade_name VARCHAR(255),
  antt_rntrc VARCHAR(50), -- Registro ANTT
  
  -- Tipo de transportadora
  is_autonomous BOOLEAN DEFAULT false,
  has_ciot BOOLEAN DEFAULT false, -- CIOT para autônomos
  
  -- Estatísticas
  quotations_responded INTEGER DEFAULT 0,
  quotations_won INTEGER DEFAULT 0,
  quotations_completed INTEGER DEFAULT 0,
  pending_ratings_count INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2),
  rating_count INTEGER DEFAULT 0,
  completion_rate DECIMAL(5,2), -- Percentual
  
  -- Financeiro
  total_earned DECIMAL(12,2) DEFAULT 0.00,
  pending_balance DECIMAL(12,2) DEFAULT 0.00,
  
  -- Auditoria
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMP,
  
  UNIQUE(profile_id)
);

CREATE INDEX idx_carriers_profile ON carriers(profile_id);
CREATE INDEX idx_carriers_antt ON carriers(antt_rntrc) WHERE deleted_at IS NULL;
CREATE INDEX idx_carriers_autonomous_ciot ON carriers(is_autonomous, has_ciot);
CREATE INDEX idx_carriers_pending_ratings ON carriers(pending_ratings_count) WHERE pending_ratings_count > 0;
CREATE INDEX idx_carriers_name_gin ON carriers USING gin(to_tsvector('portuguese', trade_name));
```

### Products (Produtos)
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipper_id UUID NOT NULL REFERENCES shippers(id),
  
  description TEXT NOT NULL,
  ncm VARCHAR(8), -- Nomenclatura Comum do Mercosul
  
  -- Dimensões
  weight_per_unit DECIMAL(10,3), -- kg
  length DECIMAL(10,2), -- cm
  width DECIMAL(10,2), -- cm
  height DECIMAL(10,2), -- cm
  
  -- Características
  is_fragile BOOLEAN DEFAULT false,
  requires_special_care BOOLEAN DEFAULT false,
  temperature_controlled BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_products_shipper ON products(shipper_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_description_gin ON products USING gin(to_tsvector('portuguese', description));
```

### Recipients (Destinatários)
```sql
CREATE TABLE recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipper_id UUID NOT NULL REFERENCES shippers(id),
  
  recipient_type VARCHAR(50) CHECK (recipient_type IN ('physical_person', 'legal_entity')),
  
  -- Pessoa Física
  cpf VARCHAR(11),
  full_name VARCHAR(255),
  
  -- Pessoa Jurídica
  cnpj VARCHAR(14),
  company_name VARCHAR(255),
  
  -- Contato
  email VARCHAR(255),
  phone VARCHAR(20),
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_recipients_shipper ON recipients(shipper_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_recipients_cpf ON recipients(cpf) WHERE deleted_at IS NULL;
CREATE INDEX idx_recipients_cnpj ON recipients(cnpj) WHERE deleted_at IS NULL;
```

### Addresses (Endereços)
```sql
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL, -- profile_id, shipper_id, ou recipient_id
  owner_type VARCHAR(50) NOT NULL, -- 'profile', 'recipient'
  address_type VARCHAR(50) CHECK (address_type IN ('pickup', 'delivery', 'billing', 'default')),
  
  -- Endereço
  street VARCHAR(255) NOT NULL,
  number VARCHAR(20) NOT NULL,
  complement VARCHAR(100),
  neighborhood VARCHAR(100),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(2) NOT NULL,
  postal_code VARCHAR(8) NOT NULL,
  
  -- Geolocalização
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  location GEOGRAPHY(POINT, 4326),
  
  -- Referências
  reference_point TEXT,
  
  is_default BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_addresses_owner ON addresses(owner_id, owner_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_addresses_postal_code ON addresses(postal_code);
CREATE INDEX idx_addresses_location ON addresses USING GIST(location);
```

### Quotations (Cotações)
```sql
CREATE TABLE quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequential_number SERIAL,
  
  -- Relacionamentos
  shipper_id UUID NOT NULL REFERENCES shippers(id),
  product_id UUID NOT NULL REFERENCES products(id),
  recipient_id UUID NOT NULL REFERENCES recipients(id),
  pickup_address_id UUID NOT NULL REFERENCES addresses(id),
  delivery_address_id UUID NOT NULL REFERENCES addresses(id),
  selected_response_id UUID REFERENCES quotation_responses(id),
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  
  -- Dados da carga
  invoice_value DECIMAL(10,2) NOT NULL CHECK (invoice_value > 0),
  total_weight DECIMAL(10,2) NOT NULL CHECK (total_weight > 0),
  volume_count INTEGER NOT NULL CHECK (volume_count > 0),
  freight_type VARCHAR(3) NOT NULL CHECK (freight_type IN ('CIF', 'FOB')),
  
  -- Data/hora
  pickup_datetime TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  expiration_datetime TIMESTAMP NOT NULL,
  expired_at TIMESTAMP,
  acceptance_datetime TIMESTAMP,
  
  -- Configurações de cotação
  tempo_cotacao_minutos INTEGER DEFAULT 60,
  auto_close BOOLEAN DEFAULT true,
  
  -- Características especiais
  requires_pallet BOOLEAN DEFAULT false,
  is_urgent BOOLEAN DEFAULT false,
  is_fragile BOOLEAN DEFAULT false,
  requires_dedicated_cargo BOOLEAN DEFAULT false,
  
  -- Status e valores
  status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN (
    'open', 'in_progress', 'awaiting_payment',
    'accepted', 'awaiting_pickup', 'in_transit',
    'completed', 'cancelled', 'disputed', 'expired'
  )),
  final_value DECIMAL(10,2),
  
  -- CT-e (atualização automática)
  cte_value DECIMAL(10,2),
  value_adjusted_by_cte BOOLEAN DEFAULT false,
  original_agreed_value DECIMAL(10,2),
  
  -- Avaliação
  rated_by_shipper BOOLEAN DEFAULT false,
  rated_by_carrier BOOLEAN DEFAULT false,
  
  -- Cancelamento
  cancellation_reason TEXT,
  cancelled_at TIMESTAMP,
  
  -- Cache (desnormalizado)
  shipper_company_name VARCHAR(255),
  carrier_company_name VARCHAR(255),
  response_count INTEGER DEFAULT 0,
  
  -- Auditoria
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_quotations_shipper_status ON quotations(shipper_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_quotations_status_created ON quotations(status, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_quotations_pickup_date ON quotations(pickup_datetime) 
  WHERE status IN ('open', 'in_progress') AND deleted_at IS NULL;
CREATE INDEX idx_quotations_sequential ON quotations(sequential_number);
CREATE INDEX idx_quotations_expiration ON quotations(expiration_datetime) 
  WHERE status IN ('open', 'in_progress') AND deleted_at IS NULL;
CREATE INDEX idx_quotations_expired ON quotations(expired_at);
CREATE INDEX idx_quotations_pending_rating ON quotations(status) 
  WHERE status = 'completed' AND (rated_by_shipper = false OR rated_by_carrier = false);
```

### Quotation Responses (Respostas de Cotação)
```sql
CREATE TABLE quotation_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  carrier_id UUID NOT NULL REFERENCES carriers(id),
  
  -- Valores
  base_value DECIMAL(10,2) NOT NULL CHECK (base_value > 0),
  pallet_value DECIMAL(10,2) DEFAULT 0,
  urgent_value DECIMAL(10,2) DEFAULT 0,
  fragile_value DECIMAL(10,2) DEFAULT 0,
  dedicated_cargo_value DECIMAL(10,2) DEFAULT 0,
  insurance_value DECIMAL(10,2) DEFAULT 0,
  total_value DECIMAL(10,2) NOT NULL CHECK (total_value > 0),
  
  -- Estimativas
  estimated_delivery_days INTEGER NOT NULL CHECK (estimated_delivery_days > 0),
  estimated_pickup_datetime TIMESTAMP,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
    'pending', 'accepted', 'rejected', 'withdrawn'
  )),
  
  -- Observações
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMP,
  
  -- Uma transportadora pode responder apenas uma vez por cotação
  UNIQUE(quotation_id, carrier_id)
);

CREATE INDEX idx_responses_quotation ON quotation_responses(quotation_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_responses_carrier_status ON quotation_responses(carrier_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_responses_created ON quotation_responses(created_at DESC);
```

### Chats (Conversas)
```sql
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL REFERENCES quotations(id),
  shipper_id UUID NOT NULL REFERENCES shippers(id),
  carrier_id UUID NOT NULL REFERENCES carriers(id),
  
  type VARCHAR(50) NOT NULL DEFAULT 'general',
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN (
    'active', 'closed'
  )),
  
  -- Mensagens (JSONB para flexibilidade)
  messages JSONB DEFAULT '[]',
  
  -- Controle de leitura
  read_by_shipper BOOLEAN DEFAULT true,
  read_by_carrier BOOLEAN DEFAULT true,
  last_message_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_chats_quotation ON chats(quotation_id);
CREATE INDEX idx_chats_shipper ON chats(shipper_id);
CREATE INDEX idx_chats_carrier ON chats(carrier_id);
CREATE INDEX idx_chats_status ON chats(status);
CREATE INDEX idx_chats_last_message ON chats(last_message_at DESC);
CREATE INDEX idx_chats_messages_gin ON chats USING gin(messages);
```

### Payments (Pagamentos)
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL REFERENCES quotations(id),
  shipper_id UUID NOT NULL REFERENCES shippers(id),
  carrier_id UUID NOT NULL REFERENCES carriers(id),
  
  -- Valores
  gross_amount DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) NOT NULL,
  carrier_net_amount DECIMAL(10,2) NOT NULL,
  
  -- Pagamento
  payment_method VARCHAR(50) CHECK (payment_method IN (
    'infinitepay', 'credit_card', 'debit_card', 'pix', 'boleto'
  )),
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'completed', 'failed', 'refunded', 'overdue'
  )),
  
  -- Boleto (para CNPJ autorizado)
  due_date DATE, -- Último dia do mês para boleto
  boleto_url TEXT,
  boleto_barcode VARCHAR(255),
  
  -- Dados externos (gateway InfinitePay)
  external_payment_id VARCHAR(255),
  gateway VARCHAR(50) DEFAULT 'infinitepay',
  
  -- Datas
  paid_at TIMESTAMP,
  refunded_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_payments_quotation ON payments(quotation_id);
CREATE INDEX idx_payments_shipper ON payments(shipper_id);
CREATE INDEX idx_payments_carrier ON payments(carrier_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_due_date ON payments(due_date) WHERE status = 'pending';
CREATE INDEX idx_payments_external ON payments(external_payment_id);
```

### Notifications (Notificações)
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- profile_id, shipper_id ou carrier_id
  user_type VARCHAR(50) NOT NULL, -- 'profile', 'shipper', 'carrier'
  
  type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_notifications_user ON notifications(user_id, user_type);
CREATE INDEX idx_notifications_read ON notifications(user_id, read, created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);
```

### Ratings (Avaliações)
```sql
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL REFERENCES quotations(id),
  evaluator_id UUID NOT NULL,
  evaluated_id UUID NOT NULL,
  
  -- Avaliação geral
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  
  -- Critérios específicos
  punctuality INTEGER CHECK (punctuality BETWEEN 1 AND 5),
  communication INTEGER CHECK (communication BETWEEN 1 AND 5),
  service_quality INTEGER CHECK (service_quality BETWEEN 1 AND 5),
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  
  -- Apenas uma avaliação por usuário por cotação
  UNIQUE(quotation_id, evaluator_id, evaluated_id)
);

CREATE INDEX idx_ratings_quotation ON ratings(quotation_id);
CREATE INDEX idx_ratings_evaluated ON ratings(evaluated_id, rating);
CREATE INDEX idx_ratings_evaluator ON ratings(evaluator_id);
```

### Históricos e Logs

```sql
-- Histórico de status de cotações
CREATE TABLE quotation_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL REFERENCES quotations(id),
  from_status VARCHAR(50),
  to_status VARCHAR(50) NOT NULL,
  changed_by UUID,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_status_history_quotation ON quotation_status_history(quotation_id, created_at DESC);

-- Histórico de ajustes de valor por CT-e
CREATE TABLE quotation_value_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL REFERENCES quotations(id),
  original_value DECIMAL(10,2) NOT NULL,
  new_value DECIMAL(10,2) NOT NULL,
  adjustment_reason VARCHAR(100) NOT NULL,
  adjusted_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_value_adjustments_quotation ON quotation_value_adjustments(quotation_id, adjusted_at DESC);
```

## Triggers

### Atualizar updated_at automaticamente
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar a todas as tabelas com updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotations_updated_at BEFORE UPDATE ON quotations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Repetir para outras tabelas...
```

### Atualizar contador de respostas
```sql
CREATE OR REPLACE FUNCTION update_quotation_response_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE quotations
    SET response_count = response_count + 1
    WHERE id = NEW.quotation_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE quotations
    SET response_count = response_count - 1
    WHERE id = OLD.quotation_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_response_count
AFTER INSERT OR DELETE ON quotation_responses
FOR EACH ROW EXECUTE FUNCTION update_quotation_response_count();
```

### Calcular valor total da resposta
```sql
CREATE OR REPLACE FUNCTION calculate_response_total_value()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_value := NEW.base_value +
    COALESCE(NEW.pallet_value, 0) +
    COALESCE(NEW.urgent_value, 0) +
    COALESCE(NEW.fragile_value, 0) +
    COALESCE(NEW.dedicated_cargo_value, 0) +
    COALESCE(NEW.insurance_value, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_total
BEFORE INSERT OR UPDATE ON quotation_responses
FOR EACH ROW EXECUTE FUNCTION calculate_response_total_value();
```

## Views Úteis

### Cotações ativas com respostas
```sql
CREATE VIEW active_quotations_with_responses AS
SELECT 
  q.*,
  COUNT(qr.id) as response_count,
  MIN(qr.total_value) as lowest_value,
  MAX(qr.total_value) as highest_value,
  AVG(qr.total_value) as average_value
FROM quotations q
LEFT JOIN quotation_responses qr ON q.id = qr.quotation_id AND qr.deleted_at IS NULL
WHERE q.deleted_at IS NULL
  AND q.status IN ('open', 'in_progress')
GROUP BY q.id;
```

### Dashboard da transportadora
```sql
CREATE VIEW carrier_dashboard AS
SELECT
  c.id,
  c.profile_id,
  p.company_name,
  c.average_rating,
  c.rating_count,
  c.quotations_responded,
  c.quotations_won,
  c.quotations_completed,
  CASE 
    WHEN c.quotations_won > 0 
    THEN (c.quotations_completed::DECIMAL / c.quotations_won * 100)
    ELSE 0 
  END as completion_percentage,
  c.blocked_from_quotations,
  c.monthly_delays,
  c.yearly_delays
FROM carriers c
JOIN profiles p ON c.profile_id = p.id
WHERE c.deleted_at IS NULL;
```
