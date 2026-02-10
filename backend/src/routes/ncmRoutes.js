import express from 'express';
import * as ncmController from '../controllers/ncmController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Busca inteligente de NCMs (mínimo 4 caracteres)
router.get('/search', ncmController.searchNCMs);

// Download da planilha de NCMs atualizada
router.get('/download/planilha', ncmController.downloadPlanilhaNcms);

// Lista NCMs desativados (transportadora)
router.get('/list', ncmController.listaNCMsDesativados);

// Toggle NCM (ativar/desativar)
router.post('/toggle', authenticateToken, ncmController.toggleNCM);

// Criar NCM desativado
router.post('/create', authenticateToken, ncmController.criaNCMDesativado);

// Deletar NCM desativado (reativar)
router.delete('/:id', authenticateToken, ncmController.deletaNCMDesativado);

export default router;
