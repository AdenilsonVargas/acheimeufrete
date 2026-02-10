import express from 'express';
import * as enderecoColetaController from '../controllers/enderecoColetaController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Lista endereços de coleta
router.get('/', authenticateToken, enderecoColetaController.listarEnderecosColeta);

// Buscar CEP (ViaCEP)
router.get('/cep/buscar', enderecoColetaController.buscarCEP);

// Obter endereço específico
router.get('/:id', authenticateToken, enderecoColetaController.obterEnderecoColeta);

// Criar endereço de coleta
router.post('/', authenticateToken, enderecoColetaController.criarEnderecoColeta);

// Atualizar endereço de coleta
router.put('/:id', authenticateToken, enderecoColetaController.atualizarEnderecoColeta);

// Marcar como padrão
router.patch('/:id/marcar-padrao', authenticateToken, enderecoColetaController.marcarComoPadrao);

// Deletar endereço de coleta
router.delete('/:id', authenticateToken, enderecoColetaController.deletarEnderecoColeta);

export default router;
