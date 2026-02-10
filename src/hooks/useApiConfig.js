/**
 * 🎣 Hook para usar API centralizada
 * 
 * Uso:
 * const apiBase = useApiBase();
 * const quotesUrl = useQuotesUrl();
 */

import { useState, useEffect } from 'react';
import apiConfig from '@/config/apiConfig';

/**
 * Hook que retorna a URL base da API
 */
export function useApiBase() {
  // Sempre usa /api (proxy do Vite) para compatibilidade com todos os ambientes
  return '/api';
}

/**
 * Hook que retorna a URL para frases motivacionais
 */
export function useQuotesUrl() {
  // Sempre usa /api (proxy do Vite) para evitar CORS em Codespaces
  return '/api/quotes/aleatoria';
}

/**
 * Hook para verificar saúde do backend
 */
export function useBackendHealth() {
  const [isHealthy, setIsHealthy] = useState(true);
  const [isChecking, setIsChecking] = useState(false);

  const checkHealth = async () => {
    setIsChecking(true);
    try {
      const porta = apiConfig.getPortSync();
      const healthy = await apiConfig.healthCheck(porta);
      setIsHealthy(healthy);
      if (!healthy) {
        console.warn(`⚠️ Backend na porta ${porta} não está respondendo`);
      }
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    // Verificar saúde ao montar e a cada 30 segundos
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return { isHealthy, isChecking, checkHealth };
}

export default {
  useApiBase,
  useQuotesUrl,
  useBackendHealth,
};
