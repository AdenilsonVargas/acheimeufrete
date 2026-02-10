import express from 'express';
import { obterMinhasDashMetricas, obterMetricasUsuario } from '../controllers/metricsController.js';
import { authenticateToken } from '../middleware/auth.js';
import { ensureAdmin } from '../middleware/admin.js';

const router = express.Router();

/**
 * ROTAS DE MÉTRICAS DO DASHBOARD
 * 
 * SEGURANÇA:
 * - GET /metrics/meu-dashboard: Apenas usuário autenticado pode acessar suas próprias métricas
 * - GET /metrics/usuario/:userId: Apenas admin pode acessar métricas de outros usuários (auditoria)
 */

// Obter métricas do próprio usuário (transportador ou embarcador)
router.get('/meu-dashboard', authenticateToken, obterMinhasDashMetricas);

// Admin obter métricas de um usuário específico (auditoria)
router.get('/usuario/:userId', authenticateToken, ensureAdmin, obterMetricasUsuario);

export default router;
