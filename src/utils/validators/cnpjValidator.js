/**
 * Validadores de CNPJ
 */

/**
 * Formata CNPJ: xx.xxx.xxx/xxxx-xx
 * @param {string} cnpj - CNPJ sem formatação
 * @returns {string} - CNPJ formatado
 */
export function formatCNPJ(cnpj) {
  const cleaned = cnpj.replace(/\D/g, '');
  
  if (cleaned.length !== 14) {
    return '';
  }
  
  return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12)}`;
}

/**
 * Valida CNPJ
 * Verifica formato, dígitos verificadores
 * @param {string} cnpj - CNPJ com ou sem formatação
 * @returns {boolean}
 */
export function isValidCNPJ(cnpj) {
  if (!cnpj || typeof cnpj !== 'string') {
    return false;
  }
  
  // Remove formatação
  const cleaned = cnpj.replace(/\D/g, '');
  
  // Deve ter 14 dígitos
  if (cleaned.length !== 14) {
    return false;
  }
  
  // Rejeita CNPJs famosos (todos iguais)
  if (/^(\d)\1{13}$/.test(cleaned)) {
    return false;
  }
  
  // Calcula primeiro dígito verificador
  let size = cleaned.length - 2;
  let numbers = cleaned.substring(0, size);
  let digits = cleaned.substring(size);
  let sum = 0;
  let pos = size - 7;
  
  for (let i = size; i >= 1; i--) {
    sum += numbers.charAt(size - i) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let result = sum % 11 < 2 ? 0 : 11 - sum % 11;
  if (result !== parseInt(digits.charAt(0))) return false;
  
  // Calcula segundo dígito verificador
  size = size + 1;
  numbers = cleaned.substring(0, size);
  sum = 0;
  pos = size - 7;
  
  for (let i = size; i >= 1; i--) {
    sum += numbers.charAt(size - i) * pos--;
    if (pos < 2) pos = 9;
  }
  
  result = sum % 11 < 2 ? 0 : 11 - sum % 11;
  if (result !== parseInt(digits.charAt(1))) return false;
  
  return true;
}

/**
 * Valida enquanto usuário digita
 * @param {string} cnpj - CNPJ sendo digitado
 * @returns {object} - { isValid: boolean, formatted: string, error: string }
 */
export function validateCNPJInput(cnpj) {
  const cleaned = cnpj.replace(/\D/g, '');
  
  if (cleaned.length === 0) {
    return { isValid: false, formatted: '', error: '' };
  }
  
  if (cleaned.length < 14) {
    return { isValid: false, formatted: cnpj, error: '' };
  }
  
  if (cleaned.length > 14) {
    return { 
      isValid: false, 
      formatted: cnpj, 
      error: 'CNPJ deve ter 14 dígitos' 
    };
  }
  
  if (!isValidCNPJ(cnpj)) {
    return { 
      isValid: false, 
      formatted: formatCNPJ(cnpj), 
      error: 'CNPJ inválido' 
    };
  }
  
  return { isValid: true, formatted: formatCNPJ(cnpj), error: '' };
}

/**
 * Remove formatação do CNPJ
 * @param {string} cnpj - CNPJ formatado
 * @returns {string} - CNPJ limpo
 */
export function cleanCNPJ(cnpj) {
  return cnpj.replace(/\D/g, '');
}
