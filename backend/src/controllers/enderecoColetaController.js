import axios from 'axios';
import prisma from '../utils/prismaClient.js';

// Função para converter para MAIÚSCULA (para NF)
const paraMAIUSCULA = (texto) => texto?.toUpperCase() || '';

// Buscar CEP via ViaCEP
const buscaCEP = async (cep) => {
  try {
    const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
    if (response.data.erro) return null;
    return response.data;
  } catch {
    return null;
  }
};

// Listar endereços de coleta do usuário
export const listarEnderecosColeta = async (req, res) => {
  try {
    const enderecos = await prisma.enderecoColeta.findMany({
      where: { userId: req.userId, ativo: true },
      orderBy: [{ padrao: 'desc' }, { createdAt: 'desc' }],
    });

    return res.json({
      enderecos: enderecos.map(e => ({
        ...e,
        nomeExibicao: e.nome, // Para seleção em dropdown
      })),
    });
  } catch (error) {
    console.error('Erro ao listar endereços de coleta:', error);
    return res.status(500).json({ message: 'Erro ao listar endereços de coleta' });
  }
};

// Obter endereço específico
export const obterEnderecoColeta = async (req, res) => {
  try {
    const { id } = req.params;

    const endereco = await prisma.enderecoColeta.findUnique({
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

// Criar endereço de coleta
export const criarEnderecoColeta = async (req, res) => {
  try {
    const { nome, cep, logradouro, numero, complemento, bairro, cidade, estado, padrao } = req.body;

    // Validações
    if (!nome?.trim()) {
      return res.status(400).json({ message: 'Nome do endereço é obrigatório' });
    }

    if (!cep?.trim()) {
      return res.status(400).json({ message: 'CEP é obrigatório' });
    }

    // Verificar duplicidade por (userId, nome)
    const existente = await prisma.enderecoColeta.findUnique({
      where: {
        userId_nome: {
          userId: req.userId,
          nome: nome.trim(),
        },
      },
    });

    if (existente) {
      return res.status(409).json({ message: 'Já existe um endereço de coleta com este nome para este cliente.' });
    }

    // Se for marcar como padrão, desmarcar outros
    if (padrao === true) {
      await prisma.enderecoColeta.updateMany({
        where: { userId: req.userId },
        data: { padrao: false },
      });
    }

    // Buscar dados do CEP se não fornecidos
    let dadosCEP = { logradouro: logradouro || '', bairro: bairro || '', cidade: cidade || '', estado: estado || '' };
    if (!logradouro || !bairro || !cidade || !estado) {
      const cepData = await buscaCEP(cep.replace(/\D/g, ''));
      if (cepData) {
        dadosCEP = {
          logradouro: cepData.logradouro || '',
          bairro: cepData.bairro || '',
          cidade: cepData.localidade || '',
          estado: cepData.uf || '',
        };
      }
    }

    // Converter para MAIÚSCULA (para NF/relatórios)
    const enderecoColeta = await prisma.enderecoColeta.create({
      data: {
        userId: req.userId,
        nome: paraMAIUSCULA(nome),
        cep: cep.replace(/\D/g, ''),
        logradouro: paraMAIUSCULA(dadosCEP.logradouro),
        numero: numero?.toString() || '',
        complemento: complemento ? paraMAIUSCULA(complemento) : null,
        bairro: paraMAIUSCULA(dadosCEP.bairro),
        cidade: paraMAIUSCULA(dadosCEP.cidade),
        estado: estado?.toUpperCase() || dadosCEP.estado?.toUpperCase() || '',
        padrao: padrao === true,
        ativo: true,
      },
    });

    return res.status(201).json({
      message: 'Endereço de coleta criado com sucesso',
      endereco: enderecoColeta,
    });
  } catch (error) {
    console.error('Erro ao criar endereço:', error);
    return res.status(500).json({ message: 'Erro ao criar endereço de coleta' });
  }
};

// Atualizar endereço de coleta
export const atualizarEnderecoColeta = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, cep, logradouro, numero, complemento, bairro, cidade, estado, padrao } = req.body;

    // Verificar propriedade
    const endereco = await prisma.enderecoColeta.findUnique({
      where: { id },
    });

    if (!endereco || endereco.userId !== req.userId) {
      return res.status(403).json({ message: 'Não autorizado' });
    }

    // Se nome mudou, verificar duplicidade
    if (nome && nome.trim() !== endereco.nome) {
      const existente = await prisma.enderecoColeta.findUnique({
        where: {
          userId_nome: {
            userId: req.userId,
            nome: nome.trim(),
          },
        },
      });

      if (existente) {
        return res.status(409).json({ message: 'Já existe um endereço de coleta com este nome para este cliente.' });
      }
    }

    // Se for marcar como padrão, desmarcar outros
    if (padrao === true && !endereco.padrao) {
      await prisma.enderecoColeta.updateMany({
        where: { userId: req.userId, id: { not: id } },
        data: { padrao: false },
      });
    }

    // Buscar dados do CEP se fornecido
    let dadosCEP = { logradouro: logradouro || '', bairro: bairro || '', cidade: cidade || '', estado: estado || '' };
    if (cep && (!logradouro || !bairro || !cidade || !estado)) {
      const cepData = await buscaCEP(cep.replace(/\D/g, ''));
      if (cepData) {
        dadosCEP = {
          logradouro: cepData.logradouro || '',
          bairro: cepData.bairro || '',
          cidade: cepData.localidade || '',
          estado: cepData.uf || '',
        };
      }
    }

    // Converter para MAIÚSCULA
    const enderecoAtualizado = await prisma.enderecoColeta.update({
      where: { id },
      data: {
        nome: nome ? paraMAIUSCULA(nome) : undefined,
        cep: cep ? cep.replace(/\D/g, '') : undefined,
        logradouro: logradouro ? paraMAIUSCULA(logradouro) : (cep ? paraMAIUSCULA(dadosCEP.logradouro || endereco.logradouro) : undefined),
        numero: numero ? numero.toString() : undefined,
        complemento: complemento ? paraMAIUSCULA(complemento) : (complemento === '' ? null : undefined),
        bairro: bairro ? paraMAIUSCULA(bairro) : (dadosCEP.bairro ? paraMAIUSCULA(dadosCEP.bairro) : undefined),
        cidade: cidade ? paraMAIUSCULA(cidade) : (dadosCEP.cidade ? paraMAIUSCULA(dadosCEP.cidade) : undefined),
        estado: estado?.toUpperCase() || (dadosCEP.estado?.toUpperCase()),
        padrao: padrao !== undefined ? padrao : undefined,
      },
    });

    return res.json({
      message: 'Endereço de coleta atualizado com sucesso',
      endereco: enderecoAtualizado,
    });
  } catch (error) {
    console.error('Erro ao atualizar endereço:', error);
    return res.status(500).json({ message: 'Erro ao atualizar endereço de coleta' });
  }
};

// Deletar endereço de coleta (soft delete)
export const deletarEnderecoColeta = async (req, res) => {
  try {
    const { id } = req.params;

    const endereco = await prisma.enderecoColeta.findUnique({
      where: { id },
    });

    if (!endereco || endereco.userId !== req.userId) {
      return res.status(403).json({ message: 'Não autorizado' });
    }

    // Soft delete
    await prisma.enderecoColeta.update({
      where: { id },
      data: { ativo: false },
    });

    return res.json({ message: 'Endereço de coleta deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar endereço:', error);
    return res.status(500).json({ message: 'Erro ao deletar endereço de coleta' });
  }
};

// Buscar CEP e preencher automaticamente
export const buscarCEP = async (req, res) => {
  try {
    const { cep } = req.query;

    if (!cep) {
      return res.status(400).json({ message: 'CEP é obrigatório' });
    }

    const dados = await buscaCEP(cep.replace(/\D/g, ''));

    if (!dados) {
      return res.status(404).json({ message: 'CEP não encontrado' });
    }

    return res.json({
      cep: dados.cep,
      logradouro: paraMAIUSCULA(dados.logradouro),
      bairro: paraMAIUSCULA(dados.bairro),
      cidade: paraMAIUSCULA(dados.localidade),
      estado: dados.uf.toUpperCase(),
    });
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    return res.status(500).json({ message: 'Erro ao buscar CEP' });
  }
};

// Marcar como padrão
export const marcarComoPadrao = async (req, res) => {
  try {
    const { id } = req.params;

    const endereco = await prisma.enderecoColeta.findUnique({
      where: { id },
    });

    if (!endereco || endereco.userId !== req.userId) {
      return res.status(403).json({ message: 'Não autorizado' });
    }

    // Desmarcar todos os outros como padrão
    await prisma.enderecoColeta.updateMany({
      where: { userId: req.userId, id: { not: id } },
      data: { padrao: false },
    });

    // Marcar este como padrão
    const atualizado = await prisma.enderecoColeta.update({
      where: { id },
      data: { padrao: true },
    });

    return res.json({
      message: 'Endereço marcado como padrão',
      endereco: atualizado,
    });
  } catch (error) {
    console.error('Erro ao marcar como padrão:', error);
    return res.status(500).json({ message: 'Erro ao marcar como padrão' });
  }
};
