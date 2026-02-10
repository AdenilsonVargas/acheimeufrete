import express from 'express';
import {
  listarEnderecos,
  obterEndereco,
  criarEndereco,
  atualizarEndereco,
  deletarEndereco,
} from '../controllers/enderecoController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Aplicar middleware de autenticação
router.use(authMiddleware);

// Listar endereços
router.get('/', listarEnderecos);

// Obter endereço específico
router.get('/:id', obterEndereco);

// Criar endereço
router.post('/', criarEndereco);

// Atualizar endereço
router.put('/:id', atualizarEndereco);

// Deletar endereço
router.delete('/:id', deletarEndereco);

export default router;
