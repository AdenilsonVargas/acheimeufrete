import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { 
  criarAvaliacaoTransportador,
  criarAvaliacaoCliente,
  listarAvaliacoesRecebidas,
  verificarAvaliacaoPendente
} from '../controllers/avaliacaoController.js';

const router = express.Router();

/**
 * POST /api/avaliacoes/transportador
 * Criar avaliação de transportador (por embarcador)
 */
router.post('/transportador', authenticateToken, criarAvaliacaoTransportador);

/**
 * POST /api/avaliacoes/cliente
 * Criar avaliação de cliente (por transportador)
 */
router.post('/cliente', authenticateToken, criarAvaliacaoCliente);

/**
 * GET /api/avaliacoes/recebidas
 * Listar avaliações recebidas
 */
router.get('/recebidas', authenticateToken, listarAvaliacoesRecebidas);

/**
 * GET /api/avaliacoes/:cotacaoId/pendente
 * Verificar se há avaliação pendente nesta cotação
 */
router.get('/:cotacaoId/pendente', authenticateToken, verificarAvaliacaoPendente);

export default router;
