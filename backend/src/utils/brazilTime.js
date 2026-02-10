/**
 * Utilitário para trabalhar com horários de Brasília (America/Sao_Paulo)
 * Este arquivo fornece funções para conversão e validação de horários
 * garantindo que todos os cálculos de horário considerem Brasília, Brasil
 */

/**
 * Obtém a hora atual em horário de Brasília
 * @returns {number} Hora atual (0-23) em horário de Brasília
 */
export const getHoraBrasilia = () => {
  try {
    const formatter = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      hour12: false
    });
    const parts = formatter.formatToParts(new Date());
    return parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
  } catch (error) {
    console.error('Erro ao obter hora de Brasília:', error);
    return new Date().getHours();
  }
};

/**
 * Obtém a data/hora completa em horário de Brasília
 * @returns {object} Objeto com hora, minuto, segundo e dia
 */
export const getDataHoraBrasilia = () => {
  try {
    const formatter = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour12: false
    });
    
    const parts = formatter.formatToParts(new Date());
    const partsMap = {};
    
    parts.forEach(part => {
      if (part.type !== 'literal') {
        partsMap[part.type] = part.value;
      }
    });
    
    return {
      hora: parseInt(partsMap.hour || '0', 10),
      minuto: parseInt(partsMap.minute || '0', 10),
      segundo: parseInt(partsMap.second || '0', 10),
      dia: parseInt(partsMap.day || '1', 10),
      mes: parseInt(partsMap.month || '1', 10),
      ano: parseInt(partsMap.year || '2024', 10),
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Erro ao obter data/hora de Brasília:', error);
    return {
      hora: new Date().getHours(),
      minuto: new Date().getMinutes(),
      segundo: new Date().getSeconds(),
      dia: new Date().getDate(),
      mes: new Date().getMonth() + 1,
      ano: new Date().getFullYear(),
      timestamp: new Date()
    };
  }
};

/**
 * Verifica se a hora atual está dentro de um intervalo em horário de Brasília
 * @param {number} horaInicio - Hora de início (0-23)
 * @param {number} horaFim - Hora de fim (0-23)
 * @returns {boolean} True se hora atual está dentro do intervalo
 */
export const estaDentroDoHorario = (horaInicio, horaFim) => {
  const horaBrasilia = getHoraBrasilia();
  
  if (horaInicio < horaFim) {
    // Intervalo simples (ex: 08:00-17:00)
    return horaBrasilia >= horaInicio && horaBrasilia < horaFim;
  } else {
    // Intervalo que passa por meia-noite (ex: 22:00-06:00)
    return horaBrasilia >= horaInicio || horaBrasilia < horaFim;
  }
};

/**
 * Valida se chat pode ser aberto (entre 08:00 e 17:00 Brasília)
 * @returns {object} { permitido: boolean, hora: number, mensagem: string }
 */
export const validarHorarioChat = () => {
  const horaBrasilia = getHoraBrasilia();
  const permitido = horaBrasilia >= 8 && horaBrasilia < 17;
  
  return {
    permitido,
    hora: horaBrasilia,
    timezone: 'America/Sao_Paulo',
    mensagem: permitido 
      ? 'Chat disponível'
      : `Chat indisponível. Horário de funcionamento: 08:00-17:00 (Brasília). Hora atual: ${horaBrasilia}:00`
  };
};

/**
 * Formata hora de Brasília como string HH:MM:SS
 * @returns {string} Hora formatada
 */
export const formatarHoraBrasilia = () => {
  try {
    const formatter = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    const parts = formatter.formatToParts(new Date());
    return parts.map(part => part.value).join('');
  } catch (error) {
    console.error('Erro ao formatar hora de Brasília:', error);
    return '00:00:00';
  }
};
