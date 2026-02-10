/**
 * Stats Routes - Rotas para estatísticas da homepage
 */

import express from 'express';
import { getHomeStats, getEconomyStats } from '../controllers/statsController.js';

const router = express.Router();

/**
 * GET /api/stats/home
 * Retorna estatísticas para a homepage
 * Pública (sem autenticação necessária)
 */
router.get('/home', getHomeStats);

/**
 * GET /api/stats/economia
 * Retorna economia gerada na plataforma
 * Pública (sem autenticação necessária)
 */
router.get('/economia', getEconomyStats);

export default router;
