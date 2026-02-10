import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { formatarHoraBrasilia } from '../utils/brazilTime';

/**
 * Componente que exibe o horário de Brasília (America/Sao_Paulo) em tempo real.
 * Sincronizado com backend via utils/brazilTime.js
 */
export default function BrazilClock() {
  const [time, setTime] = useState('00:00:00');

  useEffect(() => {
    const updateTime = () => {
      try {
        const horaBrasilia = formatarHoraBrasilia();
        setTime(horaBrasilia);
      } catch (error) {
        console.error('Erro ao atualizar relógio de Brasília:', error);
        setTime('00:00:00');
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
      <Clock className="w-4 h-4 text-slate-400" />
      <span title="Horário de Brasília (America/Sao_Paulo) - Brasília/DF, Brasil">{time}</span>
    </div>
  );
}
