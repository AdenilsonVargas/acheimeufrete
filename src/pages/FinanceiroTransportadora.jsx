import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/api/client';
import useAuthStore from '@/hooks/useAuthStore';
import { TrendingUp, DollarSign, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export default function FinanceiroTransportadora() {
  const { user } = useAuthStore();
  const [dados, setDados] = useState({ saldo: 0, entradas: 0, saidas: 0, movimentacoes: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api.entities.financeiro.list();
        const apiData = res?.data || res || {};
        setDados({
          saldo: apiData.saldo !== undefined ? parseFloat(apiData.saldo) : 0,
          entradas: apiData.entradas !== undefined ? parseFloat(apiData.entradas) : 0,
          saidas: apiData.saidas !== undefined ? parseFloat(apiData.saidas) : 0,
          movimentacoes: Array.isArray(apiData.movimentacoes) ? apiData.movimentacoes : []
        });
      } catch (err) {
        console.error('Erro ao carregar financeiro', err);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [user]);

  return (
    <DashboardLayout userType={user?.userType === "transportador" ? "transportador" : "embarcador"}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white mb-6">Financeiro</h1>

        {loading ? (
          <p className="text-slate-300">Carregando...</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="card">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm text-slate-300">Saldo Disponível</h3>
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-white">R$ {dados.saldo.toFixed(2)}</p>
              </div>

              <div className="card">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm text-slate-300">Entradas</h3>
                  <ArrowDownLeft className="w-5 h-5 text-cyan-400" />
                </div>
                <p className="text-3xl font-bold text-white">R$ {dados.entradas.toFixed(2)}</p>
              </div>

              <div className="card">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm text-slate-300">Saídas</h3>
                  <ArrowUpRight className="w-5 h-5 text-orange-600" />
                </div>
                <p className="text-3xl font-bold text-white">R$ {dados.saidas.toFixed(2)}</p>
              </div>
            </div>

            <div className="card">
              <h2 className="text-xl font-bold text-white mb-4">Movimentações</h2>
              <div className="space-y-2">
                {dados.movimentacoes?.length === 0 ? (
                  <p className="text-slate-300">Nenhuma movimentação registrada.</p>
                ) : (
                  dados.movimentacoes?.map((m, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-slate-800 rounded">
                      <div>
                        <p className="text-white font-semibold">{m.descricao}</p>
                        <p className="text-slate-400 text-sm">{new Date(m.data).toLocaleDateString()}</p>
                      </div>
                      <p className={`font-semibold ${m.tipo === 'entrada' ? 'text-green-400' : 'text-red-400'}`}>
                        {m.tipo === 'entrada' ? '+' : '-'}R$ {Math.abs(m.valor || 0).toFixed(2)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
