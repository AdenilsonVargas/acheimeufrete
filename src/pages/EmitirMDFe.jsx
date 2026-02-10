import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/api/client';
import useAuthStore from '@/hooks/useAuthStore';
import { FileText, Plus, MessageCircle } from 'lucide-react';

export default function EmitirMDFe() {
  const { user } = useAuthStore();
  const [cotacoes, setCotacoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ cotacaoId: '', peso: '', valor: '', descricao: '' });

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api.entities.cotacao.filter({ status: 'em_andamento', transportadorId: user?.id, limit: 50 });
        setCotacoes(res?.data || res || []);
      } catch (err) {
        console.error('Erro ao listar', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user]);

  const handleEmitir = async () => {
    if (!form.cotacaoId || !form.peso) return;
    try {
      await api.entities.mdfe.create({
        cotacaoId: form.cotacaoId,
        peso: parseFloat(form.peso),
        valor: parseFloat(form.valor) || 0,
        descricao: form.descricao,
        dataEmissao: new Date(),
        status: 'emitido'
      });
      alert('MDFe emitido com sucesso!');
      setForm({ cotacaoId: '', peso: '', valor: '', descricao: '' });
    } catch (err) {
      console.error('Erro ao emitir', err);
    }
  };

  return (
    <DashboardLayout userType={user?.userType === "transportador" ? "transportador" : "embarcador"}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-2">
          <FileText className="w-8 h-8 text-orange-600" /> Emitir MDFe
        </h1>

        <p className="text-slate-400 mb-8">Emita Manifestos de Documento Fiscal eletrônico para seus fretes.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 card">
            <h2 className="text-lg font-bold text-white mb-4">Cotações Disponíveis</h2>
            {loading ? (
              <p className="text-slate-300">Carregando...</p>
            ) : cotacoes.length === 0 ? (
              <p className="text-slate-300">Nenhuma cotação disponível</p>
            ) : (
              <div className="space-y-3">
                {cotacoes.map((c) => (
                  <div key={c.id || c._id} className="p-4 bg-slate-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-white font-semibold">{c.titulo}</h3>
                        <p className="text-slate-400 text-sm">{c.peso} kg</p>
                      </div>
                      <input 
                        type="radio"
                        name="cotacao"
                        onChange={() => setForm({...form, cotacaoId: c.id || c._id})}
                        className="w-4 h-4"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="text-lg font-bold text-white mb-4">Dados do MDFe</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-slate-400 text-sm mb-1">Peso (kg)</label>
                <input 
                  type="number"
                  placeholder="0.00"
                  value={form.peso}
                  onChange={(e) => setForm({...form, peso: e.target.value})}
                  className="input-field w-full"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-sm mb-1">Valor (R$)</label>
                <input 
                  type="number"
                  placeholder="0.00"
                  value={form.valor}
                  onChange={(e) => setForm({...form, valor: e.target.value})}
                  className="input-field w-full"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-sm mb-1">Descrição</label>
                <textarea 
                  placeholder="Descrição do manifesto"
                  value={form.descricao}
                  onChange={(e) => setForm({...form, descricao: e.target.value})}
                  className="input-field w-full h-20"
                ></textarea>
              </div>

              <button 
                onClick={handleEmitir}
                disabled={!form.cotacaoId || !form.peso}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Emitir MDFe
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
