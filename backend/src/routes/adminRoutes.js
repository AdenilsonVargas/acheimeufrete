import express from 'express';
import * as adminController from '../controllers/adminController.js';
import { authenticateToken } from '../middleware/auth.js';
import { ensureAdmin } from '../middleware/admin.js';

const router = express.Router();

/**
 * ROTAS DE AUTORIZAÇÃO DE BOLETO
 */

// Listar solicitações de boleto
router.get('/boleto/solicitacoes', authenticateToken, ensureAdmin, adminController.listarSolicitacoesBoleto);

// Visualizar status de autorização do cliente
router.get('/boleto/cliente/:clienteId', authenticateToken, ensureAdmin, adminController.statusAutorizacaoCliente);

// Aprovar autorização de boleto
router.post('/boleto/:clienteId/aprovar', authenticateToken, ensureAdmin, adminController.aprovarBoleto);

// Rejeitar autorização de boleto
router.post('/boleto/:clienteId/rejeitar', authenticateToken, ensureAdmin, adminController.rejeitarBoleto);

/**
 * ROTAS DE APROVAÇÃO DE CADASTRO E DOCUMENTOS (Fase 10)
 */

// Listar usuários pendentes de verificação
router.get('/usuarios-pendentes', authenticateToken, ensureAdmin, adminController.getUsuariosPendentes);

// Obter detalhes de um usuário e seus documentos
router.get('/usuario/:id/documentos', authenticateToken, ensureAdmin, adminController.getUsuarioDetalhes);

// Aprovar cadastro de um usuário
router.put('/usuario/:id/aprovar', authenticateToken, ensureAdmin, adminController.aprovarCadastroUsuario);

// Rejeitar cadastro de um usuário
router.put('/usuario/:id/rejeitar', authenticateToken, ensureAdmin, adminController.rejeitarCadastroUsuario);

// Mudar status de um documento
router.put('/documento/:documentoId/status', authenticateToken, ensureAdmin, adminController.mudarStatusDocumento);

/**
 * ROTAS NOVAS: Aprovação de Cadastros (Fase 1)
 */

// Listar cadastros pendentes de aprovação
router.get('/cadastros/pendentes', authenticateToken, ensureAdmin, adminController.listarPendentesAprovacao);

// Obter detalhes completos de um cadastro
router.get('/cadastro/:userId', authenticateToken, ensureAdmin, adminController.getDetalheCadastro);

// Aprovar um cadastro
router.post('/cadastro/:userId/aprovar', authenticateToken, ensureAdmin, adminController.aprovarCadastro);

// Rejeitar um cadastro
router.post('/cadastro/:userId/rejeitar', authenticateToken, ensureAdmin, adminController.rejeitarCadastro);

export default router;
