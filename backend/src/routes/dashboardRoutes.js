import express from 'express';
import * as dashboardController from '../controllers/dashboardController.js';
import { authenticateToken } from '../middleware/auth.js';
import { ensureAdmin } from '../middleware/admin.js';

const router = express.Router();

/**
 * ROTAS DE DASHBOARDS FINANCEIROS
 */

// Dashboard do Embarcador - Contas a Pagar
router.get('/embarcador', authenticateToken, dashboardController.dashboardEmbarcador);

// Dashboard do Transportador - Contas a Receber
router.get('/transportador', authenticateToken, dashboardController.dashboardTransportador);

// Dashboard Admin - Visão Consolidada
router.get('/admin', authenticateToken, ensureAdmin, dashboardController.dashboardAdmin);

export default router;
