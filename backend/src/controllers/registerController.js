/**
 * Função expandida: registerWithDocuments
 * Suporta todos os 4 tipos de usuário com upload de documentos
 * Adicione isto ao authController.js
 */

import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { processDocuments } from '../utils/uploadHelper.js';
import prisma from '../utils/prismaClient.js';

/**
 * NOVO ENDPOINT: Registro com suporte a FormData e documentos
 * POST /api/auth/register-new
 * 
 * Suporta 4 tipos de usuários:
 * 1. transportador_pj
 * 2. transportador_autonomo
 * 3. embarcador_cpf
 * 4. embarcador_cnpj
 */
export const registerWithDocuments = async (req, res) => {
  try {
    const { userType } = req.body;
    const files = req.files || {};

    console.log(`\n📝 NOVO REGISTRO: ${userType}`);
    console.log(`   Arquivos recebidos: ${Object.keys(files).length}`);

    // Validação básica
    if (!userType) {
      return res.status(400).json({ message: 'Tipo de usuário é obrigatório' });
    }

    if (!['transportador_pj', 'transportador_autonomo', 'embarcador_cpf', 'embarcador_cnpj'].includes(userType)) {
      return res.status(400).json({ message: 'Tipo de usuário inválido' });
    }

    // ====================================================================
    // TRANSPORTADOR PJ: 7 PASSOS
    // ====================================================================
    if (userType === 'transportador_pj') {
      const {
        razaoSocial,
        nomeFantasia,
        cnpj,
        inscricaoEstadual,
        endereco,
        nome,
        sobrenome,
        cpf,
        rg,
        cnhNumero,
        cnhVencimento,
        email,
        telefone,
        senha,
        quantidadeVeiculos,
        veiculo,
      } = req.body;

      // Validações
      if (!razaoSocial || !nomeFantasia || !cnpj || !email || !senha) {
        return res.status(400).json({ message: 'Campos obrigatórios faltando' });
      }

      // Verificar email
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email já cadastrado' });
      }

      // Hash de senha
      const senhaHash = await bcryptjs.hash(senha, 10);

      try {
        // Parse de JSON strings se necessário
        const enderecoData = typeof endereco === 'string' ? JSON.parse(endereco) : endereco;
        const veiculoData = typeof veiculo === 'string' ? JSON.parse(veiculo) : veiculo;

        // Criar usuário
        const user = await prisma.user.create({
          data: {
            email,
            password: senhaHash,
            telefone,
            userType: 'transportador_pj',
            nome: nome || razaoSocial,
            sobrenome: sobrenome || nomeFantasia,
            cpf,
            cnpj,
            inscricaoEstadual,
            statusCadastro: 'pendente_verificacao',

            // Perfil Transportadora
            perfilTransportadora: {
              create: {
                quantidadeVeiculos: parseInt(quantidadeVeiculos) || 1,
                statusDocumentos: 'pendente',
                statusVerificacao: 'pendente',
              },
            },

            // Endereço
            ...(enderecoData && {
              enderecos: {
                create: {
                  cep: enderecoData.cep,
                  logradouro: enderecoData.logradouro,
                  numero: enderecoData.numero,
                  complemento: enderecoData.complemento,
                  bairro: enderecoData.bairro,
                  cidade: enderecoData.cidade,
                  estado: enderecoData.estado,
                  tipo: 'comercial',
                  principal: true,
                },
              },
            }),

            // Veículo
            ...(veiculoData && {
              veiculos: {
                create: {
                  placa: veiculoData.placa,
                  tipo: veiculoData.tipo,
                  renavam: veiculoData.renavam,
                  dataVencimentoCRLV: new Date(veiculoData.crlvVencimento),
                  statusDocumentos: 'pendente',
                },
              },
            }),
          },
          include: {
            perfilTransportadora: true,
            veiculos: true,
          },
        });

        // Processas documentos
        const processedDocs = processDocuments(files, user.id);

        // Salvar documentos
        const requiredDocs = ['CARTAO_CNPJ', 'RG_RESPONSAVEL', 'CPF_RESPONSAVEL', 'CNH_RESPONSAVEL', 'CRLV', 'COMPROVANTE_ENDERECO'];
        const savedDocs = [];

        for (const docType of requiredDocs) {
          if (processedDocs[docType] && processedDocs[docType].url) {
            const doc = await prisma.documento.create({
              data: {
                userId: user.id,
                tipo: docType,
                url: processedDocs[docType].url,
                status: 'pendente_revisao',
              },
            });
            savedDocs.push(doc);
          }
        }

        console.log(`✅ Transportador PJ criado: ${email}`);
        console.log(`   Documentos salvos: ${savedDocs.length}/${requiredDocs.length}`);

        return res.status(201).json({
          success: true,
          message: 'Transportador PJ registrado com sucesso',
          user: {
            id: user.id,
            email: user.email,
            userType: user.userType,
            razaoSocial: user.nome,
          },
          documentsUploaded: savedDocs.length,
        });
      } catch (error) {
        console.error('Erro ao criar transportador PJ:', error);
        throw error;
      }
    }

    // ====================================================================
    // TRANSPORTADOR AUTÔNOMO: 7-8 PASSOS (CONDICIONAL CIOT)
    // ====================================================================
    if (userType === 'transportador_autonomo') {
      const {
        nome,
        sobrenome,
        cpf,
        rg,
        cnhNumero,
        cnhVencimento,
        endereco,
        email,
        telefone,
        senha,
        ciotNumero,
        ciotVencimento,
        veiculo,
      } = req.body;

      // Validações
      if (!nome || !cpf || !email || !senha || !cnhVencimento) {
        return res.status(400).json({ message: 'Campos obrigatórios faltando' });
      }

      // Verificar email
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email já cadastrado' });
      }

      // Hash de senha
      const senhaHash = await bcryptjs.hash(senha, 10);

      try {
        const enderecoData = typeof endereco === 'string' ? JSON.parse(endereco) : endereco;
        const veiculoData = typeof veiculo === 'string' ? JSON.parse(veiculo) : veiculo;

        // Criar usuário
        const user = await prisma.user.create({
          data: {
            email,
            password: senhaHash,
            telefone,
            userType: 'transportador_autonomo',
            nome,
            sobrenome,
            cpf,
            rg,
            cnhNumero,
            dataVencimentoCNH: new Date(cnhVencimento),
            statusCadastro: 'pendente_verificacao',

            // Perfil Transportadora
            perfilTransportadora: {
              create: {
                quantidadeVeiculos: 1,
                statusDocumentos: 'pendente',
                statusVerificacao: 'pendente',
              },
            },

            // Endereço residencial
            ...(enderecoData && {
              enderecos: {
                create: {
                  cep: enderecoData.cep,
                  logradouro: enderecoData.logradouro,
                  numero: enderecoData.numero,
                  complemento: enderecoData.complemento,
                  bairro: enderecoData.bairro,
                  cidade: enderecoData.cidade,
                  estado: enderecoData.estado,
                  tipo: 'residencial',
                  principal: true,
                },
              },
            }),

            // Veículo
            ...(veiculoData && {
              veiculos: {
                create: {
                  placa: veiculoData.placa,
                  tipo: veiculoData.tipo,
                  renavam: veiculoData.renavam,
                  dataVencimentoCRLV: new Date(veiculoData.crlvVencimento),
                  statusDocumentos: 'pendente',
                },
              },
            }),
          },
          include: {
            perfilTransportadora: true,
            veiculos: true,
          },
        });

        // Se emite CIOT, salvar dados
        if (ciotNumero && ciotVencimento) {
          await prisma.documento.create({
            data: {
              userId: user.id,
              tipo: 'CIOT',
              url: `ciot:${ciotNumero}`,
              dataVencimento: new Date(ciotVencimento),
              status: 'pendente_revisao',
            },
          });
        }

        // Processar documentos
        const processedDocs = processDocuments(files, user.id);
        const requiredDocs = ['CNH', 'RG', 'CPF', 'COMPROVANTE_ENDERECO'];
        const savedDocs = [];

        for (const docType of requiredDocs) {
          if (processedDocs[docType] && processedDocs[docType].url) {
            const doc = await prisma.documento.create({
              data: {
                userId: user.id,
                tipo: docType,
                url: processedDocs[docType].url,
                status: 'pendente_revisao',
              },
            });
            savedDocs.push(doc);
          }
        }

        console.log(`✅ Transportador Autônomo criado: ${email}`);
        console.log(`   CIOT: ${ciotNumero ? 'Sim' : 'Não'}`);
        console.log(`   Documentos salvos: ${savedDocs.length}/${requiredDocs.length}`);

        return res.status(201).json({
          success: true,
          message: 'Transportador Autônomo registrado com sucesso',
          user: {
            id: user.id,
            email: user.email,
            userType: user.userType,
            nome: user.nome,
          },
          ciotRegistered: !!ciotNumero,
          documentsUploaded: savedDocs.length,
        });
      } catch (error) {
        console.error('Erro ao criar transportador autônomo:', error);
        throw error;
      }
    }

    // ====================================================================
    // EMBARCADOR CPF: 5 PASSOS
    // ====================================================================
    if (userType === 'embarcador_cpf') {
      const { nome, sobrenome, cpf, rg, endereco, email, telefone, senha } = req.body;

      // Validações
      if (!nome || !cpf || !email || !senha) {
        return res.status(400).json({ message: 'Campos obrigatórios faltando' });
      }

      // Verificar email
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email já cadastrado' });
      }

      // Hash de senha
      const senhaHash = await bcryptjs.hash(senha, 10);

      try {
        const enderecoData = typeof endereco === 'string' ? JSON.parse(endereco) : endereco;

        // Criar usuário
        const user = await prisma.user.create({
          data: {
            email,
            password: senhaHash,
            telefone,
            userType: 'embarcador_cpf',
            nome,
            sobrenome,
            cpf,
            rg,
            statusCadastro: 'ok',

            // Perfil Cliente
            perfilCliente: {
              create: {
                tipoPessoa: 'cpf',
                statusDocumentos: 'pendente',
              },
            },

            // Endereço residencial
            ...(enderecoData && {
              enderecos: {
                create: {
                  cep: enderecoData.cep,
                  logradouro: enderecoData.logradouro,
                  numero: enderecoData.numero,
                  complemento: enderecoData.complemento,
                  bairro: enderecoData.bairro,
                  cidade: enderecoData.cidade,
                  estado: enderecoData.estado,
                  tipo: 'residencial',
                  principal: true,
                },
              },
            }),
          },
          include: {
            perfilCliente: true,
          },
        });

        // Processar documentos
        const processedDocs = processDocuments(files, user.id);
        const requiredDocs = ['CPF', 'RG', 'COMPROVANTE_ENDERECO'];
        const savedDocs = [];

        for (const docType of requiredDocs) {
          if (processedDocs[docType] && processedDocs[docType].url) {
            const doc = await prisma.documento.create({
              data: {
                userId: user.id,
                tipo: docType,
                url: processedDocs[docType].url,
                status: 'pendente_revisao',
              },
            });
            savedDocs.push(doc);
          }
        }

        console.log(`✅ Embarcador CPF criado: ${email}`);
        console.log(`   Documentos salvos: ${savedDocs.length}/${requiredDocs.length}`);

        return res.status(201).json({
          success: true,
          message: 'Embarcador (CPF) registrado com sucesso',
          user: {
            id: user.id,
            email: user.email,
            userType: user.userType,
            nome: user.nome,
          },
          documentsUploaded: savedDocs.length,
        });
      } catch (error) {
        console.error('Erro ao criar embarcador CPF:', error);
        throw error;
      }
    }

    // ====================================================================
    // EMBARCADOR CNPJ: 6 PASSOS
    // ====================================================================
    if (userType === 'embarcador_cnpj') {
      const {
        razaoSocial,
        nomeFantasia,
        cnpj,
        inscricaoEstadual,
        endereco,
        nomeRepresentante,
        sobrenomeRepresentante,
        email,
        telefone,
        senha,
        nomeContato,
        emailFaturamento,
        telefoneFaturamento,
      } = req.body;

      // Validações
      if (!razaoSocial || !cnpj || !email || !senha) {
        return res.status(400).json({ message: 'Campos obrigatórios faltando' });
      }

      // Verificar email
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email já cadastrado' });
      }

      // Hash de senha
      const senhaHash = await bcryptjs.hash(senha, 10);

      try {
        const enderecoData = typeof endereco === 'string' ? JSON.parse(endereco) : endereco;

        // Criar usuário
        const user = await prisma.user.create({
          data: {
            email,
            password: senhaHash,
            telefone,
            userType: 'embarcador_cnpj',
            nome: nomeRepresentante || razaoSocial,
            sobrenome: sobrenomeRepresentante || nomeFantasia,
            cnpj,
            inscricaoEstadual,
            statusCadastro: 'ok',

            // Perfil Cliente
            perfilCliente: {
              create: {
                tipoPessoa: 'cnpj',
                statusDocumentos: 'pendente',
              },
            },

            // Endereço comercial
            ...(enderecoData && {
              enderecos: {
                create: {
                  cep: enderecoData.cep,
                  logradouro: enderecoData.logradouro,
                  numero: enderecoData.numero,
                  complemento: enderecoData.complemento,
                  bairro: enderecoData.bairro,
                  cidade: enderecoData.cidade,
                  estado: enderecoData.estado,
                  tipo: 'comercial',
                  principal: true,
                },
              },
            }),
          },
          include: {
            perfilCliente: true,
          },
        });

        // Processar documentos
        const processedDocs = processDocuments(files, user.id);
        const requiredDocs = ['CARTAO_CNPJ', 'RG_REPRESENTANTE', 'COMPROVANTE_ENDERECO'];
        const savedDocs = [];

        for (const docType of requiredDocs) {
          if (processedDocs[docType] && processedDocs[docType].url) {
            const doc = await prisma.documento.create({
              data: {
                userId: user.id,
                tipo: docType,
                url: processedDocs[docType].url,
                status: 'pendente_revisao',
              },
            });
            savedDocs.push(doc);
          }
        }

        console.log(`✅ Embarcador CNPJ criado: ${email}`);
        console.log(`   Empresa: ${razaoSocial}`);
        console.log(`   Documentos salvos: ${savedDocs.length}/${requiredDocs.length}`);

        return res.status(201).json({
          success: true,
          message: 'Embarcador (CNPJ) registrado com sucesso',
          user: {
            id: user.id,
            email: user.email,
            userType: user.userType,
            razaoSocial: user.nome,
          },
          documentsUploaded: savedDocs.length,
        });
      } catch (error) {
        console.error('Erro ao criar embarcador CNPJ:', error);
        throw error;
      }
    }
  } catch (error) {
    console.error('Erro geral no registro:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao registrar usuário',
      error: error.message,
    });
  }
};

export default registerWithDocuments;
