import prisma from '../utils/prismaClient.js';

export const listaRegioesDesativadas = async (req, res) => {
  try {
    const { transportadorId, limit = 200 } = req.query;

    const regioes = await prisma.regiaoAtendida.findMany({
      where: {
        transportadorId,
        status: 'desativado'
      },
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: regioes
    });
  } catch (err) {
    console.error('Erro ao listar regiões:', err);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar regiões'
    });
  }
};

export const toggleEstado = async (req, res) => {
  try {
    const userId = req.userId || req.user?.id;
    const { estado } = req.body;

    if (!estado || estado.length !== 2) {
      return res.status(400).json({
        success: false,
        error: 'Estado inválido'
      });
    }

    // Verificar se já existe
    const estadoExistente = await prisma.regiaoAtendida.findFirst({
      where: {
        transportadorId: userId,
        tipoCobertura: 'estado',
        estado,
        status: 'desativado'
      }
    });

    if (estadoExistente) {
      // Se existe, deletar (reativar)
      await prisma.regiaoAtendida.delete({
        where: { id: estadoExistente.id }
      });

      res.json({
        success: true,
        message: 'Estado reativado com sucesso'
      });
    } else {
      // Se não existe, criar (desativar)
      const regiao = await prisma.regiaoAtendida.create({
        data: {
          transportadorId: userId,
          tipoCobertura: 'estado',
          estado,
          status: 'desativado'
        }
      });

      res.status(201).json({
        success: true,
        message: 'Estado desativado com sucesso',
        data: regiao
      });
    }
  } catch (err) {
    console.error('Erro ao atualizar estado:', err);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar estado'
    });
  }
};

export const criaCEPDesativado = async (req, res) => {
  try {
    const userId = req.userId || req.user?.id;
    const { cepInicio, cepFim, cidade, raioKm } = req.body;

    // Validações
    const cepInicioLimpo = cepInicio.replace(/\D/g, '');
    const cepFimLimpo = cepFim.replace(/\D/g, '');

    if (cepInicioLimpo.length !== 8 || cepFimLimpo.length !== 8) {
      return res.status(400).json({
        success: false,
        error: 'CEPs devem ter 8 dígitos'
      });
    }

    if (parseInt(cepInicioLimpo) > parseInt(cepFimLimpo)) {
      return res.status(400).json({
        success: false,
        error: 'CEP inicial não pode ser maior que CEP final'
      });
    }

    const regiao = await prisma.regiaoAtendida.create({
      data: {
        transportadorId: userId,
        tipoCobertura: 'cepRange',
        cepInicio: cepInicioLimpo,
        cepFim: cepFimLimpo,
        cidade: cidade || '',
        raioKm: raioKm ? parseFloat(raioKm) : null,
        status: 'desativado'
      }
    });

    res.status(201).json({
      success: true,
      data: regiao
    });
  } catch (err) {
    console.error('Erro ao criar faixa de CEP:', err);
    res.status(500).json({
      success: false,
      error: 'Erro ao criar faixa de CEP'
    });
  }
};

export const deletaCEPDesativado = async (req, res) => {
  try {
    const userId = req.userId || req.user?.id;
    const { id } = req.params;

    const regiao = await prisma.regiaoAtendida.findUnique({
      where: { id }
    });

    if (!regiao || regiao.transportadorId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Região não encontrada ou sem permissão'
      });
    }

    if (regiao.tipoCobertura !== 'cepRange') {
      return res.status(400).json({
        success: false,
        error: 'Apenas faixas de CEP podem ser deletadas desta forma'
      });
    }

    await prisma.regiaoAtendida.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Faixa de CEP reativada com sucesso'
    });
  } catch (err) {
    console.error('Erro ao deletar faixa de CEP:', err);
    res.status(500).json({
      success: false,
      error: 'Erro ao deletar faixa de CEP'
    });
  }
};

export const atualizaCEPDesativado = async (req, res) => {
  try {
    const userId = req.userId || req.user?.id;
    const { id } = req.params;
    const { cidade, raioKm } = req.body;

    const regiao = await prisma.regiaoAtendida.findUnique({
      where: { id }
    });

    if (!regiao || regiao.transportadorId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Região não encontrada ou sem permissão'
      });
    }

    const atualizado = await prisma.regiaoAtendida.update({
      where: { id },
      data: {
        cidade: cidade || regiao.cidade,
        raioKm: raioKm ? parseFloat(raioKm) : regiao.raioKm
      }
    });

    res.json({
      success: true,
      data: atualizado
    });
  } catch (err) {
    console.error('Erro ao atualizar CEP:', err);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar CEP'
    });
  }
};
