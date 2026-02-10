import prisma from '../utils/prismaClient.js';

/**
 * 1. Listar solicitações de autorização para boleto
 */
export const listarSolicitacoesBoleto = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, startDate, endDate } = req.query;

    const skip = (page - 1) * limit;

    const where = {
      userType: 'embarcador',
      solicitacaoBoletoStatus: status || undefined,
      ...(startDate || endDate
        ? {
            dataSolicitacaoBoleto: {
              gte: startDate ? new Date(startDate) : undefined,
              lte: endDate ? new Date(endDate) : undefined,
            },
          }
        : {}),
    };

    const solicitacoes = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        nomeCompleto: true,
        cpfOuCnpj: true,
        razaoSocial: true,
        autorizadoBoleto: true,
        solicitacaoBoletoStatus: true,
        dataSolicitacaoBoleto: true,
        justificativaRejeicaoBoleto: true,
        perfil: {
          select: {
            avaliacaoMedia: true,
            numeroTaxasAceitas: true
          }
        }
      },
      skip,
      take: parseInt(limit),
      orderBy: { dataSolicitacaoBoleto: 'desc' }
    });

    const total = await prisma.user.count({ where });

    res.json({
      success: true,
      data: solicitacoes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao listar solicitações de boleto:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar solicitações'
    });
  }
};

/**
 * 2. Aprovar autorização de boleto para cliente
 */
export const aprovarBoleto = async (req, res) => {
  try {
    const { clienteId } = req.params;
    const { justificativa } = req.body;

    if (!clienteId) {
      return res.status(400).json({
        success: false,
        error: 'ID do cliente obrigatório'
      });
    }

    const cliente = await prisma.user.findUnique({
      where: { id: clienteId },
      select: { userType: true }
    });

    if (!cliente || cliente.userType !== 'embarcador') {
      return res.status(404).json({
        success: false,
        error: 'Cliente (embarcador) não encontrado'
      });
    }

    const updated = await prisma.user.update({
      where: { id: clienteId },
      data: {
        autorizadoBoleto: true,
        solicitacaoBoletoStatus: 'aprovado',
        dataAutorizacaoBoleto: new Date(),
        justificativaRejeicaoBoleto: null
      },
      select: {
        id: true,
        email: true,
        nomeCompleto: true,
        autorizadoBoleto: true,
        solicitacaoBoletoStatus: true,
        dataAutorizacaoBoleto: true
      }
    });

    res.json({
      success: true,
      message: 'Autorização de boleto aprovada',
      data: updated
    });
  } catch (error) {
    console.error('Erro ao aprovar boleto:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao aprovar autorização'
    });
  }
};

/**
 * 3. Rejeitar autorização de boleto para cliente
 */
export const rejeitarBoleto = async (req, res) => {
  try {
    const { clienteId } = req.params;
    const { justificativa } = req.body;

    if (!clienteId) {
      return res.status(400).json({
        success: false,
        error: 'ID do cliente obrigatório'
      });
    }

    if (!justificativa || justificativa.length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Justificativa obrigatória (mínimo 10 caracteres)'
      });
    }

    const cliente = await prisma.user.findUnique({
      where: { id: clienteId },
      select: { userType: true }
    });

    if (!cliente || cliente.userType !== 'embarcador') {
      return res.status(404).json({
        success: false,
        error: 'Cliente (embarcador) não encontrado'
      });
    }

    const updated = await prisma.user.update({
      where: { id: clienteId },
      data: {
        autorizadoBoleto: false,
        solicitacaoBoletoStatus: 'rejeitado',
        justificativaRejeicaoBoleto: justificativa,
        dataAutorizacaoBoleto: null
      },
      select: {
        id: true,
        email: true,
        nomeCompleto: true,
        autorizadoBoleto: true,
        solicitacaoBoletoStatus: true,
        justificativaRejeicaoBoleto: true
      }
    });

    res.json({
      success: true,
      message: 'Autorização de boleto rejeitada',
      data: updated
    });
  } catch (error) {
    console.error('Erro ao rejeitar boleto:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao rejeitar autorização'
    });
  }
};

/**
 * 4. Visualizar status de autorização do cliente
 */
export const statusAutorizacaoCliente = async (req, res) => {
  try {
    const { clienteId } = req.params;

    if (!clienteId) {
      return res.status(400).json({
        success: false,
        error: 'ID do cliente obrigatório'
      });
    }

    const cliente = await prisma.user.findUnique({
      where: { id: clienteId },
      select: {
        id: true,
        email: true,
        nomeCompleto: true,
        autorizadoBoleto: true,
        solicitacaoBoletoStatus: true,
        dataSolicitacaoBoleto: true,
        dataAutorizacaoBoleto: true,
        justificativaRejeicaoBoleto: true
      }
    });

    if (!cliente) {
      return res.status(404).json({
        success: false,
        error: 'Cliente não encontrado'
      });
    }

    res.json({
      success: true,
      data: cliente
    });
  } catch (error) {
    console.error('Erro ao buscar status:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar status de autorização'
    });
  }
};

/**
 * ROTAS DE APROVAÇÃO DE CADASTRO E DOCUMENTOS (Fase 10)
 */

/**
 * Listar usuários pendentes de verificação
 */
export const getUsuariosPendentes = async (req, res) => {
  try {
    const { page = 1, limit = 20, userType, statusCadastro } = req.query;

    const skip = (page - 1) * limit;

    const where = {
      statusCadastro: statusCadastro || 'pendente_verificacao',
      ...(userType && { userType })
    };

    const usuarios = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        nomeCompleto: true,
        userType: true,
        statusCadastro: true,
        createdAt: true,
        documentos: {
          select: {
            id: true,
            tipo: true,
            status: true
          }
        }
      },
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.user.count({ where });

    res.json({
      success: true,
      data: usuarios,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao listar usuários pendentes:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar usuários'
    });
  }
};

/**
 * Obter detalhes do usuário e seus documentos
 */
export const getUsuarioDetalhes = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'ID do usuário obrigatório'
      });
    }

    const usuario = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        telefone: true,
        nomeCompleto: true,
        userType: true,
        statusCadastro: true,
        motivoRejeicaoCadastro: true,
        cpfOuCnpj: true,
        tipoTransportador: true,
        razaoSocial: true,
        createdAt: true,
        documentos: {
          select: {
            id: true,
            tipo: true,
            status: true,
            url: true,
            nomeArquivo: true,
            motivoRejeicao: true,
            dataUpload: true,
            dataAprovacao: true,
            dataRejeicao: true
          }
        }
      }
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    res.json({
      success: true,
      data: usuario
    });
  } catch (error) {
    console.error('Erro ao buscar detalhes do usuário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar detalhes'
    });
  }
};

/**
 * Aprovar cadastro de usuário
 */
export const aprovarCadastroUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'ID do usuário obrigatório'
      });
    }

    const usuario = await prisma.user.findUnique({
      where: { id },
      select: { id: true, statusCadastro: true }
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        statusCadastro: 'ok',
        motivoRejeicaoCadastro: null,
        dataSolicitacaoAprovacao: new Date()
      },
      select: {
        id: true,
        email: true,
        nomeCompleto: true,
        statusCadastro: true
      }
    });

    res.json({
      success: true,
      message: 'Cadastro aprovado com sucesso',
      data: updated
    });
  } catch (error) {
    console.error('Erro ao aprovar cadastro:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao aprovar cadastro'
    });
  }
};

/**
 * Rejeitar cadastro de usuário
 */
export const rejeitarCadastroUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'ID do usuário obrigatório'
      });
    }

    if (!motivo || motivo.length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Motivo obrigatório (mínimo 10 caracteres)'
      });
    }

    const usuario = await prisma.user.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        statusCadastro: 'rejeitado',
        motivoRejeicaoCadastro: motivo,
        dataSolicitacaoAprovacao: new Date()
      },
      select: {
        id: true,
        email: true,
        nomeCompleto: true,
        statusCadastro: true,
        motivoRejeicaoCadastro: true
      }
    });

    res.json({
      success: true,
      message: 'Cadastro rejeitado',
      data: updated
    });
  } catch (error) {
    console.error('Erro ao rejeitar cadastro:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao rejeitar cadastro'
    });
  }
};

/**
 * Mudar status de documento individual
 */
export const mudarStatusDocumento = async (req, res) => {
  try {
    const { documentoId } = req.params;
    const { status, motivo } = req.body;

    if (!documentoId) {
      return res.status(400).json({
        success: false,
        error: 'ID do documento obrigatório'
      });
    }

    if (!status || !['aprovado', 'rejeitado', 'pendente_analise'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Status inválido. Use: aprovado, rejeitado ou pendente_analise'
      });
    }

    if (status === 'rejeitado' && (!motivo || motivo.length < 5)) {
      return res.status(400).json({
        success: false,
        error: 'Motivo obrigatório para rejeição (mínimo 5 caracteres)'
      });
    }

    const documento = await prisma.documento.findUnique({
      where: { id: documentoId }
    });

    if (!documento) {
      return res.status(404).json({
        success: false,
        error: 'Documento não encontrado'
      });
    }

    const data = {
      status,
      analisadoPorAdmin: true,
      ...(status === 'aprovado' && { dataAprovacao: new Date() }),
      ...(status === 'rejeitado' && { dataRejeicao: new Date(), motivoRejeicao: motivo })
    };

    const updated = await prisma.documento.update({
      where: { id: documentoId },
      data
    });

    res.json({
      success: true,
      message: `Documento ${status} com sucesso`,
      data: updated
    });
  } catch (error) {
    console.error('Erro ao mudar status do documento:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao mudar status'
    });
  }
};

/**
 * NOVOS MÉTODOS: Aprovação de Cadastros
 */

/**
 * Listar cadastros pendentes de aprovação
 */
export const listarPendentesAprovacao = async (req, res) => {
  try {
    const { userType, page = 1, limit = 20, search } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      statusCadastro: 'pendente',
      ...(userType && userType !== 'todos' && { userType }),
      ...(search && {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { nomeCompleto: { contains: search, mode: 'insensitive' } },
          { cpfOuCnpj: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const pendentes = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        nomeCompleto: true,
        cpfOuCnpj: true,
        userType: true,
        statusCadastro: true,
        razoaSocial: true,
        createdAt: true,
        perfilTransportadora: {
          select: {
            statusDocumentos: true,
            rntrc: true,
            dataVencimentoRntrc: true
          }
        },
        perfil: {
          select: {
            statusDocumentos: true,
            cnpj: true
          }
        }
      },
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.user.count({ where });

    res.json({
      success: true,
      data: pendentes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao listar pendentes de aprovação:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar cadastros'
    });
  }
};

/**
 * Obter detalhes completos de um cadastro
 */
export const getDetalheCadastro = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        nomeCompleto: true,
        cpfOuCnpj: true,
        userType: true,
        statusCadastro: true,
        razaoSocial: true,
        ramo: true,
        telefone: true,
        createdAt: true,
        perfilTransportadora: {
          select: {
            id: true,
            cpf: true,
            cnh: true,
            rntrc: true,
            dataVencimentoRntrc: true,
            statusDocumentos: true,
            fotoPerfil: true,
            dataNascimento: true,
            genero: true
          }
        },
        perfil: {
          select: {
            id: true,
            cnpj: true,
            statusDocumentos: true,
            inscricaoEstadual: true,
            banco: true,
            conta: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Erro ao obter detalhes do cadastro:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter informações'
    });
  }
};

/**
 * Aprovar um cadastro
 */
export const aprovarCadastro = async (req, res) => {
  try {
    const { userId } = req.params;
    const { observacoes } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { statusCadastro: true, email: true, userType: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    if (user.statusCadastro !== 'pendente') {
      return res.status(400).json({
        success: false,
        error: `Cadastro não está pendente (status atual: ${user.statusCadastro})`
      });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        statusCadastro: 'aprovado',
        statusVerificacao: 'aprovado'
      },
      select: {
        id: true,
        email: true,
        nomeCompleto: true,
        userType: true,
        statusCadastro: true
      }
    });

    // TODO: Enviar notificação ao usuário
    console.log(`✅ Cadastro aprovado: ${user.email} (${user.userType})`);

    res.json({
      success: true,
      message: 'Cadastro aprovado com sucesso',
      data: updated
    });
  } catch (error) {
    console.error('Erro ao aprovar cadastro:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao aprovar cadastro'
    });
  }
};

/**
 * Rejeitar um cadastro
 */
export const rejeitarCadastro = async (req, res) => {
  try {
    const { userId } = req.params;
    const { motivo } = req.body;

    if (!motivo || motivo.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Motivo da rejeição obrigatório'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { statusCadastro: true, email: true, userType: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    if (user.statusCadastro !== 'pendente') {
      return res.status(400).json({
        success: false,
        error: `Cadastro não está pendente (status atual: ${user.statusCadastro})`
      });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        statusCadastro: 'rejeitado',
        statusVerificacao: 'rejeitado',
        justificativaRejeicao: motivo
      },
      select: {
        id: true,
        email: true,
        nomeCompleto: true,
        userType: true,
        statusCadastro: true
      }
    });

    // TODO: Enviar notificação de rejeição ao usuário
    console.log(`❌ Cadastro rejeitado: ${user.email} (${user.userType})`);

    res.json({
      success: true,
      message: 'Cadastro rejeitado',
      data: updated
    });
  } catch (error) {
    console.error('Erro ao rejeitar cadastro:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao rejeitar cadastro'
    });
  }
};
