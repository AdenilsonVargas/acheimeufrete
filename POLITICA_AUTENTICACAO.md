# 🔐 POLÍTICA DE AUTENTICAÇÃO E ACESSO

## Data: 05/02/2026
## Status: CRÍTICO

---

## ⚠️ PROBLEMA IDENTIFICADO

**Descrição:**
O sistema está permitindo acesso automático sem autenticação válida.

**Sintoma:**
- Ao abrir a plataforma, o usuário é "logado" automaticamente com um perfil "Usuário" que não existe no banco de dados
- Este acesso não deveria ser permitido
- Credenciais não foram fornecidas

**Impacto:**
- 🔴 CRÍTICO - Falha de segurança
- 🔴 Violação de política de acesso
- 🔴 Dados podem estar sendo acessados sem autenticação real

---

## 🔍 INVESTIGAÇÃO

### Código Analisado:
1. ✅ `useAuthStore.js` - Sem mock users
2. ✅ `App.jsx` - `checkAuth()` chamado em useEffect
3. ✅ Backend `authController.js` - Sem fallback users
4. ✅ `prisma/seed.js` - Cria usuários reais, não "Usuário"

### Problema Raiz:
**Ainda em investigação** - Possíveis causas:
1. localStorage tem um token expirado que permite acesso
2. `checkAuth()` está criando um usuário padrão
3. Header/Dashboard têm fallback "Usuário" quando user é null
4. Middleware está injetando um usuário padrão

---

## 📋 POLÍTICA DE AUTENTICAÇÃO OBRIGATÓRIA

### Princípio 1: Sem Acesso Sem Autenticação ✅
```
❌ NUNCA permitir:
  - Login automático sem credenciais
  - Mock users
  - Fallback users
  - Default users

✅ SEMPRE exigir:
  - Email válido cadastrado no banco
  - Senha correta
  - Token JWT válido
  - Verificação de expiração do token
```

### Princípio 2: Criação de Usuários ✅
```
✅ Permitido:
  - Novo cadastro com email e senha válidos
  - Email não deve estar duplicado
  - Dados enviados são validados no backend
  - Usuário aparece apenas após confirmação

❌ NÃO permitido:
  - Usuário pré-criado
  - Email padrão
  - Password padrão
  - Bypass de validação
```

### Princípio 3: Tipos de Usuário ✅
```
Tipos válidos:
  - embarcador
  - transportador
  - autonomo
  - administrador

Cada tipo tem:
  - Email único no banco
  - Senha com hash bcrypt
  - Dados completos (nome, telefone, etc.)
  - Perfil específico do tipo
```

### Princípio 4: Token JWT ✅
```
✅ Requisitos:
  - Gerado apenas após login bem-sucedido
  - Contém userId + userType
  - Expira em 7 dias (configurável)
  - Nunca deve ser hardcoded

❌ Nunca:
  - Token padrão
  - Token sem expiração
  - Token em localStorage sem verificação
```

---

## 🧪 FLUXO DE AUTENTICAÇÃO CORRETO

```
1. Usuário abre plataforma
   └─> Header renderizado
   └─> checkAuth() chamado
   └─> NÃO há token no localStorage
   └─> Usuario = null
   └─> Redireciona para /login
   └─> User vê: "Faça login para continuar"

2. Usuário preenche login
   └─> email: embarcador@test.com
   └─> password: 123456
   └─> Submete formulário

3. Backend valida
   └─> Email existe no banco? SIM
   └─> Senha bate? SIM
   └─> Gera token JWT

4. Frontend recebe token
   └─> Armazena em localStorage
   └─> Armazena usuário em Zustand
   └─> Redireciona para /dashboard

5. Acesso a /dashboard
   └─> Header mostra: "Bem-vindo, João Silva"
   └─> Sidebar com menu personalizado
   └─> Conteúdo carregado
```

---

## ✅ FLUXO BLOQUEADO

```
❌ Tentativa de acesso sem autenticação:
   1. Usuário abre /dashboard
   2. checkAuth() verifica token
   3. Token não existe
   4. checkAuth() NÃO cria usuário padrão
   5. ProtectedRoute bloqueia acesso
   6. Redireciona para /login

❌ Tentativa com token expirado:
   1. Token existe mas expirado
   2. Backend retorna 401
   3. Interceptor de erro captura
   4. localStorage limpo
   5. Redireciona para /login

❌ Tentativa com dados inválidos:
   1. Email: usuario.inexistente@test.com
   2. Senha: qualquer
   3. Backend: "Email ou senha incorretos"
   4. Sem token gerado
   5. Permanecer em /login
```

---

## 🔧 IMPLEMENTAÇÃO OBRIGATÓRIA

### No Frontend:
```javascript
// ✅ CORRETO
checkAuth: async () => {
  const token = localStorage.getItem('auth_token');
  if (!token) return; // Não cria user, apenas retorna
  
  try {
    const user = await apiClient.auth.me();
    set({ user, token });
  } catch (error) {
    // Token inválido, limpar
    set({ user: null, token: null });
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  }
}

// ❌ ERRADO
checkAuth: async () => {
  const token = localStorage.getItem('auth_token') || 'mock-token'; // NUNCA!
  const user = localStorage.getItem('user') || { nomeCompleto: 'Usuário' }; // NUNCA!
  set({ user, token });
}
```

### No Backend:
```javascript
// ✅ CORRETO
login: async (req, res) => {
  const user = await prisma.user.findUnique({...});
  if (!user) return res.status(401).json({message: 'Invalid'});
  // Só retorna se encontrou
}

// ❌ ERRADO
login: async (req, res) => {
  let user = await prisma.user.findUnique({...});
  if (!user) {
    user = await createDefaultUser(); // NUNCA!
  }
  // Sempre retorna algo
}
```

---

## 📋 CHECKLIST DE SEGURANÇA

### Antes de cada deploy:
- [ ] Nenhum mock user no código
- [ ] Nenhum default user no banco
- [ ] Nenhum token hardcoded
- [ ] checkAuth() não cria usuários
- [ ] Sem acesso sem token válido
- [ ] ProtectedRoute bloqueia corretamente
- [ ] Mensagens de erro não revelam dados

### Testes obrigatórios:
- [ ] Abrir site sem autenticação → redireciona para /login
- [ ] Fazer login com dados inválidos → erro
- [ ] Fazer login com dados válidos → acesso
- [ ] Token expirado → logout automático
- [ ] localStorage limpo → redireciona para /login

---

## 🚨 REGRA FUNDAMENTAL

**NENHUM ACESSO SEM AUTENTICAÇÃO VÁLIDA**

```
┌─────────────────────────────────────────┐
│  SE NÃO TEM TOKEN VÁLIDO                │
│  SE NÃO TEM EMAIL CADASTRADO            │
│  SE NÃO TEM SENHA CORRETA               │
│                                         │
│  → REDIRECIONA PARA /login              │
│  → FIM                                  │
│  → SEM EXCEÇÕES                         │
└─────────────────────────────────────────┘
```

---

## 📞 Contacto

Se houver:
- ✗ Auto-login sem credenciais
- ✗ Mock users
- ✗ Fallback users
- ✗ Default tokens

**PARAR TUDO E REPORTAR IMEDIATAMENTE**

---

**Versão:** 1.0  
**Data:** 05/02/2026  
**Status:** ⚠️ CRÍTICO  
**Action Required:** YES
