import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import prisma from '../utils/prismaClient.js';

const router = express.Router();

/**
 * POST /api/chats/ncm-nao-encontrado
 * Registra uma solicitação de NCM que não foi encontrado
 * Envia notificação para admin e embarcadores
 */
router.post('/ncm-nao-encontrado', authenticateToken, async (req, res) => {
  try {
    const { ncmProcurado, remetenteNome } = req.body;
    const remetente = req.userId || req.user?.id;

    if (!ncmProcurado || !remetente) {
      return res.status(400).json({
        success: false,
        error: 'NCM e dados do cliente são obrigatórios'
      });
    }

    // Criar mensagem de solicitação
    const mensagem = await prisma.chat.create({
      data: {
        tipo: 'ncm_solicitacao',
        titulo: `🔍 Solicitação de NCM: ${ncmProcurado}`,
        descricao: `Cliente "${remetenteNome}" procurou pelo NCM "${ncmProcurado}" mas não o encontrou no sistema.`,
        conteudo: `NCM Procurado: ${ncmProcurado}\nCliente: ${remetenteNome}`,
        remetente,
        remetenteRole: 'cliente',
        destinatarioRole: 'admin,embarcador',
        ncmProcurado,
        status: 'aberto',
        urgencia: 'normal',
        createdAt: new Date()
      }
    });

    // Notificar admin
    await prisma.notification.create({
      data: {
        userId: 'admin',
        titulo: `Novo NCM solicitado: ${ncmProcurado}`,
        descricao: `${remetenteNome} procurou pelo NCM ${ncmProcurado}`,
        tipo: 'ncm_solicitacao',
        link: `/admin/ncm-solicitacoes/${mensagem.id}`,
        lido: false,
        createdAt: new Date()
      }
    }).catch(() => {
      // Ignorar erro se notification table não existir
    });

    res.status(201).json({
      success: true,
      message: 'Solicitação registrada com sucesso',
      data: mensagem
    });
  } catch (err) {
    console.error('Erro ao registrar NCM não encontrado:', err);
    res.status(500).json({
      success: false,
      error: 'Erro ao registrar solicitação'
    });
  }
});

/**
 * GET /api/chats/ncm-solicitacoes
 * Lista todas as solicitações de NCM (admin)
 */
router.get('/ncm-solicitacoes', authenticateToken, async (req, res) => {
  try {
    const { status = 'aberto', limit = 50 } = req.query;

    const where = { tipo: 'ncm_solicitacao' };
    if (status) where.status = status;

    const solicitacoes = await prisma.chat.findMany({
      where,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        ncmProcurado: true,
        descricao: true,
        remetenteRole: true,
        status: true,
        urgencia: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      data: solicitacoes
    });
  } catch (err) {
    console.error('Erro ao listar NCM solicitações:', err);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar solicitações'
    });
  }
});

export default router;
