# 🔍 AUTO SKILL DETECTOR
## Sistema Automático de Detecção & Roteamento de Skills

> **Objetivo:** Quando um agente lê o AGENT_OPERATIONAL_GUIDEBOOK e recebe uma tarefa, este arquivo automaticamente identifica qual SKILL usar e o redireciona.

**Status:** ✅ Integrado ao protocolo de leitura do guidebook

---

## 🎯 COMO FUNCIONA

### Fluxo Automático de Detecção

```
┌─ AGENTE RECEBE TAREFA ─┐
│                        │
├─→ Ler AGENT_OPERATIONAL_GUIDEBOOK (Seções 1-3)
│                        │
├─→ ATIVAR AUTO_SKILL_DETECTOR
│   ├─ Procurar palavras-chave na tarefa
│   ├─ Mapear para skill correspondente
│   └─ Acessar skill automaticamente
│                        │
├─→ Ler SKILL relevante (A-H)
│                        │
├─→ Implementar conforme checklist
│                        │
└─→ Validar + Deploy
```

---

## 📊 MAPEAMENTO AUTOMÁTICO

### Detectar por Palavras-Chave

#### 🛒 SKILL A - QUOTATION FLOW
**Ative se tarefa mencionar:**
- quotação, cotação, frete, proposta, coleta, entrega
- criar quotação, listar quotações, aceitar proposta
- rastreamento, entrega, status da quotação, pagamento de frete
- "novo frete", "meus fretes", "propostas recebidas"

**Auto-Link:** → [SKILLS_A_QUOTATION_FLOW.md](SKILLS_A_QUOTATION_FLOW.md)

**Checklist Automático:**
- [ ] Seção 1: Quotation Creation (se criar quotação)
- [ ] Seção 2: Discovery (se listar/buscar)
- [ ] Seção 3: Proposals (se gerenciar propostas)
- [ ] Seção 4: Acceptance (se aceitar/comparar)
- [ ] Seção 5: Delivery (se rastrear)
- [ ] Seção 6: Post-Delivery (se pagar/avaliar)

---

#### 💳 SKILL B - PAYMENT STRIPE (⭐ CRÍTICO)
**Ative se tarefa mencionar:**
- pagamento, stripe, cobrar, receber, pagar, reembolso
- checkout, cartão de crédito, créditos, saldo
- "processar pagamento", "webhook", "transação"
- reconciliação, auditoria de pagamentos, fraude
- "error no pagamento", "stripe integration"

**Auto-Link:** → [SKILLS_B_PAYMENT_STRIPE.md](SKILLS_B_PAYMENT_STRIPE.md)

**Checklist Automático:**
- [ ] Setup: tokens Stripe configurados
- [ ] Checkout: session creation implementada
- [ ] Webhooks: 4 webhooks (succeeded, failed, refunded, dispute)
- [ ] Credit: sistema de créditos funcionando
- [ ] Refund: lógica de reembolso
- [ ] Reconciliation: cron de reconciliação diária
- [ ] Audit: logging de todas as transações

---

#### 📝 SKILL C - FORMS & VALIDATION
**Ative se tarefa mencionar:**
- formulário, form, validação, validar
- "criar novo usuário", "editar perfil", "registrar"
- "campo obrigatório", "validar email", "CPF inválido"
- "React Hook Form", "Zod", "erro de validação"
- multi-step form, wizard

**Auto-Link:** → [SKILLS_C_FORMS_VALIDATION.md](SKILLS_C_FORMS_VALIDATION.md)

**Checklist Automático:**
- [ ] Schema Zod definido
- [ ] useFormWithValidation hook usado
- [ ] FormInput component reutilizado
- [ ] Validação async (ViaCEP, duplicatas)
- [ ] Real-time feedback implementado
- [ ] Error messages claras

---

#### 📊 SKILL D - DATA DISPLAY
**Ative se tarefa mencionar:**
- tabela, lista, exibir dados, relatório
- paginação, ordenação, filtro, busca
- "listar usuários", "lista de quotações", "export CSV"
- dashboard, grid, cards
- "perfomance", "muitos dados", "1000+ linhas"

**Auto-Link:** → [SKILLS_D_DATA_DISPLAY.md](SKILLS_D_DATA_DISPLAY.md)

**Checklist Automático:**
- [ ] DataTable component usado
- [ ] Sort/filter/paginate implementados
- [ ] Dark mode funcionando
- [ ] CSV export (se necessário)
- [ ] Empty state definido
- [ ] < 500ms render verificado

---

#### 🔔 SKILL E - NOTIFICATIONS & FEEDBACK
**Ative se tarefa mencionar:**
- notificação, toast, alerta, modal, popup
- "mostrar mensagem", "confirmar ação", "spinner"
- sucesso, erro, warning, info
- "user feedback", "UX feedback", "loading state"
- badge, status, progresso

**Auto-Link:** → [SKILLS_E_NOTIFICATIONS_FEEDBACK.md](SKILLS_E_NOTIFICATIONS_FEEDBACK.md)

**Checklist Automático:**
- [ ] Toast provider criado (Context)
- [ ] Toast types (success, error, warning, info)
- [ ] Modal component pronto
- [ ] ConfirmDialog para ações críticas
- [ ] Loading spinner em operações async
- [ ] Status badges com cores corretas

---

#### 🔄 SKILL F - REAL-TIME FEATURES
**Ative se tarefa mencionar:**
- chat, mensagem, real-time, instantâneo
- websocket, live update, notification push
- "digitando", typing indicator, presença
- "status mudou", broadcast, sync
- "tempo real", "atualização ao vivo"

**Auto-Link:** → [SKILLS_F_REALTIME_FEATURES.md](SKILLS_F_REALTIME_FEATURES.md)

**Checklist Automático:**
- [ ] WebSocket server (backend) setup
- [ ] Frontend hook (useWebSocket) criado
- [ ] Auth na conexão implementado
- [ ] Message routing configurado
- [ ] Chat UI com scroll automático
- [ ] Notification center widget
- [ ] Message latency < 100ms

---

#### 👮 SKILL G - ADMIN & MODERATION
**Ative se tarefa mencionar:**
- admin, dashboard, moderação, gerenciar
- "usuário suspenso", "audit log", "disputas"
- "análise", "estatísticas", "KPI"
- "ações administrativas", "compliance"
- admin panel, analytics, reports

**Auto-Link:** → [SKILLS_G_ADMIN_MODERATION.md](SKILLS_G_ADMIN_MODERATION.md)

**Checklist Automático:**
- [ ] Admin dashboard com KPIs
- [ ] User management (CRUD)
- [ ] Suspend/delete user functionality
- [ ] Audit log viewer
- [ ] Dispute resolution page
- [ ] Charts/analytics
- [ ] Admin permission guard

---

#### 📦 SKILL H - PRODUCT & CUSTOMER
**Ative se tarefa mencionar:**
- produto, cliente, cadastro, perfil
- "NCM", "código de classificação", "estoque"
- "perfil do usuário", "histórico", "duplicata"
- "editar cliente", "importar produtos", "validação"
- customer management, product registry

**Auto-Link:** → [SKILLS_H_PRODUCT_CUSTOMER.md](SKILLS_H_PRODUCT_CUSTOMER.md)

**Checklist Automático:**
- [ ] Product CRUD com validação NCM
- [ ] Customer profile com histórico
- [ ] Validation de duplicatas (CPF/email)
- [ ] CSV import/export
- [ ] Activity timeline
- [ ] Data integrity checks

---

## 🚀 COMO USAR AUTO_SKILL_DETECTOR

### Para Agentes (Automático)

**Quando receber uma tarefa:**

1. **Ler guidebook** (obrigatório)
   ```bash
   # Seções 1-3 SEMPRE
   AGENT_OPERATIONAL_GUIDEBOOK.md (linhas 1-300)
   ```

2. **Ativar auto-detector**
   ```
   Procure por palavras-chave na sua tarefa
   Cruze com tabela acima
   Acesse skill automaticamente
   ```

3. **Exemplo de fluxo automático:**
   ```
   Tarefa: "Preciso criar um formulário para registro de novo usuário"
   
   Palavras-chave detectadas: "formulário", "registro", "novo usuário", "validar"
   
   ↓ AUTO-MAPEAMENTO ↓
   
   Skill detectado: SKILL C (Forms & Validation)
   
   Auto-link: [SKILLS_C_FORMS_VALIDATION.md](SKILLS_C_FORMS_VALIDATION.md)
   
   Ações automáticas:
   ├─ Ler SKILL C
   ├─ Procurar schema "registroSchema"
   ├─ Usar "useFormWithValidation" hook
   ├─ Implementar FormInput components
   └─ Validar com checklist de SKILL C
   ```

4. **Validar implementação**
   ```bash
   npm run agent:validate  # 10/10 rules
   npm run build           # Zero errors
   ```

---

### Para Programadores Manual

**Se quiser usar manualmente:**

```javascript
// 1. Identifique a tarefa
const taskDescription = "Criar formulário de quotação";

// 2. Procure palavras-chave
const keywords = taskDescription.toLowerCase();
// "quotação" detectado

// 3. Route para skill
if (keywords.includes('quotação') || keywords.includes('cotação')) {
  // Ir para SKILLS_A_QUOTATION_FLOW.md
  // Seção: "Criação de Quotação"
}
```

---

## 🎯 SKILL SELECTION DECISION TREE

```
┌─ É sobre QUOTAÇÃO? ─────────→ SKILL A (Quotation Flow)
│
├─ É sobre PAGAMENTO? ───────→ SKILL B (Payment Stripe)
│
├─ É sobre FORMULÁRIO? ──────→ SKILL C (Forms & Validation)
│
├─ É sobre EXIBIR DADOS? ────→ SKILL D (Data Display)
│
├─ É sobre FEEDBACK/NOTIF? ──→ SKILL E (Notifications)
│
├─ É sobre REAL-TIME/CHAT? ──→ SKILL F (Real-Time)
│
├─ É sobre ADMIN/AUDIT? ─────→ SKILL G (Admin & Moderation)
│
└─ É sobre PRODUTO/CLIENTE? ─→ SKILL H (Product & Customer)

Não tem certeza? → Procure na tabela acima (Mapeamento Automático)
```

---

## 🔗 INTEGRAÇÃO COM GUIDEBOOK

### Seção do Guidebook a Adicionar

**Add to AGENT_OPERATIONAL_GUIDEBOOK.md (após "READING PROTOCOL"):**

```markdown
### ⚡ AUTO SKILL DETECTION (NEW!)

When you identify a task category:

1. **Has quotation/frete/proposta keywords?** → [SKILL A](SKILLS_A_QUOTATION_FLOW.md)
2. **Has payment/stripe/pagamento keywords?** → [SKILL B](SKILLS_B_PAYMENT_STRIPE.md)
3. **Has form/validação/campo keywords?** → [SKILL C](SKILLS_C_FORMS_VALIDATION.md)
4. **Has tabela/lista/relatório keywords?** → [SKILL D](SKILLS_D_DATA_DISPLAY.md)
5. **Has notificação/toast/modal keywords?** → [SKILL E](SKILLS_E_NOTIFICATIONS_FEEDBACK.md)
6. **Has chat/real-time/websocket keywords?** → [SKILL F](SKILLS_F_REALTIME_FEATURES.md)
7. **Has admin/audit/moderação keywords?** → [SKILL G](SKILLS_G_ADMIN_MODERATION.md)
8. **Has produto/cliente/cadastro keywords?** → [SKILL H](SKILLS_H_PRODUCT_CUSTOMER.md)

**See:** [AUTO_SKILL_DETECTOR.md](AUTO_SKILL_DETECTOR.md) for full mapping table.
```

---

## 📋 TRACKING AUTO-DETECTION RESULTS

**Opcional: Documentar quais skills foram usados**

```markdown
# Task Execution Log

**Task:** Criar formulário de nova quotação

**Auto-Detection Results:**
- Keywords found: quotação, formulário, validação
- Skills identified: SKILL A (for quotation logic) + SKILL C (for form)
- Primary: SKILL A
- Secondary: SKILL C
- Ler: SKILLS_A_QUOTATION_FLOW.md (Seção 1) + SKILLS_C_FORMS_VALIDATION.md

**Sections Used:**
- ✅ SKILL A, Seção 1 (Quotation Creation)
- ✅ SKILL C, completo (Form setup + validation)

**Implementation:**
- ✅ Multi-step form created
- ✅ Zod validation implemented
- ✅ FormInput components used
- ✅ Real-time feedback added

**Validation:**
- ✅ npm run agent:validate (10/10 ✓)
- ✅ npm run build (0 errors)
```

---

## ✅ VERIFICAÇÃO: ESTE SISTEMA JÁ EXISTE?

**Resposta: NÃO (Até agora)**

- ❌ AGENT_OPERATIONAL_GUIDEBOOK é manual (requer leitura e identificação manual)
- ❌ Não há auto-deteção de skill
- ❌ Não há roteamento automático
- ❌ Não há mapeamento de palavras-chave

**COM ESTE ARQUIVO:**
- ✅ Auto-deteção de skill por palavras-chave
- ✅ Roteamento automático para skill correta
- ✅ Checklist automático por skill
- ✅ Decision tree para ambiguidade

---

## 🚀 COMO ATIVAR?

### 1️⃣ Agentes Usam Automaticamente

Toda vez que receberem tarefa:
1. Leem AGENT_OPERATIONAL_GUIDEBOOK (seções 1-3)
2. Ativam AUTO_SKILL_DETECTOR mentalmente
3. Identificam palavras-chave
4. Acessam skill correspondente
5. Implementam seguindo checklist

### 2️⃣ Integrar ao Protocolo

Adicionar seção ao guidebook referenciando este arquivo (vide seção acima).

### 3️⃣ Adicionar Comentário em App.jsx

```javascript
// src/App.jsx

/*
🔍 AUTO SKILL DETECTOR ACTIVE

Quando trabalhar neste arquivo:
1. Leia AGENT_OPERATIONAL_GUIDEBOOK.md (Seções 1-3)
2. Ative AUTO_SKILL_DETECTOR.md (detectar skill)
3. Acesse skill correspondente (SKILLS_A a SKILLS_H)
4. Implemente seguindo checklist da skill

Exemplo:
  - Tarefa: "Criar quotação"
  - Palavras-chave: quotação, forma
  - Skills: SKILL A (Quotation) + SKILL C (Forms)
  - Action: Ler [SKILLS_A](SKILLS_A_QUOTATION_FLOW.md) + [SKILLS_C](SKILLS_C_FORMS_VALIDATION.md)

Veja: AUTO_SKILL_DETECTOR.md para mapeamento completo
*/
```

---

## 📊 EXEMPLO COMPLETO

### Cenário: "Criar página de chat para quotação"

**Entrada:** `Tarefa: Implementar chat entre embarcador e transportador para discussion sobre quotação`

**Auto-Detection Process:**

```
1. PROCURAR PALAVRAS-CHAVE
   ├─ "chat" ✓
   ├─ "quotação" ✓
   ├─ "real-time" ou "instantâneo"? (opcional)
   └─ "implementar" = confirmação

2. MAPEAR PARA SKILLS
   Chat + quotação:
   ├─ SKILL A (Quotation Flow - secs 5: delivery tracking)
   ├─ SKILL F (Real-Time Features - chat component)
   └─ SKILL E (Notifications - toast feedback)

3. PRIORIDADE
   ├─ PRIMARY: SKILL F (chat é o core)
   ├─ SECONDARY: SKILL A (understanding quotation context)
   └─ TERTIARY: SKILL E (user feedback)

4. AUTO-LINKS
   → [SKILLS_F_REALTIME_FEATURES.md](SKILLS_F_REALTIME_FEATURES.md)
   → [SKILLS_A_QUOTATION_FLOW.md](SKILLS_A_QUOTATION_FLOW.md) (seção 5)
   → [SKILLS_E_NOTIFICATIONS_FEEDBACK.md](SKILLS_E_NOTIFICATIONS_FEEDBACK.md)

5. IMPLEMENTAÇÃO
   ├─ Ler SKILL F (WebSocket setup, Chat component)
   ├─ Ler SKILL A (Seção 5 - Delivery, sobre status updates)
   ├─ Ler SKILL E (Toast para mensagens)
   └─ Implementar conforme checklists

6. VALIDAÇÃO
   ✅ npm run agent:validate
   ✅ npm run build
   ✅ npm run test
```

**Resultado:** Agente automaticamente acessa 3 skills + implementa sem precisar de instrução manual adicional!

---

## 🎊 STATUS FINAL

✅ **AUTO_SKILL_DETECTOR.md criado**  
✅ **Mapeamento completo (Palavras-chave → Habilidades)**  
✅ **Decision tree para ambiguidades**  
✅ **Exemplos de uso inclusos**  
✅ **Pronto para integração ao protocolo**  

**Próximo:** Agentes leem guidebook + este arquivo = automaticamente saem sabendo qual skill usar!

---

**Uso:** Leia AGENT_OPERATIONAL_GUIDEBOOK.md → Consulte AUTO_SKILL_DETECTOR.md → Vá para SKILL correspondente!
