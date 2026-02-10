import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/api/client';
import useAuthStore from '@/hooks/useAuthStore';
import { Key, Lock, Calendar } from 'lucide-react';

export default function CodigoDiarioTransportadora() {
  const { user } = useAuthStore();
  const [codigos, setCodigos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [codigoAtual, setCodigoAtual] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        // TODO: Implementar endpoint de acesso temporário no backend
        // Dados mock enquanto não existe
        setCodigos([]);
        setCodigoAtual(null);
      } catch (err) {
        console.error('Erro ao listar', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user]);

  const handleGerarNovoCodigo = async () => {
    try {
      // TODO: Implementar endpoint de acesso temporário no backend
      const novoCodigoData = {
        transportadorId: user?.id,
        codigo: Math.random().toString(36).substr(2, 9).toUpperCase(),
        dataCriacao: new Date(),
        dataExpiracao: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
        status: 'ativo'
      };
      setCodigos([...codigos, novoCodigoData]);
      setCodigoAtual(novoCodigoData);
      alert('Novo código gerado!');
    } catch (err) {
      console.error('Erro ao gerar', err);
    }
  };

  return (
    <DashboardLayout userType={user?.userType === "transportador" ? "transportador" : "embarcador"}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-2">
          <Key className="w-8 h-8 text-blue-600" /> Código de Acesso Diário
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            {codigoAtual ? (
              <div className="card bg-gradient-to-br from-blue-900 to-cyan-900 mb-6">
                <p className="text-slate-300 text-sm mb-2">Código Ativo Hoje</p>
                <p className="text-5xl font-bold text-white text-center tracking-widest font-mono mb-2">
                  {codigoAtual.codigo}
                </p>
                <p className="text-center text-slate-300 text-sm">
                  Válido até {new Date(codigoAtual.dataExpiracao).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </p>
              </div>
            ) : (
              <div className="card mb-6 bg-yellow-900 border border-yellow-600">
                <p className="text-yellow-300">Nenhum código ativo. Gere um novo para acessar hoje.</p>
              </div>
            )}

            <div className="card">
              <h2 className="text-lg font-bold text-white mb-4">Histórico de Códigos</h2>
              {loading ? (
                <p className="text-slate-300">Carregando...</p>
              ) : codigos.length === 0 ? (
                <p className="text-slate-300">Nenhum código gerado</p>
              ) : (
                <div className="space-y-2">
                  {codigos.map((c) => (
                    <div key={c.id || c._id} className="flex items-center justify-between p-3 bg-slate-800 rounded">
                      <div>
                        <p className="text-white font-mono font-semibold">{c.codigo}</p>
                        <p className="text-slate-400 text-sm flex items-center gap-1">
                          <Calendar className="w-4 h-4" /> {new Date(c.dataCriacao).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded text-xs font-medium ${c.status === 'ativo' ? 'bg-green-900 text-green-300' : 'bg-slate-700 text-slate-300'}`}>
                        {c.status === 'ativo' ? '✓ Ativo' : 'Expirado'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5" /> Ações
            </h2>
            <button 
              onClick={handleGerarNovoCodigo}
              className="btn-primary w-full mb-3"
            >
              Gerar Novo Código
            </button>
            <p className="text-slate-400 text-sm">Seu código muda diariamente por segurança. Guarde-o bem.</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
