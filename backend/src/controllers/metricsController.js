import { prisma } from '../config/database.js';

/**
 * Obtém métricas personalizadas para o usuário autenticado
 * Transportador: fretes realizados, avaliação média, receita total
 * Embarcador: fretes solicitados, custo total, avaliação média
 * 
 * SEGURANÇA: 
 * - Apenas o usuário pode acessar suas próprias métricas
 * - Valida autenticação antes de retornar dados
 * - Sanitiza respostas para não incluir dados sensíveis
 */
export const obterMinhasDashMetricas = async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.userType;

    // Validar que o usuário está autenticado
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      });
    }

    // Validar tipo de usuário
    if (!['transportador', 'embarcador'].includes(userType)) {
      return res.status(403).json({
        success: false,
        error: 'Tipo de usuário inválido'
      });
    }

    let metricas = {};

    if (userType === 'transportador') {
      metricas = await obterMetricasTransportador(userId);
    } else if (userType === 'embarcador') {
      metricas = await obterMetricasEmbarcador(userId);
    }

    return res.json({
      success: true,
      data: metricas
    });
  } catch (error) {
    console.error('Erro ao obter métricas:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao carregar métricas'
    });
  }
};

/**
 * Calcula métricas para transportador
 * - Fretes realizados (cotações com resposta aceita ou entregue)
 * - Avaliação média (a partir de avaliacoes)
 * - Receita total (soma dos valores das respostas aceitas)
 * - Últimas cotações
 * - Estatísticas de status
 */
async function obterMetricasTransportador(userId) {
  // Cotações onde o transportador respondeu
  const respostasTransportador = await prisma.respostaCotacao.findMany({
    where: { transportadorId: userId },
    include: {
      cotacao: {
        select: {
          id: true,
          titulo: true,
          status: true,
          dataColeta: true,
          dataEntregaRealizada: true,
          createdAt: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Cotações aceitas (onde a resposta foi selecionada)
  const respostasAceitas = respostasTransportador.filter(
    r => r.aceita === true && r.cotacao.status !== 'cancelada'
  );

  // Cotações entregues
  const respostasEntregues = respostasAceitas.filter(
    r => r.cotacao.dataEntregaRealizada !== null
  );

  // Calcular receita total
  const receitaTotal = respostasAceitas.reduce((acc, r) => acc + (r.valor || 0), 0);

  // Avaliacoes recebidas (apenas de transportador)
  const avaliacoes = await prisma.avaliacao.findMany({
    where: { avaliadoId: userId },
    select: { nota: true }
  });

  const avaliacaoMedia = avaliacoes.length > 0
    ? avaliacoes.reduce((acc, a) => acc + (a.nota || 0), 0) / avaliacoes.length
    : 0;

  // Últimas 5 cotações
  const ultimasCotacoes = respostasTransportador.slice(0, 5).map(r => ({
    id: r.cotacao.id,
    titulo: r.titulo,
    valor: r.valor,
    status: r.cotacao.status,
    dataColeta: r.cotacao.dataColeta,
    dataEntrega: r.cotacao.dataEntregaRealizada,
    respondidoEm: r.createdAt
  }));

  return {
    userType: 'transportador',
    fretesRealizados: respostasEntregues.length,
    fretesAceitos: respostasAceitas.length,
    receitaTotal: parseFloat(receitaTotal.toFixed(2)),
    avaliacaoMedia: parseFloat(avaliacaoMedia.toFixed(2)),
    totalAvaliacoes: avaliacoes.length,
    estatisticasStatus: {
      respondidos: respostasTransportador.length,
      aceitos: respostasAceitas.length,
      entregues: respostasEntregues.length,
      cancelados: respostasTransportador.filter(r => r.cotacao.status === 'cancelada').length
    },
    ultimasCotacoes: ultimasCotacoes
  };
}

/**
 * Calcula métricas para embarcador
 * - Fretes solicitados (número de cotações criadas)
 * - Custo total (soma dos valores das respostas selecionadas)
 * - Avaliação média (a partir de avaliacoes_cliente)
 * - Últimas cotações
 * - Estatísticas de status
 */
async function obterMetricasEmbarcador(userId) {
  // Cotações criadas pelo embarcador
  const cotacoes = await prisma.cotacao.findMany({
    where: { userId },
    include: {
      respostaSelecionada: {
        select: {
          valor: true,
          transportador: {
            select: {
              nomeCompleto: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Cotações com resposta selecionada (aceitas)
  const cotacoesComResposta = cotacoes.filter(c => c.respostaSelecionada !== null);

  // Cotações entregues
  const cotacoesEntregues = cotacoesComResposta.filter(
    c => c.dataEntregaRealizada !== null
  );

  // Calcular custo total
  const custoTotal = cotacoesComResposta.reduce(
    (acc, c) => acc + (c.respostaSelecionada?.valor || 0),
    0
  );

  // Avaliacoes recebidas como cliente
  const avaliacoes = await prisma.avaliacaoCliente.findMany({
    where: { avaliadoId: userId },
    select: { nota: true }
  });

  const avaliacaoMedia = avaliacoes.length > 0
    ? avaliacoes.reduce((acc, a) => acc + (a.nota || 0), 0) / avaliacoes.length
    : 0;

  // Últimas 5 cotações
  const ultimasCotacoes = cotacoes.slice(0, 5).map(c => ({
    id: c.id,
    numero: c.numero,
    titulo: c.titulo,
    valor: c.respostaSelecionada?.valor || null,
    transportador: c.respostaSelecionada?.transportador?.nomeCompleto || 'Aguardando resposta',
    status: c.status,
    dataColeta: c.dataColeta,
    dataEntrega: c.dataEntregaRealizada,
    criadoEm: c.createdAt
  }));

  return {
    userType: 'embarcador',
    fretesSolicitados: cotacoes.length,
    fretesComResposta: cotacoesComResposta.length,
    fretesEntregues: cotacoesEntregues.length,
    custoTotal: parseFloat(custoTotal.toFixed(2)),
    avaliacaoMedia: parseFloat(avaliacaoMedia.toFixed(2)),
    totalAvaliacoes: avaliacoes.length,
    estatisticasStatus: {
      criadas: cotacoes.length,
      comResposta: cotacoesComResposta.length,
      entregues: cotacoesEntregues.length,
      canceladas: cotacoes.filter(c => c.status === 'cancelada').length,
      aberta: cotacoes.filter(c => c.status === 'aberta').length
    },
    ultimasCotacoes: ultimasCotacoes
  };
}

/**
 * Endpoint para admin obter métricas de um usuário específico (auditoria)
 * SEGURANÇA: Apenas admin pode acessar
 */
export const obterMetricasUsuario = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validar que o usuário admin está acessando dados de outro usuário
    if (!userId || userId.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'ID do usuário inválido'
      });
    }

    // Verificar se o usuário existe
    const usuario = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, userType: true, nomeCompleto: true, email: true }
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    let metricas = {};
    if (usuario.userType === 'transportador') {
      metricas = await obterMetricasTransportador(userId);
    } else if (usuario.userType === 'embarcador') {
      metricas = await obterMetricasEmbarcador(userId);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Tipo de usuário inválido para métricas'
      });
    }

    return res.json({
      success: true,
      usuario: usuario,
      metricas: metricas
    });
  } catch (error) {
    console.error('Erro ao obter métricas do usuário:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao carregar métricas'
    });
  }
};
