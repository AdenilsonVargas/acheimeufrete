import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/api/client';
import useAuthStore from '@/hooks/useAuthStore';
import { Settings, Plus, Copy } from 'lucide-react';

export default function OpcoesEnvio() {
  const { user } = useAuthStore();
  const [opcoes, setOpcoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ nome: '', descricao: '', prazo: '', custo: '' });

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        // TODO: Implementar endpoint de opções de envio no backend
        setOpcoes([]);
      } catch (err) {
        console.error('Erro ao listar', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user]);

  const handleAdd = async () => {
    if (!form.nome || !form.prazo) return;
    try {
      // TODO: Implementar endpoint de opções de envio no backend
      setOpcoes([...opcoes, form]);
      setForm({ nome: '', descricao: '', prazo: '', custo: '' });
      alert('Opção adicionada (dados não persistidos - backend não implementado)');
    } catch (err) {
      console.error('Erro ao adicionar', err);
    }
  };

  return (
    <DashboardLayout userType={user?.userType === "transportador" ? "transportador" : "embarcador"}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-2">
          <Settings className="w-8 h-8 text-orange-600" /> Opções de Envio
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <h2 className="text-lg font-bold text-white mb-4">Serviços Oferecidos</h2>
            {loading ? (
              <p className="text-slate-300">Carregando...</p>
            ) : opcoes.length === 0 ? (
              <p className="text-slate-300">Nenhuma opção de envio cadastrada</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {opcoes.map((o) => (
                  <div key={o.id || o._id} className="card">
                    <h3 className="text-white font-semibold">{o.nome}</h3>
                    <p className="text-slate-400 text-sm mt-1">{o.descricao}</p>
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-700">
                      <div>
                        <p className="text-slate-400 text-xs">Prazo</p>
                        <p className="text-cyan-400 font-semibold">{o.prazo} dias</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs">Custo</p>
                        <p className="text-green-400 font-semibold">R$ {(o.custo || 0).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5" /> Nova Opção
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-slate-400 text-sm mb-1">Nome do Serviço</label>
                <input 
                  placeholder="Ex: Rápido"
                  value={form.nome}
                  onChange={(e) => setForm({...form, nome: e.target.value})}
                  className="input-field w-full"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-sm mb-1">Descrição</label>
                <input 
                  placeholder="Descrição do serviço"
                  value={form.descricao}
                  onChange={(e) => setForm({...form, descricao: e.target.value})}
                  className="input-field w-full"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-sm mb-1">Prazo (dias)</label>
                <input 
                  type="number"
                  placeholder="1"
                  value={form.prazo}
                  onChange={(e) => setForm({...form, prazo: e.target.value})}
                  className="input-field w-full"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-sm mb-1">Custo Base (R$)</label>
                <input 
                  type="number"
                  placeholder="50.00"
                  value={form.custo}
                  onChange={(e) => setForm({...form, custo: e.target.value})}
                  className="input-field w-full"
                />
              </div>

              <button 
                onClick={handleAdd}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Copy className="w-4 h-4" /> Criar
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
