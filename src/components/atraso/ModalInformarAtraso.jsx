import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

export default function ModalInformarAtraso({ 
  cotacao, 
  isOpen, 
  onClose, 
  onSubmit,
  isLoading = false 
}) {
  const [form, setForm] = useState({
    motivo: '',
    diasEstimado: '',
    descricao: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit({
      cotacaoId: cotacao?.id,
      ...form
    });
    setForm({ motivo: '', diasEstimado: '', descricao: '' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-lg border border-slate-700 max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h2 className="text-lg font-bold text-white">Informar Atraso</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Motivo do Atraso</label>
            <select
              value={form.motivo}
              onChange={(e) => setForm({...form, motivo: e.target.value})}
              className="input-field"
              required
            >
              <option value="">Selecione um motivo</option>
              <option value="transito">Engarrafamento/Trânsito</option>
              <option value="clima">Condições Climáticas</option>
              <option value="mecanico">Problema Mecânico</option>
              <option value="outro">Outro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Dias Estimados de Atraso</label>
            <input
              type="number"
              min="1"
              value={form.diasEstimado}
              onChange={(e) => setForm({...form, diasEstimado: e.target.value})}
              placeholder="2"
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Descrição Adicional</label>
            <textarea
              value={form.descricao}
              onChange={(e) => setForm({...form, descricao: e.target.value})}
              placeholder="Descreva a situação..."
              className="input-field h-24 resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 btn-primary"
            >
              {isLoading ? 'Enviando...' : 'Informar Atraso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
