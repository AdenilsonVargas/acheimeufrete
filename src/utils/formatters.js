/**
 * Utilitários de formatação para cadastro
 */

/**
 * Formata CPF
 * Entrada: "12345678901" ou "123.456.789-01"
 * Saída: "123.456.789-01"
 */
export const formatCPF = (value) => {
  if (!value) return '';
  
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');
  
  // Limita a 11 dígitos
  const truncated = numbers.slice(0, 11);
  
  // Aplica a formatação
  return truncated
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

/**
 * Formata CNPJ
 * Entrada: "12345678000190" ou "12.345.678/0001-90"
 * Saída: "12.345.678/0001-90"
 */
export const formatCNPJ = (value) => {
  if (!value) return '';
  
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');
  
  // Limita a 14 dígitos
  const truncated = numbers.slice(0, 14);
  
  // Aplica a formatação
  return truncated
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
};

/**
 * Formata Telefone
 * Entrada: "1234567890" ou "(12) 3456-7890"
 * Saída: "(12) 3456-7890" ou "(12) 98765-4321"
 */
export const formatPhone = (value) => {
  if (!value) return '';
  
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');
  
  // Limita a 11 dígitos
  const truncated = numbers.slice(0, 11);
  
  // Se tem 11 dígitos, começa com 9
  if (truncated.length === 11) {
    return truncated
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  }
  
  // Se tem 10 dígitos
  if (truncated.length >= 10) {
    return truncated
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  
  // Se tem menos de 10, apenas formata o que tem
  if (truncated.length > 2) {
    return truncated
      .replace(/(\d{2})(\d)/, '($1) $2');
  }
  
  return truncated;
};

/**
 * Formata CEP
 * Entrada: "01310100" ou "01310-100"
 * Saída: "01310-100"
 */
export const formatCEP = (value) => {
  if (!value) return '';
  
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');
  
  // Limita a 8 dígitos
  const truncated = numbers.slice(0, 8);
  
  // Aplica a formatação
  return truncated.replace(/(\d{5})(\d{1,3})$/, '$1-$2');
};

/**
 * Remove formatação de CPF/CNPJ/Telefone
 */
export const removeFormatting = (value) => {
  return value.replace(/\D/g, '');
};

/**
 * Busca endereço pelo CEP usando ViaCEP
 */
export const fetchAddressByCEP = async (cep) => {
  try {
    // Remove formatação do CEP
    const cleanCEP = cep.replace(/\D/g, '');
    
    // Valida se tem 8 dígitos
    if (cleanCEP.length !== 8) {
      throw new Error('CEP deve conter 8 dígitos');
    }
    
    // Faz a requisição
    const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
    
    if (!response.ok) {
      throw new Error('Erro ao buscar CEP');
    }
    
    const data = await response.json();
    
    // Verifica se CEP foi encontrado
    if (data.erro) {
      throw new Error('CEP não encontrado');
    }
    
    return {
      logradouro: data.logradouro,
      bairro: data.bairro,
      cidade: data.localidade,
      estado: data.uf,
      cep: formatCEP(cleanCEP),
    };
  } catch (error) {
    throw new Error(error.message || 'Erro ao buscar endereço');
  }
};
