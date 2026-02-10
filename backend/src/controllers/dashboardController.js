import prisma from '../utils/prismaClient.js';

/**
 * Dashboard do Embarcador - Visão de Contas a Pagar
 */
export const dashboardEmbarcador = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { mes, ano } = req.query;

    const agora = new Date();
    const mesAtual = mes ? parseInt(mes) : agora.getMonth() + 1;
    const anoAtual = ano ? parseInt(ano) : agora.getFullYear();

    // Cotações em aberto (não pagas) do embarcador
    const cotacoesEmAberto = await prisma.cotacao.findMany({
      where: {
        userId,
        status: 'finalizada',
        statusPagamento: { not: 'confirmado' }
      },
      include: {
        respostaSelecionada: {
          select: {
            transportador: {
              select: {
                id: true,
                razaoSocial: true,
                nomeCompleto: true
              }
            }
          }
        },
        pagamentos: true
      },
      orderBy: { dataEntregaRealizada: 'desc' }
    });

    // Cotações pagas neste mês
    const cotacoesPagas = await prisma.cotacao.findMany({
      where: {
        userId,
        statusPagamento: 'confirmado',
        pagamentoConfirmadoEm: {
          gte: new Date(anoAtual, mesAtual - 1, 1),
          lte: new Date(anoAtual, mesAtual, 0)
        }
      },
      select: {
        id: true,
        numero: true,
        titulo: true,
        valorFinalTransportadora: true,
        pagamentoConfirmadoEm: true,
        respostaSelecionada: {
          select: {
            transportador: {
              select: {
                razaoSocial: true,
                nomeCompleto: true
              }
            }
          }
        }
      },
      orderBy: { pagamentoConfirmadoEm: 'desc' }
    });

    // Boletos pendentes
    const boletosAguardando = await prisma.cotacao.findMany({
      where: {
        userId,
        boletoGerado: true,
        boletoPago: false
      },
      select: {
        id: true,
        numero: true,
        titulo: true,
        valorFinalTransportadora: true,
        dataBoletoGerado: true,
        dataBoletoPago: true
      },
      orderBy: { dataBoletoGerado: 'desc' }
    });

    // Cálculos
    const totalAPagar = cotacoesEmAberto.reduce((sum, c) => sum + (c.valorFinalTransportadora || 0), 0);
    const totalPagoMes = cotacoesPagas.reduce((sum, c) => sum + (c.valorFinalTransportadora || 0), 0);
    const totalBoletosEmAberto = boletosAguardando.reduce((sum, b) => sum + (b.valorFinalTransportadora || 0), 0);

    res.json({
      success: true,
      data: {
        resumo: {
          totalAPagar,
          totalPagoMes,
          totalBoletosEmAberto,
          cotacoesEmAberto: cotacoesEmAberto.length,
          cotacoesPagasMes: cotacoesPagas.length,
          boletosAguardando: boletosAguardando.length,
          mes: mesAtual,
          ano: anoAtual
        },
        cotacoesEmAberto,
        cotacoesPagas,
        boletosAguardando
      }
    });
  } catch (error) {
    console.error('Erro ao buscar dashboard do embarcador:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar dashboard'
    });
  }
};

/**
 * Dashboard do Transportador - Visão de Contas a Receber
 */
export const dashboardTransportador = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { mes, ano } = req.query;

    const agora = new Date();
    const mesAtual = mes ? parseInt(mes) : agora.getMonth() + 1;
    const anoAtual = ano ? parseInt(ano) : agora.getFullYear();

    // Registros financeiros do transportador para o mês
    const financeiroMes = await prisma.financeiro.findFirst({
      where: {
        transportadoraId: userId,
        mes: mesAtual,
        ano: anoAtual
      }
    });

    // Cotações finalizadas e pagas neste mês
    const cotacoesRecebidas = await prisma.cotacao.findMany({
      where: {
        respostaSelecionada: {
          transportadorId: userId
        },
        status: 'finalizada',
        statusPagamento: 'confirmado',
        pagamentoConfirmadoEm: {
          gte: new Date(anoAtual, mesAtual - 1, 1),
          lte: new Date(anoAtual, mesAtual, 0)
        }
      },
      include: {
        user: {
          select: {
            id: true,
            nomeCompleto: true,
            nomeFantasia: true
          }
        },
        respostaSelecionada: {
          select: {
            valor: true
          }
        }
      },
      orderBy: { pagamentoConfirmadoEm: 'desc' }
    });

    // Cotações finalizadas mas ainda não pagas
    const cotacoesAReceber = await prisma.cotacao.findMany({
      where: {
        respostaSelecionada: {
          transportadorId: userId
        },
        status: 'finalizada',
        statusPagamento: { not: 'confirmado' }
      },
      include: {
        user: {
          select: {
            id: true,
            nomeCompleto: true,
            nomeFantasia: true
          }
        },
        respostaSelecionada: {
          select: {
            valor: true
          }
        }
      },
      orderBy: { dataEntregaRealizada: 'desc' }
    });

    // Cálculos com taxa de 5%
    const taxa = 0.05;
    const totalFaturadoMes = cotacoesRecebidas.reduce((sum, c) => sum + (c.respostaSelecionada?.valor || 0), 0);
    const comissaoMes = totalFaturadoMes * taxa;
    const totalRecebidoMes = totalFaturadoMes - comissaoMes;
    
    const totalAReceber = cotacoesAReceber.reduce((sum, c) => sum + (c.respostaSelecionada?.valor || 0), 0);
    const comissaoAReceber = totalAReceber * taxa;
    const totalLiquidoAReceber = totalAReceber - comissaoAReceber;

    res.json({
      success: true,
      data: {
        resumo: {
          totalFaturadoMes,
          comissaoMes: parseFloat(comissaoMes.toFixed(2)),
          totalRecebidoMes: parseFloat(totalRecebidoMes.toFixed(2)),
          totalAReceber,
          comissaoAReceber: parseFloat(comissaoAReceber.toFixed(2)),
          totalLiquidoAReceber: parseFloat(totalLiquidoAReceber.toFixed(2)),
          cotacoesRecebidas: cotacoesRecebidas.length,
          cotacoesAReceber: cotacoesAReceber.length,
          taxaComissao: (taxa * 100) + '%',
          mes: mesAtual,
          ano: anoAtual
        },
        financeiroMes,
        cotacoesRecebidas,
        cotacoesAReceber
      }
    });
  } catch (error) {
    console.error('Erro ao buscar dashboard do transportador:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar dashboard'
    });
  }
};

/**
 * Dashboard Admin - Visão consolidada de todos os usuários
 */
export const dashboardAdmin = async (req, res) => {
  try {
    const { mes, ano } = req.query;

    const agora = new Date();
    const mesAtual = mes ? parseInt(mes) : agora.getMonth() + 1;
    const anoAtual = ano ? parseInt(ano) : agora.getFullYear();

    // Resumo financeiro do mês
    const financemiroMes = await prisma.financeiro.findMany({
      where: {
        mes: mesAtual,
        ano: anoAtual
      },
      include: {
        transportadora: {
          select: {
            id: true,
            razaoSocial: true,
            nomeCompleto: true,
            email: true
          }
        }
      }
    });

    // Cotações finalizadas no mês
    const cotacoesFinalizadasMes = await prisma.cotacao.findMany({
      where: {
        status: 'finalizada',
        dataEntregaRealizada: {
          gte: new Date(anoAtual, mesAtual - 1, 1),
          lte: new Date(anoAtual, mesAtual, 0)
        }
      },
      include: {
        user: {
          select: {
            id: true,
            nomeCompleto: true,
            nomeFantasia: true
          }
        },
        respostaSelecionada: {
          select: {
            transportador: {
              select: {
                razaoSocial: true,
                nomeCompleto: true
              }
            },
            valor: true
          }
        }
      }
    });

    // Cotações com pagamentos pendentes
    const cotacoesPagamentosPendentes = await prisma.cotacao.findMany({
      where: {
        status: 'finalizada',
        statusPagamento: { not: 'confirmado' }
      },
      include: {
        user: {
          select: {
            id: true,
            nomeCompleto: true,
            nomeFantasia: true
          }
        },
        respostaSelecionada: {
          select: {
            transportador: {
              select: {
                razaoSocial: true,
                nomeCompleto: true
              }
            },
            valor: true
          }
        }
      },
      orderBy: { dataEntregaRealizada: 'desc' }
    });

    // Cálculos
    const totalFaturadoMes = cotacoesFinalizadasMes.reduce((sum, c) => sum + (c.respostaSelecionada?.valor || 0), 0);
    const taxa = 0.05;
    const totalComissoesMes = totalFaturadoMes * taxa;
    const totalRecebidoTransportadores = totalFaturadoMes - totalComissoesMes;

    const totalPagamentosEmAberto = cotacoesPagamentosPendentes.reduce((sum, c) => sum + (c.respostaSelecionada?.valor || 0), 0);

    res.json({
      success: true,
      data: {
        resumo: {
          totalFaturadoMes,
          totalComissoesMes: parseFloat(totalComissoesMes.toFixed(2)),
          totalRecebidoTransportadores: parseFloat(totalRecebidoTransportadores.toFixed(2)),
          totalPagamentosEmAberto,
          cotacoesFinalizadasMes: cotacoesFinalizadasMes.length,
          cotacoesPagamentosPendentes: cotacoesPagamentosPendentes.length,
          transportadoresAtivos: financemiroMes.length,
          taxaComissao: (taxa * 100) + '%',
          mes: mesAtual,
          ano: anoAtual
        },
        financeiroTransportadores: financemiroMes,
        cotacoesFinalizadasMes,
        cotacoesPagamentosPendentes
      }
    });
  } catch (error) {
    console.error('Erro ao buscar dashboard admin:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar dashboard'
    });
  }
};
