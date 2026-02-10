import { atualizarFinanceiro } from './financeiroController.js';
import prisma from '../utils/prismaClient.js';

// Listar cotações do usuário
export const listarCotacoes = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const where = { userId: req.userId };
    if (status) where.status = status;

    const cotacoes = await prisma.cotacao.findMany({
      where,
      include: {
        respostas: {
          include: {
            transportador: {
              select: {
                id: true,
                razaoSocial: true,
                nomeResponsavel: true,
                telefone: true,
                tipoTransportador: true,
                ehAutonomoCiot: true,
                perfilTransportadora: true,
              },
            },
          },
        },
        respostaSelecionada: true,
        pagamentos: true,
        avaliacoes: true,
        avaliacoesCliente: true,
        chats: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: parseInt(skip),
      take: parseInt(limit),
    });

    const total = await prisma.cotacao.count({ where });

    return res.json({
      cotacoes,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Erro ao listar cotações:', error);
    return res.status(500).json({ message: 'Erro ao listar cotações' });
  }
};

// Obter cotação por ID
export const obterCotacao = async (req, res) => {
  try {
    const { id } = req.params;

    const cotacao = await prisma.cotacao.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nomeCompleto: true,
            telefone: true,
          },
        },
        respostas: {
          include: {
            transportador: {
              select: {
                id: true,
                razaoSocial: true,
                nomeResponsavel: true,
                telefone: true,
                perfilTransportadora: true,
                tipoTransportador: true,
                ehAutonomoCiot: true,
              },
            },
          },
          orderBy: { valor: 'asc' },
        },
        respostaSelecionada: true,
        pagamentos: true,
        avaliacoes: true,
        avaliacoesCliente: true,
        chats: true,
      },
    });

    if (!cotacao) {
      return res.status(404).json({ message: 'Cotação não encontrada' });
    }

    console.log('DEBUG - Cotacao do DB:', {
      numero: cotacao.numero,
      titulo: cotacao.titulo,
      remetenteNome: cotacao.remetenteNome,
      destinatarioNome: cotacao.destinatarioNome
    });

    return res.json({ cotacao });
  } catch (error) {
    console.error('Erro ao obter cotação:', error);
    return res.status(500).json({ message: 'Erro ao obter cotação' });
  }
};

// Criar cotação
export const criarCotacao = async (req, res) => {
  try {
    const {
      // Títulos e descrição
      titulo,
      descricao,
      // Produtos
      produtoId,
      produtoNome,
      produtoNCM,
      produtoPeso,
      produtoUnidade,
      produtosLista = [],
      // Endereço de Coleta
      enderecoColetaId,
      enderecoColetaNome,
      enderecoColetaLogradouro,
      enderecoColetaBairro,
      enderecoColetaNumero,
      enderecoColetaComplemento,
      enderecoColetaCidade,
      enderecoColetaEstado,
      enderecoColetaCep,
      dataHoraColeta,
      // Destinatário
      destinatarioId,
      destinatarioNome,
      destinatarioTipoPessoa,
      destinatarioCPF,
      destinatarioCNPJ,
      destinatarioCodigoCadastro,
      destinatarioObservacoes,
      destinatarioCep,
      destinatarioCidade,
      destinatarioEstado,
      destinatarioBairro,
      // Carga
      pesoTotal,
      quantidadeVolumes,
      volumes = [],
      valorNotaFiscal,
      // Frete e Serviços
      tipoFrete,
      servicosAdicionais = {},
      tempoCotacaoMinutos = 120,
      aceitaMotoCarAte100km = false,
      aceitaTransportadorSemCNPJ = false,
      observacoes = '',
      status = 'aberta'
    } = req.body;

    // Validações básicas
    if (!destinatarioId || !enderecoColetaId || !produtosLista || produtosLista.length === 0) {
      return res.status(400).json({ message: 'Dados obrigatórios faltando: produto, destinatário ou endereço de coleta' });
    }

    const cliente = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        cpfOuCnpj: true,
        nomeCompleto: true,
      }
    });

    if (!cliente) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const tipoPessoaRemetente = cliente.cpfOuCnpj && cliente.cpfOuCnpj.length > 11 ? 'cnpj' : 'cpf';

    // Função para converter para MAIÚSCULA (NF)
    const toUpper = (str) => str?.toUpperCase() || '';

    // Calcular data de expiração da cotação
    const agora = new Date();
    const tempoMinutos = Math.max(15, Math.min(parseInt(tempoCotacaoMinutos) || 120, 1440)); // 15 min a 24h
    const dataHoraFim = new Date(agora.getTime() + tempoMinutos * 60000);

    const cotacao = await prisma.cotacao.create({
      data: {
        userId: req.userId,
        // Título e Descrição
        titulo: titulo || `COTAÇÃO ${toUpper(destinatarioCidade)} - ${new Date().toLocaleDateString('pt-BR')}`,
        descricao: descricao || observacoes || `Cotação de frete para ${toUpper(destinatarioNome || 'cliente')}`,
        // Expiração
        dataHoraFim: dataHoraFim,
        // Coleta (MAIÚSCULA para NF)
        enderecoColetaId: enderecoColetaId || null,
        enderecoColetaNome: toUpper(enderecoColetaNome) || 'NÃO INFORMADO',
        cepColeta: enderecoColetaCep?.replace(/\D/g, '') || '00000000',
        enderecoColeta: toUpper(enderecoColetaLogradouro) || 'NÃO INFORMADO',
        bairroColeta: toUpper(enderecoColetaBairro) || 'NÃO INFORMADO',
        cidadeColeta: toUpper(enderecoColetaCidade) || 'NÃO INFORMADO',
        estadoColeta: toUpper(enderecoColetaEstado) || 'XX',
        complementoColeta: enderecoColetaComplemento ? toUpper(enderecoColetaComplemento) : null,
        dataColeta: dataHoraColeta ? new Date(dataHoraColeta) : new Date(),
        // Entrega (MAIÚSCULA para NF)
        cepEntrega: destinatarioCep?.replace(/\D/g, '') || '00000000',
        enderecoEntrega: destinatarioCidade ? toUpper(destinatarioCidade) : 'NÃO INFORMADO',
        bairroEntrega: destinatarioBairro ? toUpper(destinatarioBairro) : null,
        cidadeEntrega: toUpper(destinatarioCidade) || 'NÃO INFORMADO',
        estadoEntrega: toUpper(destinatarioEstado) || 'XX',
        complementoEntrega: null,
        // Especificações
        peso: pesoTotal ? parseFloat(pesoTotal) : null,
        altura: null,
        largura: null,
        profundidade: null,
        // Valores
        valorEstimado: null,
        valorMinimo: null,
        valorMaximo: null,
        // Status
        status: status,
        // Remetente (MAIÚSCULA para NF)
        tipoPessoaRemetente,
        remetenteNome: toUpper(cliente.nomeCompleto),
        remetenteTipoPessoa: tipoPessoaRemetente,
        remetenteCPF: tipoPessoaRemetente === 'cpf' ? cliente.cpfOuCnpj : null,
        remetenteCNPJ: tipoPessoaRemetente === 'cnpj' ? cliente.cpfOuCnpj : null,
        // Destinatário (MAIÚSCULA para NF)
        destinatarioId: destinatarioId || null,
        destinatarioNome: toUpper(destinatarioNome),
        destinatarioTipoPessoa: destinatarioTipoPessoa || null,
        destinatarioCPF: destinatarioCPF || null,
        destinatarioCNPJ: destinatarioCNPJ || null,
        destinatarioCodigoCadastro: destinatarioCodigoCadastro || null,
        destinatarioObservacoes: destinatarioObservacoes || null,
        destinatarioCep: destinatarioCep?.replace(/\D/g, '') || null,
        destinatarioEndereco: null,
        destinatarioCidade: toUpper(destinatarioCidade),
        destinatarioEstado: toUpper(destinatarioEstado)
      },
    });

    return res.status(201).json({
      message: 'Cotação criada com sucesso',
      id: cotacao.id,
      cotacao,
    });
  } catch (error) {
    console.error('Erro ao criar cotação:', error);
    return res.status(500).json({ message: 'Erro ao criar cotação', error: error.message });
  }
};

// Atualizar cotação
export const atualizarCotacao = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descricao, status, ...rest } = req.body;

    const cotacao = await prisma.cotacao.findUnique({ where: { id } });

    if (!cotacao || cotacao.userId !== req.userId) {
      return res.status(403).json({ message: 'Não autorizado' });
    }

    const cotacaoAtualizada = await prisma.cotacao.update({
      where: { id },
      data: {
        titulo: titulo || cotacao.titulo,
        descricao: descricao || cotacao.descricao,
        status: status || cotacao.status,
        ...rest,
      },
      include: { respostas: true },
    });

    return res.json({
      message: 'Cotação atualizada com sucesso',
      cotacao: cotacaoAtualizada,
    });
  } catch (error) {
    console.error('Erro ao atualizar cotação:', error);
    return res.status(500).json({ message: 'Erro ao atualizar cotação' });
  }
};

// Cancelar cotação
export const cancelarCotacao = async (req, res) => {
  try {
    const { id } = req.params;

    const cotacao = await prisma.cotacao.findUnique({ where: { id } });

    if (!cotacao || cotacao.userId !== req.userId) {
      return res.status(403).json({ message: 'Não autorizado' });
    }

    const cotacaoAtualizada = await prisma.cotacao.update({
      where: { id },
      data: { status: 'cancelada' },
    });

    return res.json({
      message: 'Cotação cancelada com sucesso',
      cotacao: cotacaoAtualizada,
    });
  } catch (error) {
    console.error('Erro ao cancelar cotação:', error);
    return res.status(500).json({ message: 'Erro ao cancelar cotação' });
  }
};

// Listar cotações disponíveis (para transportadores)
export const listarCotacoesDisponiveis = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const agora = new Date();

    const cotacoes = await prisma.cotacao.findMany({
      where: {
        AND: [
          {
            status: {
              in: ['aberta', 'em_andamento', 'visualizada']
            }
          },
          { userId: { not: req.userId } },
          {
            // Filtrar apenas cotações com dataHoraFim válida e não expirada
            dataHoraFim: {
              gt: agora  // dataHoraFim > agora
            }
          }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            nomeCompleto: true,
            razaoSocial: true,
            telefone: true,
            perfil: {
              select: {
                tipoPessoa: true,
                ehPJ: true,
              }
            },
          },
        },
        respostas: {
          where: { transportadorId: req.userId },
          select: { id: true },
        },
        pagamentos: true,
        avaliacoes: true,
        avaliacoesCliente: true,
        chats: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: parseInt(skip),
      take: parseInt(limit),
    });

    const total = await prisma.cotacao.count({
      where: {
        AND: [
          {
            status: {
              in: ['aberta', 'em_andamento', 'visualizada']
            }
          },
          { userId: { not: req.userId } },
          {
            dataHoraFim: {
              gt: agora
            }
          }
        ]
      },
    });

    return res.json({
      cotacoes,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Erro ao listar cotações disponíveis:', error);
    return res.status(500).json({ message: 'Erro ao listar cotações' });
  }
};

// Aceitar uma resposta de cotação (Cliente)
export const aceitarCotacao = async (req, res) => {
  try {
    const { id } = req.params;
    const { respostaId } = req.body;

    const cotacao = await prisma.cotacao.findUnique({
      where: { id },
      include: {
        respostas: {
          where: { id: respostaId },
          include: {
            transportador: {
              select: {
                id: true,
                nomeCompleto: true,
                razaoSocial: true,
                userType: true,
                tipoTransportador: true,
                ehAutonomoCiot: true,
                perfilTransportadora: {
                  select: {
                    tipoTransportador: true,
                    ehAutonomoCiot: true,
                    emiteCiot: true,
                  }
                }
              }
            }
          },
        },
      },
    });

    if (!cotacao || cotacao.userId !== req.userId) {
      return res.status(403).json({ message: 'Não autorizado' });
    }

    const resposta = cotacao.respostas[0];
    if (!resposta) {
      return res.status(404).json({ message: 'Resposta não encontrada' });
    }

    // Dados do cliente (embarcador)
    const cliente = await prisma.user.findUnique({
      where: { id: cotacao.userId },
      select: {
        autorizadoBoleto: true,
        cpfOuCnpj: true,
        razaoSocial: true,
      }
    });

    const clienteAutorizadoBoleto = !!cliente?.autorizadoBoleto;
    const transportadorEhCiot = Boolean(
      resposta.transportador?.perfilTransportadora?.ehAutonomoCiot ||
      resposta.transportador?.perfilTransportadora?.emiteCiot ||
      resposta.transportador?.ehAutonomoCiot
    );

    const requerPagamentoObrigatorio = transportadorEhCiot || !clienteAutorizadoBoleto;

    // Método de pagamento preferencial
    const metodoPreferencial = clienteAutorizadoBoleto ? 'boleto' : 'infinitepay';

    // Autorização para coleta/chat
    let autorizadoColeta = true;
    let motivoBloqueioColeta = null;
    let statusPagamento = 'pendente';

    // Transportador CIOT exige pagamento antecipado
    if (transportadorEhCiot) {
      autorizadoColeta = false;
      motivoBloqueioColeta = 'Pagamento antecipado obrigatório para transportador CIOT.';
    }

    // Cliente sem boleto precisa pagar antes
    if (!clienteAutorizadoBoleto) {
      autorizadoColeta = false;
      motivoBloqueioColeta = 'Pagamento pendente via InfinitePay para liberar coleta.';
    }

    // Se tem boleto e não é CIOT, libera coleta imediatamente
    if (clienteAutorizadoBoleto && !transportadorEhCiot) {
      autorizadoColeta = true;
      motivoBloqueioColeta = null;
    }

    const metodosPagamento = JSON.stringify({
      boleto: clienteAutorizadoBoleto,
      infinitepay: !clienteAutorizadoBoleto || transportadorEhCiot,
    });

    // Tipo pessoa remetente
    const tipoPessoaRemetente = cliente?.cpfOuCnpj && cliente?.cpfOuCnpj.length > 11 ? 'cnpj' : 'cpf';

    await prisma.respostaCotacao.updateMany({
      where: { cotacaoId: id },
      data: { aceita: false },
    });

    await prisma.respostaCotacao.update({
      where: { id: respostaId },
      data: { aceita: true },
    });

    const cotacaoAtualizada = await prisma.cotacao.update({
      where: { id },
      data: {
        status: autorizadoColeta ? 'aguardando_coleta' : 'aguardando_pagamento',
        respostaSelecionadaId: respostaId,
        valorFinalTransportadora: resposta.valor,
        statusPagamento,
        metodosPagamento,
        requerPagamentoObrigatorio,
        autorizadoColeta,
        motivoBloqueioColeta,
        tipoPessoaRemetente,
      },
      include: { respostaSelecionada: true },
    });

    await prisma.pagamento.create({
      data: {
        userId: cotacao.userId,
        cotacaoId: id,
        valor: resposta.valor,
        metodo: metodoPreferencial,
        status: 'pendente',
        descricao: `Pagamento da cotação ${cotacao.numero}`,
        referencia: id,
      },
    });

    return res.json({ message: 'Cotação aceita com sucesso', cotacao: cotacaoAtualizada });
  } catch (error) {
    console.error('Erro ao aceitar cotação:', error);
    return res.status(500).json({ message: 'Erro ao aceitar cotação' });
  }
};

// Confirmar coleta
export const confirmarColeta = async (req, res) => {
  try {
    const { id } = req.params;
    const { codigoConfirmacao } = req.body;

    const cotacao = await prisma.cotacao.findUnique({
      where: { id },
      include: { respostaSelecionada: true },
    });

    if (!cotacao) {
      return res.status(404).json({ message: 'Cotação não encontrada' });
    }

    const transportadorId = cotacao.respostaSelecionada?.transportadorId;
    const autorizado = cotacao.userId === req.userId || transportadorId === req.userId;

    if (!autorizado) {
      return res.status(403).json({ message: 'Não autorizado' });
    }

    if (!['aguardando_coleta', 'aguardando_aprovacao_cte'].includes(cotacao.status)) {
      return res.status(400).json({ message: 'Cotação não está pronta para coleta' });
    }

    if (!cotacao.autorizadoColeta) {
      return res.status(403).json({ message: cotacao.motivoBloqueioColeta || 'Coleta bloqueada até confirmação de pagamento/autorização.' });
    }

    if (cotacao.codigoConfirmacaoColeta && cotacao.codigoConfirmacaoColeta !== codigoConfirmacao) {
      return res.status(400).json({ message: 'Código de confirmação inválido' });
    }

    const cotacaoAtualizada = await prisma.cotacao.update({
      where: { id },
      data: {
        status: 'em_transito',
        dataColetaRealizada: new Date(),
        codigoConfirmacaoColeta: codigoConfirmacao || cotacao.codigoConfirmacaoColeta,
      },
    });

    return res.json({ message: 'Coleta confirmada', cotacao: cotacaoAtualizada });
  } catch (error) {
    console.error('Erro ao confirmar coleta:', error);
    return res.status(500).json({ message: 'Erro ao confirmar coleta' });
  }
};

// Registrar CT-e/CIOT/MDF-e
export const registrarDocumento = async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo, codigo, url, valorFinal } = req.body;

    const cotacao = await prisma.cotacao.findUnique({
      where: { id },
      include: { respostaSelecionada: true },
    });

    if (!cotacao) {
      return res.status(404).json({ message: 'Cotação não encontrada' });
    }

    if (cotacao.respostaSelecionada?.transportadorId !== req.userId) {
      return res.status(403).json({ message: 'Apenas a transportadora selecionada pode registrar documentos' });
    }

    const data = {};
    if (tipo === 'cte') {
      data.codigoCte = codigo;
      data.documentoCte = url;
      data.cteRegistrado = true;
    } else if (tipo === 'ciot') {
      data.codigoCiot = codigo;
      data.documentoCiot = url;
      data.ciotRegistrado = true;
    } else if (tipo === 'mdfe') {
      data.codigoMdfe = codigo;
      data.documentoMdfe = url;
      data.mdfeRegistrado = true;
    }

    if (valorFinal) {
      data.valorFinalTransportadora = parseFloat(valorFinal);
      data.status = 'aguardando_aprovacao_cte';
    }

    const cotacaoAtualizada = await prisma.cotacao.update({
      where: { id },
      data,
    });

    return res.json({ message: 'Documento registrado', cotacao: cotacaoAtualizada });
  } catch (error) {
    console.error('Erro ao registrar documento:', error);
    return res.status(500).json({ message: 'Erro ao registrar documento' });
  }
};

// Registrar rastreamento
export const registrarRastreamento = async (req, res) => {
  try {
    const { id } = req.params;
    const { urlRastreamento, codigoRastreio } = req.body;

    const cotacao = await prisma.cotacao.findUnique({
      where: { id },
      include: { respostaSelecionada: true },
    });

    if (!cotacao) {
      return res.status(404).json({ message: 'Cotação não encontrada' });
    }

    if (cotacao.respostaSelecionada?.transportadorId !== req.userId) {
      return res.status(403).json({ message: 'Apenas a transportadora selecionada pode registrar rastreamento' });
    }

    const cotacaoAtualizada = await prisma.cotacao.update({
      where: { id },
      data: {
        urlRastreamento,
        codigoRastreio,
      },
    });

    return res.json({ message: 'Rastreamento registrado', cotacao: cotacaoAtualizada });
  } catch (error) {
    console.error('Erro ao registrar rastreamento:', error);
    return res.status(500).json({ message: 'Erro ao registrar rastreamento' });
  }
};

// Finalizar entrega
export const finalizarEntrega = async (req, res) => {
  try {
    const { id } = req.params;
    const { documentoCanhoto } = req.body;

    const cotacao = await prisma.cotacao.findUnique({
      where: { id },
      include: {
        respostaSelecionada: true,
      },
    });

    if (!cotacao) {
      return res.status(404).json({ message: 'Cotação não encontrada' });
    }

    if (cotacao.respostaSelecionada?.transportadorId !== req.userId) {
      return res.status(403).json({ message: 'Apenas a transportadora selecionada pode finalizar a entrega' });
    }

    if (!['em_transito', 'aguardando_aprovacao_cte'].includes(cotacao.status)) {
      return res.status(400).json({ message: 'Cotação não está em trânsito para ser finalizada' });
    }

    const cotacaoAtualizada = await prisma.cotacao.update({
      where: { id },
      data: {
        status: 'finalizada',
        documentoCanhoto,
        dataEntregaRealizada: new Date(),
      },
    });

    const transportadorId = cotacao.respostaSelecionada?.transportadorId;
    const valorBase = cotacao.valorFinalTransportadora || cotacao.valorEstimado || cotacao.respostaSelecionada?.valor || 0;

    if (transportadorId) {
      await atualizarFinanceiro(id, transportadorId, valorBase);
    }

    return res.json({ message: 'Entrega finalizada', cotacao: cotacaoAtualizada });
  } catch (error) {
    console.error('Erro ao finalizar entrega:', error);
    return res.status(500).json({ message: 'Erro ao finalizar entrega' });
  }
};

// Informar atraso
export const informarAtraso = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivoAtraso, novaDataEntrega } = req.body;

    const cotacao = await prisma.cotacao.findUnique({
      where: { id },
      include: { respostaSelecionada: true },
    });

    if (!cotacao) {
      return res.status(404).json({ message: 'Cotação não encontrada' });
    }

    if (cotacao.respostaSelecionada?.transportadorId !== req.userId) {
      return res.status(403).json({ message: 'Apenas a transportadora selecionada pode informar atraso' });
    }

    const cotacaoAtualizada = await prisma.cotacao.update({
      where: { id },
      data: {
        motivoAtraso,
        dataEntrega: novaDataEntrega ? new Date(novaDataEntrega) : cotacao.dataEntrega,
        atrasoInformado: true,
      },
    });

    return res.json({ message: 'Atraso informado', cotacao: cotacaoAtualizada });
  } catch (error) {
    console.error('Erro ao informar atraso:', error);
    return res.status(500).json({ message: 'Erro ao informar atraso' });
  }
};

