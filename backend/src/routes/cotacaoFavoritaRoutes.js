import express from 'express';
import {
  listarFavoritas,
  criarFavorita,
  obterFavorita,
  atualizarFavorita,
  deletarFavorita,
} from '../controllers/cotacaoFavoritaController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware);

// Listar favoritas do usuário
router.get('/', listarFavoritas);

// Criar favorita
router.post('/', criarFavorita);

// Obter favorita específica
router.get('/:id', obterFavorita);

// Atualizar nome da favorita
router.put('/:id', atualizarFavorita);

// Deletar favorita
router.delete('/:id', deletarFavorita);

export default router;
