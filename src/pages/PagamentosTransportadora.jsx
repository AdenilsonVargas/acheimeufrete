import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/api/client';
import useAuthStore from '@/hooks/useAuthStore';
import { CreditCard, Plus, Wallet, TrendingUp } from 'lucide-react';

export default function PagamentosTransportadora() {
  const { user } = useAuthStore();
  const [pagamentos, setPagamentos] = useState([]);
  const [saldo, setSaldo] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ valor: '', descricao: '', data: new Date().toISOString().split('T')[0] });

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const resP = await api.entities.pagamento.list({ transportadorId: user?.id, limit: 50 });
        const dadosP = resP?.data || resP;
        setPagamentos(Array.isArray(dadosP) ? dadosP : []);

        const resF = await api.entities.financeiro.list();
        const balanceData = resF?.data || resF || {};
        setSaldo(balanceData.saldo !== undefined ? parseFloat(balanceData.saldo) : 0);
      } catch (err) {
        console.error('Erro ao listar', err);
        setPagamentos([]);
        setSaldo(0);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user]);

  const handleSolicitarSaque = async () => {
    if (!form.valor || parseFloat(form.valor) <= 0) return;
    try {
      await api.entities.pagamento.create({
        transportadorId: user?.id,
        valor: parseFloat(form.valor),
        descricao: form.descricao,
        tipo: 'saida',
        data: form.data,
        status: 'pendente'
      });
      setPagamentos([...pagamentos, { valor: form.valor, descricao: form.descricao, status: 'pendente' }]);
      setForm({ valor: '', descricao: '', data: new Date().toISOString().split('T')[0] });
      alert('Solicitação de saque enviada!');
    } catch (err) {
      console.error('Erro ao solicitar', err);
    }
  };

  const rendimentos = pagamentos.filter(p => p.tipo === 'entrada').reduce((sum, p) => sum + (p.valor || 0), 0);
  const saques = pagamentos.filter(p => p.tipo === 'saida').reduce((sum, p) => sum + (p.valor || 0), 0);

  return (
    <DashboardLayout userType={user?.userType === "transportador" ? "transportador" : "embarcador"}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-2">
          <CreditCard className="w-8 h-8 text-orange-600" /> Pagamentos
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="card">
            <p className="text-slate-400 text-sm">Saldo Disponível</p>
            <p className="text-3xl font-bold text-green-400">R$ {saldo.toFixed(2)}</p>
          </div>
          <div className="card">
            <p className="text-slate-400 text-sm">Rendimentos</p>
            <p className="text-3xl font-bold text-cyan-400">R$ {rendimentos.toFixed(2)}</p>
          </div>
          <div className="card">
            <p className="text-slate-400 text-sm">Saques</p>
            <p className="text-3xl font-bold text-orange-400">R$ {saques.toFixed(2)}</p>
          </div>
          <div className="card">
            <p className="text-slate-400 text-sm">Transações</p>
            <p className="text-3xl font-bold text-blue-400">{pagamentos.length}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2 card">
            <h2 className="text-lg font-bold text-white mb-4">Histórico de Pagamentos</h2>
            {loading ? (
              <p className="text-slate-300">Carregando...</p>
            ) : pagamentos.length === 0 ? (
              <p className="text-slate-300">Nenhuma transação.</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {pagamentos.map((p, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-slate-800 rounded">
                    <div>
                      <p className="text-white font-semibold">{p.descricao}</p>
                      <p className="text-slate-400 text-sm">{new Date(p.data).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${p.tipo === 'entrada' ? 'text-green-400' : 'text-orange-400'}`}>
                        {p.tipo === 'entrada' ? '+' : '-'} R$ {(p.valor || 0).toFixed(2)}
                      </p>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${p.status === 'completo' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`}>
                        {p.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-orange-600" /> Solicitar Saque
            </h2>
            <div className="space-y-3">
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
                <input 
                  placeholder="Motivo do saque"
                  value={form.descricao}
                  onChange={(e) => setForm({...form, descricao: e.target.value})}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-1">Data</label>
                <input 
                  type="date"
                  value={form.data}
                  onChange={(e) => setForm({...form, data: e.target.value})}
                  className="input-field w-full"
                />
              </div>
              <button 
                onClick={handleSolicitarSaque}
                disabled={!form.valor || parseFloat(form.valor) > saldo}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Solicitar Saque
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
