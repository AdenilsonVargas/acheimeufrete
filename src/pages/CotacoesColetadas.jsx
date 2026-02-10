import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/api/client';
import useAuthStore from '@/hooks/useAuthStore';
import { Package, Calendar, MapPin } from 'lucide-react';

export default function CotacoesColetadas() {
  const { user } = useAuthStore();
  const [cotacoes, setCotacoes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api.entities.cotacao.filter({ status: 'coletada', owner: user?.id, limit: 50 });
        const dados = res?.data || res;
        setCotacoes(Array.isArray(dados) ? dados : []);
      } catch (err) {
        console.error('Erro ao listar', err);
        setCotacoes([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user]);

  return (
    <DashboardLayout userType={user?.userType === 'transportador' ? 'transportador' : 'embarcador'}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-2">
          <Package className="w-8 h-8 text-orange-600" /> Cotações Coletadas
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="card">
            <p className="text-slate-400">Total Coletado</p>
            <p className="text-3xl font-bold text-orange-600">{cotacoes.length}</p>
          </div>
          <div className="card">
            <p className="text-slate-400">Peso Total</p>
            <p className="text-3xl font-bold text-cyan-400">
              {cotacoes.reduce((sum, c) => sum + (c.peso || 0), 0).toFixed(2)} kg
            </p>
          </div>
          <div className="card">
            <p className="text-slate-400">Valor Total</p>
            <p className="text-3xl font-bold text-green-400">
              R$ {cotacoes.reduce((sum, c) => sum + (c.valor || 0), 0).toFixed(2)}
            </p>
          </div>
        </div>

        {loading ? (
          <p className="text-slate-300">Carregando...</p>
        ) : cotacoes.length === 0 ? (
          <div className="card">
            <p className="text-slate-300">Nenhuma cotação coletada.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cotacoes.map((c) => (
              <div key={c.id || c._id} className="card">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-white font-semibold text-lg">{c.titulo}</h3>
                    <div className="flex items-center gap-2 text-slate-400 text-sm mt-2">
                      <MapPin className="w-4 h-4" /> {c.origem} → {c.destino}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-orange-600">R$ {(c.valor || 0).toFixed(2)}</p>
                    <div className="flex items-center gap-2 text-slate-400 text-sm mt-2 justify-end">
                      <Calendar className="w-4 h-4" /> {new Date(c.dataColeta).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <Link to={`/cotacoes/${c.id || c._id}`} className="btn-primary inline-block">Ver Detalhes</Link>
                </div>
                <div className="mt-3 flex gap-2">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-900 text-blue-300">
                    {c.peso} kg
                  </span>
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-cyan-900 text-cyan-300">
                    Coletada
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
