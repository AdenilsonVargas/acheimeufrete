import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/api/client';
import useAuthStore from '@/hooks/useAuthStore';
import { Coins, TrendingUp, Plus, Download } from 'lucide-react';

export default function Creditos() {
  const { user } = useAuthStore();
  const [dados, setDados] = useState({
    saldoCreditos: 0,
    creditosUsados: 0,
    historico: []
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        // TODO: Implementar endpoint de assinatura premium no backend
        // Por enquanto, usando dados estáticos
        setDados({
          saldoCreditos: 500,
          creditosUsados: 150,
          historico: [
            { id: 1, tipo: 'Compra', quantidade: 100, data: '2024-01-15' },
            { id: 2, tipo: 'Uso', quantidade: -50, data: '2024-01-14' }
          ]
        });
      } catch (err) {
        console.error('Erro ao listar', err);
        // Manter dados padrão em caso de erro
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user]);

  const handleComprarCreditos = async (quantidade) => {
    try {
      // TODO: Implementar endpoint de compra de créditos no backend
      alert(`${quantidade} créditos adicionados!`);
      // Atualizar estado local
      setDados(prev => ({
        ...prev,
        saldoCreditos: prev.saldoCreditos + quantidade
      }));
    } catch (err) {
      console.error('Erro ao comprar', err);
    }
  };

  return (
    <DashboardLayout userType={user?.userType === 'transportador' ? 'transportador' : 'embarcador'}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-2">
          <Coins className="w-8 h-8 text-yellow-600" /> Créditos
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card bg-gradient-to-br from-yellow-900 to-orange-900">
            <p className="text-yellow-300 text-sm mb-2">Saldo de Créditos</p>
            <p className="text-5xl font-bold text-yellow-300">{dados.saldoCreditos}</p>
            <p className="text-yellow-400 text-sm mt-2">Créditos disponíveis</p>
          </div>

          <div className="card">
            <p className="text-slate-400 text-sm">Usados Este Mês</p>
            <p className="text-3xl font-bold text-orange-600">{dados.creditosUsados}</p>
          </div>

          <div className="card">
            <p className="text-slate-400 text-sm">Limite Mensal</p>
            <p className="text-3xl font-bold text-cyan-400">1000</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="card">
            <h2 className="text-lg font-bold text-white mb-4">Comprar Créditos</h2>
            <div className="space-y-3">
              <button 
                onClick={() => handleComprarCreditos(100)}
                className="btn-secondary w-full text-left flex items-center justify-between"
              >
                <span>100 Créditos</span>
                <span className="font-bold">R$ 99,00</span>
              </button>
              <button 
                onClick={() => handleComprarCreditos(500)}
                className="btn-secondary w-full text-left flex items-center justify-between"
              >
                <span>500 Créditos (5% desc)</span>
                <span className="font-bold">R$ 470,00</span>
              </button>
              <button 
                onClick={() => handleComprarCreditos(1000)}
                className="btn-secondary w-full text-left flex items-center justify-between"
              >
                <span>1000 Créditos (10% desc)</span>
                <span className="font-bold">R$ 890,00</span>
              </button>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-bold text-white mb-4">Para Que Usamos Créditos?</h2>
            <ul className="space-y-2 text-slate-300 text-sm">
              <li className="flex gap-2">
                <span className="text-orange-600">✓</span> Cotações adicionais
              </li>
              <li className="flex gap-2">
                <span className="text-cyan-600">✓</span> Relatórios avançados
              </li>
              <li className="flex gap-2">
                <span className="text-green-600">✓</span> Análise de mercado
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600">✓</span> Prioridade no atendimento
              </li>
            </ul>
          </div>
        </div>

        {loading ? (
          <p className="text-slate-300">Carregando...</p>
        ) : (
          <div className="card">
            <h2 className="text-lg font-bold text-white mb-4">Histórico</h2>
            {dados.historico.length === 0 ? (
              <p className="text-slate-300">Nenhuma transação</p>
            ) : (
              <div className="space-y-2">
                {dados.historico.map((h, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-slate-800 rounded text-sm">
                    <p className="text-slate-300">{h.tipo}</p>
                    <p className="text-orange-400 font-bold">{h.quantidade}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
