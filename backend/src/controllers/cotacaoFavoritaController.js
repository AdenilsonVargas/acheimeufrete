import prisma from '../utils/prismaClient.js';

// Listar cotações favoritas do usuário
export const listarFavoritas = async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    const favoritas = await prisma.cotacaoFavorita.findMany({
      where: { userId: req.userId },
      include: {
        cotacao: {
          include: {
            user: {
              select: {
                id: true,
                nomeCompleto: true,
              }
            }
          }
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: parseInt(skip),
      take: parseInt(limit),
    });

    const total = await prisma.cotacaoFavorita.count({
      where: { userId: req.userId }
    });

    return res.json({
      favoritas,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Erro ao listar favoritas:', error);
    return res.status(500).json({ message: 'Erro ao listar favoritas' });
  }
};

// Criar favorita
export const criarFavorita = async (req, res) => {
  try {
    const { cotacaoId, nome } = req.body;

    console.log('DEBUG - Criar favorita:', { cotacaoId, nome, userId: req.userId, body: req.body });

    if (!cotacaoId || !nome) {
      console.log('DEBUG - Campos obrigatórios faltando');
      return res.status(400).json({ message: 'Cotação ID e nome são obrigatórios' });
    }

    // Validar se nome já existe para este usuário
    const existente = await prisma.cotacaoFavorita.findUnique({
      where: {
        userId_nome: {
          userId: req.userId,
          nome: nome.trim(),
        }
      }
    });

    if (existente) {
      return res.status(400).json({ message: 'Já existe uma favorita com este nome' });
    }

    // Validar se cotação existe e pertence ao usuário
    const cotacao = await prisma.cotacao.findUnique({
      where: { id: cotacaoId }
    });

    if (!cotacao || cotacao.userId !== req.userId) {
      return res.status(404).json({ message: 'Cotação não encontrada' });
    }

    const favorita = await prisma.cotacaoFavorita.create({
      data: {
        userId: req.userId,
        cotacaoId,
        nome: nome.trim(),
      },
      include: {
        cotacao: {
          include: {
            user: {
              select: {
                id: true,
                nomeCompleto: true,
              }
            }
          }
        }
      }
    });

    return res.status(201).json({
      message: 'Favorita criada com sucesso',
      favorita,
    });
  } catch (error) {
    console.error('Erro ao criar favorita:', error);
    return res.status(500).json({ message: 'Erro ao criar favorita', error: error.message });
  }
};

// Obter favorita por ID
export const obterFavorita = async (req, res) => {
  try {
    const { id } = req.params;

    const favorita = await prisma.cotacaoFavorita.findUnique({
      where: { id },
      include: {
        cotacao: {
          include: {
            user: {
              select: {
                id: true,
                nomeCompleto: true,
              }
            }
          }
        }
      }
    });

    if (!favorita || favorita.userId !== req.userId) {
      return res.status(404).json({ message: 'Favorita não encontrada' });
    }

    return res.json(favorita);
  } catch (error) {
    console.error('Erro ao obter favorita:', error);
    return res.status(500).json({ message: 'Erro ao obter favorita' });
  }
};

// Atualizar nome da favorita
export const atualizarFavorita = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome } = req.body;

    if (!nome) {
      return res.status(400).json({ message: 'Nome é obrigatório' });
    }

    const favorita = await prisma.cotacaoFavorita.findUnique({
      where: { id }
    });

    if (!favorita || favorita.userId !== req.userId) {
      return res.status(404).json({ message: 'Favorita não encontrada' });
    }

    // Validar se novo nome já existe
    if (nome.trim() !== favorita.nome) {
      const existente = await prisma.cotacaoFavorita.findUnique({
        where: {
          userId_nome: {
            userId: req.userId,
            nome: nome.trim(),
          }
        }
      });

      if (existente) {
        return res.status(400).json({ message: 'Já existe uma favorita com este nome' });
      }
    }

    const atualizada = await prisma.cotacaoFavorita.update({
      where: { id },
      data: { nome: nome.trim() },
      include: {
        cotacao: true
      }
    });

    return res.json({
      message: 'Favorita atualizada com sucesso',
      favorita: atualizada,
    });
  } catch (error) {
    console.error('Erro ao atualizar favorita:', error);
    return res.status(500).json({ message: 'Erro ao atualizar favorita' });
  }
};

// Deletar favorita
export const deletarFavorita = async (req, res) => {
  try {
    const { id } = req.params;

    const favorita = await prisma.cotacaoFavorita.findUnique({
      where: { id }
    });

    if (!favorita || favorita.userId !== req.userId) {
      return res.status(404).json({ message: 'Favorita não encontrada' });
    }

    await prisma.cotacaoFavorita.delete({
      where: { id }
    });

    return res.json({
      message: 'Favorita deletada com sucesso',
    });
  } catch (error) {
    console.error('Erro ao deletar favorita:', error);
    return res.status(500).json({ message: 'Erro ao deletar favorita' });
  }
};
