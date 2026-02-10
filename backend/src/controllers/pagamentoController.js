import prisma from '../utils/prismaClient.js';

/**
 * Criar um pagamento
 */
export const criarPagamento = async (req, res) => {
  try {
    const { valor, metodo, descricao, referencia, cotacaoId } = req.body;
    let userId = req.user?.id;

    // Se for pagamento de cotação, força o userId do dono da cotação
    if (cotacaoId) {
      const cotacao = await prisma.cotacao.findUnique({ where: { id: cotacaoId } });
      if (!cotacao) {
        return res.status(404).json({ message: 'Cotação não encontrada' });
      }
      userId = cotacao.userId;
    }

    if (!valor || !metodo) {
      return res.status(400).json({ message: 'Valor e método são obrigatórios' });
    }

    const pagamento = await prisma.pagamento.create({
      data: {
        userId,
        valor,
        metodo,
        status: 'pendente',
        descricao,
        referencia: referencia || cotacaoId,
      }
    });

    // Se há cotacaoId, atualizar status da cotação
    if (cotacaoId) {
      await prisma.cotacao.update({
        where: { id: cotacaoId },
        data: { status: 'aguardando_pagamento' }
      });
    }

    res.status(201).json(pagamento);
  } catch (error) {
    console.error('Erro ao criar pagamento:', error);
    res.status(500).json({ message: 'Erro ao criar pagamento', error: error.message });
  }
};

/**
 * Listar pagamentos do usuário
 */
export const listarPagamentos = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { status, limit = 50 } = req.query;

    const where = { userId };
    if (status) {
      where.status = status;
    }

    const pagamentos = await prisma.pagamento.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });

    res.json(pagamentos);
  } catch (error) {
    console.error('Erro ao listar pagamentos:', error);
    res.status(500).json({ message: 'Erro ao listar pagamentos', error: error.message });
  }
};

/**
 * Obter pagamento por ID
 */
export const obterPagamento = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const pagamento = await prisma.pagamento.findUnique({
      where: { id }
    });

    if (!pagamento) {
      return res.status(404).json({ message: 'Pagamento não encontrado' });
    }

    if (pagamento.userId !== userId && req.user?.userType !== 'admin') {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    res.json(pagamento);
  } catch (error) {
    console.error('Erro ao obter pagamento:', error);
    res.status(500).json({ message: 'Erro ao obter pagamento', error: error.message });
  }
};

/**
 * Atualizar status do pagamento (admin ou webhook)
 */
export const atualizarPagamento = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, cotacaoId } = req.body;

    const pagamento = await prisma.pagamento.update({
      where: { id },
      data: { status }
    });

    // Se pagamento aprovado e há cotação, atualizar status e liberar coleta
    if (status === 'aprovado' && (cotacaoId || pagamento.referencia)) {
      const cotId = cotacaoId || pagamento.referencia;
      await prisma.cotacao.update({
        where: { id: cotId },
        data: {
          status: 'aguardando_coleta',
          statusPagamento: 'confirmado',
          autorizadoColeta: true,
          dataAutorizacaoColeta: new Date(),
          pagamentoConfirmadoEm: new Date(),
          motivoBloqueioColeta: null,
        }
      });
    }

    res.json(pagamento);
  } catch (error) {
    console.error('Erro ao atualizar pagamento:', error);
    res.status(500).json({ message: 'Erro ao atualizar pagamento', error: error.message });
  }
};
