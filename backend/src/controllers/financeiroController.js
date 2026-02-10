import prisma from '../utils/prismaClient.js';

/**
 * Obter financeiro da transportadora
 */
export const obterFinanceiro = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { mes, ano } = req.query;

    const where = { transportadoraId: userId };
    if (mes) where.mes = parseInt(mes);
    if (ano) where.ano = parseInt(ano);

    const financeiro = await prisma.financeiro.findMany({
      where,
      orderBy: [
        { ano: 'desc' },
        { mes: 'desc' }
      ]
    });

    res.json(financeiro);
  } catch (error) {
    console.error('Erro ao obter financeiro:', error);
    res.status(500).json({ message: 'Erro ao obter financeiro', error: error.message });
  }
};

/**
 * Criar/Atualizar registro financeiro ao finalizar cotação
 */
export const atualizarFinanceiro = async (cotacaoId, transportadoraId, valorFinal) => {
  try {
    const agora = new Date();
    const mes = agora.getMonth() + 1;
    const ano = agora.getFullYear();

    const taxa = 0.05; // 5%
    const valorComissao = valorFinal * taxa;
    const valorReceber = valorFinal - valorComissao;

    // Buscar registro existente
    let financeiro = await prisma.financeiro.findFirst({
      where: {
        transportadoraId,
        mes,
        ano
      }
    });

    if (financeiro) {
      // Atualizar existente
      await prisma.financeiro.update({
        where: { id: financeiro.id },
        data: {
          totalFaturado: { increment: valorFinal },
          totalComissao: { increment: valorComissao },
          totalReceber: { increment: valorReceber },
          numeroEntregas: { increment: 1 }
        }
      });
    } else {
      // Criar novo
      await prisma.financeiro.create({
        data: {
          transportadoraId,
          mes,
          ano,
          totalFaturado: valorFinal,
          totalComissao: valorComissao,
          totalReceber: valorReceber,
          numeroEntregas: 1,
          status: 'pendente'
        }
      });
    }

    return true;
  } catch (error) {
    console.error('Erro ao atualizar financeiro:', error);
    return false;
  }
};

/**
 * Listar financeiro de todas as transportadoras (Admin)
 */
export const listarFinanceiroAdmin = async (req, res) => {
  try {
    const { mes, ano, status } = req.query;

    const where = {};
    if (mes) where.mes = parseInt(mes);
    if (ano) where.ano = parseInt(ano);
    if (status) where.status = status;

    const financeiro = await prisma.financeiro.findMany({
      where,
      include: {
        transportadora: {
          select: {
            id: true,
            razaoSocial: true,
            nomeCompleto: true,
            email: true
          }
        }
      },
      orderBy: [
        { ano: 'desc' },
        { mes: 'desc' }
      ]
    });

    res.json(financeiro);
  } catch (error) {
    console.error('Erro ao listar financeiro admin:', error);
    res.status(500).json({ message: 'Erro ao listar financeiro', error: error.message });
  }
};

/**
 * Atualizar status do financeiro (Admin)
 */
export const atualizarStatusFinanceiro = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, dataPagamento } = req.body;

    const financeiro = await prisma.financeiro.update({
      where: { id },
      data: {
        status,
        dataPagamento: dataPagamento ? new Date(dataPagamento) : null
      }
    });

    res.json(financeiro);
  } catch (error) {
    console.error('Erro ao atualizar status financeiro:', error);
    res.status(500).json({ message: 'Erro ao atualizar status financeiro', error: error.message });
  }
};
