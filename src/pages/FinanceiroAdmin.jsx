import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/api/client';
import useAuthStore from '@/hooks/useAuthStore';
import { DollarSign, TrendingUp, TrendingDown, BarChart2 } from 'lucide-react';

export default function FinanceiroAdmin() {
  const { user } = useAuthStore();
  const [dados, setDados] = useState({
    receita: 0,
    despesa: 0,
    lucro: 0,
    comissoes: 0,
    movimentacoes: []
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const pagamentos = await api.entities.pagamento.list({ limit: 1000 });
        const cotacoes = await api.entities.cotacao.list({ limit: 1000 });

        const entradas = (pagamentos?.data || []).filter(p => p.tipo === 'entrada').reduce((sum, p) => sum + (p.valor || 0), 0);
        const saidas = (pagamentos?.data || []).filter(p => p.tipo === 'saida').reduce((sum, p) => sum + (p.valor || 0), 0);
        const totalCotacoes = (cotacoes?.data || []).reduce((sum, c) => sum + (c.valor || 0), 0);
        const comissao = totalCotacoes * 0.05; // 5% de comissão

        setDados({
          receita: entradas,
          despesa: saidas,
          lucro: entradas - saidas - comissao,
          comissoes: comissao,
          movimentacoes: (pagamentos?.data || []).slice(0, 20)
        });
      } catch (err) {
        console.error('Erro ao buscar', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <DashboardLayout userType={user?.userType}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-2">
          <DollarSign className="w-8 h-8 text-green-600" /> Financeiro
        </h1>

        {loading ? (
          <p className="text-slate-300">Carregando...</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Receita Total</p>
                    <p className="text-3xl font-bold text-green-400">R$ {(dados.receita / 1000).toFixed(1)}k</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Despesa Total</p>
                    <p className="text-3xl font-bold text-orange-400">R$ {(dados.despesa / 1000).toFixed(1)}k</p>
                  </div>
                  <TrendingDown className="w-8 h-8 text-orange-600" />
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Comissões</p>
                    <p className="text-3xl font-bold text-blue-400">R$ {(dados.comissoes / 1000).toFixed(1)}k</p>
                  </div>
                  <BarChart2 className="w-8 h-8 text-blue-600" />
                </div>
              </div>

              <div className="card bg-gradient-to-br from-green-900 to-emerald-900">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-300 text-sm">Lucro Líquido</p>
                    <p className="text-3xl font-bold text-green-300">R$ {(dados.lucro / 1000).toFixed(1)}k</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-300" />
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="text-lg font-bold text-white mb-4">Movimentações Recentes</h2>
              {dados.movimentacoes.length === 0 ? (
                <p className="text-slate-300">Nenhuma movimentação</p>
              ) : (
                <div className="space-y-3">
                  {dados.movimentacoes.map((m, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-slate-800 rounded">
                      <div>
                        <p className="text-white font-semibold">{m.descricao}</p>
                        <p className="text-slate-400 text-sm">{new Date(m.data).toLocaleDateString()}</p>
                      </div>
                      <p className={`font-bold ${m.tipo === 'entrada' ? 'text-green-400' : 'text-orange-400'}`}>
                        {m.tipo === 'entrada' ? '+' : '-'} R$ {(m.valor || 0).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
