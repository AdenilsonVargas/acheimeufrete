# Regras de Negócio Críticas

## Gerenciamento de Estado de Cotações

### State Machine

```javascript
// Estados possíveis das cotações
const QUOTATION_STATES = {
  OPEN: 'open',                           // Aguardando propostas
  IN_PROGRESS: 'in_progress',             // Tem propostas ativas
  AWAITING_PAYMENT: 'awaiting_payment',   // Proposta aceita, aguardando pagamento
  ACCEPTED: 'accepted',                   // Pagamento confirmado
  AWAITING_PICKUP: 'awaiting_pickup',     // Aguardando coleta
  IN_TRANSIT: 'in_transit',               // Em trânsito
  COMPLETED: 'completed',                 // Entrega completa (com avaliação)
  CANCELLED: 'cancelled',                 // Cancelada
  DISPUTED: 'disputed',                   // Em disputa
  EXPIRED: 'expired'                      // Expirada (tempo esgotado)
};

// Transições permitidas entre estados
const ALLOWED_TRANSITIONS = {
  [QUOTATION_STATES.OPEN]: [
    QUOTATION_STATES.IN_PROGRESS,
    QUOTATION_STATES.CANCELLED,
    QUOTATION_STATES.EXPIRED
  ],
  [QUOTATION_STATES.IN_PROGRESS]: [
    QUOTATION_STATES.AWAITING_PAYMENT,
    QUOTATION_STATES.CANCELLED,
    QUOTATION_STATES.EXPIRED
  ],
  [QUOTATION_STATES.AWAITING_PAYMENT]: [
    QUOTATION_STATES.ACCEPTED,
    QUOTATION_STATES.CANCELLED
  ],
  [QUOTATION_STATES.ACCEPTED]: [
    QUOTATION_STATES.AWAITING_PICKUP
  ],
  [QUOTATION_STATES.AWAITING_PICKUP]: [
    QUOTATION_STATES.IN_TRANSIT,
    QUOTATION_STATES.DISPUTED
  ],
  [QUOTATION_STATES.IN_TRANSIT]: [
    QUOTATION_STATES.COMPLETED,
    QUOTATION_STATES.DISPUTED
  ],
  [QUOTATION_STATES.COMPLETED]: [],
  [QUOTATION_STATES.CANCELLED]: [],
  [QUOTATION_STATES.EXPIRED]: [],
  [QUOTATION_STATES.DISPUTED]: [
    QUOTATION_STATES.IN_TRANSIT,
    QUOTATION_STATES.COMPLETED,
    QUOTATION_STATES.CANCELLED
  ]
};

/**
 * Valida se uma transição de estado é permitida
 */
function validateStateTransition(currentState, newState) {
  const allowedStates = ALLOWED_TRANSITIONS[currentState] || [];
  
  if (!allowedStates.includes(newState)) {
    throw new Error(
      `Transição inválida: ${currentState} → ${newState}. ` +
      `Estados permitidos: ${allowedStates.join(', ')}`
    );
  }
  
  return true;
}

/**
 * Atualiza o estado da cotação com validações
 */
async function updateQuotationStatus(quotationId, newStatus, metadata = {}) {
  return await db.transaction(async (trx) => {
    const quotation = await trx('quotations')
      .where('id', quotationId)
      .first();
    
    if (!quotation) {
      throw new Error('Cotação não encontrada');
    }
    
    // Validar transição
    validateStateTransition(quotation.status, newStatus);
    
    // Atualizar status
    await trx('quotations')
      .where('id', quotationId)
      .update({
        status: newStatus,
        updated_at: new Date(),
        ...metadata
      });
    
    // Registrar histórico
    await trx('quotation_status_history').insert({
      quotation_id: quotationId,
      from_status: quotation.status,
      to_status: newStatus,
      changed_by: metadata.userId,
      metadata: JSON.stringify(metadata),
      created_at: new Date()
    });
    
    return await trx('quotations').where('id', quotationId).first();
  });
}
```

## Cálculos Financeiros Precisos

### Taxa da Plataforma

**IMPORTANTE**: Toda cotação gera automaticamente 5% de taxa para a plataforma.

```javascript
import Decimal from 'decimal.js';

/**
 * Calcula o valor total de uma resposta de cotação
 * Usa Decimal.js para precisão em cálculos monetários
 */
function calculateQuotationTotal(response) {
  const baseValue = new Decimal(response.baseValue || 0);
  const palletValue = new Decimal(response.palletValue || 0);
  const urgentValue = new Decimal(response.urgentValue || 0);
  const fragileValue = new Decimal(response.fragileValue || 0);
  const dedicatedValue = new Decimal(response.dedicatedCargoValue || 0);
  const insuranceValue = new Decimal(response.insuranceValue || 0);
  
  const total = baseValue
    .plus(palletValue)
    .plus(urgentValue)
    .plus(fragileValue)
    .plus(dedicatedValue)
    .plus(insuranceValue);
  
  return total.toDecimalPlaces(2).toNumber();
}

/**
 * Calcula a taxa da plataforma (5% fixo)
 */
function calculatePlatformFee(totalValue) {
  const PLATFORM_FEE_PERCENTAGE = new Decimal(0.05); // 5%
  
  return new Decimal(totalValue)
    .times(PLATFORM_FEE_PERCENTAGE)
    .toDecimalPlaces(2)
    .toNumber();
}

/**
 * Calcula valor líquido para a transportadora
 * (valor total - taxa da plataforma)
 */
function calculateCarrierNetValue(totalValue) {
  const total = new Decimal(totalValue);
  const platformFee = calculatePlatformFee(totalValue);
  
  return total
    .minus(platformFee)
    .toDecimalPlaces(2)
    .toNumber();
}
```

## Sistema de Pagamento

### Regras de Pagamento

**REGRA FUNDAMENTAL**: Todo pagamento é SEMPRE ANTECIPADO, exceto para embarcadores CNPJ autorizados com boleto.

#### Tipos de Pagamento por Perfil

```javascript
const PAYMENT_RULES = {
  // CPF sempre paga antecipado via InfinitePay
  CPF_SHIPPER: {
    methods: ['infinitepay'],
    timing: 'prepaid',
    description: 'Embarcador CPF - Pagamento antecipado via InfinitePay'
  },
  
  // CNPJ sem autorização de boleto paga antecipado
  CNPJ_SHIPPER_NO_BOLETO: {
    methods: ['infinitepay', 'credit_card', 'pix'],
    timing: 'prepaid',
    description: 'Embarcador CNPJ - Pagamento antecipado'
  },
  
  // CNPJ com autorização pode usar boleto (último dia do mês)
  CNPJ_SHIPPER_WITH_BOLETO: {
    methods: ['infinitepay', 'credit_card', 'pix', 'boleto'],
    timing: 'prepaid_or_boleto',
    description: 'Embarcador CNPJ autorizado - Pode usar boleto'
  },
  
  // Transportador autônomo com CIOT exige pagamento antecipado
  AUTONOMOUS_CARRIER_CIOT: {
    methods: ['infinitepay', 'credit_card', 'pix'],
    timing: 'prepaid',
    description: 'Transportador autônomo com CIOT - Pagamento antecipado obrigatório'
  }
};

/**
 * Determina método de pagamento permitido
 */
function determinePaymentMethod(shipper, carrier) {
  // CPF sempre paga antecipado via InfinitePay
  if (shipper.profile_type === 'physical_person') {
    return {
      allowed_methods: ['infinitepay'],
      timing: 'prepaid',
      due_date: null
    };
  }
  
  // CNPJ - verificar se transportador é autônomo com CIOT
  if (carrier.is_autonomous && carrier.has_ciot) {
    return {
      allowed_methods: ['infinitepay', 'credit_card', 'pix'],
      timing: 'prepaid',
      due_date: null
    };
  }
  
  // CNPJ com autorização de boleto
  if (shipper.boleto_authorized) {
    const lastDayOfMonth = getLastDayOfCurrentMonth();
    return {
      allowed_methods: ['infinitepay', 'credit_card', 'pix', 'boleto'],
      timing: 'prepaid_or_boleto',
      due_date: lastDayOfMonth
    };
  }
  
  // CNPJ sem autorização - paga antecipado
  return {
    allowed_methods: ['infinitepay', 'credit_card', 'pix'],
    timing: 'prepaid',
    due_date: null
  };
}

/**
 * Calcula último dia do mês atual
 */
function getLastDayOfCurrentMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  // Next month day 0 = last day of current month
  return new Date(year, month + 1, 0);
}

/**
 * Processa pagamento de cotação
 */
async function processQuotationPayment(quotationId, paymentData) {
  return await db.transaction(async (trx) => {
    const quotation = await trx('quotations')
      .where('id', quotationId)
      .first();
    
    const response = await trx('quotation_responses')
      .where('id', quotation.selected_response_id)
      .first();
    
    const shipper = await trx('shippers')
      .join('profiles', 'shippers.profile_id', 'profiles.id')
      .where('shippers.id', quotation.shipper_id)
      .select('shippers.*', 'profiles.profile_type', 'shippers.boleto_authorized')
      .first();
    
    const carrier = await trx('carriers')
      .where('id', response.carrier_id)
      .first();
    
    // Determinar método de pagamento permitido
    const paymentRules = determinePaymentMethod(shipper, carrier);
    
    // Validar método de pagamento escolhido
    if (!paymentRules.allowed_methods.includes(paymentData.method)) {
      throw new Error(
        `Método de pagamento ${paymentData.method} não permitido. ` +
        `Métodos aceitos: ${paymentRules.allowed_methods.join(', ')}`
      );
    }
    
    // Cálculos financeiros
    const totalValue = calculateQuotationTotal(response);
    const platformFee = calculatePlatformFee(totalValue);
    const carrierNetValue = calculateCarrierNetValue(totalValue);
    
    // Determinar data de vencimento
    let dueDate = null;
    let status = 'completed';
    
    if (paymentData.method === 'boleto') {
      dueDate = paymentRules.due_date;
      status = 'pending'; // Boleto pendente de pagamento
    }
    
    // Registrar pagamento
    const [payment] = await trx('payments').insert({
      quotation_id: quotationId,
      shipper_id: quotation.shipper_id,
      carrier_id: response.carrier_id,
      gross_amount: totalValue,
      platform_fee: platformFee,
      carrier_net_amount: carrierNetValue,
      payment_method: paymentData.method,
      status: status,
      due_date: dueDate,
      paid_at: status === 'completed' ? new Date() : null,
      created_at: new Date()
    }).returning('*');
    
    // Atualizar cotação
    const newStatus = status === 'completed' ? 'accepted' : 'awaiting_payment';
    await trx('quotations')
      .where('id', quotationId)
      .update({
        status: newStatus,
        final_value: totalValue,
        payment_id: payment.id,
        updated_at: new Date()
      });
    
    return { payment, totalValue, platformFee, carrierNetValue };
  });
}
```

## Atualização Automática de Valor por CT-e

**IMPORTANTE**: Não existe mais negociação de CT-e. Se o valor do CT-e for diferente do valor acordado, a plataforma atualiza automaticamente.

```javascript
// Tolerance for value comparison (1 cent)
const VALUE_COMPARISON_TOLERANCE = 0.01;

/**
 * Atualiza valor da cotação baseado no CT-e
 * Se o valor for diferente, atualiza automaticamente
 */
async function updateQuotationValueFromCTe(quotationId, cteValue) {
  return await db.transaction(async (trx) => {
    const quotation = await trx('quotations')
      .where('id', quotationId)
      .first();
    
    if (!quotation) {
      throw new Error('Cotação não encontrada');
    }
    
    if (quotation.status !== 'in_transit') {
      throw new Error('Cotação precisa estar em trânsito');
    }
    
    const originalValue = quotation.final_value;
    const newValue = cteValue;
    
    // Se valores são diferentes, atualizar automaticamente
    if (Math.abs(originalValue - newValue) > VALUE_COMPARISON_TOLERANCE) {
      const platformFee = calculatePlatformFee(newValue);
      const carrierNetValue = calculateCarrierNetValue(newValue);
      
      // Atualizar cotação
      await trx('quotations')
        .where('id', quotationId)
        .update({
          final_value: newValue,
          cte_value: newValue,
          value_adjusted_by_cte: true,
          original_agreed_value: originalValue,
          updated_at: new Date()
        });
      
      // Atualizar pagamento
      await trx('payments')
        .where('quotation_id', quotationId)
        .update({
          gross_amount: newValue,
          platform_fee: platformFee,
          carrier_net_amount: carrierNetValue,
          updated_at: new Date()
        });
      
      // Registrar histórico de ajuste
      await trx('quotation_value_adjustments').insert({
        quotation_id: quotationId,
        original_value: originalValue,
        new_value: newValue,
        adjustment_reason: 'cte_value_difference',
        adjusted_at: new Date(),
        created_at: new Date()
      });
      
      // Notificar embarcador sobre mudança de valor
      await trx('notifications').insert({
        user_id: quotation.shipper_id,
        type: 'quotation_value_adjusted',
        title: 'Valor da Cotação Ajustado',
        message: `O valor da cotação foi ajustado de R$ ${originalValue.toFixed(2)} para R$ ${newValue.toFixed(2)} baseado no CT-e`,
        data: JSON.stringify({
          quotationId,
          originalValue,
          newValue,
          difference: newValue - originalValue
        }),
        read: false,
        created_at: new Date()
      });
    }
    
    return await trx('quotations').where('id', quotationId).first();
  });
}
```

## Expiração Automática de Cotações

**IMPORTANTE**: Cotações devem sumir de todas as telas de transportadoras quando o tempo expirar.

```javascript
/**
 * Expira cotações automaticamente
 * Executar via cron job a cada minuto
 */
async function expireQuotations() {
  const now = new Date();
  
  const expiredQuotations = await db('quotations')
    .whereIn('status', ['open', 'in_progress'])
    .where('expiration_datetime', '<=', now)
    .where('deleted_at', null);
  
  for (const quotation of expiredQuotations) {
    await db.transaction(async (trx) => {
      // Atualizar status para expirado
      await trx('quotations')
        .where('id', quotation.id)
        .update({
          status: 'expired',
          expired_at: now,
          updated_at: now
        });
      
      // Registrar histórico
      await trx('quotation_status_history').insert({
        quotation_id: quotation.id,
        from_status: quotation.status,
        to_status: 'expired',
        changed_by: null,
        metadata: JSON.stringify({ reason: 'automatic_expiration' }),
        created_at: now
      });
      
      // Notificar embarcador
      await trx('notifications').insert({
        user_id: quotation.shipper_id,
        type: 'quotation_expired',
        title: 'Cotação Expirada',
        message: `Sua cotação #${quotation.sequential_number} expirou sem receber propostas aceitas`,
        data: JSON.stringify({ quotationId: quotation.id }),
        read: false,
        created_at: now
      });
      
      // Rejeitar todas as respostas pendentes
      await trx('quotation_responses')
        .where('quotation_id', quotation.id)
        .where('status', 'pending')
        .update({
          status: 'expired',
          updated_at: now
        });
    });
  }
  
  return expiredQuotations.length;
}

/**
 * Verifica se cotação está visível para transportadora
 * Cotações expiradas NÃO devem aparecer
 */
function isQuotationVisibleToCarrier(quotation) {
  const now = new Date();
  
  // Cotações expiradas não são visíveis
  if (quotation.status === 'expired') {
    return false;
  }
  
  // Cotações que passaram do prazo não são visíveis
  if (new Date(quotation.expiration_datetime) <= now) {
    return false;
  }
  
  // Apenas cotações abertas ou em progresso são visíveis
  return ['open', 'in_progress'].includes(quotation.status);
}
```

## Sistema de Avaliações Obrigatórias

**REGRA CRÍTICA**: Avaliações são OBRIGATÓRIAS. Sem avaliar, não é possível criar novas cotações ou aceitar novas cotações.

```javascript
/**
 * Verifica se usuário tem avaliações pendentes
 */
async function hasPendingRatings(userId, userType) {
  const table = userType === 'shipper' ? 'shippers' : 'carriers';
  const foreignKey = userType === 'shipper' ? 'shipper_id' : 'carrier_id';
  
  // Buscar cotações completas sem avaliação
  const pendingRatings = await db('quotations')
    .where(foreignKey, userId)
    .where('status', 'completed')
    .whereNotExists(function() {
      this.select('*')
        .from('ratings')
        .whereRaw(`ratings.quotation_id = quotations.id`)
        .whereRaw(`ratings.evaluator_id = ?`, [userId]);
    })
    .count('* as count');
  
  return parseInt(pendingRatings[0].count) > 0;
}

/**
 * Verifica se embarcador pode criar nova cotação
 */
async function canShipperCreateQuotation(shipperId) {
  const hasPending = await hasPendingRatings(shipperId, 'shipper');
  
  if (hasPending) {
    throw new Error(
      'Você possui avaliações pendentes. ' +
      'Avalie suas cotações anteriores antes de criar uma nova.'
    );
  }
  
  return true;
}

/**
 * Verifica se transportadora pode responder cotação
 */
async function canCarrierRespondQuotation(carrierId) {
  const hasPending = await hasPendingRatings(carrierId, 'carrier');
  
  if (hasPending) {
    throw new Error(
      'Você possui avaliações pendentes. ' +
      'Avalie suas entregas anteriores antes de aceitar novas cotações.'
    );
  }
  
  return true;
}

/**
 * Criar avaliação (obrigatória após entrega)
 */
async function createRating(quotationId, evaluatorId, evaluatedId, data) {
  const quotation = await db('quotations')
    .where('id', quotationId)
    .first();
  
  if (quotation.status !== 'completed') {
    throw new Error('Cotação precisa estar completa para avaliar');
  }
  
  // Verificar se já avaliou
  const existing = await db('ratings')
    .where({
      quotation_id: quotationId,
      evaluator_id: evaluatorId,
      evaluated_id: evaluatedId
    })
    .first();
  
  if (existing) {
    throw new Error('Avaliação já realizada');
  }
  
  return await db.transaction(async (trx) => {
    // Criar avaliação
    const [rating] = await trx('ratings').insert({
      quotation_id: quotationId,
      evaluator_id: evaluatorId,
      evaluated_id: evaluatedId,
      rating: data.rating, // 1-5
      comment: data.comment,
      punctuality: data.punctuality,
      communication: data.communication,
      service_quality: data.serviceQuality,
      created_at: new Date()
    }).returning('*');
    
    // Atualizar média do avaliado
    const avgRating = await trx('ratings')
      .where('evaluated_id', evaluatedId)
      .avg('rating as average');
    
    const ratingCount = await trx('ratings')
      .where('evaluated_id', evaluatedId)
      .count('* as count');
    
    // Determinar tabela (shipper ou carrier)
    const table = data.evaluatedType === 'carrier' ? 'carriers' : 'shippers';
    await trx(table)
      .where('id', evaluatedId)
      .update({
        average_rating: avgRating[0].average,
        rating_count: ratingCount[0].count,
        updated_at: new Date()
      });
    
    // Notificar avaliado
    await trx('notifications').insert({
      user_id: evaluatedId,
      type: 'new_rating_received',
      title: 'Nova Avaliação Recebida',
      message: `Você recebeu uma avaliação de ${data.rating} estrelas`,
      data: JSON.stringify({ quotationId, rating: data.rating }),
      read: false,
      created_at: new Date()
    });
    
    return rating;
  });
}

/**
 * Listar avaliações pendentes do usuário
 */
async function getPendingRatings(userId, userType) {
  const foreignKey = userType === 'shipper' ? 'shipper_id' : 'carrier_id';
  const otherKey = userType === 'shipper' ? 'carrier_id' : 'shipper_id';
  
  return await db('quotations')
    .select(
      'quotations.id',
      'quotations.sequential_number',
      'quotations.final_value',
      'quotations.updated_at',
      db.raw(`
        CASE 
          WHEN quotations.${foreignKey} = ? THEN quotations.${otherKey}
          ELSE quotations.${foreignKey}
        END as to_evaluate_id
      `, [userId])
    )
    .where(foreignKey, userId)
    .where('status', 'completed')
    .whereNotExists(function() {
      this.select('*')
        .from('ratings')
        .whereRaw(`ratings.quotation_id = quotations.id`)
        .whereRaw(`ratings.evaluator_id = ?`, [userId]);
    })
    .orderBy('quotations.updated_at', 'desc');
}
```

## Resumo das Mudanças

### ❌ Removidos
1. **Sistema de Cashback** - Não existe mais na plataforma
2. **Negociação de CT-e** - Valor é ajustado automaticamente, sem negociação
3. **Bloqueio por Atrasos** - Sistema removido completamente

### ✅ Mantidos/Atualizados
1. **Taxa de 5%** - Toda cotação gera 5% para a plataforma
2. **State Machine** - Atualizado (removido estado AWAITING_CTE_APPROVAL, adicionado EXPIRED)
3. **Cálculos Financeiros** - Mantidos (sem cashback)

### ➕ Novos
1. **Sistema de Pagamento Robusto**
   - CPF: Sempre antecipado via InfinitePay
   - CNPJ sem autorização: Sempre antecipado
   - CNPJ com autorização: Pode usar boleto (último dia do mês)
   - Transportador autônomo com CIOT: Sempre antecipado

2. **Atualização Automática por CT-e**
   - Sem negociação
   - Ajuste automático se valor diferir
   - Notificação automática ao embarcador

3. **Expiração Automática**
   - Cotações desaparecem quando expiram
   - Não ficam visíveis para transportadoras

4. **Avaliações Obrigatórias**
   - Embarcadores não criam novas cotações sem avaliar
   - Transportadoras não aceitam novas cotações sem avaliar
   - Sistema de verificação e listagem de pendências
