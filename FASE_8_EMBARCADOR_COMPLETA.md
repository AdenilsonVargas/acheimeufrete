═══════════════════════════════════════════════════════════════════════════════
           🏢 FASE 8 - EMBARCADOR CPF E CNPJ ✅ COMPLETA
═══════════════════════════════════════════════════════════════════════════════

RESUMO EXECUTIVO
═════════════════════════════════════════════════════════════════════════════

Fase 8 implementa dois formulários com finalidades diferentes:

1️⃣ EmbarcadorCPF: Para pessoas físicas que contratam transporte
   └─ 5 passos, dados simples e diretos

2️⃣ EmbarcadorCNPJ: Para empresas que contratam transporte
   └─ 6 passos, dados de empresa + representante + faturamento

Ambas reutilizam componentes base e seguem padrão de validação.

Status: ✅ COMPLETO
Arquivos criados: 4 (2 Forms + 2 Pages)
Linhas de código: ~1.100 linhas
Componentes reutilizados: 7 base components


🏢 EMBARCADOR CPF - 5 PASSOS
═════════════════════════════════════════════════════════════════════════════

ARQUITETURA:
  Step 0: Dados Pessoais
  Step 1: Endereço Residencial
  Step 2: Contato
  Step 3: Segurança
  Step 4: Documentos

DADOS COLETADOS:
──────────────────────────────────────────────────────────────────

PASSO 0 - Dados Pessoais:
├─ nome (text, obrigatório)
├─ sobrenome (text, obrigatório)
├─ cpf (text, validado com algoritmo, obrigatório)
└─ rg (text, obrigatório)

PASSO 1 - Endereço Residencial:
├─ cep (text, obrigatório, busca automática)
├─ logradouro (text, obrigatório)
├─ numero (text, obrigatório)
├─ complemento (text, opcional)
├─ bairro (text, obrigatório)
├─ cidade (text, obrigatório)
└─ estado (select, obrigatório, 27 opções)

PASSO 2 - Contato:
├─ email (email, obrigatório)
├─ emailConfirmacao (email, sem copiar/colar, obrigatório)
└─ telefone (tel, formato (xx) xxxxx-xxxx, obrigatório)

PASSO 3 - Segurança:
├─ senha (password, força obrigatória, obrigatória)
└─ senhaConfirmacao (password, sem copiar/colar, obrigatória)

PASSO 4 - Documentos (3 obrigatórios):
├─ CPF (documento de identidade)
├─ RG (documento de identidade)
└─ COMPROVANTE_ENDERECO (recente)

CAMPOS TOTAIS: 18 campos
DOCUMENTOS: 3 obrigatórios
VALIDAÇÕES: Nome, Sobrenome, CPF, RG, CEP, Logradouro, Email match, Telefone formato, Senha força


🏢 EMBARCADOR CNPJ - 6 PASSOS
═════════════════════════════════════════════════════════════════════════════

ARQUITETURA:
  Step 0: Dados da Empresa
  Step 1: Endereço Comercial
  Step 2: Contato do Representante
  Step 3: Segurança
  Step 4: Dados de Faturamento
  Step 5: Documentos

DADOS COLETADOS:
──────────────────────────────────────────────────────────────────

PASSO 0 - Dados da Empresa:
├─ razaoSocial (text, obrigatório)
├─ nomeFantasia (text, obrigatório)
├─ cnpj (text, validado com algoritmo, obrigatório)
└─ inscricaoEstadual (text, obrigatório)

PASSO 1 - Endereço Comercial:
├─ cep (text, obrigatório, busca automática)
├─ logradouro (text, obrigatório)
├─ numero (text, obrigatório)
├─ complemento (text, opcional)
├─ bairro (text, obrigatório)
├─ cidade (text, obrigatório)
└─ estado (select, obrigatório)

PASSO 2 - Contato do Representante:
├─ nomeRepresentante (text, obrigatório)
├─ sobrenomeRepresentante (text, obrigatório)
├─ email (email, obrigatório)
├─ emailConfirmacao (email, sem copiar/colar, obrigatório)
└─ telefone (tel, obrigatório)

PASSO 3 - Segurança:
├─ senha (password, força obrigatória)
└─ senhaConfirmacao (password, sem copiar/colar)

PASSO 4 - Dados de Faturamento:
├─ nomeContato (text, obrigatório)
├─ emailFaturamento (email, obrigatório)
└─ telefoneFaturamento (tel, obrigatório)

PASSO 5 - Documentos (3 obrigatórios):
├─ CARTAO_CNPJ (cartão do CNPJ)
├─ RG_REPRESENTANTE (RG de quem representa)
└─ COMPROVANTE_ENDERECO (comprovante comercial)

CAMPOS TOTAIS: 23 campos
DOCUMENTOS: 3 obrigatórios
VALIDAÇÕES: Razão Social, CNPJ, IE, CEP, Email match, Telefone formato, Senha força


📊 COMPARAÇÃO: CPF vs CNPJ
═════════════════════════════════════════════════════════════════════════════

ASPECTO                 | CPF (5 PASSOS)            | CNPJ (6 PASSOS)
─────────────────────────────────────────────────────────────────────────────
Passo 0                | Dados Pessoais            | Dados da Empresa
Passo 1                | Endereço Residencial      | Endereço Comercial
Passo 2                | Contato                   | Contato do Representante +
                       |                           | Email/Tel representante
Passo 3                | Segurança                 | Segurança
Passo 4                | Documentos                | Dados de Faturamento (NOVO)
Passo 5                | -                         | Documentos
─────────────────────────────────────────────────────────────────────────────
Campos totais          | 18                        | 23
Documentos obrigat.    | 3                         | 3
Endereço tipo          | Residencial               | Comercial
CPF/CNPJ               | CPF (11 dígitos)          | CNPJ (14 dígitos)
Email confirmação      | Sim                       | Sim
Validações faturamen.  | -                         | Sim (nome, email, tel)
─────────────────────────────────────────────────────────────────────────────

Diferencial CNPJ:
├─ Detalha representante (nome, sobrenome, email, tel)
├─ Adiciona passo de faturamento (nome contato, email fiscal, tel)
├─ Validação de Inscrição Estadual
└─ Total 23 campos vs 18 do CPF


🔀 FLUXOS IDÊNTICOS
═════════════════════════════════════════════════════════════════════════════

AMBOS utilizam o mesmo padrão:

1. Validação linha a linha (erro embaixo do campo)
2. Bloqueio de avanço até validação passar
3. Botões Anterior/Próximo em todas as fases
4. Indicador visual de progresso (FormStepper)
5. Botão final "Finalizar Cadastro" em verde
6. Envio é POST /api/auth/register (ainda não implementada)
7. Sucesso: redireciona para /login com tipo de usuário
8. Erro: exibe mensagem em AlertCircle


✓ VALIDAÇÕES IMPLEMENTADAS
═════════════════════════════════════════════════════════════════════════════

CAMPO                  | VALIDAÇÃO                | FEEDBACK
─────────────────────────────────────────────────────────────────────────
Nome / Sobrenome       | Não vazio                | "Nome obrigatório"
CPF                    | Algoritmo verificador    | "CPF inválido"
CNPJ                   | Algoritmo verificador    | "CNPJ inválido"
RG                     | Não vazio                | "RG obrigatório"
IE                     | Não vazio                | "IE obrigatória"
CEP                    | ViaCEP lookup + não vazio| "CEP inválido" ou carrega auto
Logradouro/Num/Bairro  | Não vazio                | "Campo obrigatório"
Email                  | Regex validation + não vazio | "Email inválido"
Email Confirmação      | Match com email          | "Os emails não conferem"
Telefone               | Formato (xx) xxxxx-xxxx  | "Telefone inválido"
Senha                  | 5 critérios força        | "Senha fraca (lista critérios)"
Confirmação Senha      | Match com senha          | "As senhas não conferem"
Documentos             | 3 arquivo uploaded       | "Documentos obgatórios"


🔐 SEGURANÇA
═════════════════════════════════════════════════════════════════════════════

✅ Bloqueio copiar/colar: emailConfirmacao + senhaConfirmacao
✅ Validação força de senha: 5 critérios obrigatórios
✅ Algoritmo CPF: Rejeita CPFs genéricos (111.111.111-11, etc)
✅ Algoritmo CNPJ: Validação dois-dígito verificador
✅ Validação de vencimento: ViaCEP (aceita apenas CEPs válidos)
✅ Match de email: emailConfirmacao deve igualar email
✅ Match de senha: senhaConfirmacao deve igualar senha
✅ Validação MIME arquivo: Apenas tipos corretos
✅ Limite de tamanho: Máximo 10MB por arquivo
✅ Estados brasileiros: Validação select com 27 opções


🧪 COMO TESTAR
═════════════════════════════════════════════════════════════════════════════

EMBARCADOR CPF:
──────────────────────────────────────────────────────────────────
1. Abrir: http://localhost:3000/registro/embarcador-cpf
2. Passo 0 (Dados Pessoais):
   └─ Nome: "Maria"
   └─ Sobrenome: "Silva"
   └─ CPF: "123.456.789-09"
   └─ RG: "12.345.678-9"
   └─ ✅ Próximo

3. Passo 1 (Endereço):
   └─ CEP: "01310-100" (busca automática)
   └─ Número: "1000"
   └─ ✅ Próximo

4. Passo 2 (Contato):
   └─ Email: "maria@example.com"
   └─ Email Confirmação: "maria@example.com"
   └─ Telefone: "(11) 98765-4321"
   └─ ✅ Próximo

5. Passo 3 (Segurança):
   └─ Senha: "Senha@123456"
   └─ Confirmação: "Senha@123456"
   └─ ✅ Próximo

6. Passo 4 (Documentos):
   └─ Upload: CPF, RG, Comprovante
   └─ ✅ Finalizar Cadastro

Resultado: Redireciona para /login?registered=true&type=embarcador_cpf


EMBARCADOR CNPJ:
──────────────────────────────────────────────────────────────────
1. Abrir: http://localhost:3000/registro/embarcador-cnpj
2. Passo 0 (Dados Empresa):
   └─ Razão Social: "Empresa Ltda"
   └─ Nome Fantasia: "Empresa"
   └─ CNPJ: "34.028.114/0001-19"
   └─ IE: "123.456.789.012"
   └─ ✅ Próximo

3. Passo 1 (Endereço Comercial):
   └─ CEP: "01310-100"
   └─ Número: "500"
   └─ ✅ Próximo

4. Passo 2 (Contato Representante):
   └─ Nome: "João"
   └─ Sobrenome: "Santos"
   └─ Email: "joao@empresa.com"
   └─ Email Confirmação: "joao@empresa.com"
   └─ Telefone: "(11) 3000-0000"
   └─ ✅ Próximo

5. Passo 3 (Segurança):
   └─ Senha: "Empresa@123456"
   └─ Confirmação: "Empresa@123456"
   └─ ✅ Próximo

6. Passo 4 (Dados de Faturamento):
   └─ Nome Contato: "Maria Fiscal"
   └─ Email Faturamento: "fiscal@empresa.com"
   └─ Telefone Faturamento: "(11) 2000-0000"
   └─ ✅ Próximo

7. Passo 5 (Documentos):
   └─ Upload: Cartão CNPJ, RG Representante, Comprovante
   └─ ✅ Finalizar Cadastro

Resultado: Redireciona para /login?registered=true&type=embarcador_cnpj


📁 ESTRUTURA DE ARQUIVOS
═════════════════════════════════════════════════════════════════════════════

/src/components/auth/registration/embarcador/
├─ EmbarcadorCPFForm.jsx (500 linhas) ← NOVO
└─ EmbarcadorCNPJForm.jsx (600 linhas) ← NOVO

/src/pages/registro/
├─ embarcador-cpf.jsx (20 linhas) ← NOVO
└─ embarcador-cnpj.jsx (20 linhas) ← NOVO

Total Fase 8:
├─ 2 componentes form (1.100 linhas)
├─ 2 páginas wrapper (40 linhas)
└─ Total: 1.140 linhas


🔗 COMPONENTES REUTILIZADOS
═════════════════════════════════════════════════════════════════════════════

EMBARCADOR CPF utiliza 5/9 componentes base:
├─ ✅ FormStepper.jsx
├─ ✅ PhoneInput.jsx
├─ ✅ EmailInput.jsx (+ EmailConfirmInput)
├─ ✅ PasswordInput.jsx (+ PasswordConfirmInput)
├─ ✅ CPFInput.jsx
├─ ✅ AddressForm.jsx
└─ ✅ DocumentUpload.jsx

EMBARCADOR CNPJ utiliza 6/9 componentes base:
├─ ✅ FormStepper.jsx
├─ ✅ PhoneInput.jsx (usado 2x: representante + faturamento)
├─ ✅ EmailInput.jsx (+ EmailConfirmInput)
├─ ✅ PasswordInput.jsx (+ PasswordConfirmInput)
├─ ✅ CNPJInput.jsx
├─ ✅ AddressForm.jsx
└─ ✅ DocumentUpload.jsx

Ambos reutilizam padrão de validação:
├─ validatePhoneInput()
├─ validateEmailMatch()
├─ validatePasswordMatch()
└─ validatePassword()


🌐 ROTAS DISPONÍVEIS AGORA
═════════════════════════════════════════════════════════════════════════════

✅ /registro/transportador-pj (Fase 5-6)
✅ /registro/transportador-autonomo (Fase 7)
✅ /registro/embarcador-cpf (Fase 8) ← NOVO
✅ /registro/embarcador-cnpj (Fase 8) ← NOVO

Próximas:
├─ POST /api/auth/register ( 9 - backend)
└─ /perfil/transportador, /perfil/embarcador (Fase 10)


📊 INTEGRAÇÃO FUTURA (FASE 9)
═════════════════════════════════════════════════════════════════════════════

POST /api/auth/register precisa suportar:

userType = "embarcador_cpf":
├─ Campos: nome, sobrenome, cpf, rg, email, telefone, senha, endereco
├─ Criar: User(email, senha, userType)
├─ Criar: PerfilCliente(userId, tipoPessoa: "cpf", statusDocumentos: "pendente")
├─ Salvar: Documentos(userId, CPF, RG, COMPROVANTE)
└─ Responder: { success: true, userId, type: "embarcador_cpf" }

userType = "embarcador_cnpj":
├─ Campos: razaoSocial, cnpj, ie, email, telefone, senha, endereco, nomeContacto, emailFaturamento
├─ Criar: User(email, senha, userType)
├─ Criar: PerfilCliente(userId, tipoPessoa: "cnpj", statusDocumentos: "pendente")
├─ Salvar: Documentos(userId, CARTAO_CNPJ, RG, COMPROVANTE)
└─ Responder: { success: true, userId, type: "embarcador_cnpj" }


💾 DADOS DO EMBARCADOR SALVOS
═════════════════════════════════════════════════════════════════════════════

EMBARCADOR CPF (UserType):
{
  nome: "Maria",
  sobrenome: "Silva",
  cpf: "123.456.789-09",
  rg: "12.345.678-9",
  email: "maria@example.com",
  telefone: "(11) 98765-4321",
  endereco: {
    cep: "01310-100",
    logradouro: "Avenida Paulista",
    numero: "1000",
    bairro: "Bela Vista",
    cidade: "São Paulo",
    estado: "SP"
  },
  userType: "embarcador_cpf",
  PerfilCliente: {
    tipoPessoa: "cpf",
    statusDocumentos: "pendente",
    fotoPerfilUrl: null,
    dataCriacaoPerfil: NOW()
  },
  Documentos: [
    { tipo: "CPF", url: "...", status: "pendente" },
    { tipo: "RG", url: "...", status: "pendente" },
    { tipo: "COMPROVANTE_ENDERECO", url: "...", status: "pendente" }
  ]
}

EMBARCADOR CNPJ (UserType):
{
  razaoSocial: "Empresa Ltda",
  nomeFantasia: "Empresa",
  cnpj: "34.028.114/0001-19",
  inscricaoEstadual: "123.456.789.012",
  nomeRepresentante: "João",
  sobrenomeRepresentante: "Santos",
  email: "joao@empresa.com",
  telefone: "(11) 3000-0000",
  nomeContato: "Maria Fiscal",
  emailFaturamento: "fiscal@empresa.com",
  telefoneFaturamento: "(11) 2000-0000",
  endereco: {
    cep: "01310-100",
    logradouro: "Avenida Paulista",
    numero: "500",
    bairro: "Bela Vista",
    cidade: "São Paulo",
    estado: "SP"
  },
  userType: "embarcador_cnpj",
  PerfilCliente: {
    tipoPessoa: "cnpj",
    statusDocumentos: "pendente",
    fotoPerfilUrl: null,
    dataCriacaoPerfil: NOW()
  },
  Documentos: [
    { tipo: "CARTAO_CNPJ", url: "...", status: "pendente" },
    { tipo: "RG_REPRESENTANTE", url: "...", status: "pendente" },
    { tipo: "COMPROVANTE_ENDERECO", url: "...", status: "pendente" }
  ]
}


🎯 DIFERENCIAIS EMBARCADOR
═════════════════════════════════════════════════════════════════════════════

vs Transportador PJ:
├─ ✓ Menos passos (5-6 vs 7)
├─ ✗ Sem dados de veículos
├─ ✗ Sem CIOT
├─ ✗ Sem CNH obrigatória
├─ ✓ Less documentos (3 vs 6)
├─ ✓ Mais simples (não transporta)
└─ ✓ Rápido de cadastro

vs Transportador Autônomo:
├─ ✓ Menos dados (não motorista)
├─ ✗ Sem veículo
├─ ✗ Sem CNH
├─ ✗ Sem CIOT
├─ ✓ Mais simples
└─ ✓ Cliente puro


════════════════════════════════════════════════════════════════════════════════
                         STATUS: ✅ FASE 8 COMPLETA
════════════════════════════════════════════════════════════════════════════════

Arquivos criados: 4
├─ EmbarcadorCPFForm.jsx (500 linhas)
├─ EmbarcadorCNPJForm.jsx (600 linhas)
├─ embarcador-cpf.jsx (página)
└─ embarcador-cnpj.jsx (página)

Rotas disponíveis:
├─ http://localhost:3000/registro/embarcador-cpf
└─ http://localhost:3000/registro/embarcador-cnpj

Total de formulários agora: 4
├─ Transportador PJ (7 passos)
├─ Transportador Autônomo (7-8 passos condicional)
├─ Embarcador CPF (5 passos)
└─ Embarcador CNPJ (6 passos)

Total de rotas de registro: 4
Total de componentes: 16 (9 base + 4 forms + 3 outro)
Total de linhas de código: ~4.000 linhas


PRÓXIMA FASE (9): Backend API
├─ POST /api/auth/register (trata todos 4 tipos de usuário)
├─ POST /api/documents/upload (salva arquivos)
└─ Controllers e middlewares

════════════════════════════════════════════════════════════════════════════════
