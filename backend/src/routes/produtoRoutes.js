import express from 'express';
import * as produtoController from '../controllers/produtoController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Lista produtos
router.get('/', produtoController.listaProdutos);

// Criar produto
router.post('/', authenticateToken, produtoController.criaProduto);

// Atualizar produto
router.put('/:id', authenticateToken, produtoController.atualizaProduto);

// Deletar produto
router.delete('/:id', authenticateToken, produtoController.deletaProduto);

export default router;
