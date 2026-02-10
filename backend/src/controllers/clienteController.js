import prisma from '../utils/prismaClient.js';

/**
 * 1. Cliente solicita autorização para pagar via boleto
 */
export const solicitarAutorizacaoBoleto = async (req, res) => {
  try {
    const userId = req.userId || req.user?.id;
    const { motivo } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      });
    }

    // Verificar se é embarcador
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { userType: true, solicitacaoBoletoStatus: true }
    });

    if (!user || user.userType !== 'embarcador') {
      return res.status(403).json({
        success: false,
        error: 'Apenas embarcadores podem solicitar autorização de boleto'
      });
    }

    // Se já tem solicitação pendente, não permitir nova
    if (user.solicitacaoBoletoStatus === 'pendente') {
      return res.status(400).json({
        success: false,
        error: 'Você já possui uma solicitação pendente de análise'
      });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        solicitacaoBoletoStatus: 'pendente',
        dataSolicitacaoBoleto: new Date()
      },
      select: {
        id: true,
        email: true,
        nomeCompleto: true,
        solicitacaoBoletoStatus: true,
        dataSolicitacaoBoleto: true,
        autorizadoBoleto: true
      }
    });

    res.json({
      success: true,
      message: 'Solicitação enviada com sucesso. Aguarde análise do administrador.',
      data: updated
    });
  } catch (error) {
    console.error('Erro ao solicitar autorização:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao enviar solicitação'
    });
  }
};

/**
 * 2. Obter status de autorização do próprio cliente
 */
export const meuStatusBoleto = async (req, res) => {
  try {
    const userId = req.userId || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        autorizadoBoleto: true,
        solicitacaoBoletoStatus: true,
        dataSolicitacaoBoleto: true,
        dataAutorizacaoBoleto: true,
        justificativaRejeicaoBoleto: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Erro ao obter status:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter status'
    });
  }
};
