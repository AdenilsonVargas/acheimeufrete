import prisma from '../utils/prismaClient.js';

/**
 * Obter uma frase motivacional aleatória
 */
export const obterFraseAleatoria = async (req, res) => {
  try {
    const { categoria } = req.query;

    // Contar total de frases
    const total = await prisma.quote.count({
      where: {
        ativo: true,
        ...(categoria ? { categoria } : {})
      }
    });

    if (total === 0) {
      return res.json({
        success: true,
        data: {
          texto: "Hoje é o primeiro dia do resto de sua vida. Faça-o contar!",
          autor: "Achei Meu Frete"
        }
      });
    }

    // Gerar índice aleatório
    const indiceAleatorio = Math.floor(Math.random() * total);

    // Buscar a frase
    const frase = await prisma.quote.findFirst({
      where: {
        ativo: true,
        ...(categoria ? { categoria } : {})
      },
      skip: indiceAleatorio
    });

    res.json({
      success: true,
      data: frase
    });
  } catch (error) {
    console.error('Erro ao obter frase aleatória:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter frase'
    });
  }
};

/**
 * Listar todas as frases (para admin)
 */
export const listarFrases = async (req, res) => {
  try {
    const { categoria, pagina = 1, limite = 20 } = req.query;

    const skip = (pagina - 1) * limite;

    const frases = await prisma.quote.findMany({
      where: {
        ...(categoria ? { categoria } : {}),
        ativo: true
      },
      skip,
      take: parseInt(limite),
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.quote.count({
      where: {
        ...(categoria ? { categoria } : {}),
        ativo: true
      }
    });

    res.json({
      success: true,
      data: frases,
      pagination: {
        pagina: parseInt(pagina),
        limite: parseInt(limite),
        total,
        paginas: Math.ceil(total / limite)
      }
    });
  } catch (error) {
    console.error('Erro ao listar frases:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar frases'
    });
  }
};
