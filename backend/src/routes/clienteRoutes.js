import express from 'express';
import * as clienteController from '../controllers/clienteController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * ROTAS PARA CLIENTES (EMBARCADORES)
 */

// Solicitar autorização para pagar via boleto
router.post('/boleto/solicitar', authenticateToken, clienteController.solicitarAutorizacaoBoleto);

// Obter meu status de autorização de boleto
router.get('/boleto/status', authenticateToken, clienteController.meuStatusBoleto);

export default router;
