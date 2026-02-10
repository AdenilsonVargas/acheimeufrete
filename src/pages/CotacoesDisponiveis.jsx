import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/api/client';
import { useAuth } from '@/hooks/useAuth';

export default function CotacoesDisponiveis() {
  const { user } = useAuth();
  const [cotacoes, setCotacoes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api.entities.cotacao.disponiveis({ limit: 50 });
        const dados = res?.data || res;
        setCotacoes(Array.isArray(dados) ? dados : []);
      } catch (err) {
        console.error('Erro ao listar cotações disponíveis', err);
        setCotacoes([]);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, []);

  return (
    <DashboardLayout userType={user?.userType === "transportador" ? "transportador" : "embarcador"}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white mb-6">Cotações Disponíveis</h1>

        {loading ? (
          <p className="text-slate-300">Carregando...</p>
        ) : cotacoes.length === 0 ? (
          <div className="card">
            <p className="text-slate-300">Nenhuma cotação disponível no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {cotacoes.map((c) => (
              <div key={c.id || c._id} className="card hover:border-orange-600 transition">
                <h3 className="text-lg font-bold text-white mb-2">{c.titulo || c.descricao || `Cotação #${c.id || c._id}`}</h3>
                <p className="text-slate-300 text-sm mb-4">{c.descricao}</p>
                <div className="space-y-2 mb-4">
                  <div><span className="text-slate-400">Origem:</span> <span className="text-white font-semibold">{c.origem}</span></div>
                  <div><span className="text-slate-400">Destino:</span> <span className="text-white font-semibold">{c.destino}</span></div>
                  <div><span className="text-slate-400">Peso:</span> <span className="text-white font-semibold">{c.peso || '—'} kg</span></div>
                </div>
                <Link to={`/responder-cotacao/${c.id || c._id}`} className="btn-primary inline-block w-full text-center">Responder</Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
