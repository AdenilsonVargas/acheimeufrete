import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/api/client';
import useAuthStore from '@/hooks/useAuthStore';

export default function CotacoesAceitasTransportadora() {
  const { user } = useAuthStore();
  const [respostas, setRespostas] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        if (!user?.id) {
          console.warn('⚠️ Usuário não identificado');
          setRespostas([]);
          return;
        }

        // Usar /minhas-respostas que retorna todas as respostas do transportador
        const res = await api.entities.respostaCotacao.minhasRespostas();
        const dados = res?.data || res;
        // Filtrar apenas as aceitas
        const aceitas = Array.isArray(dados) ? dados.filter(d => d.status === 'aceita') : [];
        setRespostas(aceitas);
      } catch (err) {
        console.error('Erro ao listar cotações aceitas:', err);
        setRespostas([]);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetch();
    }
  }, [user]);

  return (
    <DashboardLayout userType={user?.userType === "transportador" ? "transportador" : "embarcador"}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Cotações Aceitas</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Gerenciar suas propostas aceitas</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600 dark:text-slate-400">Carregando...</p>
            </div>
          </div>
        ) : respostas.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg p-8 text-center">
            <p className="text-slate-600 dark:text-slate-400 mb-4">Você ainda não tem propostas aceitas.</p>
            <Link to="/cotacoes-disponiveis" className="inline-block px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
              Ver Cotações Disponíveis
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {respostas.map((r) => (
              <div key={r.id || r._id} className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Proposta #{r.id || r._id}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Cotação: {r.cotacaoId}</p>
                  </div>
                  <span className="bg-green-500 text-white px-3 py-1 rounded text-sm font-medium">Aceita</span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 text-sm block mb-1">Valor</span>
                    <p className="text-slate-900 dark:text-white font-semibold">R$ {(r.valor || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 text-sm block mb-1">Status</span>
                    <p className="text-slate-900 dark:text-white font-semibold capitalize">{r.status}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 text-sm block mb-1">Data</span>
                    <p className="text-slate-900 dark:text-white font-semibold">{new Date(r.criadoEm).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                
                {r.mensagem && (
                  <div className="mb-4 p-3 bg-slate-100 dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600">
                    <p className="text-slate-700 dark:text-slate-300 text-sm"><strong>Mensagem:</strong> {r.mensagem}</p>
                  </div>
                )}
                
                <Link 
                  to={`/cotacoes/${r.cotacaoId}`} 
                  className="inline-block px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
                >
                  Ver Detalhes da Cotação
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
