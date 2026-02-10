import React, { useState, useEffect } from 'react';
import { AlertCircle, Clock } from 'lucide-react';
import { validarHorarioChat } from '../utils/brazilTime';

/**
 * Componente que exibe informações sobre disponibilidade de chat
 * Com base no horário de Brasília (08:00-17:00)
 */
export default function ChatAvailabilityAlert() {
  const [validacao, setValidacao] = useState({
    permitido: false,
    hora: 0,
    timezone: 'America/Sao_Paulo',
    mensagem: ''
  });

  useEffect(() => {
    const atualizar = () => {
      const result = validarHorarioChat();
      setValidacao(result);
    };

    atualizar();
    const interval = setInterval(atualizar, 60000); // Verificar a cada minuto
    return () => clearInterval(interval);
  }, []);

  if (validacao.permitido) {
    return (
      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-4 flex items-start gap-3">
        <Clock className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-green-300 font-semibold">Chat Disponível</p>
          <p className="text-green-200/80 text-sm mt-1">Horário de funcionamento: 08:00-17:00 (Brasília)</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 mb-4 flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-orange-300 font-semibold">Chat Indisponível no Momento</p>
        <p className="text-orange-200/80 text-sm mt-1">
          O chat funciona apenas entre <span className="font-semibold">08:00 às 17:00</span> (horário de Brasília)
        </p>
        <p className="text-orange-200/60 text-sm mt-2">
          Hora atual: <span className="font-mono font-semibold">{String(validacao.hora).padStart(2, '0')}:00</span>
        </p>
      </div>
    </div>
  );
}
