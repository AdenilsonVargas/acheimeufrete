# 📚 GUIA DE BOAS PRÁTICAS - ACHEIMEU FRETE v1.0

## Data: 05/02/2026
## Versão: 1.0 - Documento Oficial

---

## ⚠️ OBRIGATÓRIO LER ANTES DE QUALQUER MUDANÇA

**Este documento deve ser consultado ANTES de:**
- Criar novas features
- Fazer correções de bugs
- Fazer refatoração de código
- Integrar novos componentes
- Modificar autenticação
- Alterar layout/UI

---

## 📌 PRINCÍPIOS FUNDAMENTAIS

### 1. Autenticação: Backend-Only, Sem Exceções

```
🔴 PROIBIDO:
  ❌ Mock users
  ❌ Fallback users
  ❌ Default tokens
  ❌ Auto-login sem credenciais
  ❌ Hardcoded passwords
  ❌ Email padrão

✅ OBRIGATÓRIO:
  ✓ Email cadastrado no banco
  ✓ Senha com hash bcrypt
  ✓ Token JWT após login bem-sucedido
  ✓ Verificação de expiração de token
  ✓ Logout ao expirar
```

**Arquivo:** `src/hooks/useAuthStore.js`  
**Arquivo:** `backend/src/controllers/authController.js`  
**Política:** `POLITICA_AUTENTICACAO.md`

---

### 2. Header: Um Único, Em Qualquer Lugar

```
✅ CORRETO:
  - Renderizado uma única vez em App.jsx
  - Header aparece em TODAS as páginas
  - Conteúdo dinâmico conforme autenticação E localização
  - Sem duplicação em nenhum lugar

❌ ERRADO:
  - Importar Header em múltiplas páginas
  - Criar TopBar/Header duplicado
  - Header diferente em cada seção
```

**Arquivo:** `src/App.jsx` (linha 126)  
**Arquivo:** `src/components/Header.jsx`  
**Documentação:** `HEADER_LOGICA_ATUALIZADA.md` (LEIA!)  
**Localização:** Header renderizado UMA VEZ em App.jsx

**Os 3 Cenários do Header:**

1. **NÃO AUTENTICADO em página pública** (`/`, `/sobre`, `/faq`, `/contato`, `/login`, `/cadastro`)
   - ✅ Logo + Menu + Relógio + Toggle + **Login** + **Cadastro**
   - ❌ Sino, Bem-vindo, Painel, Sair

2. **AUTENTICADO em página pública** (`/`, `/sobre`, `/faq`, `/contato`)
   - ✅ Logo + Menu + Relógio + Sino + Bem-vindo + **Painel** + Toggle + Sair
   - ❌ Login, Cadastro

3. **AUTENTICADO em Dashboard** (`/dashboard/*`)
   - ✅ Logo + Relógio + Sino + Bem-vindo + Toggle + Sair
   - ❌ Menu, Painel, Login, Cadastro (não precisa, já está no Painel!)

---

### 3. Sidebar: Abaixo do Header, Sem Overlap

```
CSS Positions:
  Header:  position: fixed; top: 0;    (z-50)
  Sidebar: position: fixed; top: 20;   (80px abaixo)
  Content: margin-left: md:ml-64;      (respeitando sidebar)

✅ Layout Correto:
┌──────────────────────────────────┐ 80px
│          HEADER                  │ (fixed top-0)
├───────────┬──────────────────────┤ Line
│ SIDEBAR   │ MAIN CONTENT (md:64) │ top-20
│           │                      │
└───────────┴──────────────────────┘
```

**Arquivo:** `src/components/DashboardLayout.jsx`  
**CSS Classes:** `fixed left-0 top-20 h-[calc(100vh-80px)] w-64`

---

### 4. Dark/Light Mode: Aplicado Globalmente

```
✅ OBRIGATÓRIO:
  - ThemeContext provê isDark state
  - Todas as classes com dark: aplicadas
  - Toggle em Header funciona
  - Preferência persiste em localStorage

❌ PROIBIDO:
  - Componentes sem classes dark:
  - Dark mode só em uma seção
  - Sem persistência de preferência
```

**Arquivo:** `src/contexts/ThemeContext.jsx`  
**Componente:** `src/components/ThemeToggle.jsx`

---

### 5. Sem Fallbacks Visuais Enganosos

```
❌ NUNCA fazer:
<span>{user?.nomeCompleto || 'Usuário'}!</span>  // Confunde
<span>{token || 'no-token'}</span>                // Revela info

✅ FAZER:
{user?.nomeCompleto && (
  <span>{user.nomeCompleto}!</span>
)}
// Se não tem user, não renderiza (ProtectedRoute bloqueia)
```

**Motivo:** Renderizar "Usuário" quando não autenticado confunde o usuário  
**Solução:** ProtectedRoute garante que só autenticados veem dashboard

---

## 🏗️ ARQUITETURA GARANTIDA

```
src/
├── App.jsx                        (ÚNICO place de Header)
│   └── <Header />
│   └── <Routes>
│       ├── Public routes (/, /sobre, /login)
│       └── Protected routes (<Dashboard>, <Cotacoes>)
│           └── <DashboardLayout>  (sidebar + content)
│
├── components/
│   ├── Header.jsx                (global, dinâmico)
│   ├── DashboardLayout.jsx        (sidebar + children)
│   ├── ThemeToggle.jsx            (dark/light)
│   └── ... (outros)
│
├── hooks/
│   ├── useAuth.js                 (hook para auth)
│   ├── useAuthStore.js            (Zustand store, backend-only)
│   └── ... (outros)
│
├── contexts/
│   ├── ThemeContext.jsx           (dark/light state)
│   └── ... (outros)
│
└── pages/
    ├── Login.jsx
    ├── Register.jsx
    ├── Dashboard.jsx              (wrapped em DashboardLayout)
    ├── DashboardTransportadora.jsx (wrapped em DashboardLayout)
    └── ... (60+ outras páginas)
```

**NUNCA alterar:**
- Onde Header é renderizado
- Posição do Sidebar (top-20)
- Localização de ThemeContext
- Estrutura de ProtectedRoute

---

## 🔄 Fluxo de Autenticação Correto

```
1. User abre site
   └─> App.jsx: checkAuth() é chamado
   └─> Token existe? NÃO → user = null
   └─> user = null → ProtectedRoute bloqueia /dashboard
   └─> Redireciona para /login

2. User preenche login
   └─> Email: embarcador@test.com
   └─> Senha: 123456
   └─> Submit

3. Backend (authController.login):
   └─> Busca user por email
   └─> Email existe? NÃO → erro "Email ou senha incorretos"
   └─> Email existe? SIM → verifica senha
   └─> Senha correta? NÃO → erro
   └─> Senha correta? SIM → gera token JWT
   └─> Retorna: { token, user: {...} }

4. Frontend (useAuthStore.login):
   └─> Recebe token + user
   └─> localStorage.setItem('auth_token', token)
   └─> localStorage.setItem('user', JSON.stringify(user))
   └─> set({ user, token })

5. Header atualiza:
   └─> isAuthenticated = !!user → true
   └─> Mostra: "Bem-vindo, João Silva!"
   └─> Mostra sino de notificações
   └─> Mostra tipo de usuário

6. ProtectedRoute permite acesso
   └─> user existe → redireciona para /dashboard
   └─> DashboardLayout renderizado
   └─> Sidebar com menu
   └─> Conteúdo da página
```

---

## ✅ Checklist Antes de Mudanças

### Antes de CRIAR nova feature:
- [ ] Verificou se não quebra autenticação?
- [ ] Header ainda é único?
- [ ] Sidebar ainda está abaixo?
- [ ] Dark mode funciona?
- [ ] Sem mock users?
- [ ] Sem fallbacks enganosos?

### Antes de ALTERAR componente:
- [ ] Existe testes?
- [ ] Header não foi importado localmente?
- [ ] CSS não conflita com dark mode?
- [ ] localStorage não foi acessado direto?

### Antes de FAZER commit:
- [ ] Build passa sem erros?
- [ ] npm run build OK?
- [ ] Sem console.error?
- [ ] Testes passam?

### Antes de FAZER PR/Deploy:
- [ ] Funcionário fez teste completo?
- [ ] Login funciona?
- [ ] Logout funciona?
- [ ] Dark mode funciona?
- [ ] Sidebar visível?
- [ ] Header mostra dados corretos?

---

## 🚫 Operações Proibidas

```
❌ NÃO FAZER NUNCA:

1. Adicionar Header em qualquer lugar além de App.jsx
   useAuthStore.js, Routing, ou outra place

2. Criar usuário "padrão" ou "demo" para auto-login

3. Remover ProtectedRoute de rotas autenticadas

4. Armazenar senha em localStorage

5. Hardcoded credentials

6. Mock API responses sem indicar claramente

7. Alterar token geração sem documentar

8. Remover checkAuth() call em App.jsx

9. Criar fallback users quando user é null

10. Ignorar este documento ao fazer mudanças
```

---

## 📋 Estrutura de Pastas - NÃO ALTERAR

```
NÃO MOVER OU DELETAR:
  ✓ src/components/Header.jsx
  ✓ src/components/DashboardLayout.jsx
  ✓ src/hooks/useAuth.js
  ✓ src/hooks/useAuthStore.js
  ✓ src/contexts/ThemeContext.jsx
  ✓ src/App.jsx
  ✓ backend/src/controllers/authController.js
  ✓ backend/prisma/schema.prisma

APENAS MELHORAR/ESTENDER:
  ✓ Novos componentes em src/components/
  ✓ Novas pages em src/pages/
  ✓ Novos hooks em src/hooks/
  ✓ Novos contextos em src/contexts/

NUNCA DUPLICAR:
  ✗ Header.jsx
  ✗ ThemeContext.jsx
  ✗ DashboardLayout.jsx
  ✗ useAuthStore.js
```

---

## 🔍 Como Referenciar Este Documento

### Ao criar nova feature:
```
"Consulte GUIA_BOAS_PRATICAS.md - Seção 'Autenticação'"
```

### Ao reportar bug:
```
"Checklist antes de mudanças: X itens falharam"
```

### Ao revisar PR:
```
"Verificou contra GUIA_BOAS_PRATICAS.md?"
```

---

## 📞 Dúvidas Frequentes

**P: Posso criar um TopBar personalizado para admin?**  
R: NÃO. Use o Header global com conteúdo dinâmico.

**P: Posso fazer login com um usuário padrão se backend falhar?**  
R: NÃO. Sempre exigir backend. Se falhar, mostrar erro.

**P: Posso usar localStorage para armazenar dados do usuário?**  
R: SIM, mas sempre validar com backend ao carregar.

**P: Devo remover o Sidebar em algumas páginas?**  
R: NÃO. Use ProtectedRoute para bloquear acesso.

**P: Posso fazer fallback "Usuário" quando não tem nome?**  
R: NÃO. Se não tem user, ProtectedRoute redireciona para login.

---

## ⚠️ Violações Críticas

Se encontrar qualquer uma dessas, PARAR E REPORTAR:

- [ ] Dois headers na mesma página
- [ ] Login automático sem credenciais
- [ ] User "Usuário" sendo renderizado
- [ ] Dados sensíveis em localStorage sem hash
- [ ] Token hardcoded
- [ ] Mock users em produção
- [ ] Sidebar sobrepondo header
- [ ] Dark mode não funciona

---

## 📖 Documentos Relacionados

Consulte também:
- `POLITICA_AUTENTICACAO.md` - Política de segurança
- `VALIDACAO_FINAL_SISTEMA.md` - Validação de funcionalidades
- `DIAGNOSTICO_AUTOLOGIN.md` - Debug de auto-login
- `CONCLUSAO_PROJETO.md` - Resumo do projeto

---

## 📞 Suporte

Se precisar fazer uma alteração e tiver dúvida:

1. **Consulte este guia**
2. **Procure no documento relacionado**
3. **Se ainda tiver dúvida, não faça** - pergunte primeiro

Manter a qualidade e segurança é responsabilidade de TODOS.

---

**LEMBRETE:**

```
┌─────────────────────────────────────────┐
│  Este documento é OBRIGATÓRIO            │
│  Ler antes de qualquer mudança           │
│  Não é apenas uma sugestão               │
│  É um ACORDO de como o projeto funciona  │
└─────────────────────────────────────────┘
```

---

**Versão:** 1.0  
**Última Atualização:** 05/02/2026  
**Status:** Oficial  
**Aplicável A:** Todos os desenvolvedores
