import express from 'express';
import * as perfilController from '../controllers/perfilController.js';
import { authenticateToken } from '../middleware/auth.js';
import { ensureAdmin } from '../middleware/admin.js';

const router = express.Router();

/**
 * ROTAS DE PERFIL DO USUÁRIO
 */

// Obter perfil do usuário autenticado
router.get('/meu-perfil', authenticateToken, perfilController.getPerfil);

// Atualizar perfil do usuário autenticado
router.put('/meu-perfil', authenticateToken, perfilController.updatePerfil);

// Obter status dos documentos do usuário autenticado
router.get('/meus-documentos/status', authenticateToken, perfilController.getStatusDocumentos);

/**
 * ROTAS DE PERFIL PARA ADMIN
 */

// Obter perfil de um usuário específico
router.get('/usuario/:userId', authenticateToken, ensureAdmin, perfilController.getPerfilPorId);

// Obter estatísticas de aprovação
router.get('/estatisticas/aprovacao', authenticateToken, ensureAdmin, perfilController.getEstatisticasAprovacao);

export default router;
