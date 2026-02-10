import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/api/client';
import useAuthStore from '@/hooks/useAuthStore';
import { FileText, Clock, Send } from 'lucide-react';

export default function ContraPropostaCTe() {
  const { user } = useAuthStore();
  const [ctes, setCtes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCte, setSelectedCte] = useState(null);
  const [form, setForm] = useState({ valor: '', justificativa: '' });

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api.entities.cte.filter({ status: 'em_analise', transportadorId: user?.id, limit: 50 });
        setCtes(res?.data || res || []);
      } catch (err) {
        console.error('Erro ao listar', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user]);

  const handleContrapropor = async () => {
    if (!form.valor || !selectedCte) return;
    try {
      await api.entities.cte.create({
        cteOriginalId: selectedCte.id,
        valor: parseFloat(form.valor),
        justificativa: form.justificativa,
        tipo: 'contraproposta',
        status: 'pendente',
        data: new Date()
      });
      setCtes(ctes.filter(c => (c.id || c._id) !== selectedCte.id));
      setSelectedCte(null);
      setForm({ valor: '', justificativa: '' });
      alert('Contraproposta enviada!');
    } catch (err) {
      console.error('Erro ao enviar', err);
    }
  };

  return (
    <DashboardLayout userType={user?.userType === "transportador" ? "transportador" : "embarcador"}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-2">
          <FileText className="w-8 h-8 text-cyan-600" /> Contraproposta CT-e
        </h1>

        <p className="text-slate-400 mb-8">Envie contrapostas com novos valores para CT-e em análise.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 card">
            <h2 className="text-lg font-bold text-white mb-4">CT-e Disponíveis</h2>
            {loading ? (
              <p className="text-slate-300">Carregando...</p>
            ) : ctes.length === 0 ? (
              <p className="text-slate-300">Nenhum CT-e para contrapor</p>
            ) : (
              <div className="space-y-2">
                {ctes.map((c) => (
                  <div 
                    key={c.id || c._id}
                    onClick={() => setSelectedCte(c)}
                    className={`p-4 rounded-lg cursor-pointer transition ${selectedCte?.id === c.id || selectedCte?._id === c._id ? 'bg-cyan-900 border-2 border-cyan-600' : 'bg-slate-800 hover:border-cyan-600 border border-slate-700'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-white font-semibold">CT-e #{c.id}</h3>
                        <p className="text-slate-400 text-sm">{c.naturezaCarga}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-cyan-400 font-bold">R$ {(c.valor || 0).toFixed(2)}</p>
                        <p className="text-slate-400 text-xs">Proposto</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="text-lg font-bold text-white mb-4">Nova Proposta</h2>
            {selectedCte ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-400 text-sm mb-1">CT-e Selecionado</label>
                  <p className="text-white font-semibold">CT-e #{selectedCte.id}</p>
                </div>

                <div>
                  <label className="block text-slate-400 text-sm mb-1">Valor Anterior</label>
                  <p className="text-slate-300 font-semibold">R$ {(selectedCte.valor || 0).toFixed(2)}</p>
                </div>

                <div>
                  <label className="block text-slate-400 text-sm mb-1">Novo Valor</label>
                  <input 
                    type="number"
                    placeholder="0.00"
                    value={form.valor}
                    onChange={(e) => setForm({...form, valor: e.target.value})}
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-sm mb-1">Justificativa</label>
                  <textarea 
                    placeholder="Explique sua contraproposta"
                    value={form.justificativa}
                    onChange={(e) => setForm({...form, justificativa: e.target.value})}
                    className="input-field w-full h-16"
                  ></textarea>
                </div>

                <button 
                  onClick={handleContrapor}
                  disabled={!form.valor}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" /> Enviar Proposta
                </button>
              </div>
            ) : (
              <p className="text-slate-300">Selecione um CT-e</p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
