# 🎯 ESTRATÉGIA DE IMPLEMENTAÇÃO DO SISTEMA DE CADASTRO

## ✅ Fase 1-3 COMPLETAS
- ✅ Banco de dados expandido com Documento e Veiculo models
- ✅ Validadores criados (phone, email, CPF, CNPJ, documento)

## 📋 Fase 4-6: IMPLEMENTAÇÃO DOS FORMULÁRIOS

### Arquitetura de Componentes

```
components/auth/registration/
├── RegistrationFlow.jsx (Componente pai - coordena fluxo)
├── TypeSelector.jsx (Escolhe: Transportador ou Embarcador)
├── 
├── Transportador/
│   ├── TransportadorTypeSelector.jsx (PJ ou Autônomo)
│   ├── TransportadorPJForm.jsx
│   │   ├── Step 1: DadosEmpresa (razão social, CNPJ, etc)
│   │   ├── Step 2: Endereço (comercial)
│   │   ├── Step 3: Contato (email, telefone)
│   │   ├── Step 4: Segurança (senha)
│   │   ├── Step 5: DecisãoVeículo (1 veículo ou múltiplos?)
│   │   │   ├── Se 1 veículo: Step 6 Veículo + Step 7 Docs
│   │   │   └── Se múltiplos: Skip Veículo
│   │   └── Step Final: Upload de Documentos
│   │
│   └── TransportadorAutonomoForm.jsx
│       ├── Step 1: DadosPessoais
│       ├── Step 2: Documentação (CPF, RG, CNH com vencimento)
│       ├── Step 3: Endereço (residencial)
│       ├── Step 4: Contato (email, telefone)
│       ├── Step 5: Segurança (senha)
│       ├── Step 6: DecisãoCIOT (Emite CIOT?)
│       │   ├── Se Sim: DadosCIOT
│       │   └── Se Não: Pular CIOT
│       ├── Step 7: Veículo (tipo, placa, RENAVAM)
│       └── Step Final: Upload de Documentos
│
├── Embarcador/
│   ├── EmbarcadorTypeSelector.jsx (CPF ou CNPJ)
│   ├── EmbarcadorCPFForm.jsx
│   │   ├── Step 1: DadosPessoais (name, sobrenome, CPF)
│   │   ├── Step 2: Documentação (RG, CNH opcional)
│   │   ├── Step 3: Endereço (residencial)
│   │   ├── Step 4: Contato (email, telefone)
│   │   ├── Step 5: Segurança (senha)
│   │   └── Step Final: Upload de Documentos
│   │
│   └── EmbarcadorCNPJForm.jsx
│       ├── Step 1: DadosEmpresa (razão social, CNPJ)
│       ├── Step 2: Endereço (comercial)
│       ├── Step 3: Contato (email, telefone)
│       ├── Step 4: Segurança (senha)
│       └── Step Final: Upload de Documentos
│
├── Shared/
│   ├── FormStepper.jsx (Componente visual de passos)
│   ├── DocumentUploadStep.jsx (Upload de arquivos)
│   ├── VehicleForm.jsx (Formulário de veículo)
│   ├── AddressForm.jsx (Formulário de endereço)
│   ├── SecurityFields.jsx (Email repetido, Senha repetida)
│   └── InputFieldWithValidation.jsx (Campo com validação em tempo real)
│
└── Inputs/
    ├── PhoneInput.jsx (Com bloqueio copiar/colar)
    ├── EmailInput.jsx (Com bloqueio copiar/colar)
    ├── PasswordInput.jsx (Com bloqueio copiar/colar + força)
    ├── CPFInput.jsx
    ├── CNPJInput.jsx
    ├── DateInput.jsx (Com validação de vencimento)
    └── FileUploadInput.jsx
```

---

## 📝 FLUXOS DETALHADOS

### FLUXO 1: Transportador PJ com 1 Veículo

```
RegistrationFlow
  → TypeSelector
    → "Transportador"
      → TransportadorTypeSelector
        → "PJ"
          → TransportadorPJForm
            Step 1: Razão Social, Nome Fantasia, CNPJ
            Step 2: Endereço Comercial (CEP, Rua, Número, Bairro, Cidade)
            Step 3: Email (sem paste), Confirmar Email (sem paste)
            Step 4: Telefone (xx) xxxxx-xxxx
            Step 5: Senha (sem copy/paste), Confirmar Senha (sem copy/paste)
            Step 6: Quantos veículos? 
                    (Sim: vai para passo 7 | Não: pula para docs)
            Step 7: Dados do Veículo
                    - Placa
                    - Tipo: Caminhão, Van, etc
                    - RENAVAM
                    - CRLV data vencimento
            Step 8: Upload Documentos
                    - Cartão CNPJ (obrigatório)
                    - RG Responsável
                    - CPF Responsável
                    - CNH Responsável (com data vencimento)
                    - CRLV do Veículo
                    - Comprovante Endereço Comercial
            
            Submit → Cria User
                   → Cria PerfilTransportadora
                   → Cria Veículo (se 1)
                   → Cria Documentos (multi-upload)
                   → Seta statusCadastro = "completo"
                   → Aguarda aprovação admin
```

### FLUXO 2: Transportador PJ com Múltiplos Veículos

```
            Step 6: Quantos veículos?
                    (Não: pula Step 7 e vai para Step 8)
            Step 8: Upload Documentos
                    - Cartão CNPJ
                    - RG Responsável
                    - CPF Responsável
                    - Comprovante Endereço Comercial
                    
            NOTA: Dados do veículo podem ser adicionados depois no Perfil
```

### FLUXO 3: Transportador Autônomo com CIOT

```
RegistrationFlow
  → TypeSelector
    → "Transportador"
      → TransportadorTypeSelector
        → "Autônomo"
          → TransportadorAutonomoForm
            Step 1: Nome, Sobrenome, CPF, RG
            Step 2: CNH (com data vencimento obrigatória)
            Step 3: Endereço Residencial
            Step 4: Email, Confirmar Email
            Step 5: Telefone
            Step 6: Senha, Confirmar Senha
            Step 7: Emite CIOT?
                    (Sim: vai para Step 8 | Não: pula para Step 9)
            Step 8: Dados CIOT
                    - Inscrição Municipal
                    - Número CIOT
            Step 9: Tipo de Veículo (Moto, Caminhão, Van, etc)
                    - Placa
                    - RENAVAM
                    - Data Vencimento CRLV
            Step 10: Upload Documentos
                    - CNH (obrigatório, com data vencimento)
                    - RG
                    - CPF
                    - CRLV
                    - Comprovante Endereço Residencial
                    - Documento CIOT (se emitente)
            
            Submit → Cria User
                   → Cria PerfilTransportadora
                   → Cria Veículo
                   → Cria Documentos
                   → Seta emiteCiot = true (se selecionou)
```

### FLUXO 4: Embarcador CPF

```
RegistrationFlow
  → TypeSelector
    → "Embarcador"
      → EmbarcadorTypeSelector
        → "CPF"
          → EmbarcadorCPFForm
            Step 1: Nome, Sobrenome, CPF
            Step 2: RG, CNH (opcional)
            Step 3: Endereço Residencial
            Step 4: Email, Confirmar Email
            Step 5: Telefone
            Step 6: Senha, Confirmar Senha
            Step 7: Upload Documentos
                    - CPF (obrigatório)
                    - RG (obrigatório)
                    - CNH (opcional - se informou)
                    - Comprovante Endereço Residencial
            
            Submit → Cria User
                   → Cria PerfilCliente
                   → Cria Documentos
                   → Seta tipoPessoa = "cpf"
```

### FLUXO 5: Embarcador CNPJ

```
RegistrationFlow
  → TypeSelector
    → "Embarcador"
      → EmbarcadorTypeSelector
        → "CNPJ"
          → EmbarcadorCNPJForm
            Step 1: Razão Social, Nome Fantasia, CNPJ
            Step 2: Endereço Comercial
            Step 3: Email, Confirmar Email
            Step 4: Telefone
            Step 5: Senha, Confirmar Senha
            Step 6: Upload Documentos
                    - Cartão CNPJ (obrigatório)
                    - Comprovante Endereço Comercial
            
            Submit → Cria User
                   → Cria PerfilCliente
                   → Cria Documentos
                   → Seta tipoPessoa = "cnpj"
```

---

## 🔐 SECURITY FEATURES (Implementar Fase 7)

### 1. Bloqueio de Copiar/Colar em Emails

```jsx
<EmailInput
  value={email}
  onChange={handleChange}
  onPaste={(e) => e.preventDefault()}
  onCopy={(e) => e.preventDefault()}
  placeholder="seu@email.com"
/>
```

### 2. Bloqueio de Copiar/Colar em Senhas

```jsx
<PasswordInput
  value={password}
  onChange={handleChange}
  onPaste={(e) => e.preventDefault()}
  onCopy={(e) => e.preventDefault()}
  showStrength={true}
/>
```

### 3. Validação em Tempo Real (Sem Submit)

```jsx
<PhoneInput
  value={phone}
  onChange={(value) => {
    setPhone(value);
    const validation = validatePhoneInput(value);
    setPhoneError(validation.error);
    setPhoneFormatted(validation.formatted);
  }}
/>
```

---

## 💾 ESTRUTURA DE REQUISIÇÃO/RESPOSTA

### Exemplo: Registro PJ com 1 Veículo

```javascript
// Request POST /api/auth/register
{
  "userType": "transportador",
  "tipoTransportador": "pj",
  "email": "contato@transportes.com",
  "emailConfirmado": "contato@transportes.com",
  "password": "Senha@123456",
  "passwordConfirmado": "Senha@123456",
  
  // Dados PJ
  "razaoSocial": "Transportes Silva LTDA",
  "nomeFantasia": "Silva Transport",
  "cnpj": "12345678901234",
  "telefone": "(11) 98765-4321",
  
  // Endereço
  "endereco": {
    "tipo": "comercial",
    "logradouro": "Avenida Principal",
    "numero": "123",
    "bairro": "Centro",
    "cidade": "São Paulo",
    "estado": "SP",
    "cep": "01234567"
  },
  
  // Veículo (se único)
  "quantidadeVeiculos": 1,
  "veiculo": {
    "placa": "ABC1234",
    "tipo": "caminhao",
    "renavam": "1234567890",
    "dataVencimentoCRLV": "2025-12-31"
  },
  
  // Documentos (FormData com files)
  "documentos": [
    {
      "tipo": "CARTAO_CNPJ",
      "file": File,
      "dataVencimento": null
    },
    {
      "tipo": "RG_RESPONSAVEL",
      "file": File,
      "dataVencimento": null
    },
    {
      "tipo": "CNH_RESPONSAVEL",
      "file": File,
      "dataVencimento": "2026-05-15"
    },
    {
      "tipo": "CRLV",
      "file": File,
      "dataVencimento": "2025-12-31"
    },
    {
      "tipo": "COMPROVANTE_ENDERECO",
      "file": File,
      "dataVencimento": null
    }
  ]
}

// Response 201 Created
{
  "success": true,
  "message": "Cadastro realizado com sucesso",
  "user": {
    "id": "user_123",
    "email": "contato@transportes.com",
    "statusCadastro": "completo",
    "userType": "transportador",
    "tipoTransportador": "pj",
    "razaoSocial": "Transportes Silva LTDA",
    "nomeFantasia": "Silva Transport"
  },
  "perfilTransportadora": {
    "id": "perfil_123",
    "statusDocumentos": "pendente_analise",
    "dataUltimaSolicitacaoAprovacao": "2026-02-05T10:30:00Z",
    "quantidadeVeiculos": 1
  },
  "veiculo": {
    "id": "veiculo_123",
    "placa": "ABC1234",
    "tipo": "caminhao"
  },
  "documentos": [
    {
      "id": "doc_1",
      "tipo": "CARTAO_CNPJ",
      "status": "pendente_analise"
    },
    // ... outros docs
  ]
}
```

---

## 🔗 ENDPOINTS NECESSÁRIOS

```
Frontend → Backend

POST /api/auth/register
  Body: Todos os dados do formulário + files

GET /api/auth/verify-email/:email
  Query: email
  Response: { available: boolean }

POST /api/auth/upload-documents
  Body: FormData com arquivos
  Response: { urls: [...] }

GET /api/profile/transportador/:userId
  Response: Todos os dados do perfil

PATCH /api/profile/transportador/:userId
  Body: Dados atualizados
  Response: Perfil atualizado

POST /api/documents/verify/:documentId
  Body: { status: 'aprovado'|'rejeitado', motivoRejeicao? }
  Response: Documento atualizado

GET /api/admin/registrations-pending
  Response: Lista de cadastros aguardando aprovação
```

---

## 📅 TIMELINE PROPOSTA

### Dia 1: Fase 4 (Transportador PJ)
- [ ] TransportadorPJForm.jsx
- [ ] Componentes compartilhados (FormStepper, AddressForm, etc)
- [ ] Backend: POST /api/auth/register (transportador PJ)
- [ ] Testes E2E do fluxo PJ

### Dia 2: Fase 5 (Transportador Autônomo)
- [ ] TransportadorAutonomoForm.jsx
- [ ] Ajustes em componentes compartilhados
- [ ] Backend: POST /api/auth/register (transportador autônomo)
- [ ] Testes E2E do fluxo autônomo

### Dia 3: Fase 6 (Embarcador)
- [ ] EmbarcadorCPFForm.jsx
- [ ] EmbarcadorCNPJForm.jsx
- [ ] Backend: POST /api/auth/register (embarcador)
- [ ] Testes E2E do fluxo embarcador

### Dia 4-5: Fase 7-8 (Segurança + Perfil)
- [ ] Inputs com bloqueio copiar/colar
- [ ] Validação em tempo real
- [ ] Páginas de perfil
- [ ] Testes completos

### Dia 6: Fase 9-10 (Aprovação + Renovação)
- [ ] Dashboard admin
- [ ] Workflow aprovação
- [ ] Sistema renovação anual

---

## 🎨 COMPONENTES BASE JÁ CRIADOS

✅ phoneValidator.js
✅ emailValidator.js
✅ cpfValidator.js
✅ cnpjValidator.js
✅ documentValidator.js

---

## ⚠️ PONTOS CRÍTICOS

1. **Validação de Vencimento de CNH**: Obrigatória para autônomos
2. **Upload de Documentos**: Múltiplos arquivos, validação de tipo/tamanho
3. **Bloqueio copiar/colar**: Implementar em EmailInput e PasswordInput
4. **Fluxo condicional**: Diferentes passos baseado em tipo de usuário
5. **Approval workflow**: Admin deve aprovar antes de acesso completo

---

**Próximo: Começar Fase 4 - Transportador PJ**
