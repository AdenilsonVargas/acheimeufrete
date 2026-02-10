import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/api/client';
import useAuthStore from '@/hooks/useAuthStore';
import { CheckCircle, FileText, Clock, AlertCircle } from 'lucide-react';

export default function AprovarCTe() {
  const { user } = useAuthStore();
  const [ctes, setCtes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCte, setSelectedCte] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api.entities.cte.filter({ status: 'bipado', limit: 50 });
        setCtes(res?.data || res || []);
      } catch (err) {
        console.error('Erro ao listar', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleAprovar = async (cteId) => {
    try {
      await api.entities.cte.update(cteId, { status: 'aprovado' });
      setCtes(ctes.filter(c => (c.id || c._id) !== cteId));
      setSelectedCte(null);
      alert('CT-e aprovado!');
    } catch (err) {
      console.error('Erro ao aprovar', err);
    }
  };

  const handleRejeitar = async (cteId) => {
    try {
      await api.entities.cte.update(cteId, { status: 'rejeitado' });
      setCtes(ctes.filter(c => (c.id || c._id) !== cteId));
      setSelectedCte(null);
      alert('CT-e rejeitado');
    } catch (err) {
      console.error('Erro ao rejeitar', err);
    }
  };

  return (
    <DashboardLayout userType={user?.userType === "transportador" ? "transportador" : "embarcador"}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-2">
          <CheckCircle className="w-8 h-8 text-green-600" /> Aprovar CT-e
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="card">
              <h2 className="text-lg font-bold text-white mb-4">CT-e Pendentes: {ctes.length}</h2>
              {loading ? (
                <p className="text-slate-300">Carregando...</p>
              ) : ctes.length === 0 ? (
                <p className="text-slate-300">Nenhum CT-e pendente</p>
              ) : (
                <div className="space-y-2">
                  {ctes.map((c) => (
                    <div 
                      key={c.id || c._id}
                      onClick={() => setSelectedCte(c)}
                      className={`p-3 rounded-lg cursor-pointer transition ${selectedCte?.id === c.id ? 'bg-green-900 border-2 border-green-600' : 'bg-slate-800 hover:border-green-600 border border-slate-700'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-cyan-400" />
                          <div>
                            <h3 className="text-white font-semibold">CT-e #{c.id}</h3>
                            <p className="text-slate-400 text-sm">{c.naturezaCarga}</p>
                          </div>
                        </div>
                        <p className="text-green-400 font-bold">R$ {(c.valor || 0).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="card">
              <h2 className="text-lg font-bold text-white mb-4">Detalhes</h2>
              {selectedCte ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-slate-400 text-sm mb-1">Documento</label>
                    <p className="text-white font-semibold">CT-e #{selectedCte.id}</p>
                  </div>

                  <div>
                    <label className="block text-slate-400 text-sm mb-1">Natureza da Carga</label>
                    <p className="text-white">{selectedCte.naturezaCarga}</p>
                  </div>

                  <div>
                    <label className="block text-slate-400 text-sm mb-1">Valor</label>
                    <p className="text-green-400 font-bold">R$ {(selectedCte.valor || 0).toFixed(2)}</p>
                  </div>

                  <div>
                    <label className="block text-slate-400 text-sm mb-1">Descrição</label>
                    <p className="text-slate-300 text-sm">{selectedCte.descricaoProduto}</p>
                  </div>

                  <div>
                    <label className="block text-slate-400 text-sm mb-1 flex items-center gap-1">
                      <Clock className="w-4 h-4" /> Data de Emissão
                    </label>
                    <p className="text-white">{new Date(selectedCte.dataEmissao).toLocaleDateString()}</p>
                  </div>

                  <div className="space-y-2">
                    <button 
                      onClick={() => handleAprovar(selectedCte.id || selectedCte._id)}
                      className="btn-primary w-full"
                    >
                      Aprovar
                    </button>
                    <button 
                      onClick={() => handleRejeitar(selectedCte.id || selectedCte._id)}
                      className="btn-danger w-full"
                    >
                      Rejeitar
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-slate-300">Selecione um CT-e</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
