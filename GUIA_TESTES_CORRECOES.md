# 🧪 GUIA DE TESTES - VALIDAR AS CORREÇÕES

Após fazer login, você pode testar os seguintes cenários para confirmar que tudo está funcionando:

---

## 📋 Cenário 1: Transportador em Light Mode ✅

### Passos:
1. Abra http://localhost:3000
2. Clique em "Cadastrar" e crie uma conta como transportador, OU
3. Use as credenciais: **transportador@test.com** / **123456**
4. Após login, você estará em `/dashboard-transportadora`
5. Clique no ícone da lua 🌙 (canto superior direito) para ativar **Light Mode**

### O que você deve ver:
- ✅ Título: **"Bem-vindo, Transportador Test! 🚚"** (VISÍVEL em light mode)
- ✅ Tipo: **"Transportadora"** (NÃO "Embarcador") - VISÍVEL em light mode
- ✅ Menu no topo: **Home | Sobre | FAQ | Contato** (VISÍVEL)
- ✅ Texto "Acompanhe as oportunidades de frete disponíveis" (VISÍVEL)
- ✅ Sem texto branco invisível sobre fundo claro

---

## 📋 Cenário 2: Menu em Página Extra ✅

### Passos:
1. Após estar logado como transportador
2. Clique em **"Perfil"** no menu lateral (esquerdo)
3. Você será levado para `/perfil-transportadora`

### O que você deve ver:
- ✅ Menu no topo: **Home | Sobre | FAQ | Contato** (VISÍVEL)
- ✅ "Bem-vindo, Transportador Test!"
- ✅ "Transportadora"
- ✅ Texto de boas-vindas visível mesmo em light mode

### Outras páginas para testar:
- `/cotacoes-aceitas-transportadora` → Menu aparece ✅
- `/ncms-atendidos` → Menu aparece ✅
- `/regioes-atendidas` → Menu aparece ✅
- Qualquer página protegida → Menu aparece ✅

---

## 📋 Cenário 3: Painel Routing ✅

### Passos:
1. Após estar logado como transportador
2. Clique no botão **"📊 Painel"** (canto superior direito)

### O que você deve ver:
- ✅ URL muda para: `/dashboard-transportadora` (NÃO `/dashboard`)
- ✅ Menu lateral mostra opções do transportador
- ✅ Menu contém: Dashboard, Perfil, Opções de Envio, NCMs Atendidos, etc.

### Teste com Embarcador:
1. Faça logout
2. Login como: **embarcador@test.com** / **123456**
3. Clique em **"📊 Painel"**
4. URL deve ser: `/dashboard` (NÃO `/dashboard-transportadora`)

---

## 📋 Cenário 4: Embarcador em Light Mode ✅

### Passos:
1. Faça logout (se estiver como transportador)
2. Login como: **embarcador@test.com** / **123456**
3. Você estará em `/dashboard`
4. Ative **Light Mode** (clique na lua 🌙)

### O que você deve ver:
- ✅ Título: **"Bem-vindo, João Silva Embarcador!"** (VISÍVEL em light mode)
- ✅ Tipo: **"Embarcador"** (NÃO "Transportadora") - VISÍVEL em light mode
- ✅ Menu no topo: **Home | Sobre | FAQ | Contato** (VISÍVEL)
- ✅ Texto "Acompanhe as cotações e fretes" (VISÍVEL)

---

## 📋 Cenário 5: Menu Funcional (Links Navegáveis) ✅

### Passos:
1. Após estar logado (qualquer tipo)
2. Verifique se o menu está visível
3. Clique em cada link do menu:
   - Home → Deve ir para `/` (página inicial)
   - Sobre → Deve ir para `/sobre` (página sobre)
   - FAQ → Deve ir para `/faq` (página FAQ)
   - Contato → Deve ir para `/contato` (página contato)

### O que você deve ver:
- ✅ Menu continua visível mesmo em páginas públicas
- ✅ "Bem-vindo" continua visível
- ✅ Tipo de usuário continua visível
- ✅ Sem erros no console

---

## 🐛 Se algo NÃO estiver funcionando:

### Menu não aparece:
- [ ] Limpe o cache do navegador (Ctrl+Shift+Delete)
- [ ] Recarregue a página (F5)
- [ ] Faça logout e login novamente

### Texto invisível em light mode:
- [ ] Verifique se há plugins de tema no navegador
- [ ] Teste em outro navegador (Chrome, Firefox, Edge)

### Tipo errado (mostrando Embarcador quando é Transportador):
- [ ] Verifique no banco: `SELECT email, "userType" FROM "User";`
- [ ] Se ainda estiver "transportadora", execute:
  ```sql
  UPDATE "User" SET "userType" = 'transportador' WHERE "userType" = 'transportadora';
  ```

---

## ✅ Checklist Final

Marque tudo o que passar:

- [ ] Login transportador mostra "Bem-vindo, Transportador Test!"
- [ ] Tipo mostra "Transportadora" (não "Embarcador")
- [ ] Menu (Home, Sobre, FAQ, Contato) aparece em dashboard
- [ ] Menu aparece em `/perfil-transportadora`
- [ ] Menu aparece em `/cotacoes-aceitas-transportadora`
- [ ] Texto visível em light mode no dashboard
- [ ] Login embarcador mostra "Bem-vindo, João Silva Embarcador!"
- [ ] Tipo embarcador mostra "Embarcador"
- [ ] Botão Painel leva transportador para `/dashboard-transportadora`
- [ ] Botão Painel leva embarcador para `/dashboard`
- [ ] Nenhum erro no console do navegador

**SE TODOS OS ITENS PASSAREM, O SISTEMA ESTÁ FUNCIONANDO CORRETAMENTE! ✅**

---

## 📞 Suporte

Se encontrar algum problema:

1. **Abra o console do navegador:**
   - Pressione: `F12` ou `Ctrl+Shift+I`
   - Procure por mensagens de erro em vermelho
   - Copie a mensagem de erro

2. **Verifique o backend:**
   ```bash
   tail -f logs/backend.log
   ```

3. **Verifique o banco de dados:**
   ```bash
   docker exec -it acheimeufrete-postgres-1 psql -U postgres -d acheimeufrete \
   -c 'SELECT email, "userType" FROM "User";'
   ```

---

**Sistema pronto para teste! 🚀**
