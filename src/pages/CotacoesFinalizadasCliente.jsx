import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/api/client';
import useAuthStore from '@/hooks/useAuthStore';
import { CheckCircle, Calendar, MapPin, Truck } from 'lucide-react';

export default function CotacoesFinalizadasCliente() {
  const { user } = useAuthStore();
  const [cotacoes, setCotacoes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api.entities.cotacao.filter({ status: 'finalizada', owner: user?.id, limit: 50 });
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
          <CheckCircle className="w-8 h-8 text-green-600" /> Cotações Finalizadas
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="card">
            <p className="text-slate-400 text-sm">Total Finalizado</p>
            <p className="text-3xl font-bold text-green-600">{cotacoes.length}</p>
          </div>
          <div className="card">
            <p className="text-slate-400 text-sm">Peso Total</p>
            <p className="text-3xl font-bold text-cyan-400">
              {cotacoes.reduce((sum, c) => sum + (c.peso || 0), 0).toFixed(0)} kg
            </p>
          </div>
          <div className="card">
            <p className="text-slate-400 text-sm">Valor Pago</p>
            <p className="text-3xl font-bold text-orange-600">
              R$ {cotacoes.reduce((sum, c) => sum + (c.valorFinal || c.valor || 0), 0).toFixed(2)}
            </p>
          </div>
          <div className="card">
            <p className="text-slate-400 text-sm">Transportadores</p>
            <p className="text-3xl font-bold text-blue-400">{new Set(cotacoes.map(c => c.transportadorId)).size}</p>
          </div>
        </div>

        {loading ? (
          <p className="text-slate-300">Carregando...</p>
        ) : cotacoes.length === 0 ? (
          <div className="card">
            <p className="text-slate-300">Nenhuma cotação finalizada.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cotacoes.map((c) => (
              <div key={c.id || c._id} className="card hover:border-orange-500 transition">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h3 className="text-white font-semibold text-lg">{c.titulo}</h3>
                    <div className="flex items-center gap-2 text-slate-400 text-sm mt-2">
                      <MapPin className="w-4 h-4" /> {c.origem} → {c.destino}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <Truck className="w-4 h-4" /> {c.transportadorNome || 'Transportador'}
                    </div>
                    <p className="text-slate-300 text-sm mt-2">Finalizada em {new Date(c.dataFinalizacao).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <Link to={`/cotacoes/${c.id || c._id}`} className="btn-secondary inline-block">Ver Detalhes</Link>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-orange-600">R$ {(c.valorFinal || c.valor || 0).toFixed(2)}</p>
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-green-900 text-green-300 mt-2">
                      ✓ Finalizada
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
