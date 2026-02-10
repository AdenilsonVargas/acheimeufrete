import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/api/client';
import useAuthStore from '@/hooks/useAuthStore';

export default function CotacoesAceitas() {
  const { user } = useAuthStore();
  const [cotacoes, setCotacoes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api.entities.cotacao.filter({ status: 'aceita', owner: user?.id, limit: 50 });
        const dados = res?.data || res;
        setCotacoes(Array.isArray(dados) ? dados : []);
      } catch (err) {
        console.error('Erro ao listar cotações aceitas', err);
        setCotacoes([]);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [user]);

  return (
    <DashboardLayout userType={user?.userType === "transportador" ? "transportador" : "embarcador"}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white mb-6">Cotações Aceitas</h1>

        {loading ? (
          <p className="text-slate-300">Carregando...</p>
        ) : cotacoes.length === 0 ? (
          <div className="card">
            <p className="text-slate-300">Você ainda não aceitou nenhuma cotação.</p>
            <Link to="/cotacoes" className="btn-secondary mt-4 inline-block">Ver Cotações</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {cotacoes.map((c) => (
              <div key={c.id || c._id} className="card">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-white">{c.titulo || c.descricao || `Cotação #${c.id || c._id}`}</h3>
                    <p className="text-slate-400 text-sm">{c.origem} → {c.destino}</p>
                  </div>
                  <span className="bg-green-600 text-white px-3 py-1 rounded text-sm">Aceita</span>
                </div>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div><span className="text-slate-400 text-sm">Peso</span> <p className="text-white font-semibold">{c.peso || '—'} kg</p></div>
                  <div><span className="text-slate-400 text-sm">Status</span> <p className="text-white font-semibold">{c.status}</p></div>
                  <div><span className="text-slate-400 text-sm">Data</span> <p className="text-white font-semibold">{new Date(c.criadoEm).toLocaleDateString()}</p></div>
                </div>
                <Link to={`/cotacoes/${c.id || c._id}`} className="btn-secondary mt-4 inline-block">Ver Detalhes</Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
