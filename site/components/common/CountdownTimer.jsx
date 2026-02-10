import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

/**
 * Componente de countdown regressivo
 * Atualiza em tempo real até expiração
 * @param {string} dataHoraFim - Data e hora final (ISO format)
 * @param {function} onExpire - Callback quando timer chega a 0
 * @param {string} className - Classes CSS adicionais
 * @returns {JSX.Element}
 */
export default function CountdownTimer({ dataHoraFim, onExpire, className = '' }) {
  const [tempo, setTempo] = useState(null);
  const [expirado, setExpirado] = useState(false);

  useEffect(() => {
    // Calcular tempo inicial
    const calcularTempo = () => {
      const agora = new Date();
      const fim = new Date(dataHoraFim);
      const diff = fim - agora;

      if (diff <= 0) {
        setTempo(null);
        setExpirado(true);
        if (onExpire) {
          onExpire();
        }
        return;
      }

      // Calcular HH:MM:SS
      const totalSegundos = Math.floor(diff / 1000);
      const horas = Math.floor(totalSegundos / 3600);
      const minutos = Math.floor((totalSegundos % 3600) / 60);
      const segundos = totalSegundos % 60;

      setTempo({
        horas: String(horas).padStart(2, '0'),
        minutos: String(minutos).padStart(2, '0'),
        segundos: String(segundos).padStart(2, '0'),
        totalSegundos
      });
      setExpirado(false);
    };

    calcularTempo();

    // Atualizar a cada segundo
    const interval = setInterval(calcularTempo, 1000);

    return () => clearInterval(interval);
  }, [dataHoraFim, onExpire]);

  if (expirado || !tempo) {
    return null;
  }

  // Cores baseadas no tempo restante
  const percentualRestante = (tempo.totalSegundos / (24 * 3600)) * 100; // % de 24h
  let bgColor = 'bg-green-500'; // Verde: > 50% de 24h
  let textColor = 'text-white';

  if (percentualRestante < 50 && percentualRestante >= 25) {
    bgColor = 'bg-yellow-500'; // Amarelo: 25-50% de 24h
  } else if (percentualRestante < 25 && percentualRestante >= 10) {
    bgColor = 'bg-orange-500'; // Laranja: 10-25% de 24h
  } else if (percentualRestante < 10) {
    bgColor = 'bg-red-500'; // Vermelho: < 10% de 24h
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${bgColor} ${textColor} font-mono font-semibold text-sm ${className}`}>
      <Clock className="w-4 h-4" />
      <span>
        {tempo.horas}:{tempo.minutos}:{tempo.segundos}
      </span>
    </div>
  );
}
