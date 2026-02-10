import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/api/client';
import useAuthStore from '@/hooks/useAuthStore';
import { Truck, MapPin, Plus } from 'lucide-react';

export default function EmEntregaTransportadora() {
  const { user } = useAuthStore();
  const [entregas, setEntregas] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api.entities.cotacao.filter({ status: 'em_andamento', transportadorId: user?.id, limit: 50 });
        const dados = res?.data || res;
        setEntregas(Array.isArray(dados) ? dados : []);
      } catch (err) {
        console.error('Erro ao listar', err);
        setEntregas([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user]);

  return (
    <DashboardLayout userType={user?.userType === "transportador" ? "transportador" : "embarcador"}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-2">
          <Truck className="w-8 h-8 text-orange-600" /> Entregas em Andamento
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="card">
            <p className="text-slate-400 text-sm">Total em Trânsito</p>
            <p className="text-3xl font-bold text-orange-600">{entregas.length}</p>
          </div>
          <div className="card">
            <p className="text-slate-400 text-sm">Peso Total</p>
            <p className="text-3xl font-bold text-cyan-400">
              {entregas.reduce((sum, e) => sum + (e.peso || 0), 0).toFixed(0)} kg
            </p>
          </div>
          <div className="card">
            <p className="text-slate-400 text-sm">Valor Total</p>
            <p className="text-3xl font-bold text-green-400">
              R$ {entregas.reduce((sum, e) => sum + (e.valor || 0), 0).toFixed(2)}
            </p>
          </div>
          <div className="card">
            <p className="text-slate-400 text-sm">Paradas</p>
            <p className="text-3xl font-bold text-blue-400">{entregas.length}</p>
          </div>
        </div>

        {loading ? (
          <p className="text-slate-300">Carregando...</p>
        ) : entregas.length === 0 ? (
          <div className="card">
            <p className="text-slate-300">Nenhuma entrega em andamento.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {entregas.map((e, idx) => (
              <div key={e.id || e._id} className="card hover:border-orange-500 transition">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-orange-900 flex items-center justify-center text-orange-300 font-bold text-sm">
                        {idx + 1}
                      </div>
                      <h3 className="text-white font-semibold">{e.titulo}</h3>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-sm mt-2">
                      <MapPin className="w-4 h-4" /> {e.origem} → {e.destino}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-orange-600">R$ {(e.valor || 0).toFixed(2)}</p>
                    <p className="text-cyan-400 font-semibold text-sm">{e.peso} kg</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-orange-900 text-orange-300">
                    → Em Trânsito
                  </span>
                  <button className="text-cyan-400 hover:text-cyan-300 text-sm font-medium">Ver Detalhes</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
