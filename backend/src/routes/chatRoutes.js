import express from 'express';
import { 
  listarChats, 
  obterChat, 
  criarChat, 
  enviarMensagem,
  marcarComoLido
} from '../controllers/chatController.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Listar todos os chats do usuário (auth opcional)
router.get('/', optionalAuthMiddleware, listarChats);

// Obter um chat específico com mensagens (auth opcional)
router.get('/:id', optionalAuthMiddleware, obterChat);

// Criar novo chat (exige auth)
router.post('/', authMiddleware, criarChat);

// Enviar mensagem em um chat (exige auth)
router.post('/:id/mensagem', authMiddleware, enviarMensagem);

// Marcar mensagens como lidas (exige auth)
router.patch('/:id/lido', authMiddleware, marcarComoLido);

export default router;
