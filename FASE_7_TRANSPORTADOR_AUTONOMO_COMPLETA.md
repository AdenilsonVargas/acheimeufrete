═══════════════════════════════════════════════════════════════════════════════
                    🚗 FASE 7 - TRANSPORTADOR AUTÔNOMO ✅ COMPLETA
═══════════════════════════════════════════════════════════════════════════════

RESUMO EXECUTIVO
═════════════════════════════════════════════════════════════════════════════

Fase 7 implementa o formulário completo para registro de Transportador Autônomo,
com suporte a decisão di CIOT, validação de CNH obrigatória com vencimento,
e seleção de tipo de veículo com múltiplas opções (Moto, Caminhão, Van, etc).

Status: ✅ COMPLETO
Arquivos criados: 2 (Form + Page)
Linhas de código: ~600 linhas
Componentes reutilizados: 7 base components
Validadores integrados: Todos os 5 validadores


ARQUITETURA - COMPARAÇÃO COM TRANSPORTADOR PJ
═════════════════════════════════════════════════════════════════════════════

TRANSPORTADOR PJ (Fase 5-6)          | TRANSPORTADOR AUTÔNOMO (Fase 7)
─────────────────────────────────────┼────────────────────────────────────
7 passos                            | 8-9 passos (condicional)
Empresa (CNPJ)                      | Dados Pessoais (CPF)
Endereço Comercial                  | Endereço Residencial
Responsável (Nome + Sobrenome)      | Pessoa = Responsável
CNH obrigatória c/ vencimento       | CNH obrigatória c/ vencimento
1 ou múltiplos veículos             | 1 veículo (autônomo)
Sem CIOT                            | CIOT condicional (sim/não)
6 documentos obrigatórios           | 4 documentos obrigatórios


LÓGICA DE PASSOS (COM BRANCHING INTELIGENTE)
═════════════════════════════════════════════════════════════════════════════

FLUXO PADRÃO:
  Step 0: Dados Pessoais (Nome, Sobrenome, CPF, RG, CNH com vencimento)
    ↓
  Step 1: Endereço Residencial (CEP automático via ViaCEP)
    ↓
  Step 2: Contato (Email + Confirmação, Telefone)
    ↓
  Step 3: Segurança (Senha + Confirmação com força)
    ↓
  Step 4: 🔀 DECISÃO - CIOT? 🔀
    ├─→ SIM: showCiotStep = true
    │    ↓
    │  Step 5: Dados CIOT (Número + Vencimento)
    │    ↓
    │  Step 6: Veículo (Tipo, Placa, RENAVAM, CRLV)
    │    ↓
    │  Step 7: Documentos (4 obrigatórios)
    │
    └─→ NÃO: showCiotStep = false
         ↓
       Step 5: Veículo (Tipo, Placa, RENAVAM, CRLV) [PULOU Step intermediário]
         ↓
       Step 6: Documentos (4 obrigatórios)

RESULTADO FINAL:
- Se CIOT = SIM:   8 passos totais (0-7)
- Se CIOT = NÃO:   7 passos totais (0-6, com Step 5 sendo Veículo)

Implementação com getSteps():
  const getSteps = () => {
    const baseSteps = [Step 0-4]; // Sempre os mesmos 5
    if (showCiotStep === true) {
      baseSteps.push(Passo 5 CIOT);
    }
    baseSteps.push(Passo Veículo, Passo Documentos);
    return baseSteps;
  }

Renderização com lógica condicional:
  case 5: // Dados CIOT
    if (showCiotStep === true) { renderiza CIOT }
    return null;
  
  case 6: // Veículo
  case 5:
    if ((showCiotStep === true && currentStep === 6) 
        || (showCiotStep !== true && currentStep === 5)) {
      renderiza Veículo
    }


COMPONENTES INTEGRADOS
═════════════════════════════════════════════════════════════════════════════

COMPONENTES REUTILIZADOS (7):
├─ FormStepper.jsx
│  └─ Mostra progresso visual com número de passos/total
│     showCiotStep = true  → steps.length = 8
│     showCiotStep = false → steps.length = 7
│
├─ PhoneInput.jsx
│  └─ Validação (11) xxxxx-xxxx com DDD 11-99
│     Usado em: Step 2 (Contato)
│
├─ EmailInput.jsx (+ EmailConfirmInput)
│  └─ Bloqueio copiar/colar no campo de confirmação
│     Usado em: Step 2 (Contato)
│
├─ PasswordInput.jsx (+ PasswordConfirmInput)
│  └─ Indicador de força (5 critérios)
│     Bloqueio copy/paste
│     Usado em: Step 3 (Segurança)
│
├─ CPFInput.jsx
│  └─ Validação com algoritmo verificador
│     Formato: xxx.xxx.xxx-xx
│     Usado em: Step 0 (Dados Pessoais)
│
├─ DateInput.jsx
│  └─ Validação de vencimento com 3 estados:
│     🟢 Válido (mais de 30 dias)
│     🟡 Próximo vencimento (7-30 dias)
│     🔴 Vencido (menos de 7 dias)
│     Usado em: Steps 0, 5 (condicional), 6
│
├─ AddressForm.jsx
│  └─ CEP automático via ViaCEP
│     Busca logradouro, bairro, cidade, estado
│     Validação assíncrona com loading
│     Usado em: Step 1 (Endereço Residencial)
│
└─ DocumentUpload.jsx
   └─ Grid de documentos
      Requisitos: CNH, RG, CPF, COMPROVANTE_ENDERECO
      Validação MIME + tamanho (10MB max)
      Usado em: Step 7 (Documentos)


DADOS COLETADOS
═════════════════════════════════════════════════════════════════════════════

PASSO 0 - DADOS PESSOAIS:
├─ nome (text, obrigatório)
├─ sobrenome (text, obrigatório)
├─ cpf (text, validado com algoritmo, obrigatório)
├─ rg (text, obrigatório)
├─ cnhNumero (text, 15 dígitos, obrigatório)
└─ cnhVencimento (date, obrigatório, validação vencimento)

PASSO 1 - ENDEREÇO RESIDENCIAL:
├─ cep (text, obrigatório, CEP lookup)
├─ logradouro (text, obrigatório, pre-preenchido via CEP)
├─ numero (text, obrigatório)
├─ complemento (text, opcional)
├─ bairro (text, obrigatório, pre-preenchido via CEP)
├─ cidade (text, obrigatório, pre-preenchido via CEP)
└─ estado (select, obrigatório, 27 opções)

PASSO 2 - CONTATO:
├─ email (email, validado, obrigatório)
├─ emailConfirmacao (email, sem copiar/colar, match validation, obrigatório)
└─ telefone (tel, formato (xx) xxxxx-xxxx, obrigatório)

PASSO 3 - SEGURANÇA:
├─ senha (password, força mínima exigida, obrigatória)
└─ senhaConfirmacao (password, sem copiar/colar, match validation, obrigatória)

PASSO 4 - DECISÃO CIOT:
└─ ciotDecision (button choice, obrigatório: true/false/null)

PASSO 5 (CONDICIONAL) - DADOS CIOT:
├─ ciotNumero (text, 15 dígitos, obrigatório se CIOT = SIM)
└─ ciotVencimento (date, obrigatório se CIOT = SIM)

PASSO 6/5 - VEÍCULO:
├─ veiculo.tipo (select, obrigatório) → 5 opções de tipos
│  ├─ Moto
│  ├─ Triciclo
│  ├─ Caminhão
│  ├─ Van
│  └─ Utilitário
├─ veiculo.placa (text, uppercase, obrigatório)
├─ veiculo.renavam (text, 11 dígitos, obrigatório)
└─ veiculo.crlvVencimento (date, validação vencimento, obrigatório)

PASSO 7/6 - DOCUMENTOS:
├─ Documentos obrigatórios (4):
│  ├─ CNH (com foto)
│  ├─ RG (com foto)
│  ├─ CPF (documento)
│  └─ COMPROVANTE_ENDERECO (recente)
└─ Documentos opcionais: Nenhum para autônomo


VALIDAÇÃO POR PASSO
═════════════════════════════════════════════════════════════════════════════

PASSO 0 - DADOS PESSOAIS:
├─ nome: não vazio ✓
├─ sobrenome: não vazio ✓
├─ cpf: validação algoritmo verificador ✓ (rejeita CPF genérico)
├─ rg: não vazio ✓
├─ cnhNumero: não vazio ✓
└─ cnhVencimento: data válida + validação vencimento ✓
   └─ Status: 🟡 PRÓXIMO_VENCIMENTO = Aviso visual
   └─ Status: 🔴 VENCIDO = Bloqueia avanço

PASSO 1 - ENDEREÇO:
├─ cep: não vazio ✓
├─ logradouro: não vazio ✓
├─ numero: não vazio ✓
├─ bairro: não vazio ✓
├─ cidade: não vazio ✓
└─ estado: não vazio ✓

PASSO 2 - CONTATO:
├─ email: validação email regex ✓
├─ emailConfirmacao: match com email ✓ (sem copiar/colar)
└─ telefone: validação (xx) xxxxx-xxxx DDD 11-99 ✓

PASSO 3 - SEGURANÇA:
├─ senha: força 5 critérios:
│  ├─ 8+ caracteres
│  ├─ 1+ maiúscula
│  ├─ 1+ minúscula
│  ├─ 1+ número
│  └─ 1+ especial (!@#$%^&*)
└─ senhaConfirmacao: match com senha ✓ (sem copiar/colar)

PASSO 4 - DECISÃO CIOT:
└─ showCiotStep: !== null (obrigatório escolher sim/não)

PASSO 5 (CONDICIONAL) - DADOS CIOT:
├─ ciotNumero: não vazio (se SIM)
└─ ciotVencimento: data válida + vencimento (se SIM)

PASSO 6/5 - VEÍCULO:
├─ tipo: um dos 5 tipos selecionado
├─ placa: não vazio, uppercase
├─ renavam: não vazio
└─ crlvVencimento: data válida + vencimento ✓

PASSO 7/6 - DOCUMENTOS:
└─ 4 documentos obrigatórios uploaded


CAPTURA DE ERROS
═════════════════════════════════════════════════════════════════════════════

validateStep(stepId):
├─ Retorna objeto {fieldName: "erro message"}
├─ Renderiza em vermelho próximo ao campo
├─ Bloqueio de avanço até correção
└─ Limpa erros ao voltar passo

Exemplos de mensagens:
├─ "Nome obrigatório"
├─ "CPF inválido"
├─ "Os emails não conferem"
├─ "Senha fraca (min 8 caracteres, 1 maiúscula, 1 número, 1 especial)"
├─ "Escolha uma opção" (CIOT)
├─ "Data de vencimento obrigatória"
└─ "Todos os documentos obrigatórios devem ser enviados"


SUBMISSÃO E API
═════════════════════════════════════════════════════════════════════════════

handleSubmit():
1. Validar step final
2. Preparar FormData:
   ├─ Valores texto: form.nome, form.cpf, etc
   ├─ Objetos aninhados: JSON.stringify(form.endereco), form.veiculo
   ├─ Condicional: se ciotDecision === true, adiciona ciotNumero + ciotVencimento
   └─ Arquivos: loop com uploadedFiles
3. POST para /api/auth/register (ainda não implementado no backend)
4. Se sucesso:
   ├─ userType = "transportador_autonomo"
   ├─ Mostra success message
   └─ Redireciona para /login?registered=true&type=transportador_autonomo
5. Se erro:
   └─ Exibe mensagem de erro em AlertCircle

Espera implementação do endpoint POST /api/auth/register


FLUXO DE USO (PASSO A PASSO)
═════════════════════════════════════════════════════════════════════════════

1. Abrir http://localhost:3000/registro/transportador-autonomo
2. Preencher PASSO 0 (Dados Pessoais)
   └─ Nome: "João"
   └─ Sobrenome: "Silva"
   └─ CPF: "123.456.789-09" (válido ou não)
   └─ RG: "12.345.678-9"
   └─ CNH: "123456789012345"
   └─ Vencimento CNH: 2026-12-31
   └─ ✅ Clique "Próximo"

3. Preencher PASSO 1 (Endereço)
   └─ CEP: "01310-100"
   └─ Sistema busca automaticamente na ViaCEP
   └─ Confirma logradouro, bairro, cidade
   └─ Seleciona estado SP
   └─ ✅ Clique "Próximo"

4. Preencher PASSO 2 (Contato)
   └─ Email: "joao@example.com"
   └─ Email Confirmação: (sem copiar/colar) "joao@example.com"
   └─ Telefone: "(11) 98765-4321"
   └─ ✅ Clique "Próximo"

5. Preencher PASSO 3 (Segurança)
   └─ Senha: "Senha@123456" (força alta)
   └─ Confirmação: (sem copiar/colar) "Senha@123456"
   └─ ✅ Clique "Próximo"

6. Responder PASSO 4 (CIOT ?)
   └─ Opção 1: Clique "Sim" → Steps 0-7 (8 passos)
   └─ Opção 2: Clique "Não" → Steps 0-6 (7 passos)

CENÁRIO A: RESPONDEU "SIM" AO CIOT
====================================
7A. Preencher PASSO 5 (Dados CIOT)
    └─ Número CIOT: "000000000000000"
    └─ Vencimento: 2026-12-31
    └─ ✅ Clique "Próximo"

8A. Preencher PASSO 6 (Veículo)
    └─ Tipo: "Moto"
    └─ Placa: "ABC1234"
    └─ RENAVAM: "12345678901"
    └─ CRLV Vencimento: 2026-12-31
    └─ ✅ Clique "Próximo"

9A. Upload PASSO 7 (Documentos)
    └─ CNH: upload file
    └─ RG: upload file
    └─ CPF: upload file
    └─ Comprovante: upload file
    └─ ✅ Clique "Finalizar Cadastro"

CENÁRIO B: RESPONDEU "NÃO" AO CIOT
===================================
7B. Pular automaticamente para Veículo (Step 5 agora, não 6)

8B. Preencher PASSO 5 (Veículo) [pulou CIOT]
    └─ Tipo: "Van"
    └─ Placa: "XYZ9876"
    └─ RENAVAM: "98765432109"
    └─ CRLV Vencimento: 2026-12-31
    └─ ✅ Clique "Próximo"

9B. Upload PASSO 6 (Documentos) [pulou CIOT]
    └─ CNH: upload file
    └─ RG: upload file
    └─ CPF: upload file
    └─ Comprovante: upload file
    └─ ✅ Clique "Finalizar Cadastro"

RESULTADO FINAL:
└─ Success message exibida por 2 segundos
└─ Redireciona para /login?registered=true&type=transportador_autonomo


ESTRUTURA DE ARQUIVOS
═════════════════════════════════════════════════════════════════════════════

/src/components/auth/registration/transportador/
├─ TransportadorPJForm.jsx (Fase 5-6, 550 linhas)
└─ TransportadorAutonomoForm.jsx (Fase 7, 600 linhas) ← NOVO

/src/pages/registro/
├─ transportador-pj.jsx (Fase 6)
└─ transportador-autonomo.jsx (Fase 7) ← NOVO

Total de componentes Form agora: 2 (PJ + Autônomo)
Total de páginas agora: 2 (PJ + Autônomo)


REUTILIZAÇÃO DE COMPONENTES
═════════════════════════════════════════════════════════════════════════════

Componentes compartilhados entre TransportadorPJForm e TransportadorAutonomoForm:

✅ FormStepper.jsx
   └─ PJ: currentStep, steps[7]
   └─ Autônomo: currentStep, steps[7-8] dinâmico

✅ PhoneInput.jsx
   └─ PJ: Step 2 (Contato)
   └─ Autônomo: Step 2 (Contato)

✅ EmailInput.jsx + EmailConfirmInput.jsx
   └─ PJ: Step 2 (Contato)
   └─ Autônomo: Step 2 (Contato)

✅ PasswordInput.jsx + PasswordConfirmInput.jsx
   └─ PJ: Step 3 (Segurança)
   └─ Autônomo: Step 3 (Segurança)

✅ CPFInput.jsx
   └─ PJ: Step 2 (Dados Responsável)
   └─ Autônomo: Step 0 (Dados Pessoais)

✅ DateInput.jsx
   └─ PJ: Steps 2, 5, 6 (CNH, CRLV vencimentos)
   └─ Autônomo: Steps 0, 5 (condicional), 6 (CNH, CIOT, CRLV vencimentos)

✅ AddressForm.jsx
   └─ PJ: Step 1 (Endereço Comercial)
   └─ Autônomo: Step 1 (Endereço Residencial)

✅ DocumentUpload.jsx
   └─ PJ: Step 6 (6 documentos: CARTAO_CNPJ, RG, CPF, CNH, CRLV, COMPROVANTE)
   └─ Autônomo: Step 7/6 (4 documentos: CNH, RG, CPF, COMPROVANTE)


DIFERENCIAIS DO AUTÔNOMO VS PJ
═════════════════════════════════════════════════════════════════════════════

AUTÔNOMO:
├─ ✅ CIOT condicional (yes/no decision)
├─ ✅ Branching dinâmico de passos
├─ ✅ CNH obrigatória (não opcional)
├─ ✅ Endereço residencial (não comercial)
├─ ✅ Sem dados de empresa (CNPJ/IE)
├─ ✅ Sem responsável separado (é a pessoa)
├─ ✅ Menos documentos (4 vs 6)
├─ ✅ Tipos de veículo múltiplos (Moto, Caminhão, etc)
└─ ✅ Sem múltiplos veículos (apenas 1)

PJ:
├─ ✅ Sem CIOT
├─ ✅ Fluxo linear (sem branching)
├─ ✅ CNH obrigatória no responsável
├─ ✅ Endereço comercial
├─ ✅ Dados de empresa (CNPJ/IE)
├─ ✅ Responsável separado (legal)
├─ ✅ Mais documentos (6 obrigatórios)
├─ ✅ Menos seleção de tipo veículo
└─ ✅ Suporta múltiplos veículos (botão yes/no)


TECNOLOGIAS MANTIDAS
═════════════════════════════════════════════════════════════════════════════

Framework: React/Next.js
Styling: TailwindCSS + dark mode
Icons: Lucide React
Validation: Custom validators (sem bibliotecas)
External APIs: ViaCEP (CEP lookup)
State: React hooks (useState)
File Upload: FormData native API


PRÓXIMOS PASSOS
═════════════════════════════════════════════════════════════════════════════

FASE 8: Embarcador (CPF + CNPJ)
├─ EmbarcadorCPFForm.jsx (~500 linhas)
│  ├─ 5 passos: Dados Pessoais, Endereço, Contato, Segurança, Documentos
│  └─ Reutiliza 5/7 componentes
│
└─ EmbarcadorCNPJForm.jsx (~550 linhas)
   ├─ 6 passos: Dados Empresa, Endereço, Contato Representante, Segurança, Documentos
   └─ Reutiliza 6/7 componentes

FASE 9: Backend API
├─ POST /api/auth/register
│  ├─ Parse FormData
│  ├─ Cria User com userType
│  ├─ Cria PerfilTransportadora ou PerfilCliente
│  └─ Salva documentos
│
└─ POST /api/documents/upload
   ├─ Recebe arquivo
   └─ Salva no storage (S3 ou local)

FASE 10: Profiles + Testes


═══════════════════════════════════════════════════════════════════════════════
                       STATUS: ✅ FASE 7 COMPLETA
═══════════════════════════════════════════════════════════════════════════════

Arquivos criados: 2
├─ TransportadorAutonomoForm.jsx (600 linhas)
└─ transportador-autonomo.jsx (página)

Rota disponível: http://localhost:3000/registro/transportador-autonomo

Componentes reutilizados: 7/9 componentes base

Próximo: Fase 8 (Embarcador CPF + CNPJ) ou outro?
