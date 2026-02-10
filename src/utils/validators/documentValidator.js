/**
 * Validadores de Documentos
 */

const VALID_DOCUMENT_TYPES = {
  CPF: { name: 'CPF', mimeTypes: ['application/pdf', 'image/png', 'image/jpeg'] },
  RG: { name: 'RG', mimeTypes: ['application/pdf', 'image/png', 'image/jpeg'] },
  CNH: { name: 'CNH', mimeTypes: ['application/pdf', 'image/png', 'image/jpeg'] },
  CNPJ: { name: 'CNPJ', mimeTypes: ['application/pdf', 'image/png', 'image/jpeg'] },
  CRLV: { name: 'CRLV', mimeTypes: ['application/pdf', 'image/png', 'image/jpeg'] },
  CIOT: { name: 'CIOT', mimeTypes: ['application/pdf', 'image/png', 'image/jpeg'] },
  COMPROVANTE_ENDERECO: { name: 'Comprovante de Endereço', mimeTypes: ['application/pdf', 'image/png', 'image/jpeg'] },
  CARTAO_CNPJ: { name: 'Cartão CNPJ', mimeTypes: ['application/pdf', 'image/png', 'image/jpeg'] },
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Valida arquivo para upload
 * @param {File} file - Arquivo
 * @param {string} documentType - Tipo de documento esperado
 * @returns {object} - { isValid: boolean, error: string }
 */
export function validateDocument(file, documentType) {
  if (!file) {
    return { isValid: false, error: 'Arquivo é obrigatório' };
  }
  
  // Valida tipo de documento
  if (!VALID_DOCUMENT_TYPES[documentType]) {
    return { isValid: false, error: 'Tipo de documento inválido' };
  }
  
  // Valida tipo MIME
  const allowedMimes = VALID_DOCUMENT_TYPES[documentType].mimeTypes;
  if (!allowedMimes.includes(file.type)) {
    return { 
      isValid: false, 
      error: `Tipo de arquivo não permitido. Use: ${allowedMimes.map(m => m.split('/')[1]).join(', ')}` 
    };
  }
  
  // Valida tamanho
  if (file.size > MAX_FILE_SIZE) {
    return { 
      isValid: false, 
      error: `Arquivo muito grande. Máximo: 10MB` 
    };
  }
  
  // Valida nome do arquivo (sem caracteres especiais que causem problemas)
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  if (sanitizedName.length > 255) {
    return { 
      isValid: false, 
      error: 'Nome do arquivo muito longo' 
    };
  }
  
  return { isValid: true, error: '' };
}

/**
 * Valida data de vencimento de documento
 * @param {Date|string} dataVencimento - Data de vencimento
 * @returns {object} - { isValid: boolean, status: 'valido'|'vencido'|'proxima_vencimento', diasRestantes: number }
 */
export function validateDocumentExpiration(dataVencimento) {
  if (!dataVencimento) {
    return { isValid: false, status: 'invalido', diasRestantes: -1 };
  }
  
  const vencimento = new Date(dataVencimento);
  const hoje = new Date();
  
  // Remove horário para comparação
  hoje.setHours(0, 0, 0, 0);
  vencimento.setHours(0, 0, 0, 0);
  
  const diasRestantes = Math.ceil((vencimento - hoje) / (1000 * 60 * 60 * 24));
  
  if (diasRestantes < 0) {
    return { isValid: false, status: 'vencido', diasRestantes: 0 };
  }
  
  if (diasRestantes < 30) {
    return { isValid: true, status: 'proxima_vencimento', diasRestantes };
  }
  
  return { isValid: true, status: 'valido', diasRestantes };
}

/**
 * Formata data para input date
 * @param {Date|string} data - Data
 * @returns {string} - Data formatada como yyyy-MM-dd
 */
export function formatDateForInput(data) {
  if (!data) return '';
  
  const date = new Date(data);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Formata data para exibição
 * @param {Date|string} data - Data
 * @returns {string} - Data formatada como dd/MM/yyyy
 */
export function formatDateForDisplay(data) {
  if (!data) return '';
  
  const date = new Date(data);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
}

/**
 * Verifica se documento está vencido
 * @param {Date|string} dataVencimento - Data de vencimento
 * @returns {boolean}
 */
export function isDocumentExpired(dataVencimento) {
  const { status } = validateDocumentExpiration(dataVencimento);
  return status === 'vencido';
}

/**
 * Retorna tipos de documento válidos
 * @returns {object}
 */
export function getValidDocumentTypes() {
  return VALID_DOCUMENT_TYPES;
}
