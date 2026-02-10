/**
 * Stats Controller - Contadores para a Homepage
 * Gerencia estatísticas dinâmicas da plataforma
 */

import prisma from '../utils/prismaClient.js';

/**
 * GET /api/stats/home
 * Retorna contadores dinâmicos para a homepage
 * 
 * Regra de Contagem:
 * - Cotações criadas: Apenas quando aceitas pelo embarcador (status = 'aceita')
 * - Cotações finalizadas: Apenas quando entregues (dataEntregaRealizada NOT NULL)
 * - Valores: Apenas de respostas selecionadas/aceitas
 */
export const getHomeStats = async (req, res) => {
  try {
    console.log('📊 [getHomeStats] Iniciando busca de estatísticas...');

    // Query 1: Contar transportadores (userType = 'transportador')
    const transportadoresCount = await prisma.user.count({
      where: { userType: 'transportador' },
    });
    console.log('  📦 Transportadores:', transportadoresCount);

    // Query 2: Contar embarcadores (userType = 'embarcador')
    const embarcadoresCount = await prisma.user.count({
      where: { userType: 'embarcador' },
    });
    console.log('  📦 Embarcadores:', embarcadoresCount);

    // Query 3: Cotações ACEITAS (criadas) - status = 'aceita'
    // Uma cotação só passa para "Cotações Aceitas" quando o embarcador aceita o valor
    const cotacoesCriadas = await prisma.cotacao.count({
      where: { status: 'aceita' },
    });
    console.log('  📦 Cotações criadas (aceitas):', cotacoesCriadas);

    // Query 4: Cotações FINALIZADAS (com entrega realizada)
    // Um cotação só é finalizada quando tem dataEntregaRealizada
    const cotacoesFinalizadas = await prisma.cotacao.count({
      where: { dataEntregaRealizada: { not: null } },
    });
    console.log('  📦 Cotações finalizadas:', cotacoesFinalizadas);

    // Query 5: Valor de COTAÇÕES ACEITAS
    // Buscar todas as cotações com status 'aceita' e somar o valor da resposta selecionada
    const cotacoesAceitas = await prisma.cotacao.findMany({
      where: { status: 'aceita' },
      select: {
        respostaSelecionadaId: true,
        respostas: {
          select: { id: true, valor: true },
        },
      },
    });

    let valorCotacoesAceitas = 0;
    cotacoesAceitas.forEach(cotacao => {
      // Encontrar a resposta selecionada
      const respostaSelecionada = cotacao.respostas.find(
        r => r.id === cotacao.respostaSelecionadaId
      );
      if (respostaSelecionada) {
        valorCotacoesAceitas += parseFloat(respostaSelecionada.valor) || 0;
      }
    });
    console.log('  💰 Valor cotações aceitas:', valorCotacoesAceitas.toFixed(2));

    // Query 6: Valor de COTAÇÕES FINALIZADAS
    // Buscar cotações com dataEntregaRealizada e somar valor
    const cotacoescomEntrega = await prisma.cotacao.findMany({
      where: { dataEntregaRealizada: { not: null } },
      select: {
        respostaSelecionadaId: true,
        respostas: {
          select: { id: true, valor: true },
        },
      },
    });

    let valorCotacoesFinalizadas = 0;
    cotacoescomEntrega.forEach(cotacao => {
      // Encontrar a resposta selecionada
      const respostaSelecionada = cotacao.respostas.find(
        r => r.id === cotacao.respostaSelecionadaId
      );
      if (respostaSelecionada) {
        valorCotacoesFinalizadas += parseFloat(respostaSelecionada.valor) || 0;
      }
    });
    console.log('  💰 Valor cotações finalizadas:', valorCotacoesFinalizadas.toFixed(2));

    const response = {
      transportadores: transportadoresCount,
      embarcadores: embarcadoresCount,
      cotacoesCriadas,
      cotacoesFinalizadas,
      valorCotacoesAceitas: valorCotacoesAceitas.toFixed(2),
      valorCotacoesFinalizadas: valorCotacoesFinalizadas.toFixed(2),
      timestamp: new Date(),
    };

    console.log('✅ [getHomeStats] Estatísticas carregadas:', response);
    return res.status(200).json(response);
  } catch (error) {
    console.error('❌ [getHomeStats] Erro:', error.message);
    console.error('Stack:', error.stack);
    return res.status(500).json({
      message: 'Erro ao buscar estatísticas',
      error: error.message,
    });
  }
};

/**
 * GET /api/stats/economia
 * Calcula economia total gerada na plataforma
 * Baseado na diferença entre valor inicial e valor aceito
 * Apenas considera cotações que foram ACEITAS (status = 'aceita')
 */
export const getEconomyStats = async (req, res) => {
  try {
    console.log('💰 [getEconomyStats] Calculando economia...');

    // Buscar APENAS cotações com status 'aceita' (já foram aceitas pelo embarcador)
    const cotacoes = await prisma.cotacao.findMany({
      where: { status: 'aceita' },
      select: {
        id: true,
        valorEstimado: true,
        respostaSelecionadaId: true,
        respostas: {
          select: { id: true, valor: true },
        },
      },
    });

    console.log(`  📊 Processando ${cotacoes.length} cotações aceitas...`);

    let totalEconomia = 0;
    let percentualMedio = 0;
    let cotacoesComEconomia = 0;

    cotacoes.forEach(cotacao => {
      if (cotacao.valorEstimado && cotacao.respostaSelecionadaId) {
        // Encontrar a resposta selecionada
        const respostaSelecionada = cotacao.respostas.find(
          r => r.id === cotacao.respostaSelecionadaId
        );

        if (respostaSelecionada) {
          const menorResposta = parseFloat(respostaSelecionada.valor) || 0;
          const economia = parseFloat(cotacao.valorEstimado) - menorResposta;
          
          if (economia > 0) {
            totalEconomia += economia;
            
            // Calcular percentual de economia
            const percentual = (economia / parseFloat(cotacao.valorEstimado)) * 100;
            percentualMedio += percentual;
            cotacoesComEconomia += 1;
          }
        }
      }
    });

    // Calcular média do percentual
    if (cotacoesComEconomia > 0) {
      percentualMedio = percentualMedio / cotacoesComEconomia;
    }

    const response = {
      totalEconomia: totalEconomia.toFixed(2),
      percentualMedio: percentualMedio.toFixed(1),
      cotacoesComEconomia,
      timestamp: new Date(),
    };

    console.log('✅ [getEconomyStats] Economia calculada:', response);

    return res.json(response);
  } catch (error) {
    console.error('❌ [getEconomyStats] Erro:', error.message);
    return res.status(500).json({
      message: 'Erro ao calcular economia',
      error: error.message,
    });
  }
};

export default {
  getHomeStats,
  getEconomyStats,
};
