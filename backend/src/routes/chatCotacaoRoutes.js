/**
 * Rotas para Chat de Cotações (Real-time)
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  carregarHistoricoMensagens,
  obterInformacoesCotacao,
  obterContadoresNaoLidas
} from '../controllers/cotacaoChatController.js';

const router = express.Router();

/**
 * GET /api/chat-cotacao/:cotacaoId
 * Carregar histórico de mensagens de uma cotação
 */
router.get('/:cotacaoId', authenticateToken, async (req, res) => {
  try {
    const { cotacaoId } = req.params;
    const { limit = '50', offset = '0' } = req.query;

    const result = await carregarHistoricoMensagens(
      cotacaoId,
      req.user.id,
      parseInt(limit),
      parseInt(offset)
    );

    if (!result.success) {
      return res.status(403).json({
        success: false,
        error: result.error
      });
    }

    return res.json(result);
  } catch (error) {
    console.error('Erro ao carregar histórico:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao carregar histórico de mensagens'
    });
  }
});

/**
 * GET /api/chat-cotacao/:cotacaoId/info
 * Obter informações da cotação
 */
router.get('/:cotacaoId/info', authenticateToken, async (req, res) => {
  try {
    const { cotacaoId } = req.params;

    const result = await obterInformacoesCotacao(cotacaoId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: result.error
      });
    }

    return res.json(result);
  } catch (error) {
    console.error('Erro ao obter informações:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter informações da cotação'
    });
  }
});

/**
 * GET /api/chat-cotacao/nao-lidas
 * Obter contadores de mensagens não lidas
 */
router.get('/nao-lidas/contador', authenticateToken, async (req, res) => {
  try {
    const result = await obterContadoresNaoLidas(req.user.id);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    return res.json(result);
  } catch (error) {
    console.error('Erro ao obter contadores:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter contadores de mensagens'
    });
  }
});

export default router;
