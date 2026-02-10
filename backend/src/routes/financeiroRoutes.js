import express from 'express';
import { 
  obterFinanceiro, 
  listarFinanceiroAdmin,
  atualizarStatusFinanceiro
} from '../controllers/financeiroController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, obterFinanceiro);
router.get('/admin', authMiddleware, listarFinanceiroAdmin);
router.get('/:id', authMiddleware, obterFinanceiro); // Rota para buscar financeiro por transportadorId
router.patch('/:id', authMiddleware, atualizarStatusFinanceiro);

export default router;
