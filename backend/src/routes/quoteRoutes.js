import express from 'express';
import * as quoteController from '../controllers/quoteController.js';

const router = express.Router();

/**
 * ROTAS DE FRASES MOTIVACIONAIS
 */

// Obter frase aleatória
router.get('/aleatoria', quoteController.obterFraseAleatoria);

// Listar todas as frases (com paginação)
router.get('/', quoteController.listarFrases);

export default router;
