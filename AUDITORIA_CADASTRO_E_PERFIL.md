# 📋 AUDITORIA COMPLETA - CADASTRO E PERFIL

## 🔍 ESTADO ATUAL DO SISTEMA

### ✅ O que JÁ EXISTE
```
✅ Model User (básico)
   - email, password, telefone, userType
   - nomeCompleto, cpfOuCnpj, nomeFantasia
   - tipoTransportador, razaoSocial, cnpj, cpf
   - emiteCiot, ehAutonomoCiot
   - relações com endereços, perfis, cotações

✅ Model PerfilCliente
   - Básico com taxas e avaliações
   - tipoPessoa, ehPJ

✅ Model PerfilTransportadora
   - Básico com avaliações
   - tipoTransportador, ehAutonomoCiot, emiteCiot

✅ Model Endereco
   - Endereços genéricos com tipo

✅ Model EnderecoColeta
   - Endereços específicos de coleta

✅ Componentes de Formulário
   - CadastroClienteForm.jsx (muito simples)
   - CadastroTransportadoraForm.jsx (muito simples)
```

### ❌ O que NÃO EXISTE / PRECISA EXPANDIR

```
BANCO DE DADOS:

❌ Model Documento (não existe)
   - Precisa: tipo, url, dataVencimento, status, dataParse

❌ Model Veiculo (não existe)
   - Precisa: placa, tipo, RENAVAM, CRLV, vencimentoCRLV, etc

❌ Campos no User (faltam)
   - documentoUrl/tipo para cada Doc: CNH, RG, CPF, CNPJ, etc
   - dataVencimentoCNH
   - fotoPerfil
   - statusCadastro (pendente, aprovado, rejeitado)
   - dataSolicitacaoAprovacao

❌ Campos no PerfilTransportadora
   - statusDocumentos (pendente, aprovado, rejeitado)
   - dataUltimaSolicitacaoAprovacao
   - motivoRejeicao
   - quantidadeVeiculos
   - emiteCiot (mudar para aqui, não no User)

❌ Campos no PerfilCliente
   - statusDocumentos
   - fotoPerfil

FRONTEND:

❌ Sistema de Upload de Documentos
   - Componente reutilizável
   - Validação de arquivo
   - Preview

❌ Formulário Transportador PJ (multietapa)
   - Decisão: 1 veículo ou múltiplos?
   - Se 1 veículo: dados do veículo
   - Se múltiplos: pular dados do veículo
   - Upload de documentos

❌ Formulário Transportador Autônomo (multietapa)
   - Decisão: Emite CIOT?
   - Se sim: dados de CIOT
   - Tipos de veículo: moto, caminhão, van, etc
   - Dados do veículo
   - Upload de documentos
   - Vencimento da CNH

❌ Formulário Embarcador (multietapa)
   - Decisão: CPF ou CNPJ?
   - Se CPF: dados pessoais + CNH
   - Se CNPJ: dados da empresa + CNPJ
   - Upload de documentos
   - Foto do perfil

❌ Validadores
   - Telefone: (xx) xxxxx-xxxx
   - Email: sem permitir colar
   - Senha: sem permitir colar/copiar
   - CPF: validação
   - CNPJ: validação
   - CNH: validação + data vencimento
   - Placa veículo: formato correto

❌ Páginas de Perfil
   - Perfil Transportador (exibir dados, editar, solicitar aprovação)
   - Perfil Embarcador (exibir dados, editar, solicitar aprovação)
   - Admin: Dashboard de aprovações

❌ Sistema de Aprovação
   - Base de dados para rastrear solicitações
   - Workflow de aprovação
   - Bloqueio de acesso se documentos vencidos
   - Notificações ao usuário

VALIDAÇÕES E SEGURANÇA:

❌ Bloqueio de copiar/colar em emails e senhas
❌ Validação de data de vencimento de documentos
❌ Verificação de documentos anuais
❌ Bloqueio de acesso se doc vencido
```

---

## 📊 MATRIZ DE CAMPOS POR TIPO DE USUÁRIO

### 📦 TRANSPORTADOR PJ (Com 1 Veículo)
```
OBRIGATÓRIOS:
✓ Nome Empresa (razaoSocial)
✓ Nome Fantasia
✓ CNPJ
✓ Telefone (xx) xxxxx-xxxx
✓ Email (sem paste)
✓ Confirmar Email (sem paste)
✓ Senha (sem copy/paste)
✓ Confirmar Senha (sem copy/paste)
✓ Endereço Comercial (cep, rua, etc)
✓ Dados do Responsável (nome, sobrenome, CPF)
✓ CNH Responsável (com data vencimento)
✓ Placa do Veículo
✓ Tipo de Veículo (Caminhão, Van, etc)
✓ RENAVAM
✓ CRLV (Certificado)

DOCUMENTOS (Upload):
✓ Cartão CNPJ
✓ RG Responsável
✓ CPF Responsável
✓ CNH Responsável
✓ CRLV do Veículo
✓ Comprovante Endereço Comercial
✓ Documento do Veículo (anual)

OPCIONAL:
• Nome Segundo Documento
• Observações
```

### 📦 TRANSPORTADOR PJ (Múltiplos Veículos)
```
OBRIGATÓRIOS:
✓ Nome Empresa (razaoSocial)
✓ Nome Fantasia
✓ CNPJ
✓ Telefone
✓ Email (sem paste)
✓ Confirmar Email (sem paste)
✓ Senha (sem copy/paste)
✓ Confirmar Senha (sem copy/paste)
✓ Endereço Comercial

DOCUMENTOS (Upload):
✓ Cartão CNPJ
✓ Documento Responsável
✓ Comprovante Endereço Comercial

NOTA: Dados do veículo podem ser adicionados depois no perfil
```

### 🏍️ TRANSPORTADOR AUTÔNOMO (CIOT = SIM)
```
OBRIGATÓRIOS:
✓ Nome Completo
✓ Sobrenome
✓ CPF
✓ RG
✓ CNH (com data vencimento)
✓ Telefone (xx) xxxxx-xxxx
✓ Email (sem paste)
✓ Confirmar Email (sem paste)
✓ Senha (sem copy/paste)
✓ Confirmar Senha (sem copy/paste)
✓ Endereço Residencial (cep, rua, etc)
✓ Placa do Veículo
✓ Tipo de Veículo (Moto, Caminhão, etc)
✓ RENAVAM
✓ CRLV
✓ Inscrição Municipal (para CIOT)

DOCUMENTOS (Upload):
✓ CNH
✓ RG
✓ CPF
✓ CRLV
✓ Comprovante Endereço Residencial
✓ Documento CIOT Autenticado

OPCIONAL:
• Observações
```

### 🏍️ TRANSPORTADOR AUTÔNOMO (CIOT = NÃO)
```
OBRIGATÓRIOS:
✓ Nome Completo
✓ Sobrenome
✓ CPF
✓ RG
✓ CNH (com data vencimento)
✓ Telefone
✓ Email (sem paste)
✓ Confirmar Email (sem paste)
✓ Senha (sem copy/paste)
✓ Confirmar Senha (sem copy/paste)
✓ Endereço Residencial
✓ Placa do Veículo
✓ Tipo de Veículo
✓ RENAVAM
✓ CRLV

DOCUMENTOS (Upload):
✓ CNH
✓ RG
✓ CPF
✓ CRLV
✓ Comprovante Endereço Residencial

NOTA: Sem CIOT - menos documentação
```

### 👤 EMBARCADOR CPF
```
OBRIGATÓRIOS:
✓ Nome Completo
✓ Sobrenome
✓ CPF
✓ RG
✓ CNH (se quiser ser motorista)
✓ Telefone
✓ Email (sem paste)
✓ Confirmar Email (sem paste)
✓ Senha (sem copy/paste)
✓ Confirmar Senha (sem copy/paste)
✓ Endereço Residencial

DOCUMENTOS (Upload):
✓ CPF
✓ RG
✓ CNH (opcional)
✓ Comprovante Endereço Residencial

OPCIONAL:
• Foto do Perfil
• Informações Adicionais (depois na edição)
```

### 🏢 EMBARCADOR CNPJ
```
OBRIGATÓRIOS:
✓ Razão Social
✓ Nome Fantasia
✓ CNPJ
✓ Telefone
✓ Email (sem paste)
✓ Confirmar Email (sem paste)
✓ Senha (sem copy/paste)
✓ Confirmar Senha (sem copy/paste)
✓ Endereço Comercial

DOCUMENTOS (Upload):
✓ Cartão CNPJ
✓ Comprovante Endereço Comercial

OPCIONAL:
• Foto do Perfil
• Informações Adicionais (depois na edição)

NOTA: Sem CNH (empresa não é motorista)
```

---

## 🗂️ ESTRUTURA DE PASTAS A CRIAR

```
src/
├── components/
│   ├── auth/
│   │   ├── registration/ (NOVO)
│   │   │   ├── TransportadorPJForm.jsx
│   │   │   ├── TransportadorAutonomoForm.jsx
│   │   │   ├── EmbarcadorForm.jsx
│   │   │   ├── DocumentUpload.jsx
│   │   │   ├── VehicleForm.jsx
│   │   │   └── RegistrationStepper.jsx
│   │   ├── validators/ (NOVO)
│   │   │   ├── phoneValidator.js
│   │   │   ├── emailValidator.js
│   │   │   ├── cpfValidator.js
│   │   │   ├── cnpjValidator.js
│   │   │   └── documentValidator.js
│   │   └── ... (existentes)
│   ├── profile/ (NOVO)
│   │   ├── TransportadorProfile.jsx
│   │   ├── EmbarcadorProfile.jsx
│   │   ├── ProfileEdit.jsx
│   │   └── ApprovalStatus.jsx
│   └── ...
│
├── pages/
│   ├── registro/ (NOVO)
│   │   ├── transportador.jsx
│   │   └── embarcador.jsx
│   ├── perfil/ (NOVO)
│   │   ├── transportador.jsx
│   │   └── embarcador.jsx
│   └── ...
│
└── utils/
    ├── upload/ (NOVO)
    │   ├── uploadConfig.js
    │   └── fileValidator.js
    └── ...

backend/
├── routes/
│   ├── auth.js (expansão)
│   ├── documents.js (NOVO)
│   ├── profile.js (NOVO)
│   └── vehicles.js (NOVO)
│
├── controllers/
│   ├── authController.js (expansão)
│   ├── documentController.js (NOVO)
│   ├── profileController.js (NOVO)
│   └── vehicleController.js (NOVO)
│
└── middleware/
    └── documentValidator.js (NOVO)
```

---

## 📅 TIMELINE DE IMPLEMENTAÇÃO

### Fase 1: Preparação do Banco (1-2 dias)
- [ ] Criar Model Documento
- [ ] Criar Model Veiculo
- [ ] Expandir User
- [ ] Expandir PerfilTransportadora
- [ ] Expandir PerfilCliente
- [ ] Migration Prisma

### Fase 2: Utilidades e Validadores (1 dia)
- [ ] phoneValidator (formato (xx) xxxxx-xxxx)
- [ ] emailValidator (sem paste)
- [ ] Validadores de CPF/CNPJ
- [ ] Validador de documentos
- [ ] Sistema de upload de files

### Fase 3: Componentes Base (2 dias)
- [ ] DocumentUpload.jsx
- [ ] VehicleForm.jsx
- [ ] RegistrationStepper.jsx
- [ ] Campos com bloqueio de copy/paste

### Fase 4: Transportador PJ (1-2 dias)
- [ ] Decisão 1 veículo vs múltiplos
- [ ] Formulário condicional
- [ ] Upload de documentos
- [ ] API backend

### Fase 5: Transportador Autônomo (2 dias)
- [ ] Decisão CIOT Sim/Não
- [ ] Tipos de veículo
- [ ] Dados de CNH com vencimento
- [ ] Upload de documentos
- [ ] API backend

### Fase 6: Embarcador (1-2 dias)
- [ ] Decisão CPF vs CNPJ
- [ ] Formulários condicionais
- [ ] Upload de documentos
- [ ] API backend

### Fase 7: Perfil Transportador (2 dias)
- [ ] Exibição de dados
- [ ] Edição de informações
- [ ] Status de aprovação
- [ ] Renovação anual de documentos

### Fase 8: Perfil Embarcador (1 dia)
- [ ] Exibição de dados
- [ ] Edição de informações
- [ ] Status de aprovação

### Fase 9: Sistema de Aprovação (2 dias)
- [ ] Dashboard admin
- [ ] Workflow de aprovação
- [ ] Notificações
- [ ] Bloqueio se vencido

### Fase 10: Testes e Ajustes (2 dias)
- [ ] Testes de cada formulário
- [ ] Testes de upload
- [ ] Testes de validação
- [ ] E2E tests

---

## 🎯 PRIORIDADE DE IMPLEMENTAÇÃO

### 🔴 CRÍTICO (Comece por aqui)
1. Expandir banco de dados (Model Documento, Veiculo)
2. Criar validadores (telefone, email, etc)
3. Sistema de upload de documentos
4. Formulário Transportador (separar PJ e Autônomo)

### 🟠 IMPORTANTE (Depois)
5. Formulário Embarcador (separar CPF e CNPJ)
6. Páginas de Perfil
7. Sistema de aprovação

### 🟡 COMPLEMENTAR (Por último)
8. Notificações
9. Dashboard admin
10. Renovação anual

---

## 💾 EXEMPLO DE ESTRUTURA DE DADOS ESPERADA

### User Expandido (exemplo em JSON)
```json
{
  "id": "user_123",
  "email": "transportador@example.com",
  "userType": "transportador",
  "tipoTransportador": "pj",
  "telefone": "(11) 98765-4321",
  "statusCadastro": "pendente",
  
  // Se PJ
  "razaoSocial": "Transportes Silva LTDA",
  "nomeFantasia": "Silva Transport",
  "cnpj": "12345678901234",
  
  // Se Autônomo
  "nomeCompleto": "João da Silva",
  "sobrenome": "Silva",
  "cpf": "12345678900",
  "dataVencimentoCNH": "2026-05-15",
  
  // Documentos
  "documentos": [
    {
      "id": "doc_1",
      "tipo": "CNH",
      "url": "s3://bucket/cnh_123.pdf",
      "dataVencimento": "2026-05-15",
      "status": "pendente_aprovacao",
      "dataUpload": "2024-12-20"
    }
  ],
  
  // Veículos (se aplicável)
  "veiculos": [
    {
      "id": "vei_1",
      "placa": "ABC1234",
      "tipo": "caminhao",
      "renavam": "1234567890",
      "dataVencimentoCRLV": "2025-12-31",
      "documentoCRLVUrl": "s3://bucket/crlv_123.pdf"
    }
  ]
}
```

---

## ✅ CHECKLIST DE APROVAÇÃO FINAL

Antes de cada fase, validar:
- [ ] Código formatado (ESLint, Prettier)
- [ ] Sem erros de console
- [ ] Validações funcionando
- [ ] Upload de files funcionando
- [ ] Sem quebra de existentes
- [ ] Database migration ok
- [ ] Testes passando
- [ ] Documentação atualizada

---

**Próximo passo: Começar Fase 1 - Expandir banco de dados**
