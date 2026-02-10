import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { getHoraBrasilia, formatarHoraBrasilia } from '../utils/brazilTime';

/**
 * Painel de informações sobre o horário de Brasília e disponibilidade de chat
 * Exibe hora atual e status de disponibilidade
 */
export default function BrazilTimeInfo() {
  const [hora, setHora] = useState('00:00:00');
  const [disponivel, setDisponivel] = useState(false);

  useEffect(() => {
    const atualizar = () => {
      const horaBrasilia = formatarHoraBrasilia();
      const horaNum = getHoraBrasilia();
      setHora(horaBrasilia);
      setDisponivel(horaNum >= 8 && horaNum < 17);
    };

    atualizar();
    const interval = setInterval(atualizar, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`rounded-lg p-4 mb-6 border ${
      disponivel 
        ? 'bg-green-500/10 border-green-500/30' 
        : 'bg-orange-500/10 border-orange-500/30'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock className={`w-5 h-5 ${disponivel ? 'text-green-400' : 'text-orange-400'}`} />
          <div>
            <p className={`font-semibold ${disponivel ? 'text-green-300' : 'text-orange-300'}`}>
              Horário de Brasília: <span className="font-mono">{hora}</span>
            </p>
            <p className={`text-sm ${disponivel ? 'text-green-200/70' : 'text-orange-200/70'}`}>
              Chat disponível entre 08:00-17:00
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {disponivel ? (
            <>
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-green-300 font-semibold text-sm">Disponível</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5 text-orange-400" />
              <span className="text-orange-300 font-semibold text-sm">Indisponível</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
