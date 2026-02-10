import express from 'express';
import { 
  criarPagamento, 
  listarPagamentos, 
  obterPagamento,
  atualizarPagamento
} from '../controllers/pagamentoController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authMiddleware, criarPagamento);
router.get('/', authMiddleware, listarPagamentos);
router.get('/:id', authMiddleware, obterPagamento);
router.patch('/:id', authMiddleware, atualizarPagamento);

export default router;
