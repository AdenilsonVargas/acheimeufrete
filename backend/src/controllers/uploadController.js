import prisma from '../utils/prismaClient.js';

/**
 * Upload de documento (CT-e, CIOT, MDF-e, Canhoto)
 * 
 * Este controller simula o upload de documentos.
 * Em produção, deve integrar com:
 * - AWS S3
 * - Google Cloud Storage
 * - Azure Blob Storage
 * - Ou qualquer outro serviço de armazenamento
 */

/**
 * Upload de CT-e
 */
export const uploadCTe = async (req, res) => {
  try {
    const { cotacaoId, codigo, url } = req.body;

    const cotacao = await prisma.cotacao.findUnique({
      where: { id: cotacaoId }
    });

    if (!cotacao) {
      return res.status(404).json({ message: 'Cotação não encontrada' });
    }

    const cotacaoAtualizada = await prisma.cotacao.update({
      where: { id: cotacaoId },
      data: {
        codigoCte: codigo,
        documentoCte: url,
        cteRegistrado: true
      }
    });

    res.json({
      message: 'CT-e registrado com sucesso',
      cotacao: cotacaoAtualizada
    });
  } catch (error) {
    console.error('Erro ao fazer upload do CT-e:', error);
    res.status(500).json({ message: 'Erro ao fazer upload do CT-e', error: error.message });
  }
};

/**
 * Upload de CIOT
 */
export const uploadCIOT = async (req, res) => {
  try {
    const { cotacaoId, codigo, url } = req.body;

    const cotacao = await prisma.cotacao.findUnique({
      where: { id: cotacaoId }
    });

    if (!cotacao) {
      return res.status(404).json({ message: 'Cotação não encontrada' });
    }

    const cotacaoAtualizada = await prisma.cotacao.update({
      where: { id: cotacaoId },
      data: {
        codigoCiot: codigo,
        documentoCiot: url,
        ciotRegistrado: true
      }
    });

    res.json({
      message: 'CIOT registrado com sucesso',
      cotacao: cotacaoAtualizada
    });
  } catch (error) {
    console.error('Erro ao fazer upload do CIOT:', error);
    res.status(500).json({ message: 'Erro ao fazer upload do CIOT', error: error.message });
  }
};

/**
 * Upload de MDF-e
 */
export const uploadMDFe = async (req, res) => {
  try {
    const { cotacaoId, codigo, url } = req.body;

    const cotacao = await prisma.cotacao.findUnique({
      where: { id: cotacaoId }
    });

    if (!cotacao) {
      return res.status(404).json({ message: 'Cotação não encontrada' });
    }

    const cotacaoAtualizada = await prisma.cotacao.update({
      where: { id: cotacaoId },
      data: {
        codigoMdfe: codigo,
        documentoMdfe: url,
        mdfeRegistrado: true
      }
    });

    res.json({
      message: 'MDF-e registrado com sucesso',
      cotacao: cotacaoAtualizada
    });
  } catch (error) {
    console.error('Erro ao fazer upload do MDF-e:', error);
    res.status(500).json({ message: 'Erro ao fazer upload do MDF-e', error: error.message });
  }
};

/**
 * Upload de Canhoto (comprovante de entrega)
 */
export const uploadCanhoto = async (req, res) => {
  try {
    const { cotacaoId, url } = req.body;

    const cotacao = await prisma.cotacao.findUnique({
      where: { id: cotacaoId }
    });

    if (!cotacao) {
      return res.status(404).json({ message: 'Cotação não encontrada' });
    }

    const cotacaoAtualizada = await prisma.cotacao.update({
      where: { id: cotacaoId },
      data: {
        documentoCanhoto: url
      }
    });

    res.json({
      message: 'Canhoto registrado com sucesso',
      cotacao: cotacaoAtualizada
    });
  } catch (error) {
    console.error('Erro ao fazer upload do canhoto:', error);
    res.status(500).json({ message: 'Erro ao fazer upload do canhoto', error: error.message });
  }
};

/**
 * Upload de arquivo genérico para chat
 */
export const uploadArquivoChat = async (req, res) => {
  try {
    const { chatId, url, nome, tipo } = req.body;

    // Validar que o chat existe
    const chat = await prisma.chat.findUnique({
      where: { id: chatId }
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat não encontrado' });
    }

    res.json({
      message: 'Arquivo registrado com sucesso',
      arquivo: {
        url,
        nome,
        tipo
      }
    });
  } catch (error) {
    console.error('Erro ao fazer upload do arquivo:', error);
    res.status(500).json({ message: 'Erro ao fazer upload do arquivo', error: error.message });
  }
};

/**
 * Obter documentos de uma cotação
 */
export const obterDocumentos = async (req, res) => {
  try {
    const { cotacaoId } = req.params;

    const cotacao = await prisma.cotacao.findUnique({
      where: { id: cotacaoId },
      select: {
        id: true,
        numero: true,
        codigoCte: true,
        documentoCte: true,
        cteRegistrado: true,
        codigoCiot: true,
        documentoCiot: true,
        ciotRegistrado: true,
        codigoMdfe: true,
        documentoMdfe: true,
        mdfeRegistrado: true,
        documentoCanhoto: true,
        urlRastreamento: true,
        codigoRastreio: true
      }
    });

    if (!cotacao) {
      return res.status(404).json({ message: 'Cotação não encontrada' });
    }

    res.json({
      cotacao: cotacao.numero,
      documentos: {
        cte: {
          codigo: cotacao.codigoCte,
          url: cotacao.documentoCte,
          registrado: cotacao.cteRegistrado
        },
        ciot: {
          codigo: cotacao.codigoCiot,
          url: cotacao.documentoCiot,
          registrado: cotacao.ciotRegistrado
        },
        mdfe: {
          codigo: cotacao.codigoMdfe,
          url: cotacao.documentoMdfe,
          registrado: cotacao.mdfeRegistrado
        },
        canhoto: {
          url: cotacao.documentoCanhoto,
          registrado: !!cotacao.documentoCanhoto
        },
        rastreamento: {
          url: cotacao.urlRastreamento,
          codigo: cotacao.codigoRastreio,
          ativo: !!cotacao.urlRastreamento
        }
      }
    });
  } catch (error) {
    console.error('Erro ao obter documentos:', error);
    res.status(500).json({ message: 'Erro ao obter documentos', error: error.message });
  }
};
