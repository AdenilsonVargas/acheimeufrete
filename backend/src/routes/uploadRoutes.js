import express from 'express';
import {
  uploadCTe,
  uploadCIOT,
  uploadMDFe,
  uploadCanhoto,
  uploadArquivoChat,
  obterDocumentos
} from '../controllers/uploadController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Aplicar middleware de autenticação
router.use(authMiddleware);

// Upload de CT-e
router.post('/cte', uploadCTe);

// Upload de CIOT
router.post('/ciot', uploadCIOT);

// Upload de MDF-e
router.post('/mdfe', uploadMDFe);

// Upload de Canhoto
router.post('/canhoto', uploadCanhoto);

// Upload de arquivo para chat
router.post('/chat', uploadArquivoChat);

// Obter todos os documentos de uma cotação
router.get('/cotacao/:cotacaoId', obterDocumentos);

export default router;
