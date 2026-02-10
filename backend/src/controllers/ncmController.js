import ExcelJS from 'exceljs';
import prisma from '../utils/prismaClient.js';

// Busca inteligente na master NCM (mín. 4 caracteres)
export const searchNCMs = async (req, res) => {
  try {
    const query = String(req.query.query || '').trim();
    const limit = Math.min(parseInt(req.query.limit || '20', 10), 50);

    if (query.length < 4) {
      return res.json({ success: true, data: [] });
    }

    const results = await prisma.nCM.findMany({
      where: {
        OR: [
          { codigo: { startsWith: query } },
          { descricao: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: [{ codigo: 'asc' }],
      select: { codigo: true, descricao: true, classificacao: true, caracteristicas: true },
    });

    res.json({ success: true, data: results });
  } catch (err) {
    console.error('Erro ao buscar NCMs:', err);
    res.status(500).json({ success: false, error: 'Erro ao buscar NCMs' });
  }
};

// Download da planilha de NCMs atualizada
export const downloadPlanilhaNcms = async (req, res) => {
  try {
    // Buscar todos os NCMs
    const ncms = await prisma.nCM.findMany({
      orderBy: { codigo: 'asc' },
      select: { codigo: true, descricao: true, classificacao: true, caracteristicas: true }
    });

    // Criar workbook Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('NCMs Mercosul');

    // Configurar colunas
    worksheet.columns = [
      { header: 'Código NCM', key: 'codigo', width: 15, style: { alignment: { horizontal: 'center' } } },
      { header: 'Descrição', key: 'descricao', width: 50 },
      { header: 'Classificação', key: 'classificacao', width: 40 },
      { header: 'Características', key: 'caracteristicas', width: 40 }
    ];

    // Estilizar header
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1e293b' } };
    worksheet.getRow(1).alignment = { horizontal: 'center', vertical: 'center', wrapText: true };

    // Adicionar dados
    ncms.forEach(ncm => {
      worksheet.addRow({
        codigo: ncm.codigo,
        descricao: ncm.descricao || '',
        classificacao: ncm.classificacao || '',
        caracteristicas: ncm.caracteristicas?.join(', ') || ''
      });
    });

    // Aplicar estilos às linhas de dados
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.cells.forEach(cell => {
          cell.alignment = { vertical: 'top', wrapText: true };
        });
      }
    });

    // Adicionar informações da planilha no topo (em uma aba ou em comentário)
    worksheet.properties.defaultRowHeight = 20;

    // Gerar arquivo
    const fileName = `NCMs-MERCOSUL-${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Erro ao gerar planilha NCM:', err);
    res.status(500).json({ success: false, error: 'Erro ao gerar planilha' });
  }
};

export const listaNCMsDesativados = async (req, res) => {
  try {
    const { transportadorId, limit = 100 } = req.query;

    const ncms = await prisma.nCMAtendido.findMany({
      where: {
        transportadorId,
        status: 'desativado'
      },
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: ncms
    });
  } catch (err) {
    console.error('Erro ao listar NCMs:', err);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar NCMs'
    });
  }
};

export const toggleNCM = async (req, res) => {
  try {
    const userId = req.userId || req.user?.id;
    const { codigo, descricao } = req.body;

    if (!codigo || !/^\d{8}$/.test(codigo)) {
      return res.status(400).json({
        success: false,
        error: 'Código NCM inválido'
      });
    }

    // Verificar se já existe
    const ncmExistente = await prisma.nCMAtendido.findUnique({
      where: {
        transportadorId_codigo: {
          transportadorId: userId,
          codigo
        }
      }
    });

    if (ncmExistente) {
      // Se existe, deletar (reativar)
      await prisma.nCMAtendido.delete({
        where: { id: ncmExistente.id }
      });

      res.json({
        success: true,
        message: 'NCM reativado com sucesso'
      });
    } else {
      // Se não existe, criar (desativar)
      const ncm = await prisma.nCMAtendido.create({
        data: {
          transportadorId: userId,
          codigo,
          descricao: descricao || '',
          status: 'desativado'
        }
      });

      res.status(201).json({
        success: true,
        message: 'NCM desativado com sucesso',
        data: ncm
      });
    }
  } catch (err) {
    console.error('Erro ao atualizar NCM:', err);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar NCM'
    });
  }
};

export const criaNCMDesativado = async (req, res) => {
  try {
    const userId = req.userId || req.user?.id;
    const { codigo, descricao } = req.body;

    if (!codigo || !/^\d{8}$/.test(codigo)) {
      return res.status(400).json({
        success: false,
        error: 'Código NCM inválido'
      });
    }

    const ncm = await prisma.nCMAtendido.create({
      data: {
        transportadorId: userId,
        codigo,
        descricao: descricao || '',
        status: 'desativado'
      }
    });

    res.status(201).json({
      success: true,
      data: ncm
    });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'Este NCM já está desativado'
      });
    }

    console.error('Erro ao desativar NCM:', err);
    res.status(500).json({
      success: false,
      error: 'Erro ao desativar NCM'
    });
  }
};

export const deletaNCMDesativado = async (req, res) => {
  try {
    const userId = req.userId || req.user?.id;
    const { id } = req.params;

    const ncm = await prisma.nCMAtendido.findUnique({
      where: { id }
    });

    if (!ncm || ncm.transportadorId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'NCM não encontrado ou sem permissão'
      });
    }

    await prisma.nCMAtendido.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'NCM reativado com sucesso'
    });
  } catch (err) {
    console.error('Erro ao deletar NCM:', err);
    res.status(500).json({
      success: false,
      error: 'Erro ao deletar NCM'
    });
  }
};
