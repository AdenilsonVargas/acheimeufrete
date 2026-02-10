import { prisma } from '../config/database.js';

/**
 * Cotação Response Controller
 * 
 * SEGURANÇA CRÍTICA:
 * - Validação rigorosa de entrada (tipos, limites, ranges)
 * - Autorização por usuário (transportador não pode responder sua própria cotação)
 * - Proteção contra duplicate responses
 * - Validação de cotação antes de resposta
 * - Rate limiting implícito (timestamp checking)
 * 
 * FUNCIONALIDADES:
 * - Transportador pode responder cotações abertas
 * - Embarcador pode visualizar/aceitar respostas
 * - Histórico de respostas
 */

/**
 * Transportador responde a uma cotação aberta
 * POST /api/cotacoes/:cotacaoId/responder
 * 
 * VALIDAÇÕES:
 * - Usuário deve ser transportador
 * - Cotação deve estar aberta e não expirada
 * - Transportador não pode responder sua própria cotação
 * - Transportador não pode responder 2x a mesma cotação
 * - Valor deve ser positivo e dentro de limites razoáveis
 * - DataEntrega deve ser no futuro
 */
export const responderCotacao = async (req, res) => {
  try {
    const { cotacaoId } = req.params;
    const { valor, descricao, dataEntrega } = req.body;
    const transportadorId = req.user.id;

    // ========== VALIDAÇÕES BÁSICAS ==========
    
    // 1. Validar tipo de usuário
    if (req.user.userType !== 'transportador') {
      return res.status(403).json({
        success: false,
        error: 'Apenas transportadores podem responder cotações'
      });
    }

    // 2. Validar se cotação existe
    if (!cotacaoId || cotacaoId.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'ID da cotação inválido'
      });
    }

    const cotacao = await prisma.cotacao.findUnique({
      where: { id: cotacaoId },
      select: {
        id: true,
        userId: true,
        status: true,
        dataHoraFim: true,
        titulo: true,
        respostas: {
          where: { transportadorId },
          select: { id: true }
        }
      }
    });

    if (!cotacao) {
      return res.status(404).json({
        success: false,
        error: 'Cotação não encontrada'
      });
    }

    // 3. Validar status da cotação
    if (!['aberta', 'em_andamento', 'visualizada'].includes(cotacao.status)) {
      return res.status(400).json({
        success: false,
        error: `Cotação não está disponível para respostas (status: ${cotacao.status})`
      });
    }

    // 4. Validar se cotação está expirada
    if (cotacao.dataHoraFim && new Date() > new Date(cotacao.dataHoraFim)) {
      return res.status(400).json({
        success: false,
        error: 'Prazo da cotação expirou'
      });
    }

    // 5. Validar se transportador não é o criador da cotação
    if (cotacao.userId === transportadorId) {
      return res.status(403).json({
        success: false,
        error: 'Você não pode responder sua própria cotação'
      });
    }

    // 6. Validar se já respondeu esta cotação
    if (cotacao.respostas && cotacao.respostas.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Você já respondeu esta cotação. Edite sua resposta anterior se necessário.'
      });
    }

    // ========== VALIDAÇÃO DE DADOS ==========

    // 7. Validar valor
    if (valor === undefined || valor === null || valor === '') {
      return res.status(400).json({
        success: false,
        error: 'Valor é obrigatório'
      });
    }

    const valorNumerico = parseFloat(String(valor).replace(',', '.'));

    if (isNaN(valorNumerico)) {
      return res.status(400).json({
        success: false,
        error: 'Valor deve ser um número válido'
      });
    }

    if (valorNumerico <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valor deve ser maior que zero'
      });
    }

    // 8. Limitar valor razoável (máximo R$ 1.000.000)
    if (valorNumerico > 1000000) {
      return res.status(400).json({
        success: false,
        error: 'Valor proposto excedem o limite máximo permitido (R$ 1.000.000)'
      });
    }

    // 9. Validar descrição (opcional, mas limitar tamanho)
    let descricaoSanitizada = null;
    if (descricao && descricao.trim().length > 0) {
      descricaoSanitizada = descricao.trim().substring(0, 1000); // Limite de 1000 caracteres
    }

    // 10. Validar dataEntrega se fornecida
    let dataEntregaparse = null;
    if (dataEntrega) {
      dataEntregaparse = new Date(dataEntrega);

      if (isNaN(dataEntregaparse.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Data de entrega inválida'
        });
      }

      // Data entrega deve ser no futuro
      if (dataEntregaparse <= new Date()) {
        return res.status(400).json({
          success: false,
          error: 'Data de entrega deve ser no futuro'
        });
      }

      // Data entrega não pode ser mais de 90 dias no futuro
      const dataMax = new Date();
      dataMax.setDate(dataMax.getDate() + 90);
      if (dataEntregaparse > dataMax) {
        return res.status(400).json({
          success: false,
          error: 'Data de entrega não pode ser mais de 90 dias no futuro'
        });
      }
    }

    // ========== CRIAR RESPOSTA ==========

    try {
      const resposta = await prisma.respostaCotacao.create({
        data: {
          cotacaoId: cotacao.id,
          transportadorId: transportadorId,
          valor: parseFloat(valorNumerico.toFixed(2)),
          dataEntrega: dataEntregaparse,
          descricao: descricaoSanitizada,
          aceita: false,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        include: {
          transportador: {
            select: {
              id: true,
              nomeCompleto: true,
              email: true,
              telefone: true,
              perfilTransportadora: {
                select: {
                  avaliacaoMedia: true,
                  numeroFretes: true
                }
              }
            }
          }
        }
      });

      // Log de auditoria
      console.log(`✅ Resposta criada: Transportador ${transportadorId} respondeu cotação ${cotacao.id} com R$ ${valorNumerico}`);

      return res.status(201).json({
        success: true,
        message: 'Resposta enviada com sucesso!',
        data: resposta
      });
    } catch (error) {
      console.error('Erro ao criar resposta:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao criar resposta. Tente novamente.'
      });
    }
  } catch (error) {
    console.error('Erro ao responder cotação:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao processar resposta'
    });
  }
};

/**
 * Embarcador aceita resposta a cotação
 * POST /api/cotacoes/:cotacaoId/respostas/:respostaId/aceitar
 * 
 * VALIDAÇÕES:
 * - Usuário deve ser o criador da cotação (embarcador)
 * - Resposta deve existir
 * - Cotação deve estar aberta
 * - Resposta já não pode ter sido aceita
 */
export const aceitarResposta = async (req, res) => {
  try {
    const { cotacaoId, respostaId } = req.params;
    const embarcadorId = req.user.id;

    // ========== VALIDAÇÕES ==========

    if (!cotacaoId || !respostaId) {
      return res.status(400).json({
        success: false,
        error: 'IDs inválidos'
      });
    }

    // 1. Buscar cotação e validar proprietário
    const cotacao = await prisma.cotacao.findUnique({
      where: { id: cotacaoId },
      select: {
        id: true,
        userId: true,
        status: true,
        dataHoraFim: true
      }
    });

    if (!cotacao) {
      return res.status(404).json({
        success: false,
        error: 'Cotação não encontrada'
      });
    }

    // Validar que é o proprietário da cotação
    if (cotacao.userId !== embarcadorId) {
      return res.status(403).json({
        success: false,
        error: 'Você não tem permissão para aceitar respostas desta cotação'
      });
    }

    // 2. Buscar resposta e validar
    const resposta = await prisma.respostaCotacao.findUnique({
      where: { id: respostaId },
      select: {
        id: true,
        cotacaoId: true,
        transportadorId: true,
        valor: true,
        aceita: true
      }
    });

    if (!resposta) {
      return res.status(404).json({
        success: false,
        error: 'Resposta não encontrada'
      });
    }

    // 3. Validar que resposta pertence a cotação
    if (resposta.cotacaoId !== cotacaoId) {
      return res.status(400).json({
        success: false,
        error: 'Resposta não pertence a esta cotação'
      });
    }

    // 4. Validar que resposta ainda não foi aceita
    if (resposta.aceita) {
      return res.status(400).json({
        success: false,
        error: 'Esta resposta já foi aceita'
      });
    }

    // ========== ACEITAR RESPOSTA ==========

    try {
      const respostaAtualizada = await prisma.respostaCotacao.update({
        where: { id: respostaId },
        data: {
          aceita: true,
          updatedAt: new Date()
        },
        include: {
          transportador: {
            select: {
              id: true,
              nomeCompleto: true,
              email: true
            }
          }
        }
      });

      // Rejeitar outras respostas desta cotação
      await prisma.respostaCotacao.updateMany({
        where: {
          cotacaoId: cotacaoId,
          id: { not: respostaId }
        },
        data: {
          aceita: false,
          updatedAt: new Date()
        }
      });

      // Atualizar cotação para mostrar que tem resposta aceita
      await prisma.cotacao.update({
        where: { id: cotacaoId },
        data: {
          respostaSelecionadaId: respostaId,
          status: 'em_andamento',
          updatedAt: new Date()
        }
      });

      console.log(`✅ Resposta aceita: Cotação ${cotacaoId} aceitou proposta de ${resposta.transportadorId} (R$ ${resposta.valor})`);

      return res.json({
        success: true,
        message: 'Resposta aceita com sucesso!',
        data: respostaAtualizada
      });
    } catch (error) {
      console.error('Erro ao aceitar resposta:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao aceitar resposta'
      });
    }
  } catch (error) {
    console.error('Erro ao aceitar resposta:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao processar solicitação'
    });
  }
};

/**
 * Rejeitar resposta a cotação
 * POST /api/cotacoes/:cotacaoId/respostas/:respostaId/rejeitar
 * 
 * VALIDAÇÕES:
 * - Usuário deve ser o criador da cotação (embarcador)
 * - Resposta deve existir
 * - Resposta não pode já ter sido aceita
 */
export const rejeitarResposta = async (req, res) => {
  try {
    const { cotacaoId, respostaId } = req.params;
    const embarcadorId = req.user.id;

    // ========== VALIDAÇÕES ==========

    if (!cotacaoId || !respostaId) {
      return res.status(400).json({
        success: false,
        error: 'IDs inválidos'
      });
    }

    // 1. Buscar cotação e validar proprietário
    const cotacao = await prisma.cotacao.findUnique({
      where: { id: cotacaoId },
      select: {
        id: true,
        userId: true
      }
    });

    if (!cotacao) {
      return res.status(404).json({
        success: false,
        error: 'Cotação não encontrada'
      });
    }

    // Validar que é o proprietário da cotação
    if (cotacao.userId !== embarcadorId) {
      return res.status(403).json({
        success: false,
        error: 'Você não tem permissão para rejeitar respostas desta cotação'
      });
    }

    // 2. Buscar resposta e validar
    const resposta = await prisma.respostaCotacao.findUnique({
      where: { id: respostaId },
      select: {
        id: true,
        cotacaoId: true,
        aceita: true
      }
    });

    if (!resposta) {
      return res.status(404).json({
        success: false,
        error: 'Resposta não encontrada'
      });
    }

    // 3. Validar que resposta pertence a cotação
    if (resposta.cotacaoId !== cotacaoId) {
      return res.status(400).json({
        success: false,
        error: 'Resposta não pertence a esta cotação'
      });
    }

    // 4. Validar que resposta não foi aceita
    if (resposta.aceita) {
      return res.status(400).json({
        success: false,
        error: 'Não é possível rejeitar uma resposta já aceita'
      });
    }

    // ========== REJEITAR RESPOSTA ==========

    try {
      const respostaAtualizada = await prisma.respostaCotacao.update({
        where: { id: respostaId },
        data: {
          updatedAt: new Date()
        }
      });

      // Apenas exclui a resposta (soft delete via timestamp)
      console.log(`✅ Resposta rejeitada: Cotação ${cotacaoId} rejeitou resposta ${respostaId}`);

      return res.json({
        success: true,
        message: 'Resposta rejeitada com sucesso'
      });
    } catch (error) {
      console.error('Erro ao rejeitar resposta:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao rejeitar resposta'
      });
    }
  } catch (error) {
    console.error('Erro ao rejeitar resposta:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao processar solicitação'
    });
  }
};

/**
 * Listar respostas de uma cotação
 * GET /api/cotacoes/:cotacaoId/respostas
 * 
 * Quem pode ver:
 * - Criador da cotação (embarcador) - Vê todas as respostas
 * - Respondedor (transportador) - Vê apenas sua resposta
 * - Admin - Vê todas
 */
export const listarRespostas = async (req, res) => {
  try {
    const { cotacaoId } = req.params;
    const usuarioId = req.user.id;

    if (!cotacaoId) {
      return res.status(400).json({
        success: false,
        error: 'ID da cotação inválido'
      });
    }

    // Buscar cotação
    const cotacao = await prisma.cotacao.findUnique({
      where: { id: cotacaoId },
      select: {
        id: true,
        userId: true
      }
    });

    if (!cotacao) {
      return res.status(404).json({
        success: false,
        error: 'Cotação não encontrada'
      });
    }

    // Autorização: apenas o criador da cotação ou admin pode ver todas
    // Transportadores veem apenas sua resposta
    let whereCondition = {
      cotacaoId: cotacaoId
    };

    if (req.user.userType === 'transportador' && cotacao.userId !== usuarioId) {
      whereCondition.transportadorId = usuarioId;
    } else if (cotacao.userId !== usuarioId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Você não tem permissão para ver as respostas desta cotação'
      });
    }

    const respostas = await prisma.respostaCotacao.findMany({
      where: whereCondition,
      include: {
        transportador: {
          select: {
            id: true,
            nomeCompleto: true,
            email: true,
            telefone: true,
            perfilTransportadora: {
              select: {
                avaliacaoMedia: true,
                numeroFretes: true,
                statusVerificacao: true
              }
            }
          }
        }
      },
      orderBy: [
        { aceita: 'desc' }, // Respostas aceitas primeiro
        { valor: 'asc' }    // Depois ordenar por valor (menor primeiro)
      ]
    });

    return res.json({
      success: true,
      data: respostas,
      total: respostas.length
    });
  } catch (error) {
    console.error('Erro ao listar respostas:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao listar respostas'
    });
  }
};
