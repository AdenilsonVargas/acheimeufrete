# 🚀 Guia Rápido - Cotações Favoritas

## Resumo em 30 segundos

Sistema permite usuários:
1. **Favoritar** cotações com nomes únicos (⭐)
2. **Reaproveitar** dados rapidamente (pré-preenchimento)
3. **Gerenciar** favoritas (listar, editar, deletar)

---

## 🎯 Para Usar

### Criar Favorita:
1. Abra qualquer cotação
2. Clique ⭐ no topo
3. Digite um nome
4. Clique "Salvar"

### Usar Favorita:
1. Vá em "Cotações"
2. Veja "Favoritas" no topo
3. Clique em um card
4. Formulário pré-preenchido ✨

### Deletar Favorita:
1. Em "Cotações" → "Favoritas"
2. Clique 🗑️ no card
3. Confirme

---

## 👨‍💻 Para Desenvolvedores

### Arquivos Principais:

```
Backend:
├─ backend/src/controllers/cotacaoFavoritaController.js
├─ backend/src/routes/cotacaoFavoritaRoutes.js
└─ backend/prisma/schema.prisma

Frontend:
├─ src/api/favoritas.js
├─ src/pages/DetalheCotacao.jsx
├─ src/pages/Cotacoes.jsx
└─ src/pages/NovaCotacao.jsx
```

### API Endpoints:

```
GET    /api/cotacoes-favoritas          Listar
POST   /api/cotacoes-favoritas          Criar
GET    /api/cotacoes-favoritas/:id      Obter
PUT    /api/cotacoes-favoritas/:id      Atualizar
DELETE /api/cotacoes-favoritas/:id      Deletar
```

### Frontend API:

```javascript
import * as favoritasAPI from '@/api/favoritas';

await favoritasAPI.listarFavoritas();
await favoritasAPI.criarFavorita(cotacaoId, nome);
await favoritasAPI.obterFavorita(id);
await favoritasAPI.atualizarFavorita(id, nome);
await favoritasAPI.deletarFavorita(id);
```

---

## 🔧 Troubleshooting

**"Nome já existe"** → Use outro nome
**"Não consegue favoritar"** → Confira se cotação está aceita
**"Favorita não pré-preenche"** → Verifique localStorage/token JWT

---

## 📚 Documentação Completa

- [FAVORITAS_IMPLEMENTACAO.md](./FAVORITAS_IMPLEMENTACAO.md) - Técnico detalhado
- [FAVORITAS_STATUS_FINAL.md](./FAVORITAS_STATUS_FINAL.md) - Status e resumo

---

## ✅ Pronto para usar!

Todos os testes passaram ✅
Código sem erros ✅
Documentado ✅
