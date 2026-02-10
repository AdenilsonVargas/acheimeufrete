import { prisma } from '../config/database.js';

/**
 * CONTROLLER: Avaliações de Transportador (por Cliente/Embarcador)
 * 
 * SEGURANÇA:
 * - Apenas embarcador (criador da cotação) pode avaliar
 * - Validação de nota (1-5)
 * - Cotação deve estar entregue/finalizada
 * - Não pode avaliar duas vezes mesma cotação
 * - Sanitização de comentários
 */

/**
 * POST /api/avaliacoes/transportador
 * Criar avaliação de transportador
 */
export async function criarAvaliacaoTransportador(req, res) {
  try {
    const { cotacaoId, nota, comentario, pontualidade, comunicacao, qualidadeServico } = req.body;
    const avaliadorId = req.user.id;

    // ===== VALIDAÇÕES =====

    // 1. Validar campos obrigatórios
    if (!cotacaoId || !nota) {
      return res.status(400).json({
        success: false,
        error: 'Cotação e nota são obrigatórias'
      });
    }

    // 2. Validar nota (1-5)
    if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
      return res.status(400).json({
        success: false,
        error: 'Nota deve ser um número inteiro entre 1 e 5'
      });
    }

    // 3. Validar critérios (opcional, dar valores default)
    const notaPontualidade = pontualidade ? Math.min(5, Math.max(1, parseInt(pontualidade))) : null;
    const notaComunicacao = comunicacao ? Math.min(5, Math.max(1, parseInt(comunicacao))) : null;
    const notaQualidade = qualidadeServico ? Math.min(5, Math.max(1, parseInt(qualidadeServico))) : null;

    // 4. Validar tamanho comentário
    const comentarioSanitizado = comentario 
      ? comentario.trim().substring(0, 1000)
      : '';

    // 5. Carregador cotação com validações
    const cotacao = await prisma.cotacao.findUnique({
      where: { id: cotacaoId },
      select: {
        id: true,
        userId: true,
        status: true,
        respostaSelecionada: {
          select: {
            transportadorId: true
          }
        }
      }
    });

    if (!cotacao) {
      return res.status(404).json({
        success: false,
        error: 'Cotação não encontrada'
      });
    }

    // 6. Verificar que é embarcador (proprietário da cotação)
    if (cotacao.userId !== avaliadorId) {
      return res.status(403).json({
        success: false,
        error: 'Apenas o criador da cotação pode avaliar'
      });
    }

    // 7. Verificar se temTransportador selecionado
    if (!cotacao.respostaSelecionada?.transportadorId) {
      return res.status(400).json({
        success: false,
        error: 'Cotação não tem transportador selecionado'
      });
    }

    const transportadorId = cotacao.respostaSelecionada.transportadorId;

    // 8. Verificar status da cotação (deve estar finalizada/entregue)
    const statusPermitidos = ['finalizada', 'entregue', 'aceita'];
    if (!statusPermitidos.includes(cotacao.status)) {
      return res.status(400).json({
        success: false,
        error: `Cotação deve estar em status finalizada, entregue ou aceita. Status atual: ${cotacao.status}`
      });
    }

    // 9. Verificar se já foi avaliado
    const avaliacaoExistente = await prisma.avaliacao.findFirst({
      where: {
        cotacaoId: cotacaoId,
        avaliadorId: avaliadorId
      }
    });

    if (avaliacaoExistente) {
      return res.status(400).json({
        success: false,
        error: 'Você já avaliou esta cotação'
      });
    }

    // ===== CRIAR AVALIAÇÃO =====
    const avaliacao = await prisma.avaliacao.create({
      data: {
        cotacaoId,
        avaliadorId,
        avaliadoId: transportadorId,
        nota,
        pontualidade: notaPontualidade,
        comunicacao: notaComunicacao,
        qualidadeServico: notaQualidade,
        comentario: comentarioSanitizado,
        tipoAvaliado: 'transportador'
      },
      include: {
        avaliador: {
          select: {
            id: true,
            nomeCompleto: true
          }
        },
        avaliado: {
          select: {
            id: true,
            nomeCompleto: true
          }
        }
      }
    });

    // ===== ATUALIZAR MÉDIAS =====
    await atualizarMediaTransportador(transportadorId);

    // LOG AUDITORIA
    console.log(`✅ Avaliação criada: ${avaliacao.avaliador.nomeCompleto} avaliou ${avaliacao.avaliado.nomeCompleto} com nota ${nota} em cotação ${cotacaoId}`);

    return res.status(201).json({
      success: true,
      data: {
        id: avaliacao.id,
        nota: avaliacao.nota,
        pontualidade: avaliacao.pontualidade,
        comunicacao: avaliacao.comunicacao,
        qualidadeServico: avaliacao.qualidadeServico,
        comentario: avaliacao.comentario,
        timestamp: avaliacao.createdAt
      }
    });
  } catch (error) {
    console.error('Erro ao criar avaliação de transportador:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao criar avaliação'
    });
  }
}

/**
 * POST /api/avaliacoes/cliente
 * Criar avaliação de cliente (por transportador)
 */
export async function criarAvaliacaoCliente(req, res) {
  try {
    const { cotacaoId, nota, comentario, pagamento, comunicacao, organizacao } = req.body;
    const avaliadorId = req.user.id;

    // ===== VALIDAÇÕES =====

    if (!cotacaoId || !nota) {
      return res.status(400).json({
        success: false,
        error: 'Cotação e nota são obrigatórias'
      });
    }

    if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
      return res.status(400).json({
        success: false,
        error: 'Nota deve ser um número inteiro entre 1 e 5'
      });
    }

    const notaPagamento = pagamento ? Math.min(5, Math.max(1, parseInt(pagamento))) : null;
    const notaComunicacao = comunicacao ? Math.min(5, Math.max(1, parseInt(comunicacao))) : null;
    const notaOrganizacao = organizacao ? Math.min(5, Math.max(1, parseInt(organizacao))) : null;

    const comentarioSanitizado = comentario 
      ? comentario.trim().substring(0, 1000)
      : '';

    // 2. Carregar cotação
    const cotacao = await prisma.cotacao.findUnique({
      where: { id: cotacaoId },
      select: {
        id: true,
        userId: true,
        status: true,
        respostaSelecionada: {
          select: {
            transportadorId: true
          }
        }
      }
    });

    if (!cotacao) {
      return res.status(404).json({
        success: false,
        error: 'Cotação não encontrada'
      });
    }

    // 3. Verificar que é transportador selecionado
    if (cotacao.respostaSelecionada?.transportadorId !== avaliadorId) {
      return res.status(403).json({
        success: false,
        error: 'Apenas o transportador selecionado pode avaliar o cliente'
      });
    }

    const clienteId = cotacao.userId;

    // 4. Verificar status
    const statusPermitidos = ['finalizada', 'entregue', 'aceita'];
    if (!statusPermitidos.includes(cotacao.status)) {
      return res.status(400).json({
        success: false,
        error: `Cotação deve estar finalizada. Status atual: ${cotacao.status}`
      });
    }

    // 5. Verificar duplicação
    const avaliacaoExistente = await prisma.avaliacaoCliente.findFirst({
      where: {
        cotacaoId: cotacaoId,
        avaliadorId: avaliadorId
      }
    });

    if (avaliacaoExistente) {
      return res.status(400).json({
        success: false,
        error: 'Você já avaliou este cliente nesta cotação'
      });
    }

    // ===== CRIAR AVALIAÇÃO =====
    const avaliacao = await prisma.avaliacaoCliente.create({
      data: {
        cotacaoId,
        avaliadorId,
        avaliadoId: clienteId,
        nota,
        pagamento: notaPagamento,
        comunicacao: notaComunicacao,
        organizacao: notaOrganizacao,
        comentario: comentarioSanitizado,
        tipoAvaliador: 'transportador'
      },
      include: {
        avaliador: {
          select: {
            id: true,
            nomeCompleto: true
          }
        },
        avaliado: {
          select: {
            id: true,
            nomeCompleto: true
          }
        }
      }
    });

    // ===== ATUALIZAR MÉDIAS =====
    await atualizarMediaCliente(clienteId);

    console.log(`✅ Avaliação de cliente criada: ${avaliacao.avaliador.nomeCompleto} avaliou ${avaliacao.avaliado.nomeCompleto}`);

    return res.status(201).json({
      success: true,
      data: {
        id: avaliacao.id,
        nota: avaliacao.nota,
        pagamento: avaliacao.pagamento,
        comunicacao: avaliacao.comunicacao,
        organizacao: avaliacao.organizacao,
        comentario: avaliacao.comentario,
        timestamp: avaliacao.createdAt
      }
    });
  } catch (error) {
    console.error('Erro ao criar avaliação de cliente:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao criar avaliação'
    });
  }
}

/**
 * GET /api/avaliacoes/recebidas
 * Listar avaliações recebidas pelo usuário
 */
export async function listarAvaliacoesRecebidas(req, res) {
  try {
    const usuarioId = req.user.id;
    const { limit = '50', offset = '0', tipo = 'transportador' } = req.query;

    let avaliacoes;

    if (tipo === 'cliente') {
      // Avaliações de cliente (recebidas por clientes)
      avaliacoes = await prisma.avaliacaoCliente.findMany({
        where: { avaliadoId: usuarioId },
        include: {
          avaliador: {
            select: {
              id: true,
              nomeCompleto: true,
              userType: true
            }
          },
          cotacao: {
            select: {
              id: true,
              titulo: true,
              status: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: parseInt(offset),
        take: Math.min(parseInt(limit), 100)
      });
    } else {
      // Avaliações de transportador (recebidas por transportadores)
      avaliacoes = await prisma.avaliacao.findMany({
        where: { avaliadoId: usuarioId },
        include: {
          avaliador: {
            select: {
              id: true,
              nomeCompleto: true,
              userType: true
            }
          },
          cotacao: {
            select: {
              id: true,
              titulo: true,
              status: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: parseInt(offset),
        take: Math.min(parseInt(limit), 100)
      });
    }

    // Mapear resultado
    const resultado = avaliacoes.map(av => ({
      id: av.id,
      cotacaoId: av.cotacao?.id,
      cotacaoTitulo: av.cotacao?.titulo,
      avaliadorNome: av.avaliador.nomeCompleto,
      nota: av.nota,
      pontualidade: av.pontualidade || av.pagamento,
      comunicacao: av.comunicacao,
      qualidade: av.qualidadeServico || av.organizacao,
      comentario: av.comentario,
      data: av.createdAt
    }));

    return res.json({
      success: true,
      data: resultado,
      total: resultado.length
    });
  } catch (error) {
    console.error('Erro ao listar avaliações:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao listar avaliações'
    });
  }
}

/**
 * GET /api/avaliacoes/:cotacaoId
 * Verificar se usuário já avaliou esta cotação
 */
export async function verificarAvaliacaoPendente(req, res) {
  try {
    const { cotacaoId } = req.params;
    const usuarioId = req.user.id;

    // Carregar cotação
    const cotacao = await prisma.cotacao.findUnique({
      where: { id: cotacaoId },
      select: {
        id: true,
        userId: true,
        status: true,
        respostaSelecionada: {
          select: {
            transportadorId: true
          }
        }
      }
    });

    if (!cotacao) {
      return res.status(404).json({
        success: false,
        error: 'Cotação não encontrada'
      });
    }

    const statusPermitidos = ['finalizada', 'entregue', 'aceita'];
    const podeAvaliar = statusPermitidos.includes(cotacao.status);

    // Verificar se é embarcador ou transportador e se já avaliou
    let avaliacaoPendente = false;
    let jaAvaliou = false;

    if (cotacao.userId === usuarioId) {
      // É embarcador
      if (podeAvaliar && cotacao.respostaSelecionada?.transportadorId) {
        avaliacaoPendente = true;
        const jav = await prisma.avaliacao.findFirst({
          where: {
            cotacaoId,
            avaliadorId: usuarioId
          }
        });
        jaAvaliou = !!jav;
      }
    } else if (cotacao.respostaSelecionada?.transportadorId === usuarioId) {
      // É transportador
      if (podeAvaliar) {
        avaliacaoPendente = true;
        const jav = await prisma.avaliacaoCliente.findFirst({
          where: {
            cotacaoId,
            avaliadorId: usuarioId
          }
        });
        jaAvaliou = !!jav;
      }
    }

    return res.json({
      success: true,
      data: {
        cotacaoId,
        avaliacaoPendente: avaliacaoPendente && !jaAvaliou,
        jaAvaliou,
        status: cotacao.status
      }
    });
  } catch (error) {
    console.error('Erro ao verificar avaliação:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao verificar avaliação'
    });
  }
}

// ========== FUNÇÕES AUXILIARES ==========

/**
 * Atualizar média de avaliação da transportadora
 */
async function atualizarMediaTransportadora(transportadorId) {
  try {
    const avaliacoes = await prisma.avaliacao.findMany({
      where: { avaliadoId: transportadorId },
      select: { nota: true, pontualidade: true, comunicacao: true, qualidadeServico: true }
    });

    if (avaliacoes.length > 0) {
      const mediaNota = avaliacoes.reduce((sum, a) => sum + a.nota, 0) / avaliacoes.length;
      const mediaPontualidade = avaliacoes
        .filter(a => a.pontualidade)
        .reduce((sum, a) => sum + a.pontualidade, 0) / Math.max(1, avaliacoes.filter(a => a.pontualidade).length);
      const mediaComunicacao = avaliacoes
        .filter(a => a.comunicacao)
        .reduce((sum, a) => sum + a.comunicacao, 0) / Math.max(1, avaliacoes.filter(a => a.comunicacao).length);

      // Tentar atualizar perfilTransportadora se existir
      const resultado = await prisma.perfilTransportadora.updateMany({
        where: { userId: transportadorId },
        data: {
          avaliacaoMedia: parseFloat(mediaNota.toFixed(2)),
          totalAvaliacoes: avaliacoes.length
        }
      });

      if (resultado.count > 0) {
        console.log(`✅ Média de transportador #${transportadorId} atualizada: ${mediaNota.toFixed(2)}`);
      }
    }
  } catch (error) {
    console.warn('Aviso ao atualizar média de transportador:', error.message);
  }
}

/**
 * Atualizar média de avaliação do cliente
 */
async function atualizarMediaCliente(clienteId) {
  try {
    const avaliacoes = await prisma.avaliacaoCliente.findMany({
      where: { avaliadoId: clienteId },
      select: { nota: true, pagamento: true, comunicacao: true, organizacao: true }
    });

    if (avaliacoes.length > 0) {
      const mediaNota = avaliacoes.reduce((sum, a) => sum + a.nota, 0) / avaliacoes.length;

      // Tentar atualizar perfilCliente se existir
      const resultado = await prisma.perfilCliente.updateMany({
        where: { userId: clienteId },
        data: {
          avaliacaoMedia: parseFloat(mediaNota.toFixed(2))
        }
      });

      if (resultado.count > 0) {
        console.log(`✅ Média de cliente #${clienteId} atualizada: ${mediaNota.toFixed(2)}`);
      }
    }
  } catch (error) {
    console.warn('Aviso ao atualizar média de cliente:', error.message);
  }
}

