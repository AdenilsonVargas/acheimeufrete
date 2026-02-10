import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { criarChat, enviarMensagem, obterChat } from '../src/controllers/chatController.js';

const prisma = new PrismaClient();

function mockRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
  };
}

async function ensureCotacao(embarcadorId) {
  const cotacao = await prisma.cotacao.create({
    data: {
      userId: embarcadorId,
      titulo: 'Teste Regras Chat',
      descricao: 'Verificar regras de horário e anexos',
      cepColeta: '01310-100',
      enderecoColeta: 'Av. Paulista, 1000',
      dataColeta: new Date(Date.now() + 24*60*60*1000),
      cepEntrega: '20040-020',
      enderecoEntrega: 'Av. Rio Branco, 456',
      dataEntrega: new Date(Date.now() + 48*60*60*1000),
      status: 'aberta',
    }
  });
  return cotacao;
}

async function run() {
  console.log('== Testes Regras de Chat ==');
  const embarcador = await prisma.user.findUnique({ where: { email: 'embarcador@test.com' } });
  const transportador = await prisma.user.findUnique({ where: { email: 'transportador@test.com' } });
  if (!embarcador || !transportador) throw new Error('Seed necessário');

  const cotacao = await ensureCotacao(embarcador.id);
  console.log('Cotacao ID:', cotacao.id, 'numero:', cotacao.numero);

  // 1) Transportador não pode abrir chat
  const reqCriarTransp = { body: { participantes: [embarcador.id, transportador.id], cotacaoId: cotacao.id }, user: { id: transportador.id, userType: 'transportador' } };
  const resCriarTransp = mockRes();
  await criarChat(reqCriarTransp, resCriarTransp);
  console.log('Transportador cria chat -> status:', resCriarTransp.statusCode); // deve ser 403

  // 2) Embarcador abre chat (assumindo hora atual < 17:00 local)
  const reqCriarEmb = { body: { participantes: [embarcador.id, transportador.id], cotacaoId: cotacao.id }, user: { id: embarcador.id, userType: 'embarcador' } };
  const resCriarEmb = mockRes();
  await criarChat(reqCriarEmb, resCriarEmb);
  console.log('Embarcador cria chat -> status:', resCriarEmb.statusCode);
  const chat = resCriarEmb.body;
  console.log('Chat criado:', chat && chat.id);

  // 3) Enviar mensagem texto enquanto ativo
  const reqMsgTexto = { params: { id: chat.id }, body: { conteudo: 'Mensagem de texto ativa' }, user: { id: embarcador.id, userType: 'embarcador' } };
  const resMsgTexto = mockRes();
  await enviarMensagem(reqMsgTexto, resMsgTexto);
  console.log('Mensagem texto -> status:', resMsgTexto.statusCode);

  // 4) Enviar anexo enquanto ativo
  const reqMsgArquivo = { params: { id: chat.id }, body: { arquivoUrl: 'https://files.example.com/doc.pdf', arquivoNome: 'doc.pdf', arquivoTipo: 'application/pdf' }, user: { id: transportador.id, userType: 'transportador' } };
  const resMsgArquivo = mockRes();
  await enviarMensagem(reqMsgArquivo, resMsgArquivo);
  console.log('Mensagem anexo -> status:', resMsgArquivo.statusCode);

  // 5) Fechar chat (simular expiração)
  await prisma.chat.update({ where: { id: chat.id }, data: { horaFechamento: new Date(Date.now() - 1000), statusChat: 'aberto' } });

  // 6) Tentar enviar após fechamento
  const reqMsgFechado = { params: { id: chat.id }, body: { conteudo: 'Após fechamento' }, user: { id: embarcador.id, userType: 'embarcador' } };
  const resMsgFechado = mockRes();
  await enviarMensagem(reqMsgFechado, resMsgFechado);
  console.log('Mensagem após 23:59 -> status:', resMsgFechado.statusCode); // deve ser 403

  // 7) Leitura do chat após fechamento
  const reqGet = { params: { id: chat.id }, user: { id: embarcador.id, userType: 'embarcador' } };
  const resGet = mockRes();
  await obterChat(reqGet, resGet);
  console.log('Obter chat após expiração -> status:', resGet.statusCode);
  console.log('Mensagens totais:', resGet.body && resGet.body.mensagens && resGet.body.mensagens.length);

  console.log('== Fim Testes Regras de Chat ==');
}

run().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
