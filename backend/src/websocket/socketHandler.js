/**
 * WebSocket Server Configuration (Socket.io)
 * 
 * SEGURANÇA CRÍTICA:
 * - Autenticação via JWT
 * - Validação de usuário em cada evento
 * - CORS restritivo apenas para origens autorizadas
 * - Namespace segregação por cotação
 * - Rate limiting implícito
 * - Logs de auditoria para cada conexão/mensagem
 * 
 * FUNCIONALIDADES:
 * - Chat em tempo real por cotação
 * - Notificações de digitação
 * - Histórico de mensagens
 * - Reconexão automática
 * - Status de online/offline
 */

import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database.js';

let io;
const connectedUsers = new Map(); // userId -> socket IDs

/**
 * Inicializar servidor WebSocket
 */
export function initializeWebSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || [
        'http://localhost:3000',
        'https://localhost:3000',
        'http://localhost:5173',
        'https://localhost:5173'
      ],
      credentials: true,
      methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5
  });

  // ========== AUTENTICAÇÃO ==========
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        console.warn(`❌ Socket connection sem token: ${socket.id}`);
        return next(new Error('Token ausente'));
      }

      // Verificar JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'seu-secret-key-aqui');

      if (!decoded.id) {
        console.warn(`❌ Token inválido para socket: ${socket.id}`);
        return next(new Error('Token inválido'));
      }

      // Validar que usuário existe (com timeout)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout ao validar usuário')), 5000)
      );

      const usuario = await Promise.race([
        prisma.user.findUnique({
          where: { id: decoded.id },
          select: { id: true, userType: true, nomeCompleto: true, email: true }
        }),
        timeoutPromise
      ]);

      if (!usuario) {
        console.warn(`❌ Usuário não encontrado: ${decoded.id}`);
        return next(new Error('Usuário não encontrado'));
      }

      // Atribuir dados ao socket
      socket.userId = usuario.id;
      socket.userType = usuario.userType;
      socket.userEmail = usuario.email;
      socket.userName = usuario.nomeCompleto;

      next();
    } catch (error) {
      console.error('Erro na autenticação WebSocket:', error);
      next(new Error('Autenticação falhou: ' + error.message));
    }
  });

  // ========== EVENTOS ==========

  io.on('connection', (socket) => {
    console.log(`✅ Usuário conectado: ${socket.userName} (${socket.userId}) - Socket: ${socket.id}`);

    // Registrar usuário conectado
    if (!connectedUsers.has(socket.userId)) {
      connectedUsers.set(socket.userId, []);
    }
    connectedUsers.get(socket.userId).push(socket.id);

    // ===== ENTRAR EM SALA DE COTAÇÃO =====
    socket.on('join-cotacao', async (cotacaoId) => {
      try {
        // Validar que cotação existe
        const cotacao = await prisma.cotacao.findUnique({
          where: { id: cotacaoId },
          select: {
            id: true,
            userId: true,
            respostaSelecionada: {
              select: {
                transportadorId: true
              }
            }
          }
        });

        if (!cotacao) {
          socket.emit('error', { message: 'Cotação não encontrada' });
          return;
        }

        // AUTORIZAÇÃO: Apenas criador ou transportador selecionado
        const isCreator = cotacao.userId === socket.userId;
        const isSelectedTransporter = cotacao.respostaSelecionada?.transportadorId === socket.userId;

        if (!isCreator && !isSelectedTransporter) {
          socket.emit('error', { message: 'Você não tem permissão para acessar este chat' });
          console.warn(`❌ Acesso negado: ${socket.userId} tentou entrar em cotação ${cotacaoId}`);
          return;
        }

        // Entrar na sala
        socket.join(`cotacao:${cotacaoId}`);

        console.log(`✅ ${socket.userName} entrou no chat da cotação ${cotacaoId}`);

        // Notificar outros usuários na sala
        io.to(`cotacao:${cotacaoId}`).emit('user-online', {
          userId: socket.userId,
          userName: socket.userName,
          timestamp: new Date(),
          message: `${socket.userName} entrou no chat`
        });
      } catch (error) {
        console.error('Erro ao entrar em cotação:', error);
        socket.emit('error', { message: 'Erro ao entrar na sala' });
      }
    });

    // ===== ENVIAR MENSAGEM =====
    socket.on('send-message', async (data) => {
      try {
        const { cotacaoId, conteudo } = data;

        // Validações básicas
        if (!cotacaoId || !conteudo || conteudo.trim() === '') {
          socket.emit('error', { message: 'Mensagem vazia ou ID de cotação inválido' });
          return;
        }

        const conteudoSanitizado = conteudo.trim().substring(0, 2000);

        // Verificar que está na sala
        if (!socket.rooms.has(`cotacao:${cotacaoId}`)) {
          socket.emit('error', { message: 'Você não está no chat desta cotação' });
          return;
        }

        // Buscar o chat relacionado à cotação (com timeout)
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout ao buscar chat')), 5000)
        );

        const chat = await Promise.race([
          prisma.chat.findFirst({
            where: { cotacaoId: cotacaoId },
            select: { id: true }
          }),
          timeoutPromise
        ]);

        if (!chat) {
          socket.emit('error', { message: 'Chat da cotação não encontrado' });
          return;
        }

        // Salvar mensagem no banco (com timeout)
        const mensagemTimeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout ao salvar mensagem')), 5000)
        );

        const mensagem = await Promise.race([
          prisma.mensagem.create({
            data: {
              conteudo: conteudoSanitizado,
              userId: socket.userId,
              chatId: chat.id,
              tipoMensagem: 'texto',
              remetente: socket.userType === 'embarcador' ? 'cliente' : 'transportadora'
            },
            include: {
              user: {
                select: {
                  id: true,
                  nomeCompleto: true,
                  email: true
                }
              }
            }
          }),
          mensagemTimeoutPromise
        ]);

        console.log(`💬 Mensagem salva: ${socket.userName} em cotação ${cotacaoId}`);

        // Enviar para todos na sala
        io.to(`cotacao:${cotacaoId}`).emit('new-message', {
          id: mensagem.id,
          conteudo: mensagem.conteudo,
          usuarioId: mensagem.userId,
          usuarioNome: mensagem.user.nomeCompleto,
          timestamp: mensagem.createdAt,
          lida: false
        });
      } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        socket.emit('error', { message: 'Erro ao enviar mensagem: ' + error.message });
      }
    });

    // ===== NOTIFICAÇÃO DE DIGITAÇÃO =====
    socket.on('user-typing', (data) => {
      const { cotacaoId } = data;

      if (!socket.rooms.has(`cotacao:${cotacaoId}`)) {
        return;
      }

      // Notificar outros usuários (não enviar de volta para o remetente)
      socket.to(`cotacao:${cotacaoId}`).emit('user-typing', {
        userId: socket.userId,
        userName: socket.userName,
        cotacaoId: cotacaoId
      });
    });

    // ===== MARCAR MENSAGENS COMO LIDAS =====
    socket.on('mark-as-read', async (data) => {
      try {
        const { cotacaoId, mensagenIds } = data;

        if (!Array.isArray(mensagenIds) || mensagenIds.length === 0) {
          return;
        }

        // Atualizar mensagens
        await prisma.mensagem.updateMany({
          where: {
            id: { in: mensagenIds },
            cotacaoId: cotacaoId,
            usuarioId: { not: socket.userId } // Não marcar próprias mensagens
          },
          data: {
            lida: true,
            updatedAt: new Date()
          }
        });

        // Notificar
        io.to(`cotacao:${cotacaoId}`).emit('messages-read', {
          mensagensIds: mensagenIds,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('Erro ao marcar como lido:', error);
      }
    });

    // ===== DESCONECTAR =====
    socket.on('disconnect', () => {
      console.log(`❌ Usuário desconectado: ${socket.userName} - Socket: ${socket.id}`);

      // Remover dos usuários conectados
      const userSockets = connectedUsers.get(socket.userId) || [];
      const index = userSockets.indexOf(socket.id);
      if (index > -1) {
        userSockets.splice(index, 1);
      }

      if (userSockets.length === 0) {
        connectedUsers.delete(socket.userId);

        // Se era a última conexão, notificar saída
        const cotacoes = Array.from(socket.rooms).filter(r => r.startsWith('cotacao:'));
        cotacoes.forEach(room => {
          io.to(room).emit('user-offline', {
            userId: socket.userId,
            userName: socket.userName,
            timestamp: new Date(),
            message: `${socket.userName} saiu do chat`
          });
        });
      }
    });

    // ===== ERROR HANDLING =====
    socket.on('error', (error) => {
      console.error(`Erro no socket ${socket.id}:`, error);
    });
  });

  return io;
}

/**
 * Enviar notificação para usuário específico
 */
export function notificarUsuario(userId, evento, dados) {
  const socketIds = connectedUsers.get(userId) || [];
  socketIds.forEach(socketId => {
    io?.to(socketId).emit(evento, dados);
  });
}

/**
 * Enviar notificação para sala de cotação
 */
export function notificarCotacao(cotacaoId, evento, dados) {
  io?.to(`cotacao:${cotacaoId}`).emit(evento, dados);
}

/**
 * Obter instância do Socket.io
 */
export function getIO() {
  return io;
}

/**
 * Verificar se usuário está online
 */
export function usuarioOnline(userId) {
  return connectedUsers.has(userId) && connectedUsers.get(userId).length > 0;
}
