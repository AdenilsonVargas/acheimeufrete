import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/api/client';
import useAuthStore from '@/hooks/useAuthStore';
import { Zap, Plus, Download, AlertCircle } from 'lucide-react';

export default function EmitirCIOT() {
  const { user } = useAuthStore();
  const [cargas, setCargas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ ciotNumero: '', dataInicio: '', dataFim: '', descricao: '' });
  const [ciots, setCiots] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const resC = await api.entities.cotacao.filter({ status: 'em_andamento', transportadorId: user?.id, limit: 50 });
        setCargas(resC?.data || resC || []);

        const resCI = await api.entities.ciot.list({ transportadorId: user?.id, limit: 50 });
        setCiots(resCI?.data || resCI || []);
      } catch (err) {
        console.error('Erro ao listar', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user]);

  const handleEmitir = async () => {
    if (!form.ciotNumero || !form.dataInicio) return;
    try {
      await api.entities.ciot.create({
        transportadorId: user?.id,
        numero: form.ciotNumero,
        dataInicio: form.dataInicio,
        dataFim: form.dataFim,
        descricao: form.descricao,
        status: 'emitido'
      });
      alert('CIOT emitido com sucesso!');
      setForm({ ciotNumero: '', dataInicio: '', dataFim: '', descricao: '' });
    } catch (err) {
      console.error('Erro ao emitir', err);
    }
  };

  return (
    <DashboardLayout userType={user?.userType === "transportador" ? "transportador" : "embarcador"}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-2">
          <Zap className="w-8 h-8 text-yellow-500" /> Emitir CIOT
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <p className="text-slate-400 text-sm">CIOTs Emitidos</p>
            <p className="text-3xl font-bold text-yellow-400">{ciots.length}</p>
          </div>
          <div className="card">
            <p className="text-slate-400 text-sm">Cargas em Andamento</p>
            <p className="text-3xl font-bold text-cyan-400">{cargas.length}</p>
          </div>
          <div className="card">
            <div className="flex items-center gap-2 text-yellow-400">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm">CIOT é obrigatório</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 card">
            <h2 className="text-lg font-bold text-white mb-4">CIOTs Emitidos</h2>
            {loading ? (
              <p className="text-slate-300">Carregando...</p>
            ) : ciots.length === 0 ? (
              <p className="text-slate-300">Nenhum CIOT emitido</p>
            ) : (
              <div className="space-y-2">
                {ciots.map((c) => (
                  <div key={c.id || c._id} className="flex justify-between items-center p-3 bg-slate-800 rounded">
                    <div>
                      <p className="text-white font-semibold">CIOT #{c.numero}</p>
                      <p className="text-slate-400 text-sm">
                        {new Date(c.dataInicio).toLocaleDateString()} - {new Date(c.dataFim).toLocaleDateString()}
                      </p>
                    </div>
                    <button className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="text-lg font-bold text-white mb-4">Novo CIOT</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-slate-400 text-sm mb-1">Número do CIOT</label>
                <input 
                  placeholder="Ex: 123456789"
                  value={form.ciotNumero}
                  onChange={(e) => setForm({...form, ciotNumero: e.target.value})}
                  className="input-field w-full"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-sm mb-1">Data Início</label>
                <input 
                  type="date"
                  value={form.dataInicio}
                  onChange={(e) => setForm({...form, dataInicio: e.target.value})}
                  className="input-field w-full"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-sm mb-1">Data Fim</label>
                <input 
                  type="date"
                  value={form.dataFim}
                  onChange={(e) => setForm({...form, dataFim: e.target.value})}
                  className="input-field w-full"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-sm mb-1">Observações</label>
                <textarea 
                  placeholder="Notas adicionais"
                  value={form.descricao}
                  onChange={(e) => setForm({...form, descricao: e.target.value})}
                  className="input-field w-full h-16"
                ></textarea>
              </div>

              <button 
                onClick={handleEmitir}
                disabled={!form.ciotNumero || !form.dataInicio}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Emitir CIOT
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
