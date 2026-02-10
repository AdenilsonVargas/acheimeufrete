import express from 'express';
import * as regioesController from '../controllers/regioesController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Lista regiões desativadas
router.get('/list', regioesController.listaRegioesDesativadas);

// Toggle estado (ativar/desativar)
router.post('/estado/toggle', authenticateToken, regioesController.toggleEstado);

// Criar CEP desativado
router.post('/cep/create', authenticateToken, regioesController.criaCEPDesativado);

// Deletar CEP desativado (reativar)
router.delete('/cep/:id', authenticateToken, regioesController.deletaCEPDesativado);

// Atualizar CEP desativado
router.put('/cep/:id', authenticateToken, regioesController.atualizaCEPDesativado);

export default router;
