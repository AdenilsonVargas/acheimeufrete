import { prisma } from '../config/database.js';

/**
 * Resposta a Cotação - Controller com SEGURANÇA CRÍTICA
 * 
 * VALIDAÇÕES IMPLEMENTADAS:
 * - Tipo de usuário (apenas transportadores podem responder)
 * - Cotação expirada ou não aberta
 * - Proprietário não pode responder sua própria cotação
 * - Sem duplicate responses
 * - Valores válidos e dentro de ranges
 * - Autorização em cada operação
 */

/**
 * Transportador responde a uma cotação aberta
 * POST /api/respostas
 * Body: { cotacaoId, valor, dataEntrega, descricao }
 * 
 * SEGURANÇA:
 * - Validação rigorosa de todos os inputs
 * - Verificar se cotação existe e está aberta
 * - Verificar se transportador não é proprietário
 * - Verificar duplicate response
 * - Validar valor (positivo, dentro de limites)
 * - Validar data de entrega (no futuro)
 */
export const responderCotacao = async (req, res) => {
  try {
    const { cotacaoId, valor, dataEntrega, descricao } = req.body;
    const transportadorId = req.userId;

    // ========== VALIDAÇÕES BÁSICAS ==========

    // 1. Validar tipo de usuário
    const transportador = await prisma.user.findUnique({
      where: { id: transportadorId },
      select: {
        id: true,
        userType: true,
        nomeCompleto: true,
        razaoSocial: true,
        telefone: true,
        perfilTransportadora: {
          select: {
            tipoTransportador: true,
            ehAutonomoCiot: true,
            emiteCiot: true,
            avaliacaoMedia: true,
            totalAvaliacoes: true,
            statusVerificacao: true
          }
        }
      }
    });

    if (!transportador) {
      return res.status(404).json({
        success: false,
        message: 'Transportador não encontrado'
      });
    }

    if (transportador.userType !== 'transportador') {
      return res.status(403).json({
        success: false,
        message: 'Apenas transportadores podem responder cotações'
      });
    }

    // 2. Validar entrada
    if (!cotacaoId || !valor || !dataEntrega) {
      return res.status(400).json({
        success: false,
        message: 'Campo obrigatório faltando: cotacaoId, valor, dataEntrega'
      });
    }

    // 3. Verificar se cotação existe
    const cotacao = await prisma.cotacao.findUnique({
      where: { id: cotacaoId },
      select: {
        id: true,
        userId: true,
        status: true,
        dataHoraFim: true,
        titulo: true
      }
    });

    if (!cotacao) {
      return res.status(404).json({
        success: false,
        message: 'Cotação não encontrada'
      });
    }

    // 4. Validar status da cotação
    if (!['aberta', 'em_andamento', 'visualizada'].includes(cotacao.status)) {
      return res.status(400).json({
        success: false,
        message: `Cotação não está aberta para respostas (status: ${cotacao.status})`
      });
    }

    // 5. Validar expiração
    if (cotacao.dataHoraFim && new Date() > new Date(cotacao.dataHoraFim)) {
      return res.status(400).json({
        success: false,
        message: 'Prazo da cotação expirou'
      });
    }

    // 6. Validar que não é o proprietário
    if (cotacao.userId === transportadorId) {
      return res.status(403).json({
        success: false,
        message: 'Você não pode responder sua própria cotação'
      });
    }

    // 7. Validar se já respondeu
    const jaRespondeu = await prisma.respostaCotacao.findFirst({
      where: {
        cotacaoId: cotacao.id,
        transportadorId: transportadorId
      },
      select: { id: true }
    });

    if (jaRespondeu) {
      return res.status(400).json({
        success: false,
        message: 'Você já respondeu esta cotação'
      });
    }

    // ========== VALIDAÇÃO DE DADOS ==========

    // 8. Validar valor
    const valorParsed = parseFloat(String(valor).replace(',', '.'));

    if (isNaN(valorParsed)) {
      return res.status(400).json({
        success: false,
        message: 'Valor deve ser um número válido'
      });
    }

    if (valorParsed <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valor deve ser maior que zero'
      });
    }

    if (valorParsed > 1000000) {
      return res.status(400).json({
        success: false,
        message: 'Valor proposto excede o limite máximo (R$ 1.000.000)'
      });
    }

    // 9. Validar dataEntrega
    const dataEntregaParsed = new Date(dataEntrega);

    if (isNaN(dataEntregaParsed.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Data de entrega inválida'
      });
    }

    if (dataEntregaParsed <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Data de entrega deve ser no futuro'
      });
    }

    const dataMax = new Date();
    dataMax.setDate(dataMax.getDate() + 90);
    if (dataEntregaParsed > dataMax) {
      return res.status(400).json({
        success: false,
        message: 'Data de entrega não pode ser mais de 90 dias no futuro'
      });
    }

    // 10. Validar descrição
    let descricaoSanitizada = null;
    if (descricao && typeof descricao === 'string' && descricao.trim().length > 0) {
      descricaoSanitizada = descricao.trim().substring(0, 1000);
    }

    // ========== CRIAR RESPOSTA ==========

    try {
      const tipoTransportador = transportador.perfilTransportadora?.tipoTransportador || null;
      const ehAutonomoCiot = Boolean(
        transportador.perfilTransportadora?.ehAutonomoCiot ||
        transportador.perfilTransportadora?.emiteCiot
      );
      const avaliacaoMedia = transportador.perfilTransportadora?.avaliacaoMedia || 5;
      const totalAvaliacoes = transportador.perfilTransportadora?.totalAvaliacoes || 0;

      const resposta = await prisma.respostaCotacao.create({
        data: {
          cotacaoId: cotacao.id,
          transportadorId: transportadorId,
          valor: parseFloat(valorParsed.toFixed(2)),
          dataEntrega: dataEntregaParsed,
          descricao: descricaoSanitizada,
          tipoTransportador,
          ehAutonomoCiot,
          pontuacaoVotacao: avaliacaoMedia,
          totalAvaliacoes,
          aceita: false,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        include: {
          transportador: {
            select: {
              id: true,
              nomeCompleto: true,
              razaoSocial: true,
              telefone: true,
              perfilTransportadora: {
                select: {
                  avaliacaoMedia: true,
                  totalAvaliacoes: true,
                  statusVerificacao: true
                }
              }
            }
          }
        }
      });

      console.log(`✅ Resposta criada: ${transportador.nomeCompleto || transportador.razaoSocial} respondeu cotação ${cotacao.id} com R$ ${valorParsed}`);

      return res.status(201).json({
        success: true,
        message: 'Resposta enviada com sucesso',
        resposta
      });
    } catch (error) {
      console.error('Erro ao créar resposta:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao enviar resposta. Tente novamente.'
      });
    }
  } catch (error) {
    console.error('Erro ao responder cotação:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao processar resposta'
    });
  }
};

/**
 * Listar respostas de uma cotação
 * GET /api/respostas/cotacao/:cotacaoId
 * 
 * AUTORIZAÇÃO:
 * - Criador da cotação: Vê todas as respostas
 * - Transportador: Vê apenas sua resposta
 * - Admin: Vê todas
 */
export const listarRespostas = async (req, res) => {
  try {
    const { cotacaoId } = req.params;
    const usuarioId = req.userId;

    // Validar cotacao ID
    if (!cotacaoId) {
      return res.status(400).json({
        success: false,
        message: 'ID da cotação inválido'
      });
    }

    // Buscar cotação
    const cotacao = await prisma.cotacao.findUnique({
      where: { id: cotacaoId },
      select: {
        id: true,
        userId: true,
        titulo: true
      }
    });

    if (!cotacao) {
      return res.status(404).json({
        success: false,
        message: 'Cotação não encontrada'
      });
    }

    // AUTORIZAÇÃO: Apenas criador ou admin
    if (cotacao.userId !== usuarioId && req.userRole !== 'admin') {
      // Se for transportador, pode ver apenas sua resposta
      const respostaTransportador = await prisma.respostaCotacao.findFirst({
        where: {
          cotacaoId: cotacao.id,
          transportadorId: usuarioId
        }
      });

      if (!respostaTransportador) {
        return res.status(403).json({
          success: false,
          message: 'Você não tem permissão para ver as respostas desta cotação'
        });
      }

      // Retornar apenas a resposta do transportador
      return res.json({
        success: true,
        respostas: [respostaTransportador],
        total: 1
      });
    }

    const respostas = await prisma.respostaCotacao.findMany({
      where: { cotacaoId: cotacao.id },
      include: {
        transportador: {
          select: {
            id: true,
            nomeCompleto: true,
            razaoSocial: true,
            email: true,
            telefone: true,
            perfilTransportadora: {
              select: {
                avaliacaoMedia: true,
                totalAvaliacoes: true,
                statusVerificacao: true
              }
            }
          }
        }
      },
      orderBy: [
        { aceita: 'desc' },
        { valor: 'asc' }
      ]
    });

    return res.json({
      success: true,
      cotacao: {
        id: cotacao.id,
        titulo: cotacao.titulo
      },
      respostas,
      total: respostas.length
    });
  } catch (error) {
    console.error('Erro ao listar respostas:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao listar respostas'
    });
  }
};

/**
 * Aceitar resposta de cotação
 * PUT /api/respostas/:respostaId/aceitar
 * 
 * SEGURANÇA:
 * - Validar que usuário é o criador da cotação
 * - Validar que resposta existe
 * - Rejeitar outras respostas automaticamente
 * - Criar registro de pagamento
 */
export const aceitarResposta = async (req, res) => {
  try {
    const { respostaId } = req.params;
    const embarcadorId = req.userId;

    // Validar ID
    if (!respostaId) {
      return res.status(400).json({
        success: false,
        message: 'ID da resposta inválido'
      });
    }

    // Buscar resposta
    const resposta = await prisma.respostaCotacao.findUnique({
      where: { id: respostaId },
      include: {
        cotacao: {
          select: {
            id: true,
            userId: true,
            status: true,
            numero: true
          }
        }
      }
    });

    if (!resposta) {
      return res.status(404).json({
        success: false,
        message: 'Resposta não encontrada'
      });
    }

    // AUTORIZAÇÃO: Validar que é o criador da cotação
    if (resposta.cotacao.userId !== embarcadorId) {
      return res.status(403).json({
        success: false,
        message: 'Você não tem permissão para aceitar respostas desta cotação'
      });
    }

    // Validar status de cotação
    if (!['aberta', 'em_andamento', 'visualizada'].includes(resposta.cotacao.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cotação não está disponível para aceitar respostas'
      });
    }

    // Validar se resposta já não foi aceita
    if (resposta.aceita) {
      return res.status(400).json({
        success: false,
        message: 'Esta resposta já foi aceita'
      });
    }

    try {
      // Rejeitar todas as outras respostas
      await prisma.respostaCotacao.updateMany({
        where: {
          cotacaoId: resposta.cotacao.id,
          id: { not: respostaId }
        },
        data: {
          aceita: false,
          updatedAt: new Date()
        }
      });

      // Aceitar resposta
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
              email: true,
              telefone: true
            }
          }
        }
      });

      // Atualizar cotação
      const cotacaoAtualizada = await prisma.cotacao.update({
        where: { id: resposta.cotacao.id },
        data: {
          status: 'aguardando_pagamento',
          respostaSelecionadaId: respostaId,
          valorFinalTransportadora: resposta.valor,
          updatedAt: new Date()
        }
      });

      // Criar pagamento
      await prisma.pagamento.create({
        data: {
          userId: resposta.cotacao.userId,
          cotacaoId: resposta.cotacao.id,
          valor: resposta.valor,
          metodo: 'pix',
          status: 'pendente',
          descricao: `Pagamento da cotação #${resposta.cotacao.numero || resposta.cotacao.id}`,
          referencia: resposta.cotacao.id,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      console.log(`✅ Resposta aceita: Cotação ${resposta.cotacao.id} aceitou proposta de ${respostaAtualizada.transportador.nomeCompleto} (R$ ${resposta.valor})`);

      return res.json({
        success: true,
        message: 'Resposta aceita com sucesso',
        resposta: respostaAtualizada,
        cotacao: cotacaoAtualizada
      });
    } catch (error) {
      console.error('Erro ao aceitar resposta:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao aceitar resposta'
      });
    }
  } catch (error) {
    console.error('Erro ao aceitar resposta:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao processar solicitação'
    });
  }
};

/**
 * Listar minhas respostas (transportador)
 * GET /api/respostas/minhas-respostas
 * 
 * Paginação: ?page=1&limit=10
 */
export const listarMinhasRespostas = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = Math.max(0, (parseInt(page) - 1) * parseInt(limit));
    const take = Math.min(parseInt(limit), 100); // Máximo de 100 registros por page

    const respostas = await prisma.respostaCotacao.findMany({
      where: { transportadorId: req.userId },
      include: {
        cotacao: {
          include: {
            user: {
              select: {
                id: true,
                nomeCompleto: true,
                razaoSocial: true,
                email: true,
                telefone: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take
    });

    const total = await prisma.respostaCotacao.count({
      where: { transportadorId: req.userId }
    });

    return res.json({
      success: true,
      respostas,
      pagination: {
        total,
        page: parseInt(page),
        limit: take,
        pages: Math.ceil(total / take)
      }
    });
  } catch (error) {
    console.error('Erro ao listar respostas:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao listar respostas'
    });
  }
};
