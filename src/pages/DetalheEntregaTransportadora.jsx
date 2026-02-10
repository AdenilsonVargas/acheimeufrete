import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/api/client';
import useAuthStore from '@/hooks/useAuthStore';
import { Box, MapPin, Clock, MessageCircle } from 'lucide-react';

export default function DetalheEntregaTransportadora() {
  const { user } = useAuthStore();
  const [entrega, setEntrega] = useState(null);
  const [loading, setLoading] = useState(false);
  const [historico, setHistorico] = useState([]);
  const [form, setForm] = useState({ latitude: '', longitude: '', status: '' });

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const entregas = await api.entities.cotacao.filter({ status: 'em_andamento', transportadorId: user?.id, limit: 10 });
        if (entregas?.data?.[0]) {
          setEntrega(entregas.data[0]);
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

  const handleUpdateStatus = async () => {
    if (!form.status) return;
    try {
      await api.entities.historico.create({
        cotacaoId: entrega.id,
        status: form.status,
        latitude: form.latitude,
        longitude: form.longitude,
        data: new Date()
      });
      setHistorico([...historico, { status: form.status, data: new Date(), latitude: form.latitude, longitude: form.longitude }]);
      setForm({ latitude: '', longitude: '', status: '' });
    } catch (err) {
      console.error('Erro ao atualizar', err);
    }
  };

  if (loading) return <div className="text-white p-4">Carregando...</div>;
  if (!entrega) return <div className="text-white p-4">Nenhuma entrega encontrada</div>;

  return (
    <DashboardLayout userType={user?.userType === "transportador" ? "transportador" : "embarcador"}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-2">
          <Box className="w-8 h-8 text-orange-600" /> Minha Entrega
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="card mb-6">
              <h2 className="text-xl font-bold text-white mb-4">{entrega.titulo}</h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
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
                  <p className="text-slate-400 text-sm">Valor do Frete</p>
                  <p className="text-green-400 font-bold">R$ {(entrega.valor || 0).toFixed(2)}</p>
                </div>
              </div>

              <div className="bg-slate-800 p-4 rounded-lg">
                <h3 className="text-lg font-bold text-white mb-3">Dados do Cliente</h3>
                <p className="text-slate-300">{entrega.clienteNome}</p>
                <p className="text-slate-400 text-sm">{entrega.clienteTelefone}</p>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" /> Histórico
              </h3>
              <div className="space-y-4">
                {historico.length === 0 ? (
                  <p className="text-slate-300">Nenhuma atualização</p>
                ) : (
                  historico.map((h, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="w-2 h-2 bg-orange-400 rounded-full mt-2"></div>
                      <div>
                        <p className="text-white font-semibold">{h.status}</p>
                        <p className="text-slate-400 text-sm">Lat: {h.latitude} | Long: {h.longitude}</p>
                        <p className="text-slate-500 text-xs">{new Date(h.data).toLocaleString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="card">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" /> Atualizar Localização
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-400 text-sm mb-1">Status</label>
                  <select 
                    value={form.status}
                    onChange={(e) => setForm({...form, status: e.target.value})}
                    className="input-field w-full"
                  >
                    <option value="">Selecione</option>
                    <option value="Saiu para Entrega">Saiu para Entrega</option>
                    <option value="Em Trânsito">Em Trânsito</option>
                    <option value="Entregue">Entregue</option>
                    <option value="Devolvido">Devolvido</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-1">Latitude</label>
                  <input 
                    placeholder="-23.5505"
                    value={form.latitude}
                    onChange={(e) => setForm({...form, latitude: e.target.value})}
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-1">Longitude</label>
                  <input 
                    placeholder="-46.6333"
                    value={form.longitude}
                    onChange={(e) => setForm({...form, longitude: e.target.value})}
                    className="input-field w-full"
                  />
                </div>
                <button onClick={handleUpdateStatus} className="btn-primary w-full">
                  Atualizar
                </button>
              </div>
            </div>

            <div className="card mt-6">
              <button className="btn-secondary w-full flex items-center justify-center gap-2">
                <MessageCircle className="w-4 h-4" /> Contatar Cliente
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
