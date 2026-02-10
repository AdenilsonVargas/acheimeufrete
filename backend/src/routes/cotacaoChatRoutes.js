/**
 * Rotas de Chat por Cotação
 * 
 * Endpoints REST para suportar chat em tempo real via WebSocket
 * Histórico de mensagens, informações da cotação, contadores
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
 * GET /api/chat/cotacao/:cotacaoId
 * Carregar histórico de mensagens de uma cotação
 * 
 * Query params:
 * - limit: número de mensagens (default: 50, máximo: 100)
 * - offset: para paginação (default: 0)
 */
router.get('/:cotacaoId', authenticateToken, async (req, res) => {
  try {
    const { cotacaoId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    const usuarioId = req.user?.id;

    if (!usuarioId) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
    }

    const resultado = await carregarHistoricoMensagens(
      cotacaoId,
      usuarioId,
      parseInt(limit),
      parseInt(offset)
    );

    if (!resultado.success) {
      return res.status(403).json({
        success: false,
        message: resultado.error
      });
    }

    res.json(resultado);
  } catch (error) {
    console.error('Erro ao carregar histórico:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar histórico de mensagens'
    });
  }
});

/**
 * POST /api/chat/cotacao/:cotacaoId/criar
 * Criar nova mensagem (fallback quando Socket.io não funciona)
 */
router.post('/:cotacaoId/criar', authenticateToken, async (req, res) => {
  try {
    const { cotacaoId } = req.params;
    const { conteudo } = req.body;
    const usuarioId = req.user?.id;

    if (!usuarioId) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
    }

    if (!conteudo) {
      return res.status(400).json({
        success: false,
        message: 'Conteúdo da mensagem é obrigatório'
      });
    }

    // Importar aqui para evitar problemas de dependência circular
    const { salvarMensagem } = await import('../controllers/cotacaoChatController.js');
    
    const resultado = await salvarMensagem(cotacaoId, usuarioId, conteudo);

    if (!resultado.success) {
      return res.status(400).json({
        success: false,
        message: resultado.error
      });
    }

    res.status(201).json(resultado);
  } catch (error) {
    console.error('Erro ao criar mensagem:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar mensagem'
    });
  }
});

/**
 * GET /api/chat/cotacao/:cotacaoId/info
 * Obter informações da cotação para exibir no header do chat
 */
router.get('/:cotacaoId/info', authenticateToken, async (req, res) => {
  try {
    const { cotacaoId } = req.params;

    const resultado = await obterInformacoesCotacao(cotacaoId);

    if (!resultado.success) {
      return res.status(404).json({
        success: false,
        message: resultado.error
      });
    }

    res.json(resultado);
  } catch (error) {
    console.error('Erro ao obter informações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter informações da cotação'
    });
  }
});

/**
 * GET /api/chat/nao-lidas
 * Obter contadores de mensagens não lidas
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const usuarioId = req.user?.id;

    if (!usuarioId) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
    }

    const resultado = await obterContadoresNaoLidas(usuarioId);

    if (!resultado.success) {
      return res.status(500).json({
        success: false,
        message: resultado.error
      });
    }

    res.json(resultado);
  } catch (error) {
    console.error('Erro ao obter contadores:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter contadores'
    });
  }
});

export default router;
