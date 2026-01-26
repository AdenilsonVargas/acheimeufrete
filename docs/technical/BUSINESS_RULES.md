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
  AWAITING_CTE_APPROVAL: 'awaiting_cte_approval', // CT-e aguardando aprovação
  COMPLETED: 'completed',                 // Entrega completa
  CANCELLED: 'cancelled',                 // Cancelada
  DISPUTED: 'disputed'                    // Em disputa
};

// Transições permitidas entre estados
const ALLOWED_TRANSITIONS = {
  [QUOTATION_STATES.OPEN]: [
    QUOTATION_STATES.IN_PROGRESS,
    QUOTATION_STATES.CANCELLED
  ],
  [QUOTATION_STATES.IN_PROGRESS]: [
    QUOTATION_STATES.AWAITING_PAYMENT,
    QUOTATION_STATES.AWAITING_PICKUP, // Se não exigir pagamento antecipado
    QUOTATION_STATES.CANCELLED
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
    QUOTATION_STATES.AWAITING_CTE_APPROVAL,
    QUOTATION_STATES.COMPLETED, // Se não houver CT-e para aprovar
    QUOTATION_STATES.DISPUTED
  ],
  [QUOTATION_STATES.AWAITING_CTE_APPROVAL]: [
    QUOTATION_STATES.IN_TRANSIT, // Voltar para renegociar
    QUOTATION_STATES.COMPLETED,
    QUOTATION_STATES.CANCELLED
  ],
  [QUOTATION_STATES.COMPLETED]: [],
  [QUOTATION_STATES.CANCELLED]: [],
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

### Cálculo de Valor Total da Cotação

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
 * Calcula a taxa da plataforma (5%)
 */
function calculatePlatformFee(carrierValue) {
  const PLATFORM_FEE_PERCENTAGE = new Decimal(0.05); // 5%
  
  return new Decimal(carrierValue)
    .times(PLATFORM_FEE_PERCENTAGE)
    .toDecimalPlaces(2)
    .toNumber();
}

/**
 * Calcula cashback para usuários premium (15%)
 */
function calculateCashback(amountPaid, isPremium) {
  if (!isPremium) return 0;
  
  const CASHBACK_PERCENTAGE = new Decimal(0.15); // 15% para premium
  
  return new Decimal(amountPaid)
    .times(CASHBACK_PERCENTAGE)
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

/**
 * Exemplo de uso completo
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
      .where('id', quotation.shipper_id)
      .first();
    
    // Cálculos financeiros
    const totalValue = calculateQuotationTotal(response);
    const platformFee = calculatePlatformFee(totalValue);
    const carrierNetValue = calculateCarrierNetValue(totalValue);
    const cashback = calculateCashback(totalValue, shipper.is_premium);
    
    // Registrar pagamento
    const [payment] = await trx('payments').insert({
      quotation_id: quotationId,
      shipper_id: quotation.shipper_id,
      carrier_id: response.carrier_id,
      gross_amount: totalValue,
      platform_fee: platformFee,
      carrier_net_amount: carrierNetValue,
      cashback_amount: cashback,
      payment_method: paymentData.method,
      status: 'completed',
      paid_at: new Date(),
      created_at: new Date()
    }).returning('*');
    
    // Atualizar saldo do embarcador (cashback)
    if (cashback > 0) {
      await trx('shipper_balances')
        .where('shipper_id', quotation.shipper_id)
        .increment('balance', cashback);
    }
    
    // Atualizar cotação
    await trx('quotations')
      .where('id', quotationId)
      .update({
        status: 'accepted',
        final_value: totalValue,
        payment_id: payment.id,
        updated_at: new Date()
      });
    
    return { payment, totalValue, cashback };
  });
}
```

## Sistema de Bloqueio por Atraso

### Regras de Bloqueio

- **3 atrasos no mesmo mês** = bloqueio automático de novas cotações
- Contador de atrasos resetado todo mês
- Histórico de atrasos anuais mantido para análise
- Transportadora notificada imediatamente

```javascript
/**
 * Verifica e bloqueia transportadora por atrasos
 */
async function checkAndBlockCarrierForDelays(carrierId) {
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  
  const carrier = await db('carriers')
    .where('id', carrierId)
    .first();
  
  if (!carrier) {
    throw new Error('Transportadora não encontrada');
  }
  
  // Regra: 3 atrasos no mês = bloqueio
  if (carrier.monthly_delays >= 3 && 
      carrier.delay_reference_month === currentMonth) {
    
    await db.transaction(async (trx) => {
      // Bloquear transportadora
      await trx('carriers')
        .where('id', carrierId)
        .update({
          blocked_from_quotations: true,
          block_reason: `3 ou mais atrasos em ${currentMonth}`,
          blocked_at: new Date(),
          updated_at: new Date()
        });
      
      // Registrar evento de bloqueio
      await trx('carrier_block_history').insert({
        carrier_id: carrierId,
        reason: 'multiple_delays',
        month_reference: currentMonth,
        delays_count: carrier.monthly_delays,
        blocked_at: new Date()
      });
      
      // Notificar transportadora
      await trx('notifications').insert({
        user_id: carrierId,
        type: 'carrier_blocked',
        title: 'Conta Bloqueada',
        message: `Sua conta foi bloqueada temporariamente devido a ${carrier.monthly_delays} atrasos em ${currentMonth}`,
        data: JSON.stringify({
          reason: 'multiple_delays',
          month: currentMonth,
          delaysCount: carrier.monthly_delays
        }),
        read: false,
        created_at: new Date()
      });
    });
    
    return true;
  }
  
  return false;
}

/**
 * Registra atraso na entrega
 */
async function registerDelay(quotationId, reason = null) {
  const quotation = await db('quotations')
    .where('id', quotationId)
    .first();
  
  if (!quotation) {
    throw new Error('Cotação não encontrada');
  }
  
  const response = await db('quotation_responses')
    .where('id', quotation.selected_response_id)
    .first();
  
  if (!response) {
    throw new Error('Resposta não encontrada');
  }
  
  const currentMonth = new Date().toISOString().slice(0, 7);
  
  await db.transaction(async (trx) => {
    // Atualizar cotação com flag de atraso
    await trx('quotations')
      .where('id', quotationId)
      .update({
        delayed: true,
        delay_start_date: new Date(),
        delay_reason: reason,
        updated_at: new Date()
      });
    
    // Buscar dados atuais da transportadora
    const carrier = await trx('carriers')
      .where('id', response.carrier_id)
      .first();
    
    if (carrier.delay_reference_month !== currentMonth) {
      // Novo mês - resetar contador mensal
      await trx('carriers')
        .where('id', response.carrier_id)
        .update({
          monthly_delays: 1,
          yearly_delays: (carrier.yearly_delays || 0) + 1,
          delay_reference_month: currentMonth,
          updated_at: new Date()
        });
    } else {
      // Mesmo mês - incrementar contador
      await trx('carriers')
        .where('id', response.carrier_id)
        .update({
          monthly_delays: (carrier.monthly_delays || 0) + 1,
          yearly_delays: (carrier.yearly_delays || 0) + 1,
          updated_at: new Date()
        });
    }
    
    // Registrar histórico de atraso
    await trx('delay_history').insert({
      quotation_id: quotationId,
      carrier_id: response.carrier_id,
      shipper_id: quotation.shipper_id,
      delay_date: new Date(),
      reason: reason,
      month_reference: currentMonth,
      created_at: new Date()
    });
    
    // Notificar embarcador
    await trx('notifications').insert({
      user_id: quotation.shipper_id,
      type: 'delivery_delayed',
      title: 'Entrega Atrasada',
      message: `A cotação #${quotation.sequential_number} está atrasada`,
      data: JSON.stringify({ quotationId, reason }),
      read: false,
      created_at: new Date()
    });
    
    // Verificar se deve bloquear transportadora
    await checkAndBlockCarrierForDelays(response.carrier_id);
  });
}

/**
 * Remove bloqueio de transportadora (uso administrativo)
 */
async function unblockCarrier(carrierId, adminId, reason) {
  await db.transaction(async (trx) => {
    await trx('carriers')
      .where('id', carrierId)
      .update({
        blocked_from_quotations: false,
        block_reason: null,
        blocked_at: null,
        updated_at: new Date()
      });
    
    await trx('carrier_block_history').insert({
      carrier_id: carrierId,
      reason: 'unblocked_by_admin',
      unblocked_by: adminId,
      unblock_reason: reason,
      unblocked_at: new Date()
    });
    
    await trx('notifications').insert({
      user_id: carrierId,
      type: 'carrier_unblocked',
      title: 'Conta Desbloqueada',
      message: 'Sua conta foi desbloqueada e você pode novamente participar de cotações',
      read: false,
      created_at: new Date()
    });
  });
}
```

## Negociação de CT-e (Máximo 2 Tentativas)

### Regras de Negociação

- **Máximo de 2 tentativas** de negociação por CT-e
- Transportadora pode propor valor diferente do acordado
- Embarcador pode aceitar, rejeitar ou fazer contraproposta
- Após 2 rejeições, cotação é cancelada automaticamente
- Prazo de 48h para resposta (configuraável)

```javascript
/**
 * Inicia negociação de CT-e pela transportadora
 */
async function handleCTeNegotiation(quotationId, carrierId, proposedValue, reason) {
  const quotation = await db('quotations')
    .where('id', quotationId)
    .first();
  
  if (!quotation) {
    throw new Error('Cotação não encontrada');
  }
  
  if (quotation.status !== 'in_transit') {
    throw new Error('Cotação precisa estar em trânsito para negociar CT-e');
  }
  
  return await db.transaction(async (trx) => {
    // Buscar ou criar chat de negociação
    let chat = await trx('chats')
      .where({
        quotation_id: quotationId,
        type: 'cte_negotiation'
      })
      .first();
    
    if (!chat) {
      // Criar novo chat de negociação
      const [newChat] = await trx('chats').insert({
        quotation_id: quotationId,
        shipper_id: quotation.shipper_id,
        carrier_id: carrierId,
        type: 'cte_negotiation',
        status: 'active',
        negotiation_attempts: 0,
        original_quotation_value: quotation.final_value,
        current_proposal_value: proposedValue,
        start_datetime: new Date(),
        expiration_datetime: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48h
        messages: JSON.stringify([]),
        created_at: new Date()
      }).returning('*');
      
      chat = newChat;
    }
    
    // Verificar limite de tentativas
    if (chat.negotiation_attempts >= 2) {
      throw new Error('Limite de tentativas de negociação atingido (2 máximo)');
    }
    
    // Adicionar mensagem de proposta
    const messages = JSON.parse(chat.messages || '[]');
    messages.push({
      id: messages.length + 1,
      sender: 'carrier',
      senderId: carrierId,
      message: reason,
      messageType: 'proposal',
      proposedValue: proposedValue,
      datetime: new Date().toISOString()
    });
    
    // Atualizar chat
    await trx('chats')
      .where('id', chat.id)
      .update({
        messages: JSON.stringify(messages),
        current_proposal_value: proposedValue,
        last_rejection_reason: reason,
        status: 'awaiting_shipper',
        read_by_shipper: false,
        updated_at: new Date()
      });
    
    // Atualizar status da cotação
    await trx('quotations')
      .where('id', quotationId)
      .update({
        status: 'awaiting_cte_approval',
        cte_negotiation_started: true,
        updated_at: new Date()
      });
    
    // Notificar embarcador
    await trx('notifications').insert({
      user_id: quotation.shipper_id,
      type: 'cte_negotiation_pending',
      title: 'Negociação de CT-e Pendente',
      message: `A transportadora propôs R$ ${proposedValue.toFixed(2)} para a cotação #${quotation.sequential_number}`,
      data: JSON.stringify({ 
        quotationId, 
        chatId: chat.id,
        proposedValue,
        originalValue: quotation.final_value
      }),
      read: false,
      created_at: new Date()
    });
    
    return chat;
  });
}

/**
 * Embarcador responde à negociação de CT-e
 */
async function respondToCTeNegotiation(
  chatId, 
  shipperId, 
  action, 
  counterProposal = null,
  message = null
) {
  const chat = await db('chats')
    .where('id', chatId)
    .first();
  
  if (!chat) {
    throw new Error('Chat não encontrado');
  }
  
  if (chat.shipper_id !== shipperId) {
    throw new Error('Não autorizado');
  }
  
  if (chat.status !== 'awaiting_shipper') {
    throw new Error('Chat não está aguardando resposta do embarcador');
  }
  
  const messages = JSON.parse(chat.messages || '[]');
  
  return await db.transaction(async (trx) => {
    if (action === 'approve') {
      // APROVAR proposta
      messages.push({
        id: messages.length + 1,
        sender: 'shipper',
        senderId: shipperId,
        message: message || 'Proposta aprovada',
        messageType: 'approval',
        datetime: new Date().toISOString()
      });
      
      await trx('chats')
        .where('id', chatId)
        .update({
          messages: JSON.stringify(messages),
          status: 'approved',
          approved_at: new Date(),
          updated_at: new Date()
        });
      
      await trx('quotations')
        .where('id', chat.quotation_id)
        .update({
          final_shipper_value: chat.current_proposal_value,
          final_value: chat.current_proposal_value,
          cte_approved_by_shipper: true,
          cte_approval_datetime: new Date(),
          status: 'in_transit',
          updated_at: new Date()
        });
      
      // Notificar transportadora
      await trx('notifications').insert({
        user_id: chat.carrier_id,
        type: 'cte_approved',
        title: 'CT-e Aprovado',
        message: `O embarcador aprovou sua proposta de R$ ${chat.current_proposal_value.toFixed(2)}`,
        data: JSON.stringify({ chatId, quotationId: chat.quotation_id }),
        read: false,
        created_at: new Date()
      });
      
    } else if (action === 'reject') {
      // REJEITAR proposta
      const newAttempts = chat.negotiation_attempts + 1;
      
      if (newAttempts >= 2) {
        // Limite de tentativas atingido - cancelar cotação
        messages.push({
          id: messages.length + 1,
          sender: 'shipper',
          senderId: shipperId,
          message: message || 'Proposta rejeitada. Limite de tentativas atingido.',
          messageType: 'final_rejection',
          datetime: new Date().toISOString()
        });
        
        await trx('chats')
          .where('id', chatId)
          .update({
            messages: JSON.stringify(messages),
            status: 'rejected_final',
            rejection_reason: message,
            updated_at: new Date()
          });
        
        await trx('quotations')
          .where('id', chat.quotation_id)
          .update({
            status: 'cancelled',
            cancellation_reason: 'cte_negotiation_failed',
            cte_rejected_by_shipper: true,
            cancelled_at: new Date(),
            updated_at: new Date()
          });
        
        // Notificar transportadora
        await trx('notifications').insert({
          user_id: chat.carrier_id,
          type: 'quotation_cancelled',
          title: 'Cotação Cancelada',
          message: 'A cotação foi cancelada após 2 tentativas de negociação de CT-e',
          data: JSON.stringify({ chatId, quotationId: chat.quotation_id }),
          read: false,
          created_at: new Date()
        });
        
      } else {
        // Ainda há tentativas - permitir contraproposta ou nova tentativa
        messages.push({
          id: messages.length + 1,
          sender: 'shipper',
          senderId: shipperId,
          message: counterProposal 
            ? `Contraproposta: R$ ${counterProposal.toFixed(2)}${message ? ' - ' + message : ''}` 
            : (message || 'Proposta rejeitada'),
          messageType: counterProposal ? 'counter_proposal' : 'rejection',
          proposedValue: counterProposal,
          datetime: new Date().toISOString()
        });
        
        await trx('chats')
          .where('id', chatId)
          .update({
            messages: JSON.stringify(messages),
            negotiation_attempts: newAttempts,
            current_proposal_value: counterProposal || chat.current_proposal_value,
            status: 'awaiting_carrier',
            read_by_carrier: false,
            updated_at: new Date()
          });
        
        await trx('quotations')
          .where('id', chat.quotation_id)
          .update({
            status: 'awaiting_cte_approval',
            updated_at: new Date()
          });
        
        // Notificar transportadora
        await trx('notifications').insert({
          user_id: chat.carrier_id,
          type: 'cte_counter_proposal',
          title: counterProposal ? 'Contraproposta Recebida' : 'Proposta Rejeitada',
          message: counterProposal
            ? `O embarcador fez uma contraproposta de R$ ${counterProposal.toFixed(2)}`
            : 'O embarcador rejeitou sua proposta. Você tem mais uma tentativa.',
          data: JSON.stringify({ 
            chatId, 
            quotationId: chat.quotation_id,
            counterProposal,
            attemptsRemaining: 2 - newAttempts
          }),
          read: false,
          created_at: new Date()
        });
      }
    }
    
    return await trx('chats').where('id', chatId).first();
  });
}

/**
 * Transportadora responde à contraproposta
 */
async function respondToCounterProposal(chatId, carrierId, action, newProposal = null) {
  const chat = await db('chats')
    .where('id', chatId)
    .first();
  
  if (!chat) {
    throw new Error('Chat não encontrado');
  }
  
  if (chat.carrier_id !== carrierId) {
    throw new Error('Não autorizado');
  }
  
  if (chat.status !== 'awaiting_carrier') {
    throw new Error('Chat não está aguardando resposta da transportadora');
  }
  
  const messages = JSON.parse(chat.messages || '[]');
  
  if (action === 'accept') {
    // Aceitar contraproposta do embarcador
    return await respondToCTeNegotiation(
      chatId,
      chat.shipper_id,
      'approve',
      null,
      'Contraproposta aceita pela transportadora'
    );
  } else {
    // Nova proposta
    return await handleCTeNegotiation(
      chat.quotation_id,
      carrierId,
      newProposal,
      'Nova proposta após contraproposta'
    );
  }
}
```

## Timeout de Cotações

```javascript
/**
 * Fecha cotações expiradas automaticamente
 * Executar via cron job a cada 5 minutos
 */
async function closeExpiredQuotations() {
  const now = new Date();
  
  const expiredQuotations = await db('quotations')
    .where('status', 'open')
    .where('expiration_datetime', '<', now)
    .where('deleted_at', null);
  
  for (const quotation of expiredQuotations) {
    await db.transaction(async (trx) => {
      await trx('quotations')
        .where('id', quotation.id)
        .update({
          status: 'cancelled',
          cancellation_reason: 'expired',
          cancelled_at: now,
          updated_at: now
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
    });
  }
  
  return expiredQuotations.length;
}
```

## Sistema de Avaliações

```javascript
/**
 * Criar avaliação após entrega completa
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
    
    // Atualizar perfil
    const table = data.evaluatedType === 'carrier' ? 'carriers' : 'shippers';
    await trx(table)
      .where('id', evaluatedId)
      .update({
        average_rating: avgRating[0].average,
        rating_count: ratingCount[0].count,
        updated_at: new Date()
      });
    
    return rating;
  });
}
```
