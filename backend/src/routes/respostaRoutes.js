import express from 'express';
import {
  responderCotacao,
  listarRespostas,
  aceitarResposta,
  listarMinhasRespostas,
} from '../controllers/respostaController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Aplicar middleware de autenticação
router.use(authMiddleware);

// Responder cotação
router.post('/', responderCotacao);

// Listar respostas do transportador
router.get('/minhas-respostas', listarMinhasRespostas);

// Listar respostas de uma cotação (apenas o dono da cotação)
router.get('/cotacao/:cotacaoId', listarRespostas);

// Aceitar resposta
router.put('/:respostaId/aceitar', aceitarResposta);

export default router;
