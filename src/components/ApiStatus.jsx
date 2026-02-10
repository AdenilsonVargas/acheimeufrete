/**
 * 📊 Componente de Status da API
 * Mostra em qual porta o backend está rodando
 */

import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import apiConfig from '@/config/apiConfig';

export function ApiStatus() {
  const [status, setStatus] = useState('checking');
  const [porta, setPorta] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const p = apiConfig.getPortSync();
      const isHealthy = await apiConfig.healthCheck(p);
      setPorta(p);
      setStatus(isHealthy ? 'online' : 'offline');
    } catch (error) {
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
    // Verificar a cada 30 segundos
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (status === 'checking') {
    return null; // Não mostrar enquanto verifica
  }

  const isOnline = status === 'online';
  const bgColor = isOnline ? 'bg-green-900/20' : 'bg-red-900/20';
  const borderColor = isOnline ? 'border-green-700' : 'border-red-700';
  const textColor = isOnline ? 'text-green-400' : 'text-red-400';
  const Icon = isOnline ? CheckCircle : AlertCircle;

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${bgColor} border ${borderColor} text-xs`}>
      <Icon className={`w-4 h-4 ${textColor}`} />
      <span className={textColor}>
        {isOnline ? 'Backend OK' : 'Backend offline'}
        {porta && ` (porta ${porta})`}
      </span>
      {!isOnline && (
        <button
          onClick={checkStatus}
          disabled={loading}
          className="ml-2 p-1 hover:bg-red-800/30 rounded transition"
          title="Tentar reconectar"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
        </button>
      )}
    </div>
  );
}

/**
 * Componente para exibir informações de debug da API
 */
export function ApiDebugInfo() {
  const [debugInfo, setDebugInfo] = useState(null);

  useEffect(() => {
    const getInfo = async () => {
      const url = await apiConfig.getBaseURL();
      const porta = apiConfig.getPortSync();
      const isDev = !import.meta.env.PROD;
      
      setDebugInfo({
        baseURL: url,
        porta,
        isDev,
        apiUrl: import.meta.env.VITE_API_URL || 'não configurado',
        mode: import.meta.env.MODE,
      });
    };

    getInfo();
  }, []);

  if (!debugInfo) return null;

  return (
    <div className="hidden">
      {/* Usar em modo desenvolvimento: */}
      {/* <pre className="bg-slate-900 text-green-400 p-4 rounded text-xs">
        {JSON.stringify(debugInfo, null, 2)}
      </pre> */}
    </div>
  );
}

export default { ApiStatus, ApiDebugInfo };
