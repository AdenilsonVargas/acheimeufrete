# 💳 SKILL B: PAYMENT INTEGRATION MASTERY
## Stripe + Sistema de Créditos (CRÍTICO - Zero Erros)

> **OBJETIVO:** Integração Stripe PERFEITA, rastreamento completo, reconciliação automática, zero fraudes

⚠️ **CRÍTICO:** Este é o sistema financeiro da plataforma. Qualquer erro = perda de confiança + multas regulatórias.

---

## 📋 TABELA DE CONTEÚDOS

1. [Stripe Integration](#1-stripe-integration)
2. [Credit System](#2-credit-system)
3. [Payment Processing](#3-payment-processing)
4. [Error Handling & Recovery](#4-error-handling--recovery)
5. [Reconciliation & Auditing](#5-reconciliation--auditing)

---

## 1. STRIPE INTEGRATION

### 🔐 Setup Essencial

```javascript
// backend/config/stripe.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Validações na inicialização
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY não configurada!');
}

if (!process.env.STRIPE_PUBLISHABLE_KEY) {
  throw new Error('STRIPE_PUBLISHABLE_KEY não configurada!');
}

// Webhook signing
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
if (!WEBHOOK_SECRET) {
  console.warn('⚠️ STRIPE_WEBHOOK_SECRET não configurada - CRÍTICO em produção!');
}
```

### 📊 Account Setup
- [ ] Conectar conta Stripe (não OAuth - conta própria)
- [ ] Configurar webhooks:
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `charge.refunded`
  - `charge.dispute.created`
  - `customer.subscription.deleted`

- [ ] Configurar customer records:
  - Cada transportador = customer Stripe
  - Metadata: transportador_id, user_email
  - Default payment method salvo

---

## 2. CREDIT SYSTEM

### 💰 Fluxo de Créditos

```
┌─────────────────────────────────────────┐
│ EMBARCADOR PAGA PELO FRETE              │
│ (R$ 2.500 para transportador)           │
└─────────────┬───────────────────────────┘
              │
              ↓
┌─────────────────────────────────────────┐
│ STRIPE RECEBE PAGAMENTO                 │
│ (Acrescenta taxa: 2.99% + R$ 0,30)      │
│ Plataforma fica com Y%                  │
└─────────────┬───────────────────────────┘
              │
              ↓
┌─────────────────────────────────────────┐
│ GERAR CRÉDITOS PARA TRANSPORTADOR       │
│ Credits = (valor - taxa - refund%)      │
└─────────────┬───────────────────────────┘
              │
              ↓
┌─────────────────────────────────────────┐
│ TRANSPORTADOR PODE SACAR (1x/semana)    │
│ OU usar credits em nova cotação         │
└─────────────────────────────────────────┘
```

### ✅ Checklist - Credit Table
```sql
-- Tabela de créditos
CREATE TABLE "Credit" (
  id UUID PRIMARY KEY,
  transportadorId UUID NOT NULL,
  quantidade DECIMAL(10, 2),  -- R$ em créditos
  origem ENUM('frete_pago', 'devolvido', 'bonus'),
  freteId UUID,
  status ENUM('pendente', 'disponivel', 'utilizado', 'sacado'),
  criadoEm TIMESTAMP DEFAULT NOW(),
  expiraEm TIMESTAMP,  -- créditos expiram em 90 dias
  PRIMARY KEY (id),
  FOREIGN KEY (transportadorId) REFERENCES User(id)
);

-- Histórico de movimentação
CREATE TABLE "CreditHistory" (
  id UUID PRIMARY KEY,
  creditId UUID NOT NULL,
  transportadorId UUID NOT NULL,
  tipo ENUM('deposito', 'saque', 'utilizacao', 'cancelamento'),
  valor DECIMAL(10, 2),
  descricao VARCHAR(255),
  dataMovimento TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (creditId) REFERENCES Credit(id),
  FOREIGN KEY (transportadorId) REFERENCES User(id)
);
```

### 💳 Saldo de Créditos
- [ ] **Widget de Saldo**
  ```
  Saldo disponível: R$ 1.250,50
  [Sacar →]  [Usar em novo frete →]
  
  Próxima renovação: 15/02 (créditos expiram em 90 dias)
  Últimas movimentações:
  ├─ +R$ 500 (Frete #123 - PAGO) - 20/01
  ├─ -R$ 200 (Saque para conta) - 18/01
  └─ +R$ 300 (Crédito referência) - 15/01
  ```

- [ ] **Expiração:** Créditos expiram em 90 dias (configurável)
- [ ] **Resgate:** Mínimo R$ 100, máximo ao saldo disponível
- [ ] **Transferência:** Via Stripe Payout (automático semanalmente)

---

## 3. PAYMENT PROCESSING

### 🛒 Checkout Flow

#### **Passo 1: Preparar Stripe Session**
```javascript
// POST /api/pagamentos/criar-sessao
router.post('/criar-sessao', authenticateToken, async (req, res) => {
  const { freteId } = req.body;
  
  try {
    // 1. Validar frete
    const frete = await prisma.frete.findUnique({
      where: { id: freteId },
      include: { proposta: true }
    });
    
    if (!frete) return res.status(404).json({ erro: 'Frete não encontrado' });
    if (frete.status !== 'aceita') return res.status(400).json({ erro: 'Status inválido' });
    if (frete.pagamentoStatus === 'pago') return res.status(400).json({ erro: 'Já pago' });
    
    // 2. Validar embarcador é criador
    if (frete.embarcadorId !== req.userId) {
      return res.status(403).json({ erro: 'Sem permissão' });
    }
    
    // 3. Calcular valores
    const valorFrete = frete.proposta.valor;
    const taxaStripe = Math.ceil((valorFrete * 0.0299 + 0.30) * 100) / 100;
    const totalCents = Math.round((valorFrete + taxaStripe) * 100);
    
    // 4. Criar Stripe Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer: frete.transportador.stripeCustomerId,
      line_items: [{
        price_data: {
          currency: 'brl',
          product_data: {
            name: `Frete ${frete.id}`,
            description: `Origem: ${frete.cidadeOrigem} → Destino: ${frete.cidadeDestino}`
          },
          unit_amount: totalCents
        },
        quantity: 1
      }],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/pagamento/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/meu-frete/${freteId}?cancelled=true`,
      metadata: {
        freteId: frete.id,
        transportadorId: frete.transportadorId,
        embarcadorId: frete.embarcadorId,
        valorOriginal: valorFrete.toString()
      }
    });
    
    // 5. Salvar tentativa de pagamento (log)
    await prisma.pagamento.create({
      data: {
        freteId,
        status: 'esperando_confirmacao',
        stripeSessionId: session.id,
        valoresCalculados: {
          valorFrete,
          taxaStripe,
          total: valorFrete + taxaStripe
        }
      }
    });
    
    res.json({ sessionId: session.id, clientSecret: session.payment_info });
  } catch (error) {
    logger.error(`Erro ao criar sessão Stripe: ${error.message}`, { freteId, userId: req.userId });
    res.status(500).json({ erro: 'Erro ao processar pagamento' });
  }
});
```

#### **Passo 2: Frontend - Stripe Elements**
```javascript
// pages/Pagamento.jsx
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export default function PaginaCheckout({ freteId }) {
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);
  
  const handleCheckout = async () => {
    try {
      setCarregando(true);
      const response = await apiClient.post('/pagamentos/criar-sessao', { freteId });
      const stripe = await stripePromise;
      
      await stripe.redirectToCheckout({ sessionId: response.sessionId });
    } catch (err) {
      setErro('Erro ao iniciar checkout');
      logger.error(err);
    } finally {
      setCarregando(false);
    }
  };
  
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm onSubmit={handleCheckout} carregando={carregando} erro={erro} />
    </Elements>
  );
}
```

#### **Passo 3: Webhook - Confirmar Pagamento**
```javascript
// backend/routes/webhooks.js
const handlePaymentSuccess = async (paymentIntent) => {
  const { freteId, transportadorId } = paymentIntent.metadata;
  
  try {
    // 1. Buscar frete
    const frete = await prisma.frete.findUnique({ where: { id: freteId } });
    if (!frete) {
      logger.error(`Frete não encontrado: ${freteId}`);
      return;
    }
    
    // 2. Marcar como pago
    await prisma.frete.update({
      where: { id: freteId },
      data: {
        pagamentoStatus: 'pago',
        pagamentoData: new Date(),
        stripePaymentIntentId: paymentIntent.id,
        status: 'pagando'  // Próximo status antes de liberar saque
      }
    });
    
    // 3. Criar crédito para transportador
    const valorOriginal = parseFloat(paymentIntent.metadata.valorOriginal);
    const taxa = paymentIntent.amount / 100 - valorOriginal;
    const creditoDisponivel = valorOriginal - (taxa * 0.5);  // Plataforma fica com 50% da taxa
    
    const credito = await prisma.credit.create({
      data: {
        transportadorId,
        quantidade: creditoDisponivel,
        origem: 'frete_pago',
        freteId,
        status: 'pendente',
        expiraEm: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      }
    });
    
    // 4. Registrar histórico
    await prisma.creditHistory.create({
      data: {
        creditId: credito.id,
        transportadorId,
        tipo: 'deposito',
        valor: creditoDisponivel,
        descricao: `Pagamento recebido - Frete #${freteId}`
      }
    });
    
    // 5. Enviar email
    await sendEmail({
      to: frete.transportador.email,
      subject: 'Pagamento Recebido com Sucesso',
      template: 'payment-received',
      data: {
        freteId,
        valor: creditoDisponivel,
        dataVencimento: credito.expiraEm
      }
    });
    
    // 6. Log de auditoria
    logger.info(`Pagamento processado com sucesso`, {
      freteId,
      transportadorId,
      valor: valorOriginal,
      credito: creditoDisponivel,
      stripeId: paymentIntent.id
    });
  } catch (error) {
    logger.error(`Erro ao processar webhook de sucesso: ${error.message}`, {
      freteId,
      paymentIntentId: paymentIntent.id
    });
    // Enviar alerta para admin
    await sendAlertToAdmins(`Erro ao processar pagamento`, { error: error.message, paymentIntent });
  }
};

const handlePaymentFailed = async (paymentIntent) => {
  const { freteId, transportadorId } = paymentIntent.metadata;
  
  logger.warn(`Pagamento falhou`, { freteId, reason: paymentIntent.last_payment_error });
  
  // Enviar email ao embarcador
  await sendEmail({
    to: frete.embarcador.email,
    subject: 'Falha no Pagamento do Frete',
    template: 'payment-failed',
    data: { freteId, razao: paymentIntent.last_payment_error.message }
  });
};
```

---

## 4. ERROR HANDLING & RECOVERY

### 🚨 Cenários de Erro

| Erro | Causa | Solução |
|------|-------|---------|
| `card_declined` | Cartão rejeitado | Sugerir outro cartão / Pix |
| `insufficient_funds` | Sem saldo | Sugerir outro paga mento |
| `expired_card` | Cartão expirado | Pedir novo cartão |
| `processing_error` | Timeout Stripe | Retry automático (3x) |
| `authentication_required` | 3D Secure | Autenticar no app Stripe |
| `duplicate` | Mesmo pagamento 2x | Verificar e notificar |

### ✅ Retry Logic
```javascript
// Função de retry para pagamentos falhos
const retryPayment = async (freteId, maxRetries = 3) => {
  let tentativa = 0;
  
  while (tentativa < maxRetries) {
    try {
      const frete = await prisma.frete.findUnique({ where: { id: freteId } });
      const session = await stripe.checkout.sessions.create({...});
      
      // If successful, break
      return session;
    } catch (error) {
      tentativa++;
      
      if (tentativa >= maxRetries) {
        // Notificar embarcador depois de 3 tentativas
        await notifyEmbarcador(frete.embarcadorId, 'Falha persistente no pagamento', { freteId });
        throw new Error(`Falha após ${maxRetries} tentativas`);
      }
      
      // Wait antes de retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, tentativa) * 1000));
    }
  }
};
```

### 🔐 Refund Logic
```javascript
// POST /api/pagamentos/reembolsar
router.post('/reembolsar', authenticateTokenAdmin, async (req, res) => {
  const { freteId, motivo } = req.body;
  
  try {
    // 1. Buscar frete pago
    const frete = await prisma.frete.findUnique({
      where: { id: freteId },
      include: { pagamento: true }
    });
    
    if (frete.pagamento.status !== 'pago') {
      return res.status(400).json({ erro: 'Frete não foi pago' });
    }
    
    // 2. Criar reembolso no Stripe
    const refund = await stripe.refunds.create({
      payment_intent: frete.pagamento.stripePaymentIntentId,
      reason: motivo || 'requested_by_customer',
      metadata: { freteId, motivo }
    });
    
    // 3. Debitar crédito do transportador (reverter)
    const credito = await prisma.credit.findFirst({
      where: { freteId, status: 'disponivel' }
    });
    
    if (credito) {
      await prisma.creditHistory.create({
        data: {
          creditId: credito.id,
          transportadorId: frete.transportadorId,
          tipo: 'cancelamento',
          valor: -credito.quantidade,
          descricao: `Reembolso - ${motivo}`
        }
      });
      
      await prisma.credit.update({
        where: { id: credito.id },
        data: { status: 'cancelado' }
      });
    }
    
    // 4. Log de auditoria
    logger.info('Reembolso processado', {
      freteId,
      transportadorId: frete.transportadorId,
      valor: frete.proposta.valor,
      motivo,
      stripeRefundId: refund.id
    });
    
    res.json({ sucesso: true, refundId: refund.id });
  } catch (error) {
    logger.error(`Erro ao reembolsar`, { error, freteId });
    res.status(500).json({ erro: 'Erro ao processar reembolso' });
  }
});
```

---

## 5. RECONCILIATION & AUDITING

### 📊 Reconciliação Diária
```javascript
// Cron: Roda todo dia às 2h da manhã
const reconciliarPagamentos = async () => {
  logger.info('🔄 Iniciando reconciliação diária de pagamentos...');
  
  try {
    // 1. Buscar todas as transações Stripe dos últimos 24h
    const stripeTransactions = await stripe.charges.list({
      created: {
        gte: Math.floor(Date.now() / 1000) - 86400
      }
    });
    
    // 2. Comparar com banco de dados
    for (const charge of stripeTransactions.data) {
      const pagamento = await prisma.pagamento.findFirst({
        where: { stripePaymentIntentId: charge.payment_intent }
      });
      
      if (!pagamento) {
        logger.warn(`Transação Stripe não mapeada: ${charge.id}`, { charge });
        // Alertar admin
        await sendAlertToAdmins(`Transação não mapeada`, { chargeId: charge.id });
        continue;
      }
      
      // Verificar consistência
      if (pagamento.status !== 'pago' && charge.paid) {
        logger.warn(`Inconsistência: Charge pago mas pagamento não marcado`, { chargeId: charge.id });
        // Auto-corrigir
        await prisma.pagamento.update({
          where: { id: pagamento.id },
          data: { status: 'pago' }
        });
      }
    }
    
    logger.info('✅ Reconciliação concluída com sucesso');
  } catch (error) {
    logger.error(`❌ Erro na reconciliação`, { error });
    await sendAlertToAdmins(`Erro na reconciliação de pagamentos`, { error: error.message });
  }
};
```

### 📋 Audit Log
```sql
CREATE TABLE "PagamentoLog" (
  id UUID PRIMARY KEY,
  pagamentoId UUID NOT NULL,
  acao VARCHAR(50),  -- criado, pago, reembolsado, falhou
  detalhes JSON,
  usuarioId UUID,
  ipAddress VARCHAR(50),
  userAgent VARCHAR(500),
  timestamp TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (pagamentoId) REFERENCES Pagamento(id)
);
```

### 🛡️ Compliance Features
- [ ] **PCI Compliance:** Nunca armazenar dados de cartão (Stripe Element)
- [ ] **Fraude Detection:** Alertas para transações suspeitas
- [ ] **Reporte de Bots:** Detecção de múltiplos pagamentos falhados
- [ ] **LGPD:** Criptografar dados sensíveis em repouso
- [ ] **Conformidade fiscal:** Gerar notas fiscais de serviços (NFS-e)

---

## 🎯 Success Metrics
✅ 99.9% de taxa de sucesso em pagamentos  
✅ Zero inconsistências entre Stripe e DB  
✅ < 10 segundos para processar confirmação  
✅ 100% de auditoria (cada transação logada)  
✅ < 0.5% de taxa de fraude  
✅ Reconciliação diária 100% automática  

---

**Próxima Skill:** SKILL C - Admin & Moderation System
