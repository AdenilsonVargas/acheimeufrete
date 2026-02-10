/**
 * Exporta todos os validadores
 */

export * from './phoneValidator';
export * from './emailValidator';
export * from './cpfValidator';
export * from './cnpjValidator';
export * from './documentValidator';

// Validador genérico de CPF ou CNPJ
export function validateCPFOrCNPJ(value, type = 'auto') {
  if (!value) {
    return { isValid: false, error: 'CPF ou CNPJ é obrigatório' };
  }
  
  const cleaned = value.replace(/\D/g, '');
  
  if (type === 'auto') {
    // Detecta automaticamente
    if (cleaned.length === 11) {
      return validateCPFInput(value);
    } else if (cleaned.length === 14) {
      return validateCNPJInput(value);
    } else {
      return { isValid: false, error: 'CPF ou CNPJ inválido' };
    }
  } else if (type === 'cpf') {
    return validateCPFInput(value);
  } else if (type === 'cnpj') {
    return validateCNPJInput(value);
  }
  
  return { isValid: false, error: 'Tipo inválido' };
}
