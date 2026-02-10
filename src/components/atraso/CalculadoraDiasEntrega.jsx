import React, { useMemo } from 'react';
import { Calendar } from 'lucide-react';

export default function CalculadoraDiasEntrega({ 
  dataColeta, 
  dataEntregaEstimada,
  diasDecorridos = 0 
}) {
  const dias = useMemo(() => {
    if (!dataColeta || !dataEntregaEstimada) return null;

    const coleta = new Date(dataColeta);
    const entrega = new Date(dataEntregaEstimada);
    const diff = Math.floor((entrega - coleta) / (1000 * 60 * 60 * 24));
    
    return {
      totalDias: diff,
      diasRestantes: diff - diasDecorridos,
      percentualDecorrido: Math.floor((diasDecorridos / diff) * 100)
    };
  }, [dataColeta, dataEntregaEstimada, diasDecorridos]);

  if (!dias) return null;

  return (
    <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-5 h-5 text-cyan-500" />
        <h4 className="font-semibold text-white">Timeline de Entrega</h4>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-300">Progresso</span>
            <span className="text-cyan-400 font-semibold">{dias.percentualDecorrido}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div 
              className="bg-cyan-500 h-2 rounded-full transition-all"
              style={{ width: `${dias.percentualDecorrido}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-slate-700/50 p-2 rounded">
            <p className="text-gray-400 text-xs">Total</p>
            <p className="text-white font-bold text-lg">{dias.totalDias}d</p>
          </div>
          <div className="bg-slate-700/50 p-2 rounded">
            <p className="text-gray-400 text-xs">Decorridos</p>
            <p className="text-cyan-400 font-bold text-lg">{diasDecorridos}d</p>
          </div>
          <div className="bg-slate-700/50 p-2 rounded">
            <p className="text-gray-400 text-xs">Restantes</p>
            <p className={`font-bold text-lg ${dias.diasRestantes > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {dias.diasRestantes}d
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
