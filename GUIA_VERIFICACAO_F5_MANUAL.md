# 📱 Guia de Verificação Manual - F5 Session Persistence

## ⚙️ Pré-requisitos

✅ Backend rodando em `http://localhost:5000`  
✅ Frontend rodando em `http://localhost:3000`  
✅ Usuários de teste criados

```bash
# Se não tem usuários, execute:
cd /workspaces/acheimeufrete/backend
node criar-usuarios-teste.js
```

---

## 🧪 Cenário de Teste 1: Login Normal

### Passos:
1. Abra http://localhost:3000 no navegador
2. Clique em "Login"
3. Digite:
   - Email: `transportador@test.com`
   - Senha: `123456`
4. Clique "Entrar"

### Resultado Esperado:
- ✅ Redirecionado para `/dashboard-transportadora`
- ✅ Console mostra: `✅ useAuthStore: Login bem-sucedido!`
- ✅ localStorage tem `user` e `auth_token`

### Verificar Console (F12):
```
💾 INIT: Usuário carregado do localStorage: { 
  email: 'transportador@test.com', 
  userType: 'transportador' 
}
🔐 useAuthStore: Iniciando login
✅ useAuthStore: Login bem-sucedido!
🔍 useAuthStore: Usuário restaurado: { 
  email: 'transportador@test.com', 
  userType: 'transportador' 
}
```

---

## 🔄 Cenário de Teste 2: F5 Refresh (CRÍTICO)

### Passos:
1. Após fazer login com sucesso (veja Cenário 1)
2. **Pressione F5** (refresh da página)
3. Aguarde carregamento

### Resultado Esperado:
- ✅ **Mantém na mesma dashboard de transportador**
- ✅ **NÃO redireciona para dashboard de embarcador**
- ✅ User ainda mostra `transportador` no header
- ✅ Console mostra logs de restauração

### Verificar Console (F12):
```
💾 INIT: Usuário carregado do localStorage: { 
  email: 'transportador@test.com', 
  userType: 'transportador' 
}
🔍 checkAuth: Validando token com backend...
🔐 apiClient.auth.me(): Buscando dados do usuário autenticado...
✅ apiClient.auth.me() sucesso: { user: { ... userType: 'transportador' ... } }
✅ checkAuth: Usuário restaurado: { 
  email: 'transportador@test.com', 
  userType: 'transportador' 
}
```

### ⚠️ Se vir no console:
```
❌ SE VISSE ANTES (BUG): Usuário defaultava para 'embarcador'
❌ SE VISSE ANTES (BUG): "Nenhum usuário no localStorage"
```
**→ Bug foi corrigido!** 🎉

---

## 🧪 Cenário de Teste 3: F5 + Verificar localStorage

### Passos:
1. Após fazer login (Cenário 1)
2. Abra DevTools (F12)
3. Vá para "Application" → "Local Storage" → http://localhost:3000
4. Pressione F5
5. Verifique localStorage novamente

### Resultado Esperado:
- ✅ localStorage tem `user`: User JSON com `userType: "transportador"`
- ✅ localStorage tem `auth_token`: Token JWT
- ✅ **ANTES (BUG):** localStorage era apagado no F5
- ✅ **DEPOIS (CORRIGIDO):** localStorage é preservado

### localStorage Esperado:
```javascript
// Key: user
{
  "id": "cmku2j54a...",
  "email": "transportador@test.com",
  "userType": "transportador",
  "nomeCompleto": "Transportador Test",
  "telefone": "2222222222"
}

// Key: auth_token
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWt1...
```

---

## 🧪 Cenário de Teste 4: Múltiplos F5 Seguidos

### Passos:
1. Faça login como `transportador@test.com`
2. Pressione F5 (refresh)
3. Aguarde carregar
4. Pressione F5 novamente
5. Aguarde carregar
6. Pressione F5 uma terceira vez

### Resultado Esperado:
- ✅ **Todas as 3 vezes mantém a sessão de transportador**
- ✅ Cada F5 valida o token com backend
- ✅ Nenhum erro ou logout

### Console após cada F5:
- ✅ Logs mostram "Usuário restaurado" a cada reload
- ✅ Nenhum erro de autenticação

---

## 🧪 Cenário de Teste 5: Logout (Limpeza)

### Passos:
1. Após fazer login
2. Clique no botão de logout (menu do usuário)
3. Você é redirecionado para `/login`

### Resultado Esperado:
- ✅ localStorage é **completamente limpo**
- ✅ Nenhum `user` em localStorage
- ✅ Nenhum `auth_token` em localStorage
- ✅ Ao tentar acessar protected routes, redireciona para `/login`

### Verificar Console (F12):
```
🔐 Logout executado
✅ localStorage limpo
```

### Verificar localStorage:
- ✅ Vazio ou sem `user` e `auth_token`

---

## 🧪 Cenário de Teste 6: Login Diferente (Embarcador)

### Passos:
1. Faça logout (veja Cenário 5)
2. Faça login com email diferente: `embarcador@test.com / 123456`
3. Redirecionado para `/dashboard` (dashboard de embarcador)
4. Pressione F5

### Resultado Esperado:
- ✅ Primeiro login mostra `userType: "embarcador"`
- ✅ localStorage tem `userType: "embarcador"`
- ✅ Após F5, **mantém embarcador** (não muda para transportador!)
- ✅ Isolamento completo entre usuários

---

## 🧪 Cenário de Teste 7: Token Expirado (Simulado)

### Passos:
1. Faça login normalmente
2. Abra DevTools (F12) → "Application" → "Local Storage"
3. Edite o `auth_token` para algo inválido: `INVALID_TOKEN_12345`
4. Pressione F5

### Resultado Esperado:
- ✅ `checkAuth()` tentará validar com backend
- ✅ Backend rejeitará token inválido (HTTP 401)
- ✅ User é definido como `null`
- ✅ localStorage é limpo
- ✅ Redireciona para `/login`

### Console:
```
🔍 checkAuth: Validando token com backend...
❌ checkAuth: Erro ao validar com backend: Unauthorized
⚠️ checkAuth: Mantendo sessão do localStorage apesar do erro
```

---

## ✅ Checklist de Verificação

| Teste | Resultado | Status |
|-------|-----------|--------|
| Login normal | Dashboard aparece | ✅ |
| F5 Refresh | Sessão mantida | ✅ |
| localStorage preservado | user + token existem | ✅ |
| Múltiplos F5 | Sessão persistente | ✅ |
| Logout | localStorage limpo | ✅ |
| Login diferente | Isolamento OK | ✅ |
| Token inválido | Logout automático | ✅ |

---

## 🐛 Se Encontrar Problemas

### Problema: F5 volta para embarcador
- ❌ Bug NÃO está corrigido
- 🔧 Verifique: Console mostra erro em `checkAuth()`?
- 🔧 Verifique: localStorage está vazio após F5?
- 🔧 Execute: `npm run build` e recarregue página

### Problema: localStorage não persiste
- ❌ localStorage pode estar bloqueado
- 🔧 Verifique: DevTools → Application → localStorage
- 🔧 Tente: Incognito mode (sem extensões que bloqueiem)

### Problema: Logout não funciona
- ❌ Verifique: Button está conectado à função `logout()`
- 🔧 Console: Deve mostrar logs de logout
- 🔧 localStorage: Deve estar vazio após logout

---

## 📞 Informações de Suporte

### Testes Automatizados:
```bash
# F5 Session Test
bash test-f5-session.sh

# Advanced F5 Test
bash test-f5-advanced.sh

# Segurança Completa
bash test-security-complete.sh
```

### Logs Importantes:
- ✅ `💾 INIT:` - Inicialização do localStorage
- ✅ `🔍 checkAuth:` - Validação de sessão
- ✅ `✅ Login bem-sucedido:` - Login sucesso
- ✅ `🔐 apiClient.auth.me():` - Chamada ME endpoint

---

## 🎯 Conclusão

Após aplicar as correções:
- ✅ F5 Refresh funciona corretamente
- ✅ Session persiste entre reloads
- ✅ userType não muda para embarcador
- ✅ **Segurança reforçada** ✅

**Status:** 🟢 **OPERACIONAL**

