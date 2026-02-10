import express from 'express';
import {
  listarCotacoes,
  obterCotacao,
  criarCotacao,
  atualizarCotacao,
  cancelarCotacao,
  listarCotacoesDisponiveis,
  aceitarCotacao,
  confirmarColeta,
  registrarDocumento,
  registrarRastreamento,
  finalizarEntrega,
  informarAtraso,
} from '../controllers/cotacaoController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware);

// Listar cotações disponíveis (para transportadores) - DEVE VIR ANTES de /:id
router.get('/disponiveis', listarCotacoesDisponiveis);

// Listar cotações do usuário
router.get('/', listarCotacoes);

// Obter cotação específica
router.get('/:id', obterCotacao);

// Criar cotação
router.post('/', criarCotacao);

// Atualizar cotação
router.put('/:id', atualizarCotacao);

// Cancelar cotação
router.delete('/:id', cancelarCotacao);

// Aceitar resposta de cotação
router.post('/:id/aceitar', aceitarCotacao);

// Confirmar coleta
router.post('/:id/confirmar-coleta', confirmarColeta);

// Registrar documento fiscal (CT-e, CIOT, MDF-e)
router.post('/:id/documento', registrarDocumento);

// Registrar rastreamento
router.post('/:id/rastreamento', registrarRastreamento);

// Finalizar entrega
router.post('/:id/finalizar', finalizarEntrega);

// Informar atraso
router.post('/:id/atraso', informarAtraso);

export default router;
