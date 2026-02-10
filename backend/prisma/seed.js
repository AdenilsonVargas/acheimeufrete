import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Limpar dados existentes
  console.log('Limpando dados existentes...');
  
  await prisma.mensagem.deleteMany();
  await prisma.chat.deleteMany();
  await prisma.respostaCotacao.deleteMany();
  await prisma.cotacao.deleteMany();
  await prisma.pagamento.deleteMany();
  await prisma.endereco.deleteMany();
  await prisma.perfilTransportadora.deleteMany();
  await prisma.perfilCliente.deleteMany();
  await prisma.user.deleteMany();

  console.log('Criando usuários de teste...');

  // Criar usuário embarcador
  const senhaHash = await bcryptjs.hash('123456', 10);

  const embarcador = await prisma.user.create({
    data: {
      email: 'embarcador@test.com',
      password: senhaHash,
      telefone: '(11) 98765-4321',
      userType: 'embarcador',
      nomeCompleto: 'João Silva Embarcador',
      cpfOuCnpj: '123.456.789-01',
      nomeFantasia: 'Silva Logística',
      perfil: {
        create: {
          numeroTaxasAceitas: 15,
          taxaMedia: 8.5,
          avaliacaoMedia: 4.8,
        },
      },
      enderecos: {
        create: [
          {
            cep: '01310-100',
            logradouro: 'Avenida Paulista',
            numero: '1000',
            complemento: 'Sala 200',
            bairro: 'Bela Vista',
            cidade: 'São Paulo',
            estado: 'SP',
            tipo: 'principal',
            principal: true,
          },
        ],
      },
    },
  });

  console.log('Embarcador criado:', embarcador);

  // Criar usuário transportador PJ
  const transportadorPJ = await prisma.user.create({
    data: {
      email: 'transportador@test.com',
      password: senhaHash,
      telefone: '(11) 99999-8888',
      userType: 'transportador',
      tipoTransportador: 'pj',
      razaoSocial: 'Transportes Silva LTDA',
      cnpj: '12.345.678/0001-90',
      nomeResponsavel: 'Carlos Silva',
      perfilTransportadora: {
        create: {
          numeroFretes: 120,
          avaliacaoMedia: 4.9,
          statusVerificacao: 'verificado',
        },
      },
      enderecos: {
        create: [
          {
            cep: '02156-000',
            logradouro: 'Avenida Brasil',
            numero: '5000',
            bairro: 'Tatuapé',
            cidade: 'São Paulo',
            estado: 'SP',
            tipo: 'principal',
            principal: true,
          },
        ],
      },
    },
  });

  console.log('Transportador PJ criado:', transportadorPJ);

  // Criar usuário transportador Autônomo
  const transportadorAutonomo = await prisma.user.create({
    data: {
      email: 'autonomo@test.com',
      password: senhaHash,
      telefone: '(11) 97777-6666',
      userType: 'transportador',
      tipoTransportador: 'autonomo',
      cpf: '987.654.321-00',
      nomeResponsavel: 'Maria Santos',
      perfilTransportadora: {
        create: {
          numeroFretes: 45,
          avaliacaoMedia: 4.7,
          statusVerificacao: 'verificado',
        },
      },
      enderecos: {
        create: [
          {
            cep: '03103-000',
            logradouro: 'Rua Siqueira Campos',
            numero: '100',
            bairro: 'Belenzinho',
            cidade: 'São Paulo',
            estado: 'SP',
            tipo: 'principal',
            principal: true,
          },
        ],
      },
    },
  });

  console.log('Transportador Autônomo criado:', transportadorAutonomo);

  // Criar cotações de teste
  const cotacao = await prisma.cotacao.create({
    data: {
      userId: embarcador.id,
      titulo: 'Frete São Paulo - Rio de Janeiro',
      descricao: 'Transporte de máquinas industriais',
      cepColeta: '01310-100',
      enderecoColeta: 'Av. Paulista, 1000 - São Paulo, SP',
      dataColeta: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 dias
      cepEntrega: '20000-000',
      enderecoEntrega: 'Centro - Rio de Janeiro, RJ',
      peso: 500,
      altura: 2.5,
      largura: 1.5,
      profundidade: 1.5,
      valorEstimado: 2500,
      valorMinimo: 2000,
      valorMaximo: 3000,
      status: 'aberta',
    },
  });

  console.log('Cotação criada:', cotacao);

  // Criar respostas de cotação
  const resposta = await prisma.respostaCotacao.create({
    data: {
      cotacaoId: cotacao.id,
      transportadorId: transportadorPJ.id,
      valor: 2400,
      dataEntrega: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      descricao: 'Entrega rápida e segura',
    },
  });

  console.log('Resposta de cotação criada:', resposta);

  // Criar produtos para o embarcador
  const produto1 = await prisma.produto.create({
    data: {
      userId: embarcador.id,
      nome: 'Eletrônicos Frágeis',
      ncmCode: '84713090',
      ncmClassificacao: 'Eletrônicos',
      unidadeMedida: 'unidade',
      pesoKg: 5,
      larguraM: 0.5,
      alturaM: 0.5,
      comprimentoM: 0.5,
      valorUnitario: 1500,
      flags: ['fragil', 'delicado', 'alto_valor'],
      observacoes: 'Produto sensível - requer embalagem especial'
    }
  });

  const produto2 = await prisma.produto.create({
    data: {
      userId: embarcador.id,
      nome: 'Bebidas Perecíveis',
      ncmCode: '22021000',
      ncmClassificacao: 'Bebidas',
      unidadeMedida: 'unidade',
      pesoKg: 2,
      larguraM: 0.3,
      alturaM: 0.3,
      comprimentoM: 0.3,
      valorUnitario: 50,
      flags: ['perecivel', 'refrigerado', 'liquido'],
      observacoes: 'Manter refrigerado entre 2-8°C'
    }
  });

  console.log('Produtos criados:', produto1.id, produto2.id);

  // Criar destinatários para o embarcador
  const destinatario1 = await prisma.destinatario.create({
    data: {
      userId: embarcador.id,
      nomeCompleto: 'Empresa XYZ Ltda',
      cep: '01310100',
      logradouro: 'Av. Paulista',
      numero: '1000',
      complemento: 'Sala 500',
      bairro: 'Bela Vista',
      cidade: 'São Paulo',
      estado: 'SP',
      pais: 'Brasil',
      aceitaMotoCarAte100km: false
    }
  });

  console.log('Destinatário criado:', destinatario1.id);

  // Criar NCMs desativados para transportador
  const ncmDesativado = await prisma.nCMAtendido.create({
    data: {
      transportadorId: transportadorPJ.id,
      codigo: '38249090',
      descricao: 'Produtos Químicos',
      status: 'desativado'
    }
  });

  console.log('NCM desativado criado:', ncmDesativado.id);

  // Criar regiões desativadas para transportador
  const estadoDesativado = await prisma.regiaoAtendida.create({
    data: {
      transportadorId: transportadorPJ.id,
      tipoCobertura: 'estado',
      estado: 'RJ',
      status: 'desativado'
    }
  });

  const cepDesativado = await prisma.regiaoAtendida.create({
    data: {
      transportadorId: transportadorPJ.id,
      tipoCobertura: 'cepRange',
      cepInicio: '20000000',
      cepFim: '20999999',
      cidade: 'Rio de Janeiro',
      raioKm: 50,
      status: 'desativado'
    }
  });

  console.log('Regiões desativadas criadas:', estadoDesativado.id, cepDesativado.id);

  console.log('✅ Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
