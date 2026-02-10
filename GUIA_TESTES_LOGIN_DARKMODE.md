# 🧪 GUIA DE TESTES - LOGIN + DARK MODE

## 1️⃣ TESTAR LOGIN

### Credenciais de Teste:
```
Transportador:
  Email: transportador@test.com
  Senha: 123456

Embarcador:
  Email: embarcador@test.com
  Senha: 123456
```

### Passo a Passo:
1. Abra `http://localhost:3000`
2. Clique em "Entrar"
3. Digite `transportador@test.com` e `123456`
4. Clique em "🚀 Entrar"
5. **Esperado:** Dashboard Transportadora abre com 3 Oportunidades Disponíveis

### Debugging no Console:
Se der erro, abra DevTools (F12 → Console) e procure por:
- `🔍 Tentando login com:` ← Log do Login.jsx
- `✅ Login sucesso!` ← Se aparecer, é sucesso
- `❌ Erro ao fazer login:` ← Se aparecer, há erro

---

## 2️⃣ TESTAR DARK MODE

### Teste 1: Botão no Header
1. Abra `http://localhost:3000`
2. Localize o botão 🌙 (Lua) no canto superior direito do header
3. Clique no botão
4. **Esperado:** Interface muda para tema escuro
5. Clique novamente
6. **Esperado:** Interface volta ao tema claro

### Teste 2: Persistência
1. Mude para dark mode
2. **Locação:** O tema deve estar salvo em localStorage
3. Recarregue a página (F5)
4. **Esperado:** Tema permanece escuro (sem piscar)

### Teste 3: Preferência do Sistema
1. Abra DevTools → Application → Local Storage
2. Delete a entrada `theme`
3. Recarregue (F5)
4. **Esperado:** Sistema detecta tema preferido do SO

### Teste 4: Em Diferentes Páginas
1. Login como transportador@test.com
2. Navegue entre abas (Dashboard, Cotações, Chats, etc)
3. Mude para dark mode
4. Navegue para outro link
5. **Esperado:** Tema permanece escuro em todas as páginas

---

## 3️⃣ TESTAR DASHBOARD TRANSPORTADOR

### Verificações:
- [ ] Header mostra "Bem-vindo, [Nome]" com emoji 🚚
- [ ] 3 Oportunidades Disponíveis aparecem
- [ ] Sino no topo mostra badge "3"
- [ ] Menu lateral mostra "3" no Cotações
- [ ] Dark mode funciona nessa página

### Páginas para Verificar Dark Mode:
- [x] Login
- [ ] Dashboard Transportador
- [ ] Dashboard Embarcador
- [ ] Cotações Disponíveis
- [ ] Cotações Aceitas
- [ ] Chats
- [ ] Perfil

---

## 4️⃣ CHECKLIST FINAL

### Login:
- [ ] Transportador consegue fazer login
- [ ] Embarcador consegue fazer login
- [ ] Redirecionamento correto (transportador → /dashboard-transportadora)
- [ ] Redirecionamento correto (embarcador → /dashboard)
- [ ] Mensagens de erro aparecem se dados inválidos

### Dark Mode:
- [ ] Botão de toggle aparece no header
- [ ] Clique alterna entre claro/escuro
- [ ] Tema persiste após recarregar página
- [ ] Transição suave (sem piscar)
- [ ] Todas as cores estão legíveis
- [ ] Componentes (cards, inputs, buttons) se adaptam

### Visual Embarcador vs Transportador:
- [ ] Transportador mostra "Bem-vindo" no dashboard
- [ ] Embarcador mostra "Bem-vindo" no dashboard
- [ ] Ambos têm cores consistentes
- [ ] Layout é responsivo (funciona em mobile)

---

## 🐛 SE HOUVER ERROS:

### Erro: Flash de tema
**Causa:** ThemeContext renderiza antes de aplicar classe
**Solução:** Main.jsx já tem código para isto - limpar cache (Ctrl+Shift+Delete)

### Erro: Login não funciona
**Causa:** Senha incorreta no banco
**Solução:** Usar script `node backend/fix-test-passwords.js`

### Erro: Dark mode não aparece
**Causa:** CSS não carregou
**Solução:** 
1. Verificar se Tailwind regenerou (npm run build)
2. Limpar browser cache
3. Verificar se tailwind.config.js tem `darkMode: 'class'`

### Erro: Cores ficam estranhas em dark mode
**Causa:** Alguns componentes ainda têm cores hardcoded
**Solução:** Usar classes Tailwind com `dark:` prefix

---

## 📝 NOTAS IMPORTANTES:

1. **Theme Toggle está em:** `/src/components/ThemeToggle.jsx`
2. **Theme Context está em:** `/src/contexts/ThemeContext.jsx`
3. **Estilos Dark Mode estão em:** `/src/index.css` (final do arquivo)
4. **Tailwind config:** `darkMode: 'class'` em `tailwind.config.js`
5. **Main.jsx:** Aplica tema antes de render

---

## ✅ TESTES PASSARAM?

Se todos os testes passarem, comitamos:
```bash
git add .
git commit -m "feat: adicionar login debug + dark mode completo"
```

