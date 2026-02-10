# 🚀 SKILL A: QUOTATION FLOW MASTERY
## End-to-End Cotação (Criação → Entrega → Pagamento)

> **OBJETIVO:** Garantir que TODA cotação flua com precisão,sem erros, agradável visualmente, gerando resultados positivos

---

## 📋 TABELA DE CONTEÚDOS

1. [Quotation Creation](#1-quotation-creation)
2. [Quotation Display & Discovery](#2-quotation-display--discovery)
3. [Proposal Management](#3-proposal-management)
4. [Quotation Acceptance](#4-quotation-acceptance)
5. [Delivery & Tracking](#5-delivery--tracking)
6. [Post-Delivery Actions](#6-post-delivery-actions)

---

## 1. QUOTATION CREATION

### 📋 Overview
**Página:** `/nova-cotacao` (NovaCotacao.jsx)  
**Usuário:** Embarcador  
**Objetivo:** Criar cotação com UX fluída, validação completa, zero erros

### ✅ Checklist de Implementação

- [ ] **Form Structure**
  - [ ] Multi-step form (6 passos visuais)
  - [ ] Progress bar (indica onde está)
  - [ ] Auto-save (salva a cada passo)
  - [ ] Validação em tempo real (inline feedback)

- [ ] **Passo 1: Informações Básicas**
  - [ ] Campo: Título (max 100 chars, counter)
  - [ ] Campo: Descrição (max 500 chars, counter)
  - [ ] Campo: Categoria (select com icons - Alimentos, Eletrônicos, etc)
  - [ ] Campo: Urgência (Baixa/Média/Alta/Crítica - cores différentes)
  - [ ] **Validação:** Campos obrigatórios, comprimento máximo
  - [ ] **Visual:** Cards com ícones, cores diferentes por urgência

- [ ] **Passo 2: Origem (CEP + Endereço)**
  - [ ] Campo: CEP (máscara automática, busca ViaCEP)
  - [ ] Auto-fill: Rua, Bairro, Cidade, Estado (após CEP)
  - [ ] Campo: Complemento (opcional)
  - [ ] Campo: Número (obrigatório)
  - [ ] Campo: Referência (opcional)
  - [ ] **Validação:** CEP válido, endereço não vazio
  - [ ] **Visual:** Google Maps preview (mini mapa)
  - [ ] **Fallback:** Se ViaCEP falhar, mensagem clara + form manual

- [ ] **Passo 3: Destino (Tipo de busca: CEP ou Endereço Livre)**
  - [ ] Toggle: "Tenho CEP" / "Buscar por endereço"
  - [ ] Se CEP: mesmo que origem (ViaCEP)
  - [ ] Se Livre: Cidade + Bairro (autocomplete)
  - [ ] Campo: Número (obrigatório)
  - [ ] Campo: Complemento (opcional)
  - [ ] **Validação:** CEP válido OU cidade válida
  - [ ] **Visual:** Google Maps preview
  - [ ] **Calcular:** Distância estimada em km

- [ ] **Passo 4: Dimensões & Peso**
  - [ ] Campo: Peso (kg) - validação: > 0
  - [ ] Campo: Altura (m) - validação: > 0
  - [ ] Campo: Largura (m) - validação: > 0
  - [ ] Campo: Profundidade (m) - validação: > 0
  - [ ] **Autocálculo:** Volume = altura × largura × profundidade
  - [ ] **Visual:** Mini 3D box (mostra dimensões visualmente)
  - [ ] **Validação:** Soma não pode exceder limites de transporte
  - [ ] Campo: Tipo de volume (Caixa, Pallet, Cilindro, Irregular)

- [ ] **Passo 5: Produtos (NCM)**
  - [ ] Button: "+ Adicionar Produto"
  - [ ] Cada produto:
     - [ ] Busca NCM (autocomplete 10.507 códigos)
     - [ ] Descrição (auto-fill do NCM)
     - [ ] Quantidade
     - [ ] Valor unitário
     - [ ] Total calculado automaticamente
  - [ ] **Validação:** NCM válido, quantidade > 0, valor > 0
  - [ ] **Visual:** Cards com código NCM, descrição, cores diferentes
  - [ ] **Subtotal:** Soma automática de todos os produtos
  - [ ] **Button:** Remover produto (com confirmação)

- [ ] **Passo 6: Revisão & Confirmação**
  - [ ] Review de TODOS os dados (resumido)
  - [ ] Exibir: Origem → Destino (com distância)
  - [ ] Exibir: Peso, dimensões, volume
  - [ ] Exibir: Produtos (lista compacta)
  - [ ] Exibir: Valor total estimado
  - [ ] **Button:** Voltar (editar qualquer passo)
  - [ ] **Button:** Confirmar Cotação

### 🎨 Visual Design
```
CORES & ESTADOS:
├─ Urgência Baixa: Azul (#3B82F6)
├─ Urgência Média: Amarelo (#FBBF24)
├─ Urgência Alta: Laranja (#F97316)
├─ Urgência Crítica: Vermelho (#EF4444)
└─ Dark mode: Todas com variante dark:

TIPOGRAFIA:
├─ Título: 24px, bold
├─ Subtítulo: 16px, medium
├─ Label: 14px, medium
├─ Input: 14px, regular
└─ Counter: 12px, light (cinza)

LAYOUT:
├─ Desktop: 2 colunas (form + preview)
├─ Tablet: 1 coluna (form stackado)
├─ Mobile: 1 coluna (simplifqué)
└─ Progress bar: Top (sticky)
```

### ✔️ Validação & Error Handling

```javascript
// Validações obrigatórias
const validateStep1 = (data) => {
  if (!data.titulo?.trim()) return 'Título é obrigatório';
  if (data.titulo.length > 100) return 'Título máximo 100 caracteres';
  if (!data.descricao?.trim()) return 'Descrição é obrigatória';
  if (data.descricao.length > 500) return 'Descrição máxima 500 caracteres';
  if (!data.categoria) return 'Categoria é obrigatória';
  return null;
};

// CEP validation (ViaCEP)
const validateCEP = async (cep) => {
  const cleaned = cep.replace(/\D/g, '');
  if (cleaned.length !== 8) return 'CEP inválido';
  
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
    if (response.ok && !response.data.erro) {
      return null; // Válido
    }
  } catch (error) {
    return 'Erro ao validar CEP. Preencha manualmente.';
  }
};

// Erro handling
const handleCreationError = (error) => {
  if (error.response?.status === 400) {
    toast.error('Dados inválidos. Verifique os campos.');
  } else if (error.response?.status === 401) {
    redirectToLogin();
  } else if (error.response?.status === 500) {
    toast.error('Erro no servidor. Tente novamente em alguns minutos.');
  } else {
    toast.error('Erro ao criar cotação. Verifique a conexão.');
  }
};
```

### 🔒 Segurança
- [ ] Sanitizar inputs (XSS prevention)
- [ ] Rate limit: Max 50 cotações/dia por embarcador
- [ ] CSRF token na requisição
- [ ] Validar origem & destino (não podem ser iguais)
- [ ] Validar peso & dimensões (limites legais de transporte)
- [ ] Log de criação (user_id, timestamp, dados)

### 📊 Success Metrics
✅ Cotação criada em < 3 minutos (tempo médio)  
✅ 100% de validação (zero cotações malformadas)  
✅ < 1% de abandono no form (UX fluída)  
✅ Dark mode funcional em todos os inputs  

---

## 2. QUOTATION DISPLAY & DISCOVERY

### 📋 Overview
**Páginas:** `/cotacoes-disponiveis` (transportador descobre)  
**Objetivo:** Display bonito, filtros úteis, busca rápida, zero lag

### ✅ Checklist
- [ ] **List Display**
  - [ ] Card por cotação (com sombra, hover effect)
  - [ ] Status visual (badge: Aberta, Respondida, Aceita, Entregando, Entregue)
  - [ ] Urgência (cor na borda do card)
  - [ ] Origem → Destino (com distância em km)
  - [ ] Peso & dimensões (resumido)
  - [ ] Valor estimado (destacado)
  - [ ] Tempo restante (quanto tempo a cotação expira)
  - [ ] Transportadores respondidos (x de y)

- [ ] **Filtros & Busca**
  - [ ] **Busca por texto:** Título, descrição, origem, destino
  - [ ] **Filtro: Estado** (São Paulo, Rio, Minas, etc)
  - [ ] **Filtro: Distância** (10-100km, 100-500km, >500km)
  - [ ] **Filtro: Urgência** (Baixa, Média, Alta, Crítica)
  - [ ] **Filtro: Peso** (0-100kg, 100-500kg, >500kg)
  - [ ] **Filtro: Categoria** (Alimentos, Eletrônicos, etc)
  - [ ] **Filtro: Status** (Aberta, Respondida - quantas respostas)
  - [ ] **Sort:** Mais recentes, Urgência alta, Maior valor
  - [ ] **Salvar filtros** (para próxima visita)

- [ ] **Visual Display**
  - [ ] Pagination (10 itens/página)
  - [ ] Skeleton loader (enquanto carrega)
  - [ ] Empty state (nenhuma cotação encontrada)
  - [ ] Grid responsivo (Desktop: 3 cols, Tablet: 2, Mobile: 1)
  - [ ] Hover effect (card levanta, sombra aumenta)
  - [ ] Dark mode: Cards com bg-slate-800, texto claro

- [ ] **Card Details**
```
┌─────────────────────────────────┐
│ 🔴 CRÍTICA        ✓ 3 respostas │ ← Status & badge
├─────────────────────────────────┤
│ Frete São Paulo → Rio de Janeiro│ ← Origem → Destino
│ 450 km • 1 dia atrás            │ ← Distância & tempo
├─────────────────────────────────┤
│ Peso: 500kg | Vol: 3,75m³       │ ← Dimensões
│ Máq industriais • Refrigerado    │ ← Produtos & reqs
├─────────────────────────────────┤
│ Valor estimado: R$ 2.500        │ ← Valor destacado
│ Coleta: 25/01 10:00 - 26/01 [Visualizar] │
├─────────────────────────────────┤
│ [Responder com Proposta]        │ ← CTA button
└─────────────────────────────────┘
```

- [ ] **Performance**
  - [ ] Infinite scroll OU pagination (não ambos)
  - [ ] Lazy load imagens
  - [ ] Cache de lista (5 min)
  - [ ] Debounce na busca (300ms)

### 🔒 Segurança
- [ ] Mostrar apenas cotações abertas para transportadores
- [ ] Não revelar email do embarcador na listagem
- [ ] Rate limit: 1000 requests/hora por IP
- [ ] Validar filtros (previne injection)

---

## 3. PROPOSAL MANAGEMENT

### 📋 Overview
**Página:** `/responder-cotacao/{id}` (transportador responde)  
**Objetivo:** Submeter proposta com valor, cobertura geográfica, documentos

### ✅ Checklist
- [ ] **Proposta Form**
  - [ ] Exibir cotação original (read-only resumo)
  - [ ] Campo: Valor da proposta (R$)
  - [ ] Field: Dias para entregar (número)
  - [ ] Field: Descrição complementar (opcional)
  - [ ] Field: Documentos que possui (checkboxes)
     - [ ] CTE (Conhecimento de Transporte Eletrônico)
     - [ ] CIOT (Conhecimento de Integração do Orçamento do Transporte)
     - [ ] MDF-e (Manifesto de Documentos Fiscais)
  - [ ] **Validação:** Valor > 0, dias > 0, pelo menos 1 documento
  - [ ] **Visual:** Status badges para documentos

- [ ] **Proposta Review**
  - [ ] Cotação resumida (origem, destino, peso)
  - [ ] Seu valor proposto
  - [ ] Diferença do valor estimado (+ ou -)
  - [ ] Estimativa de entrega
  - [ ] **Button:** Confirmar Proposta
  - [ ] **Button:** Cancelar

- [ ] **Proposta Enviada**
  - [ ] Toast: "Proposta enviada com sucesso!"
  - [ ] Redirect para `/minhas-propostas?status=enviada`
  - [ ] Email confirmação para transportador (async)

### 📊 Data Management
```javascript
// Estrutura de Proposta
{
  id: UUID,
  cotacaoId: UUID,
  transportadorId: UUID,
  valor: number,
  diasEntrega: number,
  descricao: string,
  documentosCTE: boolean,
  documentosCIOT: boolean,
  documentosMDFe: boolean,
  status: 'enviada' | 'aceita' | 'recusada',
  createdAt: timestamp,
  respondidoEm: timestamp
}
```

### 🔒 Segurança
- [ ] Validar que transportador existe
- [ ] Validar que cotação ainda está aberta
- [ ] Prevenir duplicate proposals (mesma cotação)
- [ ] Rate limit: 1 proposta/minuto por transportador
- [ ] Avisar se valor é muito abaixo da média (anti-dumping)

---

## 4. QUOTATION ACCEPTANCE

### 📋 Overview
**Página:** `/cotacoes/{id}` (embarcador avalia propostas)  
**Objetivo:** Comparar propostas, escolher uma, gerar contrato

### ✅ Checklist
- [ ] **Propostas Listing**
  - [ ] Table OU Cards com propostas (sort por valor, data, rating)
  - [ ] Cada proposta mostra:
    - [ ] Nome transportador + rating (⭐⭐⭐⭐⭐)
    - [ ] Valor proposto (destaque em verde se análogo ao estimado)
    - [ ] Dias para entrega
    - [ ] Documentos (CTE ✓, CIOT ✓, MDF-e ✓)
    - [ ] Botão "Aceitar"
    - [ ] Botão "Conversar" (abre chat)

- [ ] **Before Acceptance**
  - [ ] Mostrar último preço aceito para transportador (contexto)
  - [ ] Mostrar histórico (quantas vezes transportador já fez frete comigo)
  - [ ] Rating + comentários de embarcadores anteriores

- [ ] **Acceptance Process**
  - [ ] Modal: Confirmar aceitação de proposta
  - [ ] Exibir: Cotação resumida
  - [ ] Exibir: Proposta escolhida
  - [ ] Campo: Referência interna (opcional)
  - [ ] Checkbox: "Li e concordo com os termos"
  - [ ] Button: "Aceitar Proposta"
  - [ ] Avisar sobre próximas ações (chat, coleta, pagamento)

- [ ] **After Acceptance**
  - [ ] Atualizar status da cotação: "aceita"
  - [ ] Atualizar status da proposta: "aceita"
  - [ ] Rejeitar automaticamente outras propostas
  - [ ] Email para transportador (proposta aceita)
  - [ ] Abrir chat automaticamente (redirect)
  - [ ] Gerar contrato/recebe PDF (para embarcador)

### 📊 Success Flow
```
Embarcador seleciona proposta
→ Modal de confirmação
→ Verifica termos
→ Clica "Aceitar"
→ Backend: aceita, rejeita outras, cria chat
→ Ambos recebem email
→ Redireciona para chat
→ Status muda para "Em Andamento"
```

### 🔒 Segurança
- [ ] Validar que usuário é embarcador da cotação
- [ ] Validar que proposta ainda é válida
- [ ] Log de aceitação (user_id, timestamp, proposta_id)
- [ ] Enviar confirmação por email (duplicação preventiva)

---

## 5. DELIVERY & TRACKING

### 📋 Overview
**Página:** `/meu-frete/{id}` (tracking para ambos)  
**Objetivo:** Atualizar status, anexar documentos, confirmar coleta/entrega

### ✅ Checklist - Status Flow
- [ ] **Status 1: Aguardando Coleta**
  - [ ] Transportador confirma coleta (botão: "Coletado!")
  - [ ] Câmera: Foto da carga (upload)
  - [ ] Código de confirmação (gerado automaticamente)
  - [ ] Timestamp de coleta
  - [ ] Mudar status → "Em Transporte"

- [ ] **Status 2: Em Transporte**
  - [ ] Tracker ao vivo (mapa com localização atual)
  - [ ] Atualização de localização (transportador compartilha)
  - [ ] Mensagem: "Saiu para entrega em X horas"
  - [ ] Documetos: CTE, CIOT, MDF-e disponíveis para download

- [ ] **Status 3: Entregue**
  - [ ] Transportador marca como "Entregue"
  - [ ] Campos obrigatórios:
    - [ ] Data & hora de entrega
    - [ ] Assinatura do recebedor (eSig OU foto)
    - [ ] Anexo: Foto da entrega
    - [ ] Observações (opcional)
  - [ ] Validação: Todos os campos
  - [ ] Mudar status → "Entregue"

- [ ] **Status 4: Pagamento Pendente**
  - [ ] Mostrar: Valor a pagar
  - [ ] Botão: "Processar Pagamento" (via Stripe)
  - [ ] Opções: Cartão, Pix, Transferência (se suportado)
  - [ ] Após pagamento → "Pago" + dados transação

### 📊 Timeline Visual
```
Criação → Aceitação → Coleta → Em Transporte → Entregue → Pagado
   ✓         ✓          ✓            ✓           ✓          ✓
 
Cada etapa:
- Data & hora
- Responsável
- Documentos anexados
```

### 📎 Document Management
- [ ] Anexar documentos (CTE, CIOT, MDF-e)
- [ ] Upload de múltiplos arquivos
- [ ] Validação de tipo (PDF, PNG, JPG)
- [ ] Máximo 10MB por arquivo
- [ ] Histórico de versões (se editado)
- [ ] Download para ambos

### 🔒 Segurança
- [ ] Validar assinatura eletrônica
- [ ] Timestamp server-side (não client)
- [ ] Fotos: Verificar GPS (confirma localização)
- [ ] Log de todas as alterações
- [ ] Só transportador/embarcador podem editar

---

## 6. POST-DELIVERY ACTIONS

### ✅ Pós-Entrega
- [ ] **Rating & Feedback**
  - [ ] Embarcador consegue avaliar transportador (⭐)
  - [ ] Transportador consegue avaliar embarcador (⭐)
  - [ ] Comentários (opcional, max 200 chars)
  - [ ] Salvar para histórico

- [ ] **Invoice & Payment**
  - [ ] Gerar invoice/recibo
  - [ ] Disponibilizar PDF para download
  - [ ] Integração com contabilidade (API export)

- [ ] **Communication Archive**
  - [ ] Chat preservado (histório completo)
  - [ ] Documentos linkados ao frete
  - [ ] Busca por frete histórico

### 📊 Success Metrics
✅ 99%+ taxa de entrega confirmada  
✅ < 2% de reclamações post-delivery  
✅ Rating médio > 4.5 ⭐  
✅ 100% de pagamentos processados sem erros  

---

## 🎨 DESIGN SYSTEM - QUOTATION CARDS

### Card States
```
ABERTA (Verde)
├─ Badge: "Aceitando Propostas"
├─ Botão: "Responder" (primário)
└─ Countdown: Tempo até fechar

RESPONDIDA (Azul)
├─ Badge: "3 respostas"
├─ Botão: "Ver Propostas" (primário)
└─ Maior proeminência

ACEITA (Roxo)
├─ Badge: "Transportador Selecionado"
├─ Botão: "Acompanhar" (info)
└─ Mostra nome transportador

ENTREGANDO (Amarelo)
├─ Badge: "Em Trânsito"
├─ Botão: "Localizar" (info)
└─ Countdown: Estimativa de entrega

ENTREGUE (Verde)
├─ Badge: "Entregue"
├─ Botão: "Ver Comprovante" (info)
└─ Rating do transportador

PAGO (Verde escuro)
├─ Badge: "Transação Completa"
├─ Botão: "Download Recibo" (info)
└─ Arquivo: Disponível
```

---

**Próxima Skill:** SKILL B - Product & Customer Management
