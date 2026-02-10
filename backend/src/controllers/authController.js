import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prismaClient.js';

const generateToken = (userId, userType) => {
  return jwt.sign(
    { userId, userType },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRATION || '7d' }
  );
};

export const register = async (req, res) => {
  try {
    const {
      email,
      password,
      telefone,
      userType,
      // Embarcador
      nomeCompleto,
      cpfOuCnpj,
      nomeFantasia,
      // Transportador
      tipoTransportador,
      razaoSocial,
      cnpj,
      cpf,
      inscricaoEstadual,
      nomeResponsavel,
      // Endereço
      cep,
      logradouro,
      numero,
      complemento,
      bairro,
      cidade,
      estado,
    } = req.body;

    // Validações básicas
    if (!email || !password || !userType) {
      return res.status(400).json({ message: 'Email, senha e tipo de usuário são obrigatórios' });
    }

    // Verifica se email já existe
    const usuarioExistente = await prisma.user.findUnique({
      where: { email },
    });

    if (usuarioExistente) {
      return res.status(400).json({ message: 'Email já está cadastrado' });
    }

    // Hash da senha
    const senhaHash = await bcryptjs.hash(password, 10);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        email,
        password: senhaHash,
        telefone,
        userType,
        nomeCompleto,
        cpfOuCnpj,
        nomeFantasia,
        tipoTransportador,
        razaoSocial,
        cnpj,
        cpf,
        inscricaoEstadual,
        nomeResponsavel,
        // Criar perfil baseado no tipo
        ...(userType === 'embarcador' && {
          perfil: {
            create: {},
          },
        }),
        ...(userType === 'transportador' && {
          perfilTransportadora: {
            create: {
              statusVerificacao: 'pendente',
            },
          },
        }),
        // Criar endereço se fornecido
        ...(cep && {
          enderecos: {
            create: {
              cep,
              logradouro,
              numero,
              complemento,
              bairro,
              cidade,
              estado,
              tipo: 'principal',
              principal: true,
            },
          },
        }),
      },
      include: {
        perfil: true,
        perfilTransportadora: true,
      },
    });

    // Gerar token
    const token = generateToken(user.id, user.userType);

    return res.status(201).json({
      message: 'Usuário registrado com sucesso',
      token,
      user: {
        id: user.id,
        email: user.email,
        userType: user.userType,
        nomeCompleto: user.nomeCompleto,
        razaoSocial: user.razaoSocial,
      },
    });
  } catch (error) {
    console.error('Erro ao registrar:', error);
    return res.status(500).json({ message: 'Erro ao registrar usuário', error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password, selectedUserType } = req.body;
    
    console.log(`\n🔍 LOGIN DEBUG:`, { email, password: password ? '***' : 'undefined', selectedUserType });

    if (!email || !password) {
      return res.status(400).json({ message: 'Email e senha são obrigatórios' });
    }

    // SE selectedUserType foi fornecido, validar
    if (selectedUserType && !['embarcador', 'transportador'].includes(selectedUserType)) {
      return res.status(400).json({ message: 'Tipo de usuário inválido' });
    }

    // Encontrar usuário
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        perfil: true,
        perfilTransportadora: true,
      },
    });

    if (!user) {
      return res.status(401).json({ message: 'Email ou senha incorretos' });
    }

    // 🔐 VALIDAR selectedUserType - Novo fluxo de seleção de tipo
    if (selectedUserType) {
      console.log(`👤 Login com seleção de tipo - Email: ${email}, Selecionado: ${selectedUserType}, UserType no DB: ${user.userType}`);
      
      // Validar se o usuário TEM essa role
      if (selectedUserType === 'transportador' && user.userType !== 'transportador') {
        console.warn(`❌ Acesso negado: usuário ${email} tentou acessar como transportador mas é ${user.userType}`);
        return res.status(403).json({ 
          message: `Você não tem uma conta de transportador. Sua conta é de ${user.userType}.`,
          availableUserTypes: [user.userType]
        });
      }

      if (selectedUserType === 'embarcador' && user.userType !== 'embarcador') {
        console.warn(`❌ Acesso negado: usuário ${email} tentou acessar como embarcador mas é ${user.userType}`);
        return res.status(403).json({ 
          message: `Você não tem uma conta de embarcador. Sua conta é de ${user.userType}.`,
          availableUserTypes: [user.userType]
        });
      }
    }

    // Verificar senha
    const senhaValida = await bcryptjs.compare(password, user.password);

    if (!senhaValida) {
      return res.status(401).json({ message: 'Email ou senha incorretos' });
    }

    // 🔐 Se selectedUserType foi fornecido, usar; senão usar userType do DB
    const finalUserType = selectedUserType || user.userType;
    const token = generateToken(user.id, finalUserType);

    console.log(`✅ Login bem-sucedido para ${email} como ${finalUserType}`);

    return res.json({
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: user.id,
        email: user.email,
        userType: user.userType,
        selectedUserType: finalUserType,
        nomeCompleto: user.nomeCompleto,
        razaoSocial: user.razaoSocial,
        telefone: user.telefone,
      },
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    return res.status(500).json({ message: 'Erro ao fazer login', error: error.message });
  }
};

export const me = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: {
        perfil: true,
        perfilTransportadora: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        userType: user.userType,
        nomeCompleto: user.nomeCompleto,
        razaoSocial: user.razaoSocial,
        telefone: user.telefone,
        cpf: user.cpf,
        cnpj: user.cnpj,
        cpfOuCnpj: user.cpfOuCnpj,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return res.status(500).json({ message: 'Erro ao buscar usuário' });
  }
};

/**
 * Atualizar dados do perfil do usuário autenticado
 */
export const updateMe = async (req, res) => {
  try {
    const userId = req.userId;
    const { nomeCompleto, telefone, razaoSocial, fotoPerfil } = req.body;

    const updateData = {};
    
    if (nomeCompleto) updateData.nomeCompleto = nomeCompleto;
    if (telefone) updateData.telefone = telefone;
    if (razaoSocial) updateData.razaoSocial = razaoSocial;
    if (fotoPerfil) updateData.fotoPerfil = fotoPerfil;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        nomeCompleto: true,
        telefone: true,
        userType: true,
        cpfOuCnpj: true,
        razaoSocial: true,
        fotoPerfil: true,
        statusCadastro: true
      }
    });

    res.json({
      message: 'Perfil atualizado com sucesso',
      user
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ message: 'Erro ao atualizar perfil' });
  }
};
