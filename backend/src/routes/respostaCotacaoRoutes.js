import express from 'express';
import {
  responderCotacao,
  aceitarResposta,
  rejeitarResposta,
  listarRespostas
} from '../controllers/respostaCotacaoController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * ROTAS SEGURAS DE RESPOSTA A COTAÇÕES
 * 
 * Todos os endpoints requerem autenticação JWT
 * Validações:
 * - Transportador: Pode responder e ver suas respostas
 * - Embarcador: Pode aceitar/rejeitar e ver respostas de suas cotações
 * - Endereços verificados em cada controller
 */

// Listar respostas de uma cotação
// GET /api/respostas/:cotacaoId
// Acesso: Criador da cotação, transportadores, atau admin
router.get('/:cotacaoId', authenticateToken, listarRespostas);

// Transportador responde a uma cotação
// POST /api/respostas/:cotacaoId/responder
// Acesso: Apenas transportadores
router.post('/:cotacaoId/responder', authenticateToken, responderCotacao);

// Embarcador aceita resposta
// POST /api/respostas/:cotacaoId/resposta/:respostaId/aceitar
// Acesso: Criador da cotação apenas
router.post('/:cotacaoId/resposta/:respostaId/aceitar', authenticateToken, aceitarResposta);

// Embarcador rejeita resposta
// POST /api/respostas/:cotacaoId/resposta/:respostaId/rejeitar
// Acesso: Criador da cotação apenas
router.post('/:cotacaoId/resposta/:respostaId/rejeitar', authenticateToken, rejeitarResposta);

export default router;
