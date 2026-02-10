/**
 * Validadores de Email
 * Não permite copiar/colar no segundo email para confirmação
 */

/**
 * Valida formato de email básico
 * @param {string} email - Email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  // Regex para validar email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Valida se dois emails são iguais
 * @param {string} email1 - Primeiro email
 * @param {string} email2 - Segundo email (confirmação)
 * @returns {object} - { isValid: boolean, error: string }
 */
export function validateEmailMatch(email1, email2) {
  if (!email1 || !email2) {
    return { isValid: false, error: 'Ambos os emails são obrigatórios' };
  }
  
  if (!isValidEmail(email1)) {
    return { isValid: false, error: 'Primeiro email inválido' };
  }
  
  if (!isValidEmail(email2)) {
    return { isValid: false, error: 'Segundo email inválido' };
  }
  
  if (email1.toLowerCase() !== email2.toLowerCase()) {
    return { isValid: false, error: 'Os emails não correspondem' };
  }
  
  return { isValid: true, error: '' };
}

/**
 * Normaliza email para comparação
 * @param {string} email - Email
 * @returns {string} - Email normalizado
 */
export function normalizeEmail(email) {
  return email.toLowerCase().trim();
}

/**
 * Valida força de senha
 * @param {string} password - Senha
 * @returns {object} - { isValid: boolean, strength: 'fraca'|'media'|'forte', errors: [] }
 */
export function validatePasswordStrength(password) {
  const errors = [];
  
  if (!password) {
    return { 
      isValid: false, 
      strength: 'fraca', 
      errors: ['Senha é obrigatória'] 
    };
  }
  
  if (password.length < 8) {
    errors.push('Mínimo 8 caracteres');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Deve conter letra maiúscula');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Deve conter letra minúscula');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Deve conter número');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Deve conter caractere especial');
  }
  
  let strength = 'fraca';
  if (errors.length <= 2) strength = 'media';
  if (errors.length === 0) strength = 'forte';
  
  return {
    isValid: errors.length === 0,
    strength,
    errors
  };
}

/**
 * Valida se duas senhas combinam
 * @param {string} password - Senha
 * @param {string} confirmPassword - Confirmação
 * @returns {object} - { isValid: boolean, error: string }
 */
export function validatePasswordMatch(password, confirmPassword) {
  if (!password || !confirmPassword) {
    return { isValid: false, error: 'Ambas as senhas são obrigatórias' };
  }
  
  if (password !== confirmPassword) {
    return { isValid: false, error: 'As senhas não correspondem' };
  }
  
  return { isValid: true, error: '' };
}
