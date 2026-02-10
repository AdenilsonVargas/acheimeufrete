import express from 'express';
import { register, login, me, updateMe } from '../controllers/authController.js';
import { registerWithDocuments } from '../controllers/registerController.js';
import { authMiddleware } from '../middleware/auth.js';
import { uploadDocuments, handleUploadError, normalizeMulnerFiles } from '../middleware/multer.js';

const router = express.Router();

// Endpoints de autenticação
router.post('/register', register);
router.post('/login', login);
router.get('/me', authMiddleware, me);
router.put('/me', authMiddleware, updateMe);

/**
 * NOVO ENDPOINT: Registro com documentos (FormData)
 * POST /api/auth/register-new
 * 
 * Suporta multipart/form-data com:
 * - Campos de texto (nome, email, senha, etc)
 * - Múltiplos arquivos (documents_CPF, documents_RG, etc)
 */
router.post(
  '/register-new',
  uploadDocuments,
  handleUploadError,
  async (req, res, next) => {
    // Normalizar arquivos do multer para formato esperado
    req.files = normalizeMulnerFiles(req);
    next();
  },
  registerWithDocuments
);

export default router;
