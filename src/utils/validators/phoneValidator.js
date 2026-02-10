/**
 * Validadores de Telefone
 * Formato esperado: (xx) xxxxx-xxxx
 */

/**
 * Formata telefone para o padrão brasileiro
 * @param {string} phone - Telefone sem formatação
 * @returns {string} - Telefone formatado (xx) xxxxx-xxxx
 */
export function formatPhone(phone) {
  // Remove tudo que não é número
  const cleaned = phone.replace(/\D/g, '');
  
  // Se não tem 11 dígitos, retorna vazio
  if (cleaned.length !== 11) {
    return '';
  }
  
  // Formata: (xx) xxxxx-xxxx
  return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
}

/**
 * Valida silenciosamente enquanto o usuário digita
 * @param {string} phone - Telefone sendo digitado
 * @returns {object} - { isValid: boolean, formatted: string, error: string }
 */
export function validatePhoneInput(phone) {
  // Remove tudo que não é número
  const cleaned = phone.replace(/\D/g, '');
  
  // Se vazio, retorna
  if (cleaned.length === 0) {
    return { isValid: false, formatted: '', error: '' };
  }
  
  // Se menos de 11, continua aceitando (validação silenciosa)
  if (cleaned.length < 11) {
    return { isValid: false, formatted: phone, error: '' };
  }
  
  // Se mais de 11, rejeita
  if (cleaned.length > 11) {
    return { 
      isValid: false, 
      formatted: phone, 
      error: 'Telefone deve ter 11 dígitos' 
    };
  }
  
  // Se exatamente 11, formata e valida
  if (cleaned.length === 11) {
    const formatted = formatPhone(phone);
    
    // Valida DDD (primeiros 2 dígitos)
    const ddd = parseInt(cleaned.slice(0, 2));
    if (ddd < 11 || ddd > 99) {
      return { 
        isValid: false, 
        formatted, 
        error: 'DDD inválido' 
      };
    }
    
    return { isValid: true, formatted, error: '' };
  }
  
  return { isValid: false, formatted: phone, error: 'Telefone inválido' };
}

/**
 * Valida telefone final
 * @param {string} phone - Telefone formatado ou não
 * @returns {boolean}
 */
export function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  
  const cleaned = phone.replace(/\D/g, '');
  
  // Deve ter exatamente 11 dígitos
  if (cleaned.length !== 11) {
    return false;
  }
  
  // Valida DDD
  const ddd = parseInt(cleaned.slice(0, 2));
  if (ddd < 11 || ddd > 99) {
    return false;
  }
  
  return true;
}

/**
 * Remove formatação do telefone
 * @param {string} phone - Telefone formatado
 * @returns {string} - Telefone limpo (apenas números)
 */
export function cleanPhone(phone) {
  return phone.replace(/\D/g, '');
}
