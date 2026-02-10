import express from 'express';
import * as destinatarioController from '../controllers/destinatarioController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Lista destinatários
router.get('/', destinatarioController.listaDestinatarios);

// Buscar CEP (ViaCEP)
router.get('/cep', destinatarioController.buscaCEP);

// Criar destinatário
router.post('/', authenticateToken, destinatarioController.criaDestinatario);

// Atualizar destinatário
router.put('/:id', authenticateToken, destinatarioController.atualizaDestinatario);

// Deletar destinatário
router.delete('/:id', authenticateToken, destinatarioController.deletaDestinatario);

export default router;
