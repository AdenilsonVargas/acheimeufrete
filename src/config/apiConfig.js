/**
 * 🔧 CONFIGURAÇÃO CENTRALIZADA DE API
 * 
 * Este arquivo detecta automaticamente a porta do backend
 * Suporta múltiplas portas: 5000, 5001, 5002, etc.
 * 
 * Prioridade:
 * 1. VITE_API_URL (variável de ambiente)
 * 2. Proxy do Vite em desenvolvimento (/api)
 * 3. Detection automático de porta disponível
 */

/**
 * Detecta automaticamente qual porta o backend está usando
 */
async function detectBackendPort() {
  // Lista de portas para tentar (ordem de prioridade)
  const portas = [5000, 5001, 5002, 5003, 5004];
  
  for (const porta of portas) {
    try {
      const response = await fetch(`http://localhost:${porta}/health`, {
        method: 'GET',
        timeout: 2000,
      });
      
      if (response.ok) {
        console.log(`✅ Backend detectado na porta ${porta}`);
        return porta;
      }
    } catch (error) {
      // Porta não respondeu, tenta próxima
      continue;
    }
  }
  
  // Se nenhuma porta respondeu, retorna 5000 como padrão
  console.warn('⚠️ Backend não detectado automaticamente, usando porta 5000 como fallback');
  return 5000;
}

/**
 * Configuração de API para toda a aplicação
 */
export const apiConfig = {
  // Em desenvolvimento: usa proxy do Vite (/api)
  // Em produção: usa URL completa com porta detectada ou configurada
  getBaseURL: async () => {
    const isDev = !import.meta.env.PROD;
    
    if (isDev) {
      // Em desenvolvimento, o Vite faz o proxy automaticamente
      return '/api';
    }
    
    // Em produção, tenta usar VITE_API_URL ou detecta porta
    if (import.meta.env.VITE_API_URL) {
      console.log('📡 Usando VITE_API_URL:', import.meta.env.VITE_API_URL);
      return import.meta.env.VITE_API_URL;
    }
    
    // Detecta porta automaticamente
    const porta = await detectBackendPort();
    const baseURL = `http://localhost:${porta}/api`;
    console.log('📡 API URL detectada:', baseURL);
    return baseURL;
  },

  /**
   * URL para frases motivacionais (usado em Login e Registro)
   */
  getQuotesURL: async () => {
    const baseURL = await apiConfig.getBaseURL();
    return `${baseURL}/quotes/aleatoria`;
  },

  /**
   * Detecta a porta de forma síncrona com fallback
   * (usado para configuração inicial)
   */
  getPortSync: () => {
    if (import.meta.env.VITE_API_URL) {
      const match = import.meta.env.VITE_API_URL.match(/:(\d+)/);
      if (match) {
        return parseInt(match[1]);
      }
    }
    return 5000; // Fallback para 5000
  },

  /**
   * Realiza health check para verificar se backend está disponível
   */
  healthCheck: async (porta = 5000) => {
    try {
      const response = await fetch(`http://localhost:${porta}/health`, {
        method: 'GET',
        timeout: 3000,
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  },
};

export default apiConfig;
