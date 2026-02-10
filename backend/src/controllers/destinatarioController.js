import axios from 'axios';
import prisma from '../utils/prismaClient.js';

// Buscar endereço via ViaCEP
const buscarEnderecoPorCEP = async (cep) => {
  try {
    const cepLimpo = cep.replace(/\D/g, '');
    const response = await axios.get(`https://viacep.com.br/ws/${cepLimpo}/json/`);
    return response.data;
  } catch (err) {
    console.error('Erro ao buscar CEP:', err);
    return null;
  }
};

export const listaDestinatarios = async (req, res) => {
  try {
    const { clienteId, limit = 50 } = req.query;

    const destinatarios = await prisma.destinatario.findMany({
      where: {
        userId: clienteId,
        ativo: true
      },
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: destinatarios
    });
  } catch (err) {
    console.error('Erro ao listar destinatários:', err);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar destinatários'
    });
  }
};

// Validar CPF
const validarCPF = (cpf) => {
  const cpfLimpo = cpf.replace(/\D/g, '');
  if (cpfLimpo.length !== 11) return false;
  
  // Verificar se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cpfLimpo)) return false;
  
  // Calcular primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpfLimpo[i]) * (10 - i);
  }
  let resto = soma % 11;
  let dv1 = resto < 2 ? 0 : 11 - resto;
  
  if (parseInt(cpfLimpo[9]) !== dv1) return false;
  
  // Calcular segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpfLimpo[i]) * (11 - i);
  }
  resto = soma % 11;
  let dv2 = resto < 2 ? 0 : 11 - resto;
  
  return parseInt(cpfLimpo[10]) === dv2;
};

// Validar CNPJ
const validarCNPJ = (cnpj) => {
  const cnpjLimpo = cnpj.replace(/\D/g, '');
  if (cnpjLimpo.length !== 14) return false;
  
  // Verificar se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(cnpjLimpo)) return false;
  
  // Calcular primeiro dígito verificador
  let soma = 0;
  const multiplicador1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 12; i++) {
    soma += parseInt(cnpjLimpo[i]) * multiplicador1[i];
  }
  let resto = soma % 11;
  let dv1 = resto < 2 ? 0 : 11 - resto;
  
  if (parseInt(cnpjLimpo[12]) !== dv1) return false;
  
  // Calcular segundo dígito verificador
  soma = 0;
  const multiplicador2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 13; i++) {
    soma += parseInt(cnpjLimpo[i]) * multiplicador2[i];
  }
  resto = soma % 11;
  let dv2 = resto < 2 ? 0 : 11 - resto;
  
  return parseInt(cnpjLimpo[13]) === dv2;
};

export const criaDestinatario = async (req, res) => {
  try {
    const userId = req.userId || req.user?.id;
    const {
      nomeCompleto,
      tipoPessoa,
      cpf,
      cnpj,
      codigoCadastro,
      cep,
      logradouro,
      numero,
      complemento,
      bairro,
      cidade,
      estado,
      pais,
      observacoes,
      aceitaMotoCarAte100km
    } = req.body;

    // Validações
    if (!nomeCompleto || nomeCompleto.length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Nome deve ter pelo menos 3 caracteres'
      });
    }

    // Validar tipo de pessoa
    if (!tipoPessoa || !['cpf', 'cnpj'].includes(tipoPessoa)) {
      return res.status(400).json({
        success: false,
        error: 'Tipo de pessoa deve ser CPF ou CNPJ'
      });
    }

    // Validar CPF ou CNPJ conforme tipo
    if (tipoPessoa === 'cpf') {
      if (!cpf) {
        return res.status(400).json({
          success: false,
          error: 'CPF é obrigatório para pessoa física'
        });
      }
      if (!validarCPF(cpf)) {
        return res.status(400).json({
          success: false,
          error: 'CPF inválido'
        });
      }
    } else if (tipoPessoa === 'cnpj') {
      if (!cnpj) {
        return res.status(400).json({
          success: false,
          error: 'CNPJ é obrigatório para pessoa jurídica'
        });
      }
      if (!validarCNPJ(cnpj)) {
        return res.status(400).json({
          success: false,
          error: 'CNPJ inválido'
        });
      }
    }

    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) {
      return res.status(400).json({
        success: false,
        error: 'CEP deve ter 8 dígitos'
      });
    }

    if (!logradouro || !numero || !bairro || !cidade || !estado) {
      return res.status(400).json({
        success: false,
        error: 'Todos os campos de endereço são obrigatórios'
      });
    }

    // Verificar duplicidade de nome por cliente (case-insensitive)
    const nomeExistente = await prisma.destinatario.findFirst({
      where: { userId, nomeCompleto: { equals: nomeCompleto, mode: 'insensitive' }, ativo: true }
    });

    if (nomeExistente) {
      return res.status(409).json({ 
        success: false, 
        error: 'Já existe um destinatário com este nome para este cliente.' 
      });
    }

    const destinatario = await prisma.destinatario.create({
      data: {
        userId,
        nomeCompleto,
        tipoPessoa,
        cpf: tipoPessoa === 'cpf' ? cpf.replace(/\D/g, '') : null,
        cnpj: tipoPessoa === 'cnpj' ? cnpj.replace(/\D/g, '') : null,
        codigoCadastro: codigoCadastro || null,
        cep: cepLimpo,
        logradouro,
        numero,
        complemento: complemento || null,
        bairro,
        cidade,
        estado,
        pais: pais || 'Brasil',
        observacoes: observacoes || null,
        aceitaMotoCarAte100km: aceitaMotoCarAte100km || false
      }
    });

    res.status(201).json({
      success: true,
      data: destinatario
    });
  } catch (err) {
    console.error('Erro ao criar destinatário:', err);
    res.status(500).json({
      success: false,
      error: 'Erro ao criar destinatário'
    });
  }
};

export const atualizaDestinatario = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId || req.user?.id;
    const {
      nomeCompleto,
      tipoPessoa,
      cpf,
      cnpj,
      codigoCadastro,
      cep,
      logradouro,
      numero,
      complemento,
      bairro,
      cidade,
      estado,
      pais,
      observacoes,
      aceitaMotoCarAte100km
    } = req.body;

    const destinatario = await prisma.destinatario.findUnique({
      where: { id }
    });

    if (!destinatario || destinatario.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Destinatário não encontrado ou sem permissão'
      });
    }

    // Validar tipo de pessoa se foi alterado
    if (tipoPessoa) {
      if (!['cpf', 'cnpj'].includes(tipoPessoa)) {
        return res.status(400).json({
          success: false,
          error: 'Tipo de pessoa deve ser CPF ou CNPJ'
        });
      }

      // Validar CPF ou CNPJ conforme tipo
      if (tipoPessoa === 'cpf') {
        if (!cpf) {
          return res.status(400).json({
            success: false,
            error: 'CPF é obrigatório para pessoa física'
          });
        }
        if (!validarCPF(cpf)) {
          return res.status(400).json({
            success: false,
            error: 'CPF inválido'
          });
        }
      } else if (tipoPessoa === 'cnpj') {
        if (!cnpj) {
          return res.status(400).json({
            success: false,
            error: 'CNPJ é obrigatório para pessoa jurídica'
          });
        }
        if (!validarCNPJ(cnpj)) {
          return res.status(400).json({
            success: false,
            error: 'CNPJ inválido'
          });
        }
      }
    }

    // Verificar duplicidade de nome por cliente ao alterar (case-insensitive)
    if (nomeCompleto && nomeCompleto !== destinatario.nomeCompleto) {
      const nomeExistente = await prisma.destinatario.findFirst({
        where: { 
          userId, 
          id: { not: id },
          nomeCompleto: { equals: nomeCompleto, mode: 'insensitive' }, 
          ativo: true 
        }
      });

      if (nomeExistente) {
        return res.status(409).json({ 
          success: false, 
          error: 'Já existe um destinatário com este nome para este cliente.' 
        });
      }
    }

    const atualizado = await prisma.destinatario.update({
      where: { id },
      data: {
        nomeCompleto: nomeCompleto || destinatario.nomeCompleto,
        tipoPessoa: tipoPessoa || destinatario.tipoPessoa,
        cpf: tipoPessoa === 'cpf' && cpf ? cpf.replace(/\D/g, '') : destinatario.cpf,
        cnpj: tipoPessoa === 'cnpj' && cnpj ? cnpj.replace(/\D/g, '') : destinatario.cnpj,
        codigoCadastro: codigoCadastro !== undefined ? codigoCadastro : destinatario.codigoCadastro,
        cep: cep ? cep.replace(/\D/g, '') : destinatario.cep,
        logradouro: logradouro || destinatario.logradouro,
        numero: numero || destinatario.numero,
        complemento: complemento !== undefined ? complemento : destinatario.complemento,
        bairro: bairro || destinatario.bairro,
        cidade: cidade || destinatario.cidade,
        estado: estado || destinatario.estado,
        pais: pais || destinatario.pais,
        observacoes: observacoes !== undefined ? observacoes : destinatario.observacoes,
        aceitaMotoCarAte100km: aceitaMotoCarAte100km !== undefined ? aceitaMotoCarAte100km : destinatario.aceitaMotoCarAte100km
      }
    });

    res.json({
      success: true,
      data: atualizado
    });
  } catch (err) {
    console.error('Erro ao atualizar destinatário:', err);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar destinatário'
    });
  }
};

export const deletaDestinatario = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId || req.user?.id;

    const destinatario = await prisma.destinatario.findUnique({
      where: { id }
    });

    if (!destinatario || destinatario.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Destinatário não encontrado ou sem permissão'
      });
    }

    await prisma.destinatario.update({
      where: { id },
      data: { ativo: false }
    });

    res.json({
      success: true,
      message: 'Destinatário deletado com sucesso'
    });
  } catch (err) {
    console.error('Erro ao deletar destinatário:', err);
    res.status(500).json({
      success: false,
      error: 'Erro ao deletar destinatário'
    });
  }
};

export const buscaCEP = async (req, res) => {
  try {
    const { cep } = req.query;

    if (!cep || cep.replace(/\D/g, '').length !== 8) {
      return res.status(400).json({
        success: false,
        error: 'CEP inválido'
      });
    }

    const endereco = await buscarEnderecoPorCEP(cep);

    if (!endereco || endereco.erro) {
      return res.status(404).json({
        success: false,
        error: 'CEP não encontrado'
      });
    }

    res.json({
      success: true,
      data: endereco
    });
  } catch (err) {
    console.error('Erro ao buscar CEP:', err);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar CEP'
    });
  }
};
