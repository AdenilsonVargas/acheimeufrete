import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/api/client';
import useAuthStore from '@/hooks/useAuthStore';
import { CheckCircle, Calendar, MapPin, DollarSign } from 'lucide-react';

export default function CotacoesFinalizadasTransportadora() {
  const { user } = useAuthStore();
  const [cotacoes, setCotacoes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        // Usar /minhas-respostas que retorna todas as respostas do transportador
        const res = await api.entities.respostaCotacao.minhasRespostas();
        const dados = res?.data || res;
        // Filtrar apenas as finalizadas
        const finalizadas = Array.isArray(dados) ? dados.filter(d => d.status === 'finalizada') : [];
        setCotacoes(finalizadas);
      } catch (err) {
        console.error('Erro ao listar fretes finalizados:', err);
        setCotacoes([]);
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
        <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-2">
          <CheckCircle className="w-8 h-8 text-green-600" /> Fretes Finalizados
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="card">
            <p className="text-slate-400 text-sm">Total Finalizado</p>
            <p className="text-3xl font-bold text-green-600">{cotacoes.length}</p>
          </div>
          <div className="card">
            <p className="text-slate-400 text-sm">Frete Total</p>
            <p className="text-3xl font-bold text-orange-600">
              R$ {cotacoes.reduce((sum, c) => sum + (c.valor || 0), 0).toFixed(2)}
            </p>
          </div>
          <div className="card">
            <p className="text-slate-400 text-sm">Médio por Frete</p>
            <p className="text-3xl font-bold text-cyan-400">
              R$ {(cotacoes.length > 0 ? cotacoes.reduce((sum, c) => sum + (c.valor || 0), 0) / cotacoes.length : 0).toFixed(2)}
            </p>
          </div>
          <div className="card">
            <p className="text-slate-400 text-sm">Clientes</p>
            <p className="text-3xl font-bold text-blue-400">{new Set(cotacoes.map(c => c.clienteId)).size}</p>
          </div>
        </div>

        {loading ? (
          <p className="text-slate-300">Carregando...</p>
        ) : cotacoes.length === 0 ? (
          <div className="card">
            <p className="text-slate-300">Nenhum frete finalizado.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cotacoes.map((c) => (
              <div key={c.id || c._id} className="card hover:border-green-500 transition">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h3 className="text-white font-semibold text-lg">{c.cotacaoTitulo || 'Frete'}</h3>
                    <div className="flex items-center gap-2 text-slate-400 text-sm mt-2">
                      <MapPin className="w-4 h-4" /> {c.origem} → {c.destino}
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-300 text-sm">Cliente: {c.clienteNome || 'Cliente'}</p>
                    <div className="flex items-center gap-2 text-slate-400 text-sm mt-2">
                      <Calendar className="w-4 h-4" /> {new Date(c.dataFinalizacao).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <DollarSign className="w-5 h-5 text-green-400" />
                      <p className="text-2xl font-bold text-green-400">R$ {(c.valor || 0).toFixed(2)}</p>
                    </div>
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-green-900 text-green-300 mt-2">
                      ✓ Pago
                    </span>
                  </div>
                </div>
                <div className="mt-4">
                  <Link to={`/cotacoes/${c.cotacaoId}`} className="btn-secondary inline-block">Ver Detalhes da Cotação</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
