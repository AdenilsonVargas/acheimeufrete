import { validarHorarioChat } from '../utils/brazilTime.js';
import prisma from '../utils/prismaClient.js';

/**
 * Lista todos os chats do usuário com busca avançada
 */
export const listarChats = async (req, res) => {
  try {
    const { usuarioId, limit = 50, busca } = req.query;
    const userId = usuarioId || req.user?.id;

    if (!userId) {
      return res.status(400).json({ message: 'ID do usuário é obrigatório' });
    }

    // Construir filtros de busca
    let whereClause = {
      participantes: {
        has: userId
      }
    };

    // Se há busca, aplicar filtros adicionais
    if (busca && busca.trim()) {
      const termoBusca = busca.trim();
      // Buscar por número da cotação, conteúdo de mensagens, ou outros campos
      whereClause.OR = [
        {
          mensagens: {
            some: {
              conteudo: {
                contains: termoBusca,
                mode: 'insensitive'
              }
            }
          }
        }
      ];
    }

    const chats = await prisma.chat.findMany({
      where: whereClause,
      orderBy: {
        updatedAt: 'desc'
      },
      take: parseInt(limit),
      include: {
        mensagens: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        },
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
      }
    });

    // Buscar produtos das cotações e informações dos participantes
    const chatsEnriquecidos = await Promise.all(chats.map(async (chat) => {
      let produtos = [];
      let embarcadorInfo = null;
      let transportadoraInfo = null;

      // Buscar produtos da cotação
      if (chat.cotacaoId) {
        produtos = await prisma.produto.findMany({
          where: {
            userId: chat.cotacao?.userId
          },
          select: {
            id: true,
            nome: true,
            ncmCode: true,
            ncmClassificacao: true
          },
          take: 10
        });
      }

      // Buscar informações dos participantes
      embarcadorInfo = await prisma.user.findUnique({
        where: { id: chat.clienteId },
        select: {
          id: true,
          nomeCompleto: true,
          razaoSocial: true,
          email: true,
          telefone: true
        }
      });

      transportadoraInfo = await prisma.user.findUnique({
        where: { id: chat.transportadoraId },
        select: {
          id: true,
          nomeCompleto: true,
          razaoSocial: true,
          email: true,
          telefone: true
        }
      });

      // Aplicar filtro de busca em dados enriquecidos
      if (busca && busca.trim()) {
        const termo = busca.trim().toLowerCase();
        const matchNumeroCotacao = chat.cotacao?.numero?.toString().includes(termo);
        const matchNomeTransportadora = transportadoraInfo?.razaoSocial?.toLowerCase().includes(termo) || 
                                        transportadoraInfo?.nomeCompleto?.toLowerCase().includes(termo);
        const matchNomeEmbarcador = embarcadorInfo?.razaoSocial?.toLowerCase().includes(termo) || 
                                     embarcadorInfo?.nomeCompleto?.toLowerCase().includes(termo);
        const matchProduto = produtos.some(p => p.nome?.toLowerCase().includes(termo));
        const matchNCM = produtos.some(p => p.ncmCode?.includes(termo));
        const matchData = chat.createdAt?.toISOString().includes(termo);
        
        // Se nenhum match, pular este chat
        if (!matchNumeroCotacao && !matchNomeTransportadora && !matchNomeEmbarcador && 
            !matchProduto && !matchNCM && !matchData) {
          return null;
        }
      }

      return {
        ...chat,
        ultimaMensagem: chat.mensagens[0]?.conteudo || null,
        ultimaMensagemData: chat.mensagens[0]?.createdAt || chat.updatedAt,
        produtos,
        embarcador: embarcadorInfo,
        transportadora: transportadoraInfo
      };
    }));

    // Filtrar nulls (chats que não passaram no filtro de busca)
    const resultado = chatsEnriquecidos.filter(c => c !== null);

    res.json(resultado);
  } catch (error) {
    console.error('Erro ao listar chats:', error);
    res.status(500).json({ message: 'Erro ao listar chats', error: error.message });
  }
};

/**
 * Obtém um chat específico com suas mensagens e dados da cotação
 */
export const obterChat = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const chat = await prisma.chat.findUnique({
      where: { id },
      include: {
        mensagens: {
          orderBy: {
            createdAt: 'asc'
          },
          include: {
            user: {
              select: {
                id: true,
                nomeCompleto: true,
                email: true,
                userType: true,
              }
            }
          }
        },
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
      }
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat não encontrado' });
    }

    // Verificar se o usuário é participante
    if (userId && !chat.participantes.includes(userId)) {
      return res.status(403).json({ message: 'Acesso negado a este chat' });
    }

    // Buscar produtos da cotação
    let produtos = [];
    if (chat.cotacaoId && chat.cotacao) {
      produtos = await prisma.produto.findMany({
        where: {
          userId: chat.cotacao.userId
        },
        select: {
          id: true,
          nome: true,
          ncmCode: true,
          ncmClassificacao: true,
          pesoKg: true
        }
      });
    }

    // Buscar informações dos participantes
    const embarcador = await prisma.user.findUnique({
      where: { id: chat.clienteId },
      select: {
        id: true,
        nomeCompleto: true,
        razaoSocial: true,
        email: true,
        telefone: true
      }
    });

    const transportadora = await prisma.user.findUnique({
      where: { id: chat.transportadoraId },
      select: {
        id: true,
        nomeCompleto: true,
        razaoSocial: true,
        email: true,
        telefone: true
      }
    });

    res.json({
      ...chat,
      produtos,
      embarcador,
      transportadora
    });
  } catch (error) {
    console.error('Erro ao obter chat:', error);
    res.status(500).json({ message: 'Erro ao obter chat', error: error.message });
  }
};

/**
 * Cria um novo chat
 */
export const criarChat = async (req, res) => {
  try {
    const { participantes, cotacaoId } = req.body;
    const userId = req.user?.id;
    const userType = req.user?.userType;

    if (!participantes || !Array.isArray(participantes) || participantes.length < 2) {
      return res.status(400).json({ message: 'Participantes inválidos (mínimo 2)' });
    }
    if (!cotacaoId) {
      return res.status(400).json({ message: 'cotacaoId é obrigatório para abrir chat' });
    }

    // Regra: apenas embarcador pode abrir chat
    if (!userType || userType !== 'embarcador') {
      return res.status(403).json({ message: 'Apenas embarcadores podem abrir chats' });
    }

    // Regra: chat só pode ser aberto entre 08:00-17:00 (horário de Brasília)
    const validacao = validarHorarioChat();
    if (!validacao.permitido) {
      return res.status(403).json({ 
        message: validacao.mensagem,
        horaAtual: validacao.hora,
        timezone: validacao.timezone,
        horarioFuncionamento: '08:00-17:00'
      });
    }

    // Validar cotação pertence ao embarcador e identificar transportadora
    const cotacao = await prisma.cotacao.findUnique({
      where: { id: cotacaoId },
      select: {
        id: true,
        userId: true,
        autorizadoColeta: true,
        statusPagamento: true,
        motivoBloqueioColeta: true,
        metodosPagamento: true,
      }
    });
    if (!cotacao || cotacao.userId !== userId) {
      return res.status(403).json({ message: 'Cotação inválida ou não pertence ao embarcador' });
    }

    // Regra: chat só é liberado se coleta estiver autorizada ou pagamento confirmado
    const pagamentoConfirmado = cotacao.statusPagamento === 'confirmado';
    if (!cotacao.autorizadoColeta && !pagamentoConfirmado) {
      return res.status(403).json({ message: cotacao.motivoBloqueioColeta || 'Pagamento não confirmado. Chat bloqueado até liberação.' });
    }

    const outroParticipanteId = participantes.find(p => p !== userId);
    const transportadora = await prisma.user.findUnique({ where: { id: outroParticipanteId } });
    if (!transportadora || transportadora.userType !== 'transportador') {
      return res.status(400).json({ message: 'É necessário um participante transportador para abrir chat' });
    }

    // Definir fechamento automático para 23:59:59 do dia atual
    const fechamento = new Date(agora);
    fechamento.setHours(23, 59, 59, 999);

    // Verificar se já existe um chat com os mesmos participantes
    const chatExistente = await prisma.chat.findFirst({
      where: {
        cotacaoId: cotacaoId,
        AND: participantes.map(p => ({
          participantes: {
            has: p
          }
        }))
      }
    });

    if (chatExistente) {
      return res.json(chatExistente);
    }

    // Criar novo chat com restrições de horário
    const novoChat = await prisma.chat.create({
      data: {
        cotacaoId,
        participantes,
        horaAbertura: agora,
        horaFechamento: fechamento,
        statusChat: 'aberto',
        clienteId: userId,
        transportadoraId: transportadora.id,
      }
    });

    res.status(201).json(novoChat);
  } catch (error) {
    console.error('Erro ao criar chat:', error);
    res.status(500).json({ message: 'Erro ao criar chat', error: error.message });
  }
};

/**
 * Envia uma mensagem no chat
 */
export const enviarMensagem = async (req, res) => {
  try {
    const { id } = req.params;
    const { conteudo, arquivoUrl, arquivoNome, arquivoTipo } = req.body;
    const userId = req.user?.id;
    const userType = req.user?.userType;

    if ((!conteudo || conteudo.trim() === '') && !arquivoUrl) {
      return res.status(400).json({ message: 'Conteúdo ou arquivo é obrigatório' });
    }

    // Verificar se o chat existe e o usuário é participante
    const chat = await prisma.chat.findUnique({
      where: { id },
      include: {
        cotacao: {
          select: {
            id: true,
            autorizadoColeta: true,
            statusPagamento: true,
            motivoBloqueioColeta: true,
          }
        }
      }
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat não encontrado' });
    }

    if (userId && !chat.participantes.includes(userId)) {
      return res.status(403).json({ message: 'Você não é participante deste chat' });
    }

    // Bloquear envio após fechamento automático (23:59) ou status diferente de "aberto"
    const agora = new Date();
    if (chat.horaFechamento && agora > new Date(chat.horaFechamento)) {
      // Atualizar status para fechado automaticamente
      await prisma.chat.update({
        where: { id },
        data: { statusChat: 'fechado_automatico' }
      });
      return res.status(403).json({ message: 'Chat fechado automaticamente após 23:59' });
    }
    if (chat.statusChat && chat.statusChat !== 'aberto') {
      return res.status(403).json({ message: 'Chat não está aberto para mensagens' });
    }

    // Bloqueio por segurança financeira
    const pagamentoConfirmado = chat.cotacao?.statusPagamento === 'confirmado';
    if (chat.cotacao && !chat.cotacao.autorizadoColeta && !pagamentoConfirmado) {
      return res.status(403).json({ message: chat.cotacao.motivoBloqueioColeta || 'Chat bloqueado até confirmação de pagamento/autorização.' });
    }

    // Criar mensagem (texto ou arquivo)
    const payload = {
      chatId: id,
      userId: userId || chat.participantes[0],
      conteudo: (conteudo || '').trim(),
      tipoMensagem: arquivoUrl ? 'arquivo' : 'texto',
      arquivoUrl: arquivoUrl || null,
      arquivoNome: arquivoUrl ? (arquivoNome || 'documento') : null,
      arquivoTipo: arquivoUrl ? (arquivoTipo || 'application/octet-stream') : null,
    };

    const mensagem = await prisma.mensagem.create({
      data: payload,
      include: {
        user: {
          select: {
            id: true,
            nomeCompleto: true,
            email: true,
            userType: true,
          }
        }
      }
    });

    // Atualizar última mensagem do chat
    const ultima = arquivoUrl ? `[arquivo] ${arquivoNome || 'documento'}` : (conteudo || '').trim();
    await prisma.chat.update({
      where: { id },
      data: {
        ultimaMensagem: ultima,
        ultimaMensagemData: new Date(),
        dataHoraUltimaMensagem: new Date()
      }
    });

    res.status(201).json(mensagem);
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({ message: 'Erro ao enviar mensagem', error: error.message });
  }
};

/**
 * Marca mensagens como lidas
 */
export const marcarComoLido = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Verificar se o chat existe
    const chat = await prisma.chat.findUnique({
      where: { id }
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat não encontrado' });
    }

    if (userId && !chat.participantes.includes(userId)) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    // Marcar todas as mensagens do chat como lidas para este usuário
    await prisma.mensagem.updateMany({
      where: {
        chatId: id,
        userId: { not: userId },
        lida: false
      },
      data: {
        lida: true
      }
    });

    res.json({ message: 'Mensagens marcadas como lidas' });
  } catch (error) {
    console.error('Erro ao marcar mensagens como lidas:', error);
    res.status(500).json({ message: 'Erro ao marcar como lido', error: error.message });
  }
};
