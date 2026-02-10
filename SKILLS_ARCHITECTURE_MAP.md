# 🗺️ SKILLS ARCHITECTURE MAP
## Visão de Como os 8 Skills se Conectam

```
┌─────────────────────────────────────────────────────────────────┐
│                    ACHEI MEU FRETE PLATFORM                     │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │          SKILL A: QUOTATION FLOW (CORE)                  │ │
│  │                                                           │ │
│  │   Step 1: Create      → SKILL C (Form Validation)        │ │
│  │   Step 2: Discover    → SKILL D (Data Display Table)     │ │
│  │   Step 3: Proposals   → SKILL C (Form) + SKILL E (Toast) │ │
│  │   Step 4: Accept      → SKILL B (Payment Checkout)       │ │
│  │   Step 5: Delivery    → SKILL F (Real-Time Status)       │ │
│  │   Step 6: Post-Pay    → SKILL E (Rating Modal)           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                            ↓                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │   SKILL B: PAYMENT STRIPE (Credit System Integration)   │  │
│  │   ├─ Checkout session → Stripe webhooks                 │  │
│  │   ├─ Credit creation → Daily reconciliation              │  │
│  │   ├─ Refund logic → Audit logging                       │  │
│  │   └─ PCI compliance → Zero error tolerance              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ↕                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ SKILL F: REAL-TIME (Chat, notifications, status)        │  │
│  │   ├─ WebSocket server (auth, message routing)           │  │
│  │   ├─ Chat UI (messages, typing indicators)              │  │
│  │   ├─ Notification center (bell icon, list)              │  │
│  │   └─ Status broadcasts (Quotação esatus updates)        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────┐  ┌──────────────────────────────────┐ │
│  │ SKILL C: FORMS      │  │ SKILL D: DATA DISPLAY            │ │
│  │ ┌─────────────────┐ │  │ ┌──────────────────────────────┐ │ │
│  │ │ React Hook Form │ │  │ │ DataTable Reutilizável       │ │ │
│  │ │ Zod Validation  │ │  │ │ ├─ Sort, filter, paginate    │ │ │
│  │ │ Real-time       │ │  │ │ ├─ Dark mode                 │ │ │
│  │ │ Multi-step      │ │  │ │ ├─ CSV export                │ │ │
│  │ │ Async checks    │ │  │ │ └─ Selection                 │ │ │
│  │ └─────────────────┘ │  │ └──────────────────────────────┘ │ │
│  └─────────────────────┘  └──────────────────────────────────┘ │
│           ↓                                    ↓                │
│  ┌─────────────────────┐  ┌──────────────────────────────────┐ │
│  │ SKILL E: FEEDBACK   │  │ SKILL G: ADMIN & MODERATION      │ │
│  │ ┌─────────────────┐ │  │ ┌──────────────────────────────┐ │ │
│  │ │ Toast system    │ │  │ │ Dashboard (KPIs, charts)     │ │ │
│  │ │ Modals          │ │  │ │ User management              │ │ │
│  │ │ Spinners        │ │  │ │ Audit log viewer             │ │ │
│  │ │ Status badges   │ │  │ │ Dispute resolution           │ │ │
│  │ └─────────────────┘ │  │ └──────────────────────────────┘ │ │
│  └─────────────────────┘  └──────────────────────────────────┘ │
│                                    ↓                             │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │   SKILL H: PRODUCT & CUSTOMER (Data Master)             │    │
│  │   ├─ Produtos: CRUD + NCM validation                    │    │
│  │   ├─ Clientes: Profiles + historico                     │    │
│  │   ├─ Validação: Duplicatas, CPF/CNPJ                    │    │
│  │   └─ Import/Export: CSV bulk operations                 │    │
│  └──────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘

                            DEPENDENCIES

SKILL A (Quotation)
├─ SKILL C: Form creation, validation
├─ SKILL D: List quotations with table
├─ SKILL B: Payment at acceptance
├─ SKILL F: Status updates, chat
└─ SKILL E: Feedback (toasts, modals)

SKILL B (Payment)
├─ SKILL E: Payment status feedback
└─ Stripe Webhooks: External

SKILL C (Forms)
├─ Zod: Validation library
└─ React Hook Form: Form state

SKILL D (Tables)
├─ Sort/Filter/Paginate logic
└─ Export to CSV

SKILL E (Feedback)
├─ Toast provider (React Context)
└─ Modal portals

SKILL F (Real-Time)
├─ WebSocket (backend)
├─ Custom hook (frontend)
└─ Message persistence

SKILL G (Admin)
├─ SKILL D: User list, audit log
├─ SKILL E: Confirm dialogs
└─ Data aggregation

SKILL H (Data)
├─ SKILL C: Product form
├─ SKILL D: Product & customer lists
└─ Validation middlewares


                       PAGE MAPPING

Home Page
├─ SKILL E (Notifications)
└─ SKILL A (Featured quotations)

Nova Quotação
├─ SKILL A (Multi-step form)
├─ SKILL C (Validation)
└─ SKILL E (Feedback)

Minhas Quotações
├─ SKILL D (DataTable with filters)
├─ SKILL A (Quotation cards)
└─ SKILL E (Delete confirm modal)

Detalhes Quotação
├─ SKILL A (Full flow visualization)
├─ SKILL B (Payment button)
├─ SKILL F (Chat widget)
└─ SKILL E (Status badges, toasts)

Chat
├─ SKILL F (WebSocket messages)
├─ SKILL E (Typing indicators)
└─ Message history

Pagamento
├─ SKILL B (Stripe checkout)
├─ SKILL E (Loading state, toast)
└─ Success/error handling

Meu Perfil
├─ SKILL H (Profile form)
├─ SKILL C (Validation)
├─ SKILL D (Activity history)
└─ SKILL E (Edit modal)

Admin Dashboard
├─ SKILL G (KPIs, charts)
├─ SKILL D (User table)
├─ SKILL E (Delete confirm)
└─ SKILL F (Live notifications)

Admin - Usuários
├─ SKILL G (User management)
├─ SKILL D (User list)
└─ SKILL E (Edit/suspend modal)

Admin - Audit Log
├─ SKILL G (Audit log viewer)
├─ SKILL D (DataTable with filters)
└─ Details modal

Admin - Produtos
├─ SKILL H (Product CRUD)
├─ SKILL C (Form validation)
├─ SKILL D (Product list)
└─ SKILL E (Delete confirm)

Admin - Importar
├─ SKILL H (CSV import)
├─ SKILL E (Progress, results)
└─ Error handling toast


                    COMPONENT TREE

<App>
  <ToastProvider> ← SKILL E
    <NotificationCenter> ← SKILL F
      <Header>
        <HeaderNav>
        <HeaderSearch> ← SKILL D
      </Header>
      
      <Routes>
        <Route path="/quotacao/nova">
          <QuotacaoForm> ← SKILL A + C
            <FormInput>
            <MultiStepForm>
        </Route>
        
        <Route path="/quotacoes">
          <DataTable> ← SKILL D
            <Filter>
            <Sort>
            <Paginate>
        </Route>
        
        <Route path="/quotacao/:id">
          <QuotacaoDetail> ← SKILL A
            <Chat> ← SKILL F
            <PaymentButton> ← SKILL B
            <StatusTimeline>
            <RatingModal> ← SKILL E
        </Route>
        
        <Route path="/admin">
          <AdminDashboard> ← SKILL G
            <KPICards>
            <Charts>
            <Alerts>
        </Route>
        
        <Route path="/admin/usuarios">
          <UserList> ← SKILL D + G
            <DataTable>
            <EditUserModal> ← SKILL E
        </Route>
        
        <Route path="/admin/auditlog">
          <AuditLogViewer> ← SKILL G
            <DataTable> ← SKILL D
            <Filters>
        </Route>
        
        <Route path="/admin/produtos">
          <ProductManagement> ← SKILL H
            <ProductForm> ← SKILL C
            <ProductList> ← SKILL D
        </Route>
      </Routes>
      
      <Footer>
    </ToastProvider>
  </ToastProvider>
</App>


                      DATA FLOW

User Action
  ↓
[Validation - SKILL C] ← Zod schemas
  ↓
Accepted / Rejected
  ├─ Rejected: Toast Error (SKILL E)
  └─ Accepted: API Call
       ↓
   [Backend Validation]
       ↓
   Valid / Invalid
   ├─ Invalid: 400 Error → Toast (SKILL E)
   └─ Valid: Process
        ↓
    [Side Effects]
    ├─ SKILL B: Stripe charge, create credit
    ├─ SKILL F: Broadcast status update
    ├─ SKILL G: Log to audit
    ├─ SKILL H: Update product/customer
    └─ SKILL D: Refresh table
         ↓
    Success Callback
        ├─ Toast Success (SKILL E)
        ├─ Update UI
        └─ Optional Redirect


                      TECH STACK ALIGNMENT

Frontend Layer:
├─ React 18.2 → Hook patterns across all SKILLS
├─ Vite 5.4 → Build tool
├─ Tailwind 3.4 → Styling (SKILLS A-H all use it)
├─ React Router 6 → Navigation
└─ Lucide React → Icons (SKILLS E, G use it)

Form Layer:
├─ React Hook Form → SKILL C
└─ Zod → SKILL C

Data Layer:
├─ Axios → API calls across all SKILLS
├─ React Query (optional) → Caching
└─ Context API → SKILL E (ToastProvider), SKILL F (WebSocket)

Real-Time Layer:
├─ WebSocket → SKILL F
└─ JWT Auth → Validation in SKILL F

Payment Layer:
├─ Stripe API → SKILL B
└─ Prisma → SKILL B (database queries)

Backend Layer:
├─ Node.js 18+ → Runtime
├─ Express 4.18 → Server
├─ PostgreSQL 15 → Database
├─ Prisma ORM 5.8 → Database client
├─ JWT → Authentication
└─ bcryptjs → Password hashing

                      SUCCESS PATH

1. Use AGENT_OPERATIONAL_GUIDEBOOK
   ├─ Section 1: FORBIDDEN OPERATIONS
   ├─ Section 2: MANDATORY PATTERNS (Auth, Header, Dark Mode)
   └─ Section 3: ARCHITECTURE GUARANTEES

2. Use SKILLS_INDEX.md
   ├─ Find which skill applies
   ├─ Read that skill document
   └─ Implement as checklist

3. Implement Skill Features
   ├─ Copy code patterns
   ├─ Adapt to your domain
   └─ Test with examples

4. Validate
   └─ npm run agent:validate (10/10 rules ✅)

5. Build & Deploy
   ├─ npm run build (zero errors)
   └─ npm run test (100% passing)

```

---

## 📍 VOCÊ ESTÁ AQUI

✅ fase 1: F5 security fix  
✅ Fase 2: AGENT_OPERATIONAL_GUIDEBOOK created  
✅ Fase 3: 8 SKILLS created (A-H)  
✅ Fase 4: SKILLS mapped & indexed  
🔴 **Fase 5: Implementar skills no código** ← PRÓXIMO

---

## 🚀 PRÓXIMO: COMEÇAR A IMPLEMENTAR

Escolha sua prioridade:

### Opção A: MVP Rápido (6h)
1. SKILL A → Quotation form
2. SKILL C → Validation
3. SKILL D → List table
4. SKILL E → Toasts
5. Deploy

### Opção B: Payment First (8h)
1. SKILL C → Form + validation
2. SKILL B → Stripe setup
3. SKILL E → Feedback system
4. SKILL A → Payment integration
5. Deploy

### Opção C: Complete (16h)
1. Implementar SKILLS A-H sequencialmente
2. Integração de todas as features
3. Full testing + audit
4. Deploy

---

**Recomendação:** Comece com Opção A (MVP) depois expanda para B e C!
