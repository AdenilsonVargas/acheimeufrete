import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/api/client';
import useAuthStore from '@/hooks/useAuthStore';
import { FileText, Download, Send, AlertCircle } from 'lucide-react';

export default function BiparCTe() {
  const { user } = useAuthStore();
  const [ctes, setCtes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCte, setSelectedCte] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api.entities.cte.filter({ status: 'emitido', transportadorId: user?.id, limit: 50 });
        setCtes(res?.data || res || []);
      } catch (err) {
        console.error('Erro ao listar', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user]);

  const handleBipar = async (cteId) => {
    try {
      await api.entities.cte.update(cteId, { status: 'bipado' });
      setCtes(ctes.map(c => (c.id || c._id) === cteId ? {...c, status: 'bipado'} : c));
      alert('CT-e bipado com sucesso!');
    } catch (err) {
      console.error('Erro ao bipar', err);
    }
  };

  return (
    <DashboardLayout userType={user?.userType === "transportador" ? "transportador" : "embarcador"}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-2">
          <FileText className="w-8 h-8 text-cyan-600" /> Bipar CT-e
        </h1>

        <p className="text-slate-400 mb-6">Registre a entrada (bipar) dos CT-e na operação.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="card">
            <p className="text-slate-400 text-sm">Total de CT-e</p>
            <p className="text-3xl font-bold text-cyan-400">{ctes.length}</p>
          </div>
          <div className="card">
            <p className="text-slate-400 text-sm">Emitidos</p>
            <p className="text-3xl font-bold text-orange-400">{ctes.filter(c => c.status === 'emitido').length}</p>
          </div>
          <div className="card">
            <p className="text-slate-400 text-sm">Bipados</p>
            <p className="text-3xl font-bold text-green-400">{ctes.filter(c => c.status === 'bipado').length}</p>
          </div>
        </div>

        {loading ? (
          <p className="text-slate-300">Carregando...</p>
        ) : ctes.length === 0 ? (
          <div className="card">
            <p className="text-slate-300">Nenhum CT-e encontrado.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {ctes.map((c) => (
              <div key={c.id || c._id} className="card flex justify-between items-start hover:border-cyan-600 transition">
                <div>
                  <h3 className="text-white font-semibold">CT-e #{c.id}</h3>
                  <p className="text-slate-400 text-sm">{c.naturezaCarga}</p>
                  <p className="text-cyan-400 font-semibold text-sm mt-1">R$ {(c.valor || 0).toFixed(2)}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <span className={`px-3 py-1 rounded text-xs font-medium ${c.status === 'bipado' ? 'bg-green-900 text-green-300' : 'bg-orange-900 text-orange-300'}`}>
                    {c.status === 'bipado' ? '✓ Bipado' : 'Pendente'}
                  </span>
                  {c.status === 'emitido' && (
                    <button 
                      onClick={() => handleBipar(c.id || c._id)}
                      className="btn-primary text-xs py-1"
                    >
                      Bipar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
