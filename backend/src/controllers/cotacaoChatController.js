/**
 * Controller para Chat de Cotações (Real-time via Socket.io)
 * 
 * Funções específicas para chat por cotação com autenticação WebSocket
 * Integração com banco de dados para persistência
 */

import { prisma } from '../config/database.js';

/**
 * Carregar histórico de mensagens de uma cotação
 */
export async function carregarHistoricoMensagens(cotacaoId, usuarioId, limit = 50, offset = 0) {
  try {
    const cotacao = await prisma.cotacao.findUnique({
      where: { id: cotacaoId },
      select: {
        id: true,
        userId: true,
        respostaSelecionada: {
          select: { transportadorId: true }
        }
      }
    });

    if (!cotacao) {
      throw new Error('Cotação não encontrada');
    }

    const isCreator = cotacao.userId === usuarioId;
    const isSelectedTransporter = cotacao.respostaSelecionada?.transportadorId === usuarioId;

    if (!isCreator && !isSelectedTransporter) {
      throw new Error('Você não tem permissão para acessar este chat');
    }

    const chat = await prisma.chat.findFirst({
      where: { cotacaoId: cotacaoId },
      select: { id: true }
    });

    if (!chat) {
      return { success: true, data: [], total: 0 };
    }

    const mensagens = await prisma.mensagem.findMany({
      where: { chatId: chat.id },
      orderBy: { createdAt: 'asc' },
      skip: offset,
      take: Math.min(limit, 100),
      include: {
        user: {
          select: {
            id: true,
            nomeCompleto: true,
            email: true,
            userType: true
          }
        }
      }
    });

    return {
      success: true,
      data: mensagens.map(m => ({
        id: m.id,
        conteudo: m.conteudo,
        usuarioId: m.userId,
        usuarioNome: m.user.nomeCompleto,
        usuarioTipo: m.user.userType,
        timestamp: m.createdAt,
        lida: true
      })),
      total: await prisma.mensagem.count({ where: { chatId: chat.id } })
    };
  } catch (error) {
    console.error('Erro ao carregar histórico:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obter informações da cotação
 */
export async function obterInformacoesCotacao(cotacaoId) {
  try {
    const cotacao = await prisma.cotacao.findUnique({
      where: { id: cotacaoId },
      select: {
        id: true,
        titulo: true,
        cidadeColeta: true,
        cidadeEntrega: true,
        dataColeta: true,
        dataHoraFim: true,
        status: true,
        userId: true,
        user: {
          select: {
            id: true,
            nomeCompleto: true,
            email: true
          }
        },
        respostaSelecionada: {
          select: {
            id: true,
            transportadorId: true,
            transportador: {
              select: {
                id: true,
                nomeCompleto: true,
                email: true
              }
            },
            valor: true,
            dataEntrega: true
          }
        }
      }
    });

    if (!cotacao) {
      throw new Error('Cotação não encontrada');
    }

    return {
      success: true,
      data: {
        id: cotacao.id,
        titulo: cotacao.titulo,
        cidadeColeta: cotacao.cidadeColeta,
        cidadeEntrega: cotacao.cidadeEntrega,
        dataColeta: cotacao.dataColeta,
        dataHoraFim: cotacao.dataHoraFim,
        status: cotacao.status,
        embarcador: {
          id: cotacao.user.id,
          nome: cotacao.user.nomeCompleto,
          email: cotacao.user.email
        },
        respostaSelecionada: cotacao.respostaSelecionada ? {
          id: cotacao.respostaSelecionada.id,
          transportador: {
            id: cotacao.respostaSelecionada.transportador.id,
            nome: cotacao.respostaSelecionada.transportador.nomeCompleto
          },
          valor: cotacao.respostaSelecionada.valor,
          dataEntrega: cotacao.respostaSelecionada.dataEntrega
        } : null
      }
    };
  } catch (error) {
    console.error('Erro ao obter informações:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obter contadores de mensagens não lidas
 */
export async function obterContadoresNaoLidas(usuarioId) {
  try {
    const cotacoes = await prisma.cotacao.findMany({
      where: {
        OR: [
          { userId: usuarioId },
          { respostaSelecionada: { transportadorId: usuarioId } }
        ]
      },
      select: {
        id: true,
        chat: { select: { id: true } }
      }
    });

    const contadores = {};

    for (const cotacao of cotacoes) {
      const chat = cotacao.chat?.[0];
      if (!chat) continue;

      const count = await prisma.mensagem.count({
        where: {
          chatId: chat.id,
          userId: { not: usuarioId }
        }
      });

      if (count > 0) {
        contadores[cotacao.id] = count;
      }
    }

    return { success: true, data: contadores };
  } catch (error) {
    console.error('Erro ao obter contadores:', error);
    return { success: false, error: error.message };
  }
}
