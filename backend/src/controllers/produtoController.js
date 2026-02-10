import prisma from '../utils/prismaClient.js';

export const listaProdutos = async (req, res) => {
  try {
    const { clienteId, limit = 50 } = req.query;

    const produtos = await prisma.produto.findMany({
      where: {
        userId: clienteId,
        ativo: true
      },
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: produtos
    });
  } catch (err) {
    console.error('Erro ao listar produtos:', err);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar produtos'
    });
  }
};

export const criaProduto = async (req, res) => {
  try {
    const userId = req.userId || req.user?.id;
    
    console.log('🔍 DEBUG criaProduto - userId:', userId);
    console.log('🔍 DEBUG criaProduto - req.userId:', req.userId);
    console.log('🔍 DEBUG criaProduto - req.user:', req.user);
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      });
    }
    
    const {
      nome,
      sku,
      ncmCode,
      ncmClassificacao,
      unidadeMedida,
      pesoKg,
      larguraM,
      alturaM,
      comprimentoM,
      valorUnitario,
      flags,
      observacoes
    } = req.body;

    // Validações
    if (!nome || nome.length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Nome deve ter pelo menos 3 caracteres'
      });
    }

    if (!ncmCode || !/^\d{8}$/.test(ncmCode.replace(/\D/g, ''))) {
      return res.status(400).json({
        success: false,
        error: 'NCM deve ter 8 dígitos'
      });
    }

    if (!pesoKg || parseFloat(pesoKg) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Peso deve ser maior que zero'
      });
    }

    // Verificar duplicidade de nome por cliente (case-insensitive)
    const nomeExistente = await prisma.produto.findFirst({
      where: { userId, nome: { equals: nome, mode: 'insensitive' }, ativo: true }
    });

    if (nomeExistente) {
      return res.status(409).json({ success: false, error: 'Já existe um produto com este nome para este cliente.' });
    }

    const produto = await prisma.produto.create({
      data: {
        userId,
        nome,
        sku: sku || null,
        ncmCode,
        ncmClassificacao: ncmClassificacao || '',
        unidadeMedida: unidadeMedida || 'kg',
        pesoKg: parseFloat(pesoKg),
        larguraM: larguraM ? parseFloat(larguraM) : null,
        alturaM: alturaM ? parseFloat(alturaM) : null,
        comprimentoM: comprimentoM ? parseFloat(comprimentoM) : null,
        valorUnitario: valorUnitario ? parseFloat(valorUnitario) : null,
        flags: Array.isArray(flags) ? flags : [],
        observacoes: observacoes || ''
      }
    });

    res.status(201).json({
      success: true,
      data: produto
    });
  } catch (err) {
    console.error('Erro ao criar produto:', err);
    res.status(500).json({
      success: false,
      error: 'Erro ao criar produto'
    });
  }
};

export const atualizaProduto = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId || req.user?.id;
    const {
      nome,
      sku,
      ncmCode,
      ncmClassificacao,
      unidadeMedida,
      pesoKg,
      larguraM,
      alturaM,
      comprimentoM,
      valorUnitario,
      flags,
      observacoes
    } = req.body;

    // Verificar se produto pertence ao usuário
    const produto = await prisma.produto.findUnique({
      where: { id }
    });

    if (!produto || produto.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Produto não encontrado ou sem permissão'
      });
    }

    // Se nome foi alterado, validar duplicidade
    if (nome && nome.toLowerCase() !== (produto.nome || '').toLowerCase()) {
      const duplicado = await prisma.produto.findFirst({
        where: { userId, nome: { equals: nome, mode: 'insensitive' }, ativo: true, NOT: { id } }
      });
      if (duplicado) {
        return res.status(409).json({ success: false, error: 'Já existe um produto com este nome para este cliente.' });
      }
    }

    const atualizado = await prisma.produto.update({
      where: { id },
      data: {
        nome: nome || produto.nome,
        sku: sku !== undefined ? sku : produto.sku,
        ncmCode: ncmCode || produto.ncmCode,
        ncmClassificacao: ncmClassificacao !== undefined ? ncmClassificacao : produto.ncmClassificacao,
        unidadeMedida: unidadeMedida || produto.unidadeMedida,
        pesoKg: pesoKg ? parseFloat(pesoKg) : produto.pesoKg,
        larguraM: larguraM ? parseFloat(larguraM) : produto.larguraM,
        alturaM: alturaM ? parseFloat(alturaM) : produto.alturaM,
        comprimentoM: comprimentoM ? parseFloat(comprimentoM) : produto.comprimentoM,
        valorUnitario: valorUnitario ? parseFloat(valorUnitario) : produto.valorUnitario,
        flags: flags || produto.flags,
        observacoes: observacoes !== undefined ? observacoes : produto.observacoes
      }
    });

    res.json({
      success: true,
      data: atualizado
    });
  } catch (err) {
    console.error('Erro ao atualizar produto:', err);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar produto'
    });
  }
};

export const deletaProduto = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId || req.user?.id;

    const produto = await prisma.produto.findUnique({
      where: { id }
    });

    if (!produto || produto.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Produto não encontrado ou sem permissão'
      });
    }

    await prisma.produto.update({
      where: { id },
      data: { ativo: false }
    });

    res.json({
      success: true,
      message: 'Produto deletado com sucesso'
    });
  } catch (err) {
    console.error('Erro ao deletar produto:', err);
    res.status(500).json({
      success: false,
      error: 'Erro ao deletar produto'
    });
  }
};
