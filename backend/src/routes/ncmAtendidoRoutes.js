import express from 'express';
import * as ncmController from '../controllers/ncmController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Rota compatível com o frontend: /api/ncm-atendido
// GET /api/ncm-atendido - Lista NCMs desativados (com filtros de query)
router.get('/', ncmController.listaNCMsDesativados);

// POST /api/ncm-atendido - Criar NCM desativado
router.post('/', authenticateToken, ncmController.criaNCMDesativado);

// DELETE /api/ncm-atendido/:id - Deletar NCM desativado (reativar)
router.delete('/:id', authenticateToken, ncmController.deletaNCMDesativado);

export default router;
