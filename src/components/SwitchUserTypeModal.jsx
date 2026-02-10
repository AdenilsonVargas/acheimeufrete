import React, { useState } from 'react';
import { ArrowRightLeft, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SwitchUserTypeModal({ 
  isOpen, 
  onClose, 
  userType = 'embarcador' 
}) {
  const navigate = useNavigate();
  
  const handleSwitchType = (newType) => {
    // Aqui o usuário seria "logout do tipo atual" e "login como novo tipo"
    // Por enquanto, redireciona para a dashboard do outro tipo
    if (newType === 'transportador') {
      navigate('/dashboard-transportadora');
    } else {
      navigate('/dashboard');
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-lg border border-slate-700 max-w-md w-full">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-orange-500" />
            Trocar de Tipo de Conta
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Você pode acessar diferentes dashboards
          </p>
        </div>

        <div className="p-6 space-y-3">
          <button
            onClick={() => handleSwitchType('embarcador')}
            className={`w-full p-4 rounded-lg border-2 transition text-left ${
              userType === 'embarcador'
                ? 'border-orange-500 bg-orange-500/10'
                : 'border-slate-700 hover:border-slate-600'
            }`}
          >
            <h3 className="font-semibold text-white">📦 Dashboard Embarcador</h3>
            <p className="text-sm text-slate-300 mt-1">
              Criar e gerenciar cotações de frete
            </p>
          </button>

          <button
            onClick={() => handleSwitchType('transportador')}
            className={`w-full p-4 rounded-lg border-2 transition text-left ${
              userType === 'transportador'
                ? 'border-cyan-400 bg-cyan-400/10'
                : 'border-slate-700 hover:border-slate-600'
            }`}
          >
            <h3 className="font-semibold text-white">🚚 Dashboard Transportador</h3>
            <p className="text-sm text-slate-300 mt-1">
              Responder cotações e gerenciar fretes
            </p>
          </button>
        </div>

        <div className="p-6 border-t border-slate-700 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
