/**
 * Hook para buscar estatísticas da homepage
 * Contadores dinâmicos: Transportadores, Embarcadores, Cotações, etc
 */

import { useState, useEffect } from 'react';
import { apiClient } from '@/api/client';

export const useStats = () => {
  const [stats, setStats] = useState({
    transportadores: 0,
    embarcadores: 0,
    cotacoesCriadas: 0,
    cotacoesFinalizadas: 0,
    valorCotacoesAceitas: 0,
    valorCotacoesFinalizadas: 0,
  });

  const [economy, setEconomy] = useState({
    totalEconomia: 0,
    percentualMedio: 0,
    cotacoesComEconomia: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // Buscar stats gerais
        const statsResponse = await fetch('/api/stats/home', { signal: AbortSignal.timeout(3000) });
        if (statsResponse.ok) {
          const data = await statsResponse.json();
          setStats(data);
          console.log('📊 Stats carregados:', data);
        } else {
          // NÃO fazer retry em 404 - rota não existe ainda
          if (statsResponse.status === 404) {
            console.warn('⚠️ Stats endpoint não configurado (404) - aguardando inicialização do backend');
          } else {
            console.warn('⚠️ Stats não disponíveis:', statsResponse.status);
          }
        }

        // Buscar stats de economia
        const economyResponse = await fetch('/api/stats/economia', { signal: AbortSignal.timeout(3000) });
        if (economyResponse.ok) {
          const data = await economyResponse.json();
          setEconomy(data);
          console.log('💰 Economia carregada:', data);
        } else {
          // NÃO fazer retry em 404 - rota não existe ainda
          if (economyResponse.status === 404) {
            console.warn('⚠️ Economia endpoint não configurado (404) - aguardando inicialização do backend');
          } else {
            console.warn('⚠️ Economia não disponível:', economyResponse.status);
          }
        }

        setError(null);
      } catch (err) {
        // NÃO fazer retry em erro de timeout ou 404
        if (err.name === 'AbortError') {
          console.warn('⏱️ Timeout ao buscar stats - backend pode estar iniciando');
        } else {
          console.error('❌ Erro ao carregar stats:', err);
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    
    // Atualizar a cada 10 minutos (não 5 para evitar sobrecarga)
    const interval = setInterval(fetchStats, 10 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    stats,
    economy,
    loading,
    error,
  };
};

export default useStats;
