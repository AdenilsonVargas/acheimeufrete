// Utilitário para cálculo de dias restantes para entrega

/**
 * Calcula a data prevista de entrega baseada na data de coleta confirmada e prazo em dias
 * A contagem começa no dia seguinte à coleta, às 19h BRT
 */
export function calcularDataPrevistaEntrega(dataColetaConfirmada, prazoEntregaDias) {
  if (!dataColetaConfirmada || !prazoEntregaDias) return null;
  
  const coleta = new Date(dataColetaConfirmada);
  
  // Começar a contar do dia seguinte às 19h
  const inicioPrazo = new Date(coleta);
  inicioPrazo.setDate(inicioPrazo.getDate() + 1);
  inicioPrazo.setHours(19, 0, 0, 0);
  
  // Adicionar os dias de prazo
  const dataPrevista = new Date(inicioPrazo);
  dataPrevista.setDate(dataPrevista.getDate() + prazoEntregaDias - 1);
  
  return dataPrevista.toISOString();
}

/**
 * Calcula quantos dias restam para a entrega
 * Retorna valor negativo se estiver atrasado
 */
export function calcularDiasRestantes(dataPrevista) {
  if (!dataPrevista) return null;
  
  const agora = new Date();
  const prevista = new Date(dataPrevista);
  
  // Calcular diferença em milissegundos
  const diffMs = prevista - agora;
  
  // Converter para dias (arredondar para baixo)
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  return diffDias;
}

/**
 * Verifica se a entrega está atrasada
 */
export function verificarAtraso(dataPrevista) {
  if (!dataPrevista) return false;
  
  const agora = new Date();
  const prevista = new Date(dataPrevista);
  
  return agora > prevista;
}

/**
 * Formata a exibição de dias restantes
 */
export function formatarDiasRestantes(diasRestantes) {
  if (diasRestantes === null) return "N/I";
  
  if (diasRestantes < 0) {
    const diasAtraso = Math.abs(diasRestantes);
    return `Atrasado ${diasAtraso} dia${diasAtraso !== 1 ? 's' : ''}`;
  }
  
  if (diasRestantes === 0) return "Entrega hoje";
  if (diasRestantes === 1) return "1 dia";
  
  return `${diasRestantes} dias`;
}

/**
 * Retorna a classe CSS baseada no status de entrega
 */
export function getClasseDiasRestantes(diasRestantes) {
  if (diasRestantes === null) return "text-gray-500";
  
  if (diasRestantes < 0) return "text-red-700 font-bold";
  if (diasRestantes === 0) return "text-orange-700 font-bold";
  if (diasRestantes <= 2) return "text-yellow-700 font-semibold";
  
  return "text-green-700 font-semibold";
}
