import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/api/client';
import useAuthStore from '@/hooks/useAuthStore';
import { Box, Calendar, MapPin, Truck, MessageSquare } from 'lucide-react';

export default function DetalheEntregaCliente() {
  const { user } = useAuthStore();
  const [entrega, setEntrega] = useState(null);
  const [loading, setLoading] = useState(false);
  const [historico, setHistorico] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        // Buscar detalhes da entrega
        const entregas = await api.entities.cotacao.filter({ status: 'em_andamento', owner: user?.id, limit: 10 });
        if (entregas?.data?.[0]) {
          setEntrega(entregas.data[0]);
          // Buscar histórico
          const hist = await api.entities.historico.list({ cotacaoId: entregas.data[0].id });
          setHistorico(hist?.data || []);
        }
      } catch (err) {
        console.error('Erro ao listar', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user]);

  if (loading) return <div className="text-white p-4">Carregando...</div>;
  if (!entrega) return <div className="text-white p-4">Nenhuma entrega encontrada</div>;

  return (
    <DashboardLayout userType={user?.userType === 'transportador' ? 'transportador' : 'embarcador'}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-2">
          <Box className="w-8 h-8 text-cyan-600" /> Detalhes da Entrega
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="card mb-6">
              <h2 className="text-xl font-bold text-white mb-4">{entrega.titulo}</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400 text-sm">Origem</p>
                  <p className="text-white font-semibold">{entrega.origem}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Destino</p>
                  <p className="text-white font-semibold">{entrega.destino}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Peso</p>
                  <p className="text-cyan-400 font-bold">{entrega.peso} kg</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Valor</p>
                  <p className="text-green-400 font-bold">R$ {(entrega.valor || 0).toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-bold text-white mb-4">Histórico de Rastreamento</h3>
              <div className="space-y-4">
                {historico.length === 0 ? (
                  <p className="text-slate-300">Nenhuma atualização ainda</p>
                ) : (
                  historico.map((h, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <p className="text-white font-semibold">{h.status}</p>
                        <p className="text-slate-400 text-sm">{h.descricao}</p>
                        <p className="text-slate-500 text-xs mt-1">{new Date(h.data).toLocaleString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="card mb-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5" /> Transportador
              </h3>
              <div className="bg-slate-800 p-4 rounded-lg mb-4">
                <p className="text-white font-semibold">{entrega.transportadorNome || 'Transportador'}</p>
                <p className="text-slate-400 text-sm">{entrega.transportadorTelefone || 'Telefone'}</p>
              </div>
              <button className="btn-primary w-full flex items-center justify-center gap-2">
                <MessageSquare className="w-4 h-4" /> Contatar
              </button>
            </div>

            <div className="card">
              <h3 className="text-lg font-bold text-white mb-4">Status</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Coleta</span>
                  <span className="text-cyan-400">✓ Realizada</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Em Trânsito</span>
                  <span className="text-orange-400">→ Ativo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Entrega</span>
                  <span className="text-slate-500">Pendente</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
