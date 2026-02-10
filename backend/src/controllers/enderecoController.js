import prisma from '../utils/prismaClient.js';

// Listar endereços do usuário
export const listarEnderecos = async (req, res) => {
  try {
    const enderecos = await prisma.endereco.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ enderecos });
  } catch (error) {
    console.error('Erro ao listar endereços:', error);
    return res.status(500).json({ message: 'Erro ao listar endereços' });
  }
};

// Obter endereço específico
export const obterEndereco = async (req, res) => {
  try {
    const { id } = req.params;

    const endereco = await prisma.endereco.findUnique({
      where: { id },
    });

    if (!endereco || endereco.userId !== req.userId) {
      return res.status(404).json({ message: 'Endereço não encontrado' });
    }

    return res.json({ endereco });
  } catch (error) {
    console.error('Erro ao obter endereço:', error);
    return res.status(500).json({ message: 'Erro ao obter endereço' });
  }
};

// Criar endereço
export const criarEndereco = async (req, res) => {
  try {
    const {
      cep,
      rua,
      numero,
      complemento,
      bairro,
      cidade,
      estado,
      referencia,
      tipo,
    } = req.body;

    if (!cep || !rua || !numero || !cidade || !estado) {
      return res.status(400).json({ message: 'Preencha todos os campos obrigatórios' });
    }

    const endereco = await prisma.endereco.create({
      data: {
        userId: req.userId,
        cep,
        rua,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        referencia,
        tipo: tipo || 'residencial',
      },
    });

    return res.status(201).json({
      message: 'Endereço criado com sucesso',
      endereco,
    });
  } catch (error) {
    console.error('Erro ao criar endereço:', error);
    return res.status(500).json({ message: 'Erro ao criar endereço' });
  }
};

// Atualizar endereço
export const atualizarEndereco = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      cep,
      rua,
      numero,
      complemento,
      bairro,
      cidade,
      estado,
      referencia,
      tipo,
    } = req.body;

    // Verificar se o endereço pertence ao usuário
    const endereco = await prisma.endereco.findUnique({
      where: { id },
    });

    if (!endereco || endereco.userId !== req.userId) {
      return res.status(403).json({ message: 'Não autorizado' });
    }

    const enderecoAtualizado = await prisma.endereco.update({
      where: { id },
      data: {
        cep: cep || undefined,
        rua: rua || undefined,
        numero: numero || undefined,
        complemento: complemento || undefined,
        bairro: bairro || undefined,
        cidade: cidade || undefined,
        estado: estado || undefined,
        referencia: referencia || undefined,
        tipo: tipo || undefined,
      },
    });

    return res.json({
      message: 'Endereço atualizado com sucesso',
      endereco: enderecoAtualizado,
    });
  } catch (error) {
    console.error('Erro ao atualizar endereço:', error);
    return res.status(500).json({ message: 'Erro ao atualizar endereço' });
  }
};

// Deletar endereço
export const deletarEndereco = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se o endereço pertence ao usuário
    const endereco = await prisma.endereco.findUnique({
      where: { id },
    });

    if (!endereco || endereco.userId !== req.userId) {
      return res.status(403).json({ message: 'Não autorizado' });
    }

    await prisma.endereco.delete({
      where: { id },
    });

    return res.json({ message: 'Endereço deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar endereço:', error);
    return res.status(500).json({ message: 'Erro ao deletar endereço' });
  }
};
