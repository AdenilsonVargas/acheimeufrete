import prisma from '../utils/prismaClient.js';

/**
 * Obter perfil completo do usuário autenticado
 */
export const getPerfil = async (req, res) => {
  try {
    const { userId } = req.user; // Do token JWT via middleware

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Usuário não autenticado'
      });
    }

    const usuario = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        telefone: true,
        nomeCompleto: true,
        sobrenome: true,
        userType: true,
        statusCadastro: true,
        cpfOuCnpj: true,
        fotoPerfil: true,
        // TRANSPORTADOR
        tipoTransportador: true,
        razaoSocial: true,
        cnpj: true,
        cpf: true,
        rg: true,
        nomeResponsavel: true,
        ehAutonomoCiot: true,
        emiteCiot: true,
        quantidadeVeiculos: true,
        // ENDEREÇOS
        enderecos: {
          select: {
            id: true,
            cep: true,
            logradouro: true,
            numero: true,
            bairro: true,
            cidade: true,
            estado: true
          }
        },
        // DOCUMENTOS
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
            dataVencimento: true
          }
        },
        createdAt: true,
        updatedAt: true
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
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar perfil'
    });
  }
};

/**
 * Obter perfil de um usuário específico (para admin)
 */
export const getPerfilPorId = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'ID do usuário obrigatório'
      });
    }

    const usuario = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        telefone: true,
        nomeCompleto: true,
        userType: true,
        statusCadastro: true,
        cpfOuCnpj: true,
        fotoPerfil: true,
        tipoTransportador: true,
        razaoSocial: true,
        enderecos: {
          select: {
            id: true,
            cep: true,
            logradouro: true,
            numero: true,
            bairro: true,
            cidade: true
          }
        },
        documentos: {
          select: {
            id: true,
            tipo: true,
            status: true,
            url: true,
            nomeArquivo: true
          }
        },
        createdAt: true
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
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar perfil'
    });
  }
};

/**
 * Atualizar perfil do usuário (apenas campos permitidos)
 */
export const updatePerfil = async (req, res) => {
  try {
    const { userId } = req.user; // Do token JWT

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Usuário não autenticado'
      });
    }

    // Campos permitidos para edição (não podem editar documentos já verificados)
    const { telefone, fotoPerfil } = req.body;

    const usuario = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    const data = {};

    if (telefone !== undefined) {
      if (!/^\(\d{2}\) \d{4,5}-\d{4}$/.test(telefone)) {
        return res.status(400).json({
          success: false,
          error: 'Telefone em formato inválido'
        });
      }
      data.telefone = telefone;
    }

    if (fotoPerfil !== undefined) {
      data.fotoPerfil = fotoPerfil;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum campo para atualizar'
      });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        telefone: true,
        nomeCompleto: true,
        fotoPerfil: true,
        statusCadastro: true
      }
    });

    res.json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      data: updated
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar perfil'
    });
  }
};

/**
 * Obter status dos documentos do usuário
 */
export const getStatusDocumentos = async (req, res) => {
  try {
    const { userId } = req.user; // Do token JWT

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Usuário não autenticado'
      });
    }

    const documentos = await prisma.documento.findMany({
      where: { userId },
      select: {
        id: true,
        tipo: true,
        status: true,
        dataVencimento: true,
        dataUpload: true,
        motivoRejeicao: true,
        dataAprovacao: true,
        dataRejeicao: true
      },
      orderBy: { dataUpload: 'desc' }
    });

    // Agrupar por status
    const porStatus = {
      pendente: documentos.filter(d => d.status === 'pendente_analise'),
      aprovado: documentos.filter(d => d.status === 'aprovado'),
      rejeitado: documentos.filter(d => d.status === 'rejeitado')
    };

    res.json({
      success: true,
      data: {
        documentos,
        resumo: {
          total: documentos.length,
          pendente: porStatus.pendente.length,
          aprovado: porStatus.aprovado.length,
          rejeitado: porStatus.rejeitado.length
        }
      }
    });
  } catch (error) {
    console.error('Erro ao buscar status de documentos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar status de documentos'
    });
  }
};

/**
 * Obter estatísticas de aprovação (para admin)
 */
export const getEstatisticasAprovacao = async (req, res) => {
  try {
    const usuarios = await prisma.user.groupBy({
      by: ['statusCadastro', 'userType'],
      _count: true
    });

    const documentos = await prisma.documento.groupBy({
      by: ['status'],
      _count: true
    });

    // Calcular totais
    const totalUsuarios = usuarios.reduce((sum, u) => sum + u._count, 0);
    const usuariosAprovados = usuarios.find(u => u.statusCadastro === 'ok')?._count || 0;
    const usuariosPendentes = usuarios.find(u => u.statusCadastro === 'pendente_verificacao')?._count || 0;
    const usuariosRejeitados = usuarios.find(u => u.statusCadastro === 'rejeitado')?._count || 0;

    const totalDocumentos = documentos.reduce((sum, d) => sum + d._count, 0);
    const documentosAprovados = documentos.find(d => d.status === 'aprovado')?._count || 0;
    const documentosPendentes = documentos.find(d => d.status === 'pendente_analise')?._count || 0;
    const documentosRejeitados = documentos.find(d => d.status === 'rejeitado')?._count || 0;

    res.json({
      success: true,
      data: {
        usuarios: {
          total: totalUsuarios,
          aprovados: usuariosAprovados,
          pendentes: usuariosPendentes,
          rejeitados: usuariosRejeitados,
          porTipo: usuarios
        },
        documentos: {
          total: totalDocumentos,
          aprovados: documentosAprovados,
          pendentes: documentosPendentes,
          rejeitados: documentosRejeitados,
          porStatus: documentos
        }
      }
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar estatísticas'
    });
  }
};
