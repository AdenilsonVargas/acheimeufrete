/**
 * Validadores de CPF
 */

/**
 * Formata CPF: xxx.xxx.xxx-xx
 * @param {string} cpf - CPF sem formatação
 * @returns {string} - CPF formatado
 */
export function formatCPF(cpf) {
  const cleaned = cpf.replace(/\D/g, '');
  
  if (cleaned.length !== 11) {
    return '';
  }
  
  return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
}

/**
 * Valida CPF
 * Verifica formato, dígitos verificadores e se não é um CPF genérico
 * @param {string} cpf - CPF com ou sem formatação
 * @returns {boolean}
 */
export function isValidCPF(cpf) {
  if (!cpf || typeof cpf !== 'string') {
    return false;
  }
  
  // Remove formatação
  const cleaned = cpf.replace(/\D/g, '');
  
  // Deve ter 11 dígitos
  if (cleaned.length !== 11) {
    return false;
  }
  
  // Rejeita CPFs famosos (todos iguais)
  if (/^(\d)\1{10}$/.test(cleaned)) {
    return false;
  }
  
  // Calcula primeiro dígito verificador
  let sum = 0;
  let remainder;
  
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleaned.substring(i - 1, i)) * (11 - i);
  }
  
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.substring(9, 10))) return false;
  
  // Calcula segundo dígito verificador
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleaned.substring(i - 1, i)) * (12 - i);
  }
  
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.substring(10, 11))) return false;
  
  return true;
}

/**
 * Valida enquanto usuário digita
 * @param {string} cpf - CPF sendo digitado
 * @returns {object} - { isValid: boolean, formatted: string, error: string }
 */
export function validateCPFInput(cpf) {
  const cleaned = cpf.replace(/\D/g, '');
  
  if (cleaned.length === 0) {
    return { isValid: false, formatted: '', error: '' };
  }
  
  if (cleaned.length < 11) {
    return { isValid: false, formatted: cpf, error: '' };
  }
  
  if (cleaned.length > 11) {
    return { 
      isValid: false, 
      formatted: cpf, 
      error: 'CPF deve ter 11 dígitos' 
    };
  }
  
  if (!isValidCPF(cpf)) {
    return { 
      isValid: false, 
      formatted: formatCPF(cpf), 
      error: 'CPF inválido' 
    };
  }
  
  return { isValid: true, formatted: formatCPF(cpf), error: '' };
}

/**
 * Remove formatação do CPF
 * @param {string} cpf - CPF formatado
 * @returns {string} - CPF limpo
 */
export function cleanCPF(cpf) {
  return cpf.replace(/\D/g, '');
}
