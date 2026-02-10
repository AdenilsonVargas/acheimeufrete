import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurar storage
const storage = multer.memoryStorage(); // Armazenar em memória antes de processar

// Filtro de arquivos
const fileFilter = (req, file, cb) => {
  const ALLOWED_MIMES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  
  if (ALLOWED_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de arquivo não permitido: ${file.mimetype}`), false);
  }
};

// Configurar multer
const multerConfig = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10, // Máximo 10 arquivos
  },
});

// Middleware para upload único
export const uploadSingle = multerConfig.single('file');

// Middleware para múltiplos arquivos com nomes específicos
export const uploadDocuments = multerConfig.fields([
  { name: 'documents_CPF', maxCount: 1 },
  { name: 'documents_RG', maxCount: 1 },
  { name: 'documents_CNH', maxCount: 1 },
  { name: 'documents_CNPJ', maxCount: 1 },
  { name: 'documents_CARTAO_CNPJ', maxCount: 1 },
  { name: 'documents_CRLV', maxCount: 1 },
  { name: 'documents_CIOT', maxCount: 1 },
  { name: 'documents_COMPROVANTE_ENDERECO', maxCount: 1 },
  { name: 'documents_RG_REPRESENTANTE', maxCount: 1 },
  { name: 'documents_RG_GERENTE', maxCount: 1 },
  { name: 'documents_CPF_RESPONSAVEL', maxCount: 1 },
  { name: 'documents_CNH_RESPONSAVEL', maxCount: 1 },
]);

// Middleware de erro
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(400).json({ message: 'Arquivo muito grande (máximo 10MB)' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ message: 'Muitos arquivos enviados' });
    }
    return res.status(400).json({ message: err.message });
  }
  if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};

// Converter multer fields em objeto plano compatível com processDocuments
export const normalizeMulnerFiles = (req) => {
  const files = {};
  
  if (req.files && Object.keys(req.files).length > 0) {
    Object.entries(req.files).forEach(([fieldName, fileArray]) => {
      if (fileArray && fileArray.length > 0) {
        // Pegar o primeiro arquivo se houver múltiplos
        const file = fileArray[0];
        files[fieldName] = {
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          buffer: file.buffer,
        };
      }
    });
  }
  
  return files;
};
