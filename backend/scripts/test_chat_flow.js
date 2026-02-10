import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import {
  listarChats,
  obterChat,
  criarChat,
  enviarMensagem,
  marcarComoLido,
} from '../src/controllers/chatController.js';

const prisma = new PrismaClient();

function mockRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

async function run() {
  console.log('== Iniciando testes de fluxo de chat (controllers) ==');

  // Obter usuários de teste
  const embarcador = await prisma.user.findUnique({ where: { email: 'embarcador@test.com' } });
  const transportador = await prisma.user.findUnique({ where: { email: 'transportador@test.com' } });

  if (!embarcador || !transportador) {
    throw new Error('Usuários de teste não encontrados. Execute o seed primeiro.');
  }

  console.log('Embarcador:', embarcador.id);
  console.log('Transportador:', transportador.id);

  // Garantir chat existente
  let chat = await prisma.chat.findFirst({
    where: {
      AND: [
        { participantes: { has: embarcador.id } },
        { participantes: { has: transportador.id } },
      ],
    },
  });
  if (!chat) {
    const reqCriar = {
      body: { participantes: [embarcador.id, transportador.id] },
      user: { id: embarcador.id, userType: 'embarcador' },
    };
    const resCriar = mockRes();
    await criarChat(reqCriar, resCriar);
    if (resCriar.statusCode >= 400) {
      console.log('criarChat bloqueado (regra de horário ou permissão):', resCriar.body);
      // Cria chat diretamente para continuar o fluxo de teste
      const agora = new Date();
      const fechamento = new Date(agora);
      fechamento.setHours(23, 59, 59, 999);
      chat = await prisma.chat.create({
        data: {
          participantes: [embarcador.id, transportador.id],
          horaAbertura: agora,
          horaFechamento: fechamento,
          statusChat: 'aberto',
          clienteId: embarcador.id,
          transportadoraId: transportador.id,
        },
      });
    } else {
      chat = resCriar.body;
    }
  }
  console.log('Chat ID:', chat.id);

  // Listar chats para embarcador (via query.usuarioId)
  const reqList = { query: { usuarioId: embarcador.id } };
  const resList = mockRes();
  await listarChats(reqList, resList);
  console.log('listarChats(status):', resList.statusCode);
  console.log('listarChats(count):', Array.isArray(resList.body) ? resList.body.length : resList.body);

  // Enviar mensagem como embarcador
  const reqMsg = {
    params: { id: chat.id },
    body: { conteudo: 'Mensagem de teste automatizada (controller)' },
    user: { id: embarcador.id, userType: 'embarcador' },
  };
  const resMsg = mockRes();
  await enviarMensagem(reqMsg, resMsg);
  console.log('enviarMensagem(status):', resMsg.statusCode);
  console.log('enviarMensagem(body):', resMsg.body && { id: resMsg.body.id, chatId: resMsg.body.chatId, conteudo: resMsg.body.conteudo });

  // Obter chat completo
  const reqGet = { params: { id: chat.id }, user: { id: embarcador.id, userType: 'embarcador' } };
  const resGet = mockRes();
  await obterChat(reqGet, resGet);
  console.log('obterChat(status):', resGet.statusCode);
  console.log('obterChat(mensagens):', resGet.body && Array.isArray(resGet.body.mensagens) ? resGet.body.mensagens.length : null);

  // Marcar como lido
  const reqLido = { params: { id: chat.id }, user: { id: embarcador.id, userType: 'embarcador' } };
  const resLido = mockRes();
  await marcarComoLido(reqLido, resLido);
  console.log('marcarComoLido(status):', resLido.statusCode);
  console.log('marcarComoLido(body):', resLido.body);

  console.log('== Testes concluídos ==');
}

run()
  .catch((e) => {
    console.error('Erro nos testes:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
