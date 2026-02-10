import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function AlertaLimitacoesSemBackend() {
  return (
    <div className="p-4 rounded-lg border bg-amber-900/20 border-amber-700 flex gap-3 mb-4">
      <AlertCircle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
      <div>
        <h4 className="font-semibold text-amber-300 mb-1">Backend Não Conectado</h4>
        <p className="text-sm text-amber-100">
          Alguns dados estão em modo de demonstração. Conecte ao backend para funcionalidade completa.
        </p>
      </div>
    </div>
  );
}
