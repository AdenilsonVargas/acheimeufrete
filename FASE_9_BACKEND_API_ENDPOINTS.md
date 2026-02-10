═══════════════════════════════════════════════════════════════════════════════
                    🚀 FASE 9 - BACKEND API ENDPOINTS ✅ PARCIAL
═══════════════════════════════════════════════════════════════════════════════

RESUMO
═════════════════════════════════════════════════════════════════════════════

Fase 9 implementa o backend para processar registros de usuários com:
✅ Suporte a FormData (multipart/form-data) para upload de documentos
✅ Processamento de 4 tipos de usuário (PJ, Autônomo, Embarcador CPF, CNPJ)
✅ Salvamento de documentos com validação
✅ Criação de registros no banco de dados

Status: ✅ CÓDIGO PRONTO (requer instalação de multer)
Arquivos criados: 3
├─ registerController.js (novo controller de registro)
├─ uploadHelper.js (utilitários de upload)
└─ multer.js (middleware de upload)

Arquivos atualizados: 1
└─ authRoutes.js (nova rota /register-new)


⚙️ SETUP NECESSÁRIO
═════════════════════════════════════════════════════════════════════════════

1. INSTALAR MULTER:
   └─ cd backend && npm install multer

2. VERIFICAR DIRETÓRIO DE UPLOADS:
   └─ O código espera: /workspaces/acheimeufrete/backend/uploads/documentos
   └─ Se não existir, será criado automaticamente

3. VARIÁVEIS DE AMBIENTE (backend/.env):
   └─ DOCUMENT_UPLOAD_PATH=/uploads/documentos (opcional)
   └─ MAX_FILE_SIZE=10485760 (10MB, em bytes)
   └─ Já estão com valores padrão

4. REINICIAR BACKEND:
   └─ npm run dev


🔀 NOVA ROTA DESCRITA
═════════════════════════════════════════════════════════════════════════════

POST /api/auth/register-new
├─ Content-Type: multipart/form-data
├─ Aceita: Campos texto + múltiplos arquivos
└─ Retorna: { success, message, user, documentsUploaded }

Substitui temporariamente: POST /api/auth/register (versão antiga)
Próximo passo: Unificar ambas em uma única rota "inteligente"


📝 FLUXO DE REGISTRO POR TIPO DE USUÁRIO
═════════════════════════════════════════════════════════════════════════════

1. TRANSPORTADOR PJ
   ────────────────────────────────────────────────────────────────
   
   Dados recebidos:
   ├─ Form fields: razaoSocial, nomeFantasia, cnpj, ie, email, senha
   ├─ Endereço JSON: { cep, logradouro, numero, complemento, bairro, cidade, estado }
   ├─ Veículo JSON: { placa, tipo, renavam, crlvVencimento }
   └─ Documentos (6 obrigatórios):
      ├─ documents_CARTAO_CNPJ
      ├─ documents_RG_RESPONSAVEL
      ├─ documents_CPF_RESPONSAVEL
      ├─ documents_CNH_RESPONSAVEL
      ├─ documents_CRLV
      └─ documents_COMPROVANTE_ENDERECO
   
   Processamento:
   ├─ 1. Hash de senha (bcryptjs)
   ├─ 2. Criar User + PerfilTransportadora
   ├─ 3. Criar Endereco
   ├─ 4. Criar Veiculo (se enviado)
   ├─ 5. Processar e salvar 6 documentos
   └─ 6. Retornar response { success, user, documentsUploaded }
   
   Banco de dados criado:
   ├─ User (email, password, userType: "transportador_pj", etc)
   ├─ PerfilTransportadora (quantidadeVeiculos, statusDocumentos, etc)
   ├─ Endereco (tipo: "comercial", principal: true)
   ├─ Veiculo (placa, tipo, RENAVAM, CRLV vencimento)
   └─ Documento x 6 (CPF, RG, CNH, CRLV, CARTAO_CNPJ, COMPROVANTE)
   
   StatusCadastro: "pendente_verificacao"
   StatusDocumentos: "pendente"


2. TRANSPORTADOR AUTÔNOMO
   ────────────────────────────────────────────────────────────────
   
   Dados recebidos:
   ├─ Form fields: nome, sobrenome, cpf, rg, cnhNumero, cnhVencimento
   ├─ Contato: email, telefone, senha
   ├─ Decisão CIOT: ciotNumero?, ciotVencimento?
   ├─ Endereço JSON: { cep, logradouro, numero, bairro, cidade, estado }
   ├─ Veículo JSON: { placa, tipo, renavam, crlvVencimento }
   └─ Documentos (4 obrigatórios):
      ├─ documents_CNH
      ├─ documents_RG
      ├─ documents_CPF
      └─ documents_COMPROVANTE_ENDERECO
   
   Processamento:
   ├─ 1. Hash de senha
   ├─ 2. Criar User + PerfilTransportadora
   ├─ 3. Criar Endereco (tipo: "residencial")
   ├─ 4. Criar Veiculo
   ├─ 5. Se CIOT, criar Documento CIOT (url: "ciot:numero")
   ├─ 6. Processar e salvar 4 documentos
   └─ 7. Retornar response { success, user, ciotRegistered, documentsUploaded }
   
   StatusCadastro: "pendente_verificacao"
   StatusCIOT: Salvo como Documento se fornecido


3. EMBARCADOR CPF
   ────────────────────────────────────────────────────────────────
   
   Dados recebidos:
   ├─ Form fields: nome, sobrenome, cpf, rg, email, telefone, senha
   ├─ Endereço JSON: { cep, logradouro, numero, bairro, cidade, estado }
   └─ Documentos (3 obrigatórios):
      ├─ documents_CPF
      ├─ documents_RG
      └─ documents_COMPROVANTE_ENDERECO
   
   Processamento:
   ├─ 1. Hash de senha
   ├─ 2. Criar User + PerfilCliente (tipoPessoa: "cpf")
   ├─ 3. Criar Endereco (tipo: "residencial")
   ├─ 4. Processar e salvar 3 documentos
   └─ 5. Retornar response { success, user, documentsUploaded }
   
   StatusCadastro: "ok" (Cliente não precisa verificação)
   PerfilCliente.tipoPessoa: "cpf"


4. EMBARCADOR CNPJ
   ────────────────────────────────────────────────────────────────
   
   Dados recebidos:
   ├─ Empresa: razaoSocial, nomeFantasia, cnpj, inscricaoEstadual
   ├─ Representante: nomeRepresentante, sobrenomeRepresentante
   ├─ Contato: email, telefone, senha
   ├─ Faturamento: nomeContato, emailFaturamento, telefoneFaturamento
   ├─ Endereço JSON: { cep, logradouro, numero, bairro, cidade, estado }
   └─ Documentos (3 obrigatórios):
      ├─ documents_CARTAO_CNPJ
      ├─ documents_RG_REPRESENTANTE
      └─ documents_COMPROVANTE_ENDERECO
   
   Processamento:
   ├─ 1. Hash de senha
   ├─ 2. Criar User + PerfilCliente (tipoPessoa: "cnpj")
   ├─ 3. Criar Endereco (tipo: "comercial")
   ├─ 4. Processar e salvar 3 documentos
   └─ 5. Retornar response { success, user, documentsUploaded }
   
   StatusCadastro: "ok"
   PerfilCliente.tipoPessoa: "cnpj"


✓ VALIDAÇÕES IMPLEMENTADAS
═════════════════════════════════════════════════════════════════════════════

Arquivo:
├─ ✅ Tamanho máximo: 10MB
├─ ✅ Tipos MIME: PDF, JPG, PNG
├─ ✅ Extensões: .pdf, .jpg, .jpeg, .png
└─ ✅ Sanitização de caminho (previne path traversal)

Campos obrigatórios:
├─ ✅ Validação por tipo de usuário
├─ ✅ Email única (CHECK no DB antes de criação)
├─ ✅ Tipo de usuário válido
└─ ✅ Documentos obrigatórios presentes

Dados:
├─ ✅ Senha enHash com bcryptjs (salt 10)
├─ ✅ Datas parseiam em formato ISO
├─ ✅ Objetos JSON parseiam corretamente
└─ ✅ Valores numéricos convertidos (parseInt para quantidadeVeiculos)


💾 ESTRUTURA DE DIRETÓRIO DE UPLOADS
═════════════════════════════════════════════════════════════════════════════

/backend/uploads/documentos/
├─ {userId}_{documentType}_{timestamp}.pdf
├─ {userId}_{documentType}_{timestamp}.jpg
├─ 01_CPF_1704067200000.pdf
├─ 01_RG_1704067250000.jpg
├─ 02_CARTAO_CNPJ_1704067300000.pdf
└─ etc...

Cada arquivo:
├─ Nomeado: userId_tipo_timestamp.ext
├─ Armazenado: backend/uploads/documentos/
└─ URL no DB: /uploads/documentos/{filename}


🔍 RESPOSTA DE SUCESSO
═════════════════════════════════════════════════════════════════════════════

Transportador PJ (201 Created):
{
  "success": true,
  "message": "Transportador PJ registrado com sucesso",
  "user": {
    "id": "uuid",
    "email": "empresa@example.com",
    "userType": "transportador_pj",
    "razaoSocial": "Empresa Ltda"
  },
  "documentsUploaded": 6
}

Transportador Autônomo (201 Created):
{
  "success": true,
  "message": "Transportador Autônomo registrado com sucesso",
  "user": {
    "id": "uuid",
    "email": "motorista@example.com",
    "userType": "transportador_autonomo",
    "nome": "João Silva"
  },
  "ciotRegistered": true,
  "documentsUploaded": 4
}

Embarcador CPF (201 Created):
{
  "success": true,
  "message": "Embarcador (CPF) registrado com sucesso",
  "user": {
    "id": "uuid",
    "email": "maria@example.com",
    "userType": "embarcador_cpf",
    "nome": "Maria Silva"
  },
  "documentsUploaded": 3
}


❌ RESPOSTA DE ERRO
═════════════════════════════════════════════════════════════════════════════

400 Bad Request:
{
  "message": "Email já cadastrado"
}

400 Bad Request:
{
  "message": "Campos obrigatórios faltando"
}

400 Bad Request (multer):
{
  "message": "Arquivo muito grande (máximo 10MB)"
}

400 Bad Request (multer):
{
  "message": "Tipo de arquivo não permitido: application/msword"
}

500 Internal Server Error:
{
  "success": false,
  "message": "Erro ao registrar usuário",
  "error": "erro específico do BD"
}


🧪 COMO TESTAR
═════════════════════════════════════════════════════════════════════════════

COM CURL:
──────────────────────────────────────────────────────────────────

Transportador PJ:
```bash
curl -X POST http://localhost:5000/api/auth/register-new \
  -H "Content-Type: multipart/form-data" \
  -F "userType=transportador_pj" \
  -F "razaoSocial=Empresa Ltda" \
  -F "nomeFantasia=Empresa" \
  -F "cnpj=34.028.114/0001-19" \
  -F "inscricaoEstadual=123.456.789.012" \
  -F "email=pj@example.com" \
  -F "senha=Senha@123456" \
  -F "telefone=(11)98765-4321" \
  -F "endereco={\"cep\":\"01310-100\",\"logradouro\":\"Av Paulista\",\"numero\":\"500\",\"bairro\":\"Bela Vista\",\"cidade\":\"São Paulo\",\"estado\":\"SP\"}" \
  -F "veiculo={\"placa\":\"ABC1234\",\"tipo\":\"Caminhão\",\"renavam\":\"12345678901\",\"crlvVencimento\":\"2026-12-31\"}" \
  -F "quantidadeVeiculos=1" \
  -F "documents_CARTAO_CNPJ=@/path/to/cartao.pdf" \
  -F "documents_RG_RESPONSAVEL=@/path/to/rg.jpg" \
  -F "documents_CPF_RESPONSAVEL=@/path/to/cpf.pdf" \
  -F "documents_CNH_RESPONSAVEL=@/path/to/cnh.pdf" \
  -F "documents_CRLV=@/path/to/crlv.pdf" \
  -F "documents_COMPROVANTE_ENDERECO=@/path/to/endereco.pdf"
```

COM POSTMAN:
──────────────────────────────────────────────────────────────────

1. Criar novo request POST: http://localhost:5000/api/auth/register-new
2. Ir para "Body" tab
3. Selecionar "form-data"
4. Adicionar:
   ├─ userType: transportador_pj (text)
   ├─ razaoSocial: Empresa Ltda (text)
   ├─ email: email@example.com (text)
   ├─ endereco: {"cep":"01310-100",...} (text)
   ├─ documents_CPF: [selecionar arquivo] (file)
   └─ documents_RG: [selecionar arquivo] (file)
5. Clicar SEND


PELO FRONTEND:
──────────────────────────────────────────────────────────────────

O formulário já prepara FormData:
```javascript
const formData = new FormData();
formData.append('userType', 'transportador_pj');
formData.append('razaoSocial', form.razaoSocial);
formData.append('endereco', JSON.stringify(form.endereco));
formData.append('veiculo', JSON.stringify(form.veiculo));

// Adicionar arquivos
Object.entries(uploadedFiles).forEach(([docType, file]) => {
  formData.append(`documents_${docType}`, file);
});

const response = await fetch('/api/auth/register-new', {
  method: 'POST',
  body: formData,
});
```


🔐 SEGURANÇA
═════════════════════════════════════════════════════════════════════════════

✅ Senhas:
   ├─ Hash com bcryptjs (salt 10)
   └─ Nunca armazenadas em plain text

✅ Arquivos:
   ├─ Validação MIME type + extensão
   ├─ Limite de tamanho 10MB
   ├─ Armazenamento em diretório separado
   └─ Nomeação com UUID + timestamp (previne conflicts)

✅ SQL Injection:
   ├─ Prisma ORM automaticamente previne
   └─ Sem concatenação de strings

✅ CORS:
   └─ Configurado em server.js (apenas origens autorizadas)


📊 BANCO DE DADOS CRIADO
═════════════════════════════════════════════════════════════════════════════

User:
├─ id (uuid, PK)
├─ email (unique)
├─ password (hashed)
├─ telefone
├─ userType (enum)
├─ nome, sobrenome
├─ cpf, cnpj, rg
├─ inscricaoEstadual
├─ cnhNumero, dataVencimentoCNH
├─ statusCadastro
└─ createdAt, updatedAt

PerfilTransportadora:
├─ id (uuid, PK)
├─ userId (FK → User)
├─ quantidadeVeiculos
├─ statusDocumentos
├─ statusVerificacao
└─ createdAt

PerfilCliente:
├─ id (uuid, PK)
├─ userId (FK → User)
├─ tipoPessoa (cpf/cnpj)
├─ statusDocumentos
└─ createdAt

Endereco:
├─ id (uuid, PK)
├─ userId (FK → User)
├─ tipo (residencial/comercial)
├─ cep, logradouro, numero
├─ complemento, bairro, cidade, estado
├─ principal (boolean)
└─ createdAt

Veiculo:
├─ id (uuid, PK)
├─ userId (FK → User)
├─ placa (unique)
├─ tipo
├─ renavam
├─ dataVencimentoCRLV
├─ statusDocumentos
└─ createdAt

Documento:
├─ id (uuid, PK)
├─ userId (FK → User)
├─ tipo (enum)
├─ url
├─ dataVencimento
├─ status (pendente_revisao, aprovado, rejeitado)
├─ motivoRejeicao
┴─ createdAt


🎯 PRÓXIMOS PASSOS (Fase 10)
═════════════════════════════════════════════════════════════════════════════

1. Unificar rotas: /register-new → /register (migrar dados antigos)
2. Adicionar autenticação JWT após registro
3. Criar Sistema de Aprovação de Documentos:
   ├─ Admin endpoint para revisar documentos
   ├─ Endpoint para mudar status
   └─ Webhooks para notificar usuário
4. Criar páginas de Perfil:
   ├─ /perfil/transportador-pj
   ├─ /perfil/transportador-autonomo
   ├─ /perfil/embarcador
   └─ Dashboard com status
5. Testes E2E:
   ├─ Testar cada tipo de registro
   ├─ Testar validações
   └─ Testar upload de arquivos


════════════════════════════════════════════════════════════════════════════════
                         STATUS: ✅ FASE 9 PRONTA (SETUP)
════════════════════════════════════════════════════════════════════════════════

Código criado: 3 arquivos (1.000+ linhas)
├─ registerController.js
├─ uploadHelper.js
└─ multer.js

Código atualizado: 1 arquivo
└─ authRoutes.js

O que falta: npm install multer no backend

Para começar:
1. cd /workspaces/acheimeufrete/backend
2. npm install multer
3. npm run dev
4. POST http://localhost:5000/api/auth/register-new

════════════════════════════════════════════════════════════════════════════════
