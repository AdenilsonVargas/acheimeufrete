# 📚 ACHEI MEU FRETE - SKILLS INDEX
## Índice Central de Todas as Skills de Desenvolvimento

---

## 🎯 Overview - Escolha sua Skill

Este é o **repositório centralizado** de padrões, componentes e implementações da plataforma Achei Meu Frete.

**8 Skills Complementares:**

| # | Skill | Foco | Quando Usar |
|---|-------|------|-----------|
| **A** | [Quotation Flow](#skill-a-quotation-flow) | Fluxo completo de cotações | Criar, buscar, aceitar, entregar, pagar quotações |
| **B** | [Payment Stripe](#skill-b-payment-stripe) | Integração Stripe + Créditos | Pagamentos, webhooks, reembolsos, reconciliação |
| **C** | [Forms & Validation](#skill-c-forms--validation) | React Hook Form + Zod | Criar formulários, validar dados, error handling |
| **D** | [Data Display](#skill-d-data-display) | Tabelas, paginação, filtros | Exibir listas, tabelas, exportar dados |
| **E** | [Notifications](#skill-e-notifications--feedback) | Toasts, modals, loading states | Feedback visual, confirmações, spinners |
| **F** | [Real-Time Features](#skill-f-real-time-features) | WebSocket, chat, status updates | Chat, notificações push, updates instantâneos |
| **G** | [Admin & Moderation](#skill-g-admin--moderation) | Dashboard, audit, disputes | Gerenciar usuários, auditoria, resolved conflitos |
| **H** | [Product & Customer](#skill-h-product--customer) | Cadastro, validação, import | Produtos, perfis, duplicatas, bulk import |

---

## 📖 SKILLS DETALHADAS

### SKILL A: QUOTATION FLOW
**Arquivo:** [SKILLS_A_QUOTATION_FLOW.md](SKILLS_A_QUOTATION_FLOW.md)

Cobre o **ciclo completo de uma quotação** desde a criação até o pagamento.

**Seções:**
1. **Criação de Quotação** - Form multi-step, validação ViaCEP, cálculo de dimensões
2. **Descoberta de Quotações** - Busca, filtros, paginação, cards com status
3. **Gerenciamento de Propostas** - Transportadores enviam propostas, validação de documentos
4. **Aceitação de Quotação** - Embarcador compara propostas, seleciona, gera contrato
5. **Entrega e Rastreamento** - 4-status: Aguardando → Transporte → Entregue → Pagamento
6. **Pós-Entrega** - Rating, confirmação de pagamento, archive

**Checklist de Implementação:**
- [ ] Multi-step form com progress bar
- [ ] ViaCEP API integration com validação
- [ ] NCM search (10.507 códigos)
- [ ] Google Maps para origin/destination
- [ ] Document upload (CTE, CIOT, MDF-e)
- [ ] Real-time status updates
- [ ] Payment confirmation flow
- [ ] Rating & review system
- [ ] CSV export de quotações

**Recursos Críticos:**
- Form validation em cada step
- Rate limiting para ViaCEP
- CSRF protection em uploads
- Audit logging de cada mudança de status
- Data de coleta validada (futura)
- Dimensões dentro de limites (50 ton máx)

---

### SKILL B: PAYMENT STRIPE
**Arquivo:** [SKILLS_B_PAYMENT_STRIPE.md](SKILLS_B_PAYMENT_STRIPE.md)

**CRÍTICO:** Sistema financeiro com zero erros, reconciliação automática.

**Seções:**
1. **Stripe Integration** - Setup da conta, webhooks, customer records
2. **Credit System** - Créditos para transportadores, expiração em 90 dias
3. **Payment Processing** - Checkout flow, confirmação via webhook
4. **Error Handling** - Retry logic, refunds, dispute resolution
5. **Reconciliation & Auditing** - Daily reconciliation, compliance PCI

**Checklist:**
- [ ] Stripe account connected (não OAuth)
- [ ] 4 webhooks configurados (payment_intent.succeeded, failed, refunded, dispute)
- [ ] Customer records com metadata
- [ ] Credit table & history
- [ ] Widget de saldo em dashboard
- [ ] Checkout session criação
- [ ] Webhook validation & signature verification
- [ ] Crédito expiração automática (90 dias)
- [ ] Retry automático (exponential backoff)
- [ ] Refund logic com auditoria
- [ ] Daily reconciliation cron job
- [ ] PCI compliance checklist
- [ ] Fraud detection alerts

**Valores Críticos:**
- Stripe fee rate: 2.99% + R$ 0,30
- Plataforma takes: 50% da taxa
- Transportador fica com: valor - taxa - (taxa × 0.5)
- Min saque: R$ 100
- Frequência: 1x/semana automático
- Expiração crédito: 90 dias

---

### SKILL C: FORMS & VALIDATION
**Arquivo:** [SKILLS_C_FORMS_VALIDATION.md](SKILLS_C_FORMS_VALIDATION.md)

Padrão **unified** para todos os formulários da plataforma.

**Seções:**
1. **Setup Essencial** - React Hook Form + Zod (hook customizado)
2. **Schemas Reutilizáveis** - Login, registro, quotação, perfil
3. **Componentes Base** - FormInput, botões, validação inline
4. **Error Handling** - Validação async, erros do servidor
5. **Acessibilidade** - WCAG 2.1 AA compliance

**Padrões de Validação:**
- Email: format + lowercase
- Senha: min 8 chars, maiúscula, número, caractere especial
- CPF/CNPJ: algorítmico + check duplicata
- CEP: ViaCEP validation
- NCM: 8 dígitos, digits only
- Telefone: (XX) XXXXX-XXXX format
- Data: must be future, etc

**Checklist:**
- [ ] useFormWithValidation hook criado
- [ ] Todos os schemas definidos (auth, quotação, perfil, produtos)
- [ ] FormInput component com icons + error display
- [ ] Multi-step form com progress bar
- [ ] Validação async (ViaCEP, duplicatas)
- [ ] Real-time validation feedback
- [ ] Server-side error mapping
- [ ] Accessibility labels (aria-label, aria-describedby)
- [ ] Focus management em modals/dialogs

---

### SKILL D: DATA DISPLAY
**Arquivo:** [SKILLS_D_DATA_DISPLAY.md](SKILLS_D_DATA_DISPLAY.md)

Componente **DataTable reutilizável** para toda a plataforma.

**Seções:**
1. **DataTable Component** - Sorting, filtering, pagination, dark mode
2. **Uso em Lista de Quotações** - Exemplo prático
3. **Empty States** - Skeleton loading, no results state
4. **Features:**
   - Busca full-text
   - Ordenação multi-coluna
   - Paginação (10, 15, 25 items/página)
   - Dark mode automático
   - CSV export
   - Selection (checkboxes)
   - Responsive grid

**Checklist:**
- [ ] DataTable component criado (reusável)
- [ ] Sort icons (chevron up/down)
- [ ] Real-time search filter
- [ ] Pagination controls
- [ ] Loading skeleton
- [ ] Empty state component
- [ ] Export CSV functionality
- [ ] Dark mode working
- [ ] Acessível (WCAG AA)
- [ ] Performance: < 500ms render (1K+ rows)

---

### SKILL E: NOTIFICATIONS & FEEDBACK
**Arquivo:** [SKILLS_E_NOTIFICATIONS_FEEDBACK.md](SKILLS_E_NOTIFICATIONS_FEEDBACK.md)

Sistema de **feedback visual** profissional e usado em toda plataforma.

**Seções:**
1. **Toast System** - Success, error, warning, info (contexto global)
2. **Modal System** - Generic + ConfirmDialog
3. **Loading States** - Spinner, full-screen, button loading
4. **Status Badges** - Cores por status (ativa, aguardando, etc)

**Toast Types:**
- ✅ `success` - Verde, icon CheckCircle
- ❌ `error` - Vermelho, icon AlertCircle
- ⚠️ `warning` - Amarelo, icon AlertTriangle
- ℹ️ `info` - Azul, icon Info

**Badges (Status):**
- ativa → Green
- aguardando → Yellow
- aceita → Blue
- entregando → Purple
- entregue → Cyan
- pagando → Orange
- cancelada → Gray

**Checklist:**
- [ ] Toast provider + hook criado
- [ ] Toast icons (success, error, warning, info)
- [ ] Auto-dismiss (3s default)
- [ ] Modal base component
- [ ] ConfirmDialog component
- [ ] LoadingSpinner (3 sizes)
- [ ] Button loading state
- [ ] Badge component (todos os status)
- [ ] Dark mode em tudo
- [ ] A11y: role="alert" em toasts

---

### SKILL F: REAL-TIME FEATURES
**Arquivo:** [SKILLS_F_REALTIME_FEATURES.md](SKILLS_F_REALTIME_FEATURES.md)

**WebSocket patterns** para chat, notifications, status updates.

**Seções:**
1. **Backend WebSocket Server** - Autenticação, message routing, typing indicators
2. **Frontend Hook** - useWebSocket custom hook
3. **Chat Component** - UI, message history, typing indicators
4. **Notification Center** - Toast + badge para notificações

**Message Types:**
- `auth` - Autenticar usuário
- `message` - Nova mensagem de chat
- `typing_indicator` - Usuário está digitando
- `status_update` - Status de quotação mudou
- `message_received` - Server → client
- `typing` - Server → client

**Checklist:**
- [ ] WebSocket server (port 8080)
- [ ] JWT auth na conexão
- [ ] Message persistence no BD
- [ ] Typing indicators (3s timeout)
- [ ] Reconnect automático
- [ ] Client pool management
- [ ] useWebSocket hook criado
- [ ] Chat component com scroll auto
- [ ] Message history load
- [ ] Notification center widget
- [ ] Status update broadcasts
- [ ] Message latency < 100ms

---

### SKILL G: ADMIN & MODERATION
**Arquivo:** [SKILLS_G_ADMIN_MODERATION.md](SKILLS_G_ADMIN_MODERATION.md)

**Dashboard administrativo** com auditoria completa.

**Seções:**
1. **Admin Dashboard** - KPIs, receita, quotações, documentos pendentes
2. **User Management** - Lista, editar, suspender usuários
3. **Audit Log System** - Log todas as ações (automático via middleware)
4. **Dispute Resolution** - Gerenciar reclamações de clientes

**KPIs:**
- Usuários ativos
- Receita (30 dias)
- Quotações (30 dias)
- Documentos pendentes

**Ações Auditadas:**
- Login, logout
- Criar/editar/deletar quotação
- Aceitar proposta
- Reembolsar pagamento
- Modificar usuário
- Upload de documento
- Cada ação logs: usuário, IP, timestamp, mudanças

**Checklist:**
- [ ] Admin permission guard
- [ ] Dashboard com 4 KPIs
- [ ] LineChart (receita 30d)
- [ ] BarChart (status quotações)
- [ ] User management table
- [ ] Edit user modal
- [ ] Suspend user functionality
- [ ] Audit log viewer
- [ ] Audit filters (ação, recurso, data)
- [ ] Dispute list (abertos, em revisão, resolvidos)
- [ ] Resolve dispute modal
- [ ] Alerts widget (recentes)
- [ ] CSV export de audit logs

---

### SKILL H: PRODUCT & CUSTOMER
**Arquivo:** [SKILLS_H_PRODUCT_CUSTOMER.md](SKILLS_H_PRODUCT_CUSTOMER.md)

**Data master** - Produtos e clientes com validação forte.

**Seções:**
1. **Product Management** - Criar, editar, deletar produtos
2. **Customer Profiles** - Perfil completo com histórico
3. **Customer Validation** - Duplicatas, CPF/CNPJ únicos
4. **Bulk Import/Export** - CSV upload, template download

**Product Fields:**
- nome (required, min 5 chars)
- descrição (required, min 20 chars)
- ncmCodigo (required, 8 digits)
- peso (required, > 0, max 50K kg)
- preço (optional)
- estoque (default 0)
- ativo (default true)

**Customer Validation:**
- CPF/CNPJ único (check BD antes de salvar)
- Email único (case-insensitive)
- Nome mínimo 5 caracteres
- Formato CPF/CNPJ válido
- Dados obrigatórios presentes

**Checklist:**
- [ ] Product form com validation
- [ ] Product list com CRUD
- [ ] Editar produto (modal)
- [ ] Deletar produto (confirm)
- [ ] Profile page para usuário
- [ ] Edit profile modal
- [ ] Activity history timeline
- [ ] Validation hooks (validateCustomer)
- [ ] Validação duplicatas
- [ ] CSV import handler
- [ ] Template download
- [ ] Import results report (sucesso/erro)
- [ ] Bulk data validation

---

## 🔄 DECISION TREE - Qual Skill Usar?

```
📦 Trabalhando com Quotações?
├─ Criar nova quotação → SKILL A (Form multi-step)
├─ Listar quotações → SKILL D (DataTable)
├─ Aceitar quotação → SKILL A (secs 4-5)
├─ Pagar quotação → SKILL B (Payment flow)
└─ Chat com transportador → SKILL F (WebSocket)

💳 Implementando Pagamento?
└─ SKILL B (Stripe Integration) - completo

📝 Criando Formulário?
└─ SKILL C (Forms & Validation) - padrão único

📊 Exibindo Dados em Tabela?
└─ SKILL D (DataTable) - reutilizável

🔔 Feedback Visual (Toast/Modal)?
└─ SKILL E (Notifications) - componentes base

💬 Chat ou Status Real-Time?
└─ SKILL F (WebSocket) - backend + frontend

👮 Admin Dashboard ou Auditoria?
└─ SKILL G (Admin) - dashboard + logs

📦 Produtos ou Perfil de Cliente?
└─ SKILL H (Product & Customer) - data master
```

---

## 🎯 CHECKLIST ANTES DE DEPLOY

### Pre-Deployment Validation
- [ ] Todas as 8 skills implementadas
- [ ] Build: `npm run build` (zero errors)
- [ ] Lint: `npm run lint` (zero warnings)
- [ ] Tests: `npm run test` (100% passing)
- [ ] Validation: `npm run agent:validate` (10/10 rules ✅)
- [ ] Dark mode: Teste em 5+ páginas
- [ ] Acessibilidade: WCAG 2.1 AA em todo site
- [ ] Performance: Lighthouse > 90
- [ ] Security: CSP headers, no XSS, no SQL injection
- [ ] Payment: Stripe webhook test (simule charge)
- [ ] Forms: Submeta cada form com dados inválidos
- [ ] Tables: Export, sort, filter em 3 tabelas
- [ ] Chat: Envie mensagens entre 2 usuários
- [ ] Admin: Verifique audit log de 1 ação
- [ ] Mobile: Responsive em iPhone + Android

### Zero-Error Mandate
✅ Zero dados inválidos no BD  
✅ Zero pagamentos perdidos (reconciliação automática)  
✅ Zero usuários sem validação  
✅ Zero duplicatas de CPF/email  
✅ Zero XSS, CSRF, SQL injection  
✅ Zero chat messages perdidas  
✅ Zero status updates faltando  

---

## 🚀 IMPLEMENTAÇÃO RÁPIDA

**Setup Inicial (30 min):**
1. SKILL A - Form criação quotação
2. SKILL C - Validação com Zod
3. SKILL E - Toast notification
4. SKILL D - Listar quotações

**MVP (2h):**
1. Adicione SKILL B - Checkout Stripe
2. Adicione SKILL F - Chat WebSocket
3. Teste fluxo completo

**Production (4h):**
1. SKILL G - Admin dashboard
2. SKILL H - Product management
3. Testes completos + deploy

---

## 📞 REFERÊNCIAS RÁPIDAS

**Encontrar um padrão?**
- Componentes → SKILL A, D, E
- Autenticação → AGENT_OPERATIONAL_GUIDEBOOK (Seção 4)
- Header Global → AGENT_OPERATIONAL_GUIDEBOOK (Seção 3)
- Dark Mode → AGENT_OPERATIONAL_GUIDEBOOK (Seção 2)
- Tabela/Lista → SKILL D
- Formulário → SKILL C
- Pagamento → SKILL B
- Chat/Real-time → SKILL F
- Admin → SKILL G
- Validação de dados → SKILL H

**Ficou com dúvida?**
1. Leia AGENT_OPERATIONAL_GUIDEBOOK.md (Seções 1-3 OBRIGATÓRIO)
2. Procure na skill relevante
3. Verifique exemplo de uso ou checklist
4. Execute: `npm run agent:validate` para garantir rules

---

## 📈 VERSÃO SKILLS

| Versão | Data | Updates |
|--------|------|---------|
| **1.0** | 2024 | Initial 8 skills framework |
| **1.1** | TBD | Add Webhook retry patterns |
| **1.2** | TBD | Add GraphQL patterns |
| **2.0** | TBD | Mobile app patterns |

---

**Última atualização:** $(date +%Y-%m-%d)  
**Framework:** React 18.2 + Vite 5.4 + Tailwind 3.4 + Node.js 18+  
**Status:** 🟢 Production Ready

---

**👉 Comece por:** [AGENT_OPERATIONAL_GUIDEBOOK.md](AGENT_OPERATIONAL_GUIDEBOOK.md) → [SKILL A](SKILLS_A_QUOTATION_FLOW.md)
