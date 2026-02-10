import React from 'react';
import { AlertTriangle, Clock } from 'lucide-react';

export default function AlertaAtrasoTransportadora({ cotacao, onReport }) {
  if (!cotacao?.tempoEstimado || !cotacao?.tempoAtualizado) return null;

  const diasRestantes = Math.floor(
    (new Date(cotacao.tempoEstimado) - new Date()) / (1000 * 60 * 60 * 24)
  );

  const estaAtrasado = diasRestantes < 0;

  if (!estaAtrasado && diasRestantes > 2) return null;

  return (
    <div className={`p-4 rounded-lg border mb-4 flex gap-3 items-start ${
      estaAtrasado 
        ? 'bg-red-900/20 border-red-700' 
        : 'bg-yellow-900/20 border-yellow-700'
    }`}>
      <AlertTriangle className={`w-6 h-6 flex-shrink-0 mt-0.5 ${
        estaAtrasado ? 'text-red-400' : 'text-yellow-400'
      }`} />
      <div className="flex-1">
        <h4 className={`font-semibold mb-1 ${estaAtrasado ? 'text-red-300' : 'text-yellow-300'}`}>
          {estaAtrasado ? 'Entrega Atrasada' : 'Aviso de Prazo'}
        </h4>
        <p className="text-sm text-gray-300 mb-3">
          {estaAtrasado 
            ? `Entrega com ${Math.abs(diasRestantes)} dia(s) de atraso`
            : `Apenas ${diasRestantes} dia(s) restantes para entregar`}
        </p>
        {estaAtrasado && (
          <button
            onClick={() => onReport?.(cotacao.id)}
            className="text-sm px-3 py-1 bg-red-700 hover:bg-red-600 rounded text-white transition"
          >
            Informar Situação
          </button>
        )}
      </div>
    </div>
  );
}
