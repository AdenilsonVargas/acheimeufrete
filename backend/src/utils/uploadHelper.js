import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Diretório de uploads
const UPLOAD_DIR = path.join(__dirname, '../../uploads/documentos');

// Garantir que o diretório existe
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Tipos de documento permitidos e suas extensões
 */
export const DOCUMENT_TYPES_ALLOWED = {
  CPF: ['pdf', 'jpg', 'jpeg', 'png'],
  RG: ['pdf', 'jpg', 'jpeg', 'png'],
  CNH: ['pdf', 'jpg', 'jpeg', 'png'],
  CNPJ: ['pdf', 'jpg', 'jpeg', 'png'],
  CARTAO_CNPJ: ['pdf', 'jpg', 'jpeg', 'png'],
  CRLV: ['pdf', 'jpg', 'jpeg', 'png'],
  CIOT: ['pdf', 'jpg', 'jpeg', 'png'],
  COMPROVANTE_ENDERECO: ['pdf', 'jpg', 'jpeg', 'png'],
  RG_REPRESENTANTE: ['pdf', 'jpg', 'jpeg', 'png'],
  RG_GERENTE: ['pdf', 'jpg', 'jpeg', 'png'],
  CPF_RESPONSAVEL: ['pdf', 'jpg', 'jpeg', 'png'],
  CNH_RESPONSAVEL: ['pdf', 'jpg', 'jpeg', 'png'],
};

/**
 * MIME types permitidos
 */
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/jpg',
];

/**
 * Validar arquivo
 */
export const validateFile = (file, documentType) => {
  if (!file) {
    return { valid: false, error: 'Arquivo não fornecido' };
  }

  // Validar tamanho (10MB máx)
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_SIZE) {
    return { valid: false, error: `Arquivo muito grande (máx ${MAX_SIZE / 1024 / 1024}MB)` };
  }

  // Validar MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return { valid: false, error: 'Tipo de arquivo não permitido. Use PDF, JPG ou PNG.' };
  }

  // Validar extensão
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  const allowedExts = DOCUMENT_TYPES_ALLOWED[documentType];
  if (allowedExts && !allowedExts.includes(ext)) {
    return { valid: false, error: `Extensão não permitida para ${documentType}. Use: ${allowedExts.join(', ')}` };
  }

  return { valid: true };
};

/**
 * Salvar arquivo no disco
 */
export const saveFile = (file, userId, documentType) => {
  try {
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `${userId}_${documentType}_${Date.now()}${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    // Salvar arquivo
    fs.writeFileSync(filepath, file.buffer);

    // Retornar URL relativa
    const url = `/uploads/documentos/${filename}`;
    return { success: true, url, filename };
  } catch (error) {
    console.error('Erro ao salvar arquivo:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Processar múltiplos arquivos de um FormData
 */
export const processDocuments = (files, userId) => {
  const processedDocs = {};

  Object.entries(files).forEach(([fieldName, file]) => {
    // Extrair tipo de documento do nome do campo (documents_CPF → CPF)
    const match = fieldName.match(/documents_(.+)/);
    if (!match) return;

    const docType = match[1];

    // Validar arquivo
    const validation = validateFile(file, docType);
    if (!validation.valid) {
      processedDocs[docType] = { error: validation.error };
      return;
    }

    // Salvar arquivo
    const saved = saveFile(file, userId, docType);
    if (saved.success) {
      processedDocs[docType] = {
        url: saved.url,
        filename: saved.filename,
        mimetype: file.mimetype,
        size: file.size,
      };
    } else {
      processedDocs[docType] = { error: saved.error };
    }
  });

  return processedDocs;
};

/**
 * Deletar arquivo
 */
export const deleteFile = (filepath) => {
  try {
    const fullPath = path.join(__dirname, '../../', filepath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return { success: true };
    }
    return { success: false, error: 'Arquivo não encontrado' };
  } catch (error) {
    console.error('Erro ao deletar arquivo:', error);
    return { success: false, error: error.message };
  }
};
