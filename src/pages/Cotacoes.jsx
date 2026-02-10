import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/api/client';
import useAuthStore from '@/hooks/useAuthStore';
import * as favoritasAPI from '@/api/favoritas';
import { Star, Trash2 } from 'lucide-react';

export default function Cotacoes() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [cotacoes, setCotacoes] = useState([]);
  const [favoritas, setFavoritas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingFavoritas, setLoadingFavoritas] = useState(false);
  const [deletandoFavorita, setDeletandoFavorita] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api.entities.cotacao.list({ owner: user?.id || 'me', limit: 50 });
        console.log('DEBUG - Response cotações:', res);
        const dados = res?.data?.cotacoes || res?.cotacoes || res?.data || res;
        console.log('DEBUG - Cotações extraídas:', dados);
        setCotacoes(Array.isArray(dados) ? dados : []);
      } catch (err) {
        console.error('Erro ao listar cotações', err);
        setCotacoes([]);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [user]);

  useEffect(() => {
    const fetchFavoritas = async () => {
      setLoadingFavoritas(true);
      try {
        const res = await favoritasAPI.listarFavoritas();
        setFavoritas(Array.isArray(res) ? res : res?.data || []);
      } catch (err) {
        console.error('Erro ao listar favoritas', err);
        setFavoritas([]);
      } finally {
        setLoadingFavoritas(false);
      }
    };

    fetchFavoritas();
  }, [user]);

  const handleDeletarFavorita = async (favoritaId) => {
    if (!window.confirm('Tem certeza que deseja remover esta favorita?')) return;
    
    setDeletandoFavorita(favoritaId);
    try {
      await favoritasAPI.deletarFavorita(favoritaId);
      setFavoritas(favoritas.filter(f => f.id !== favoritaId));
    } catch (err) {
      console.error('Erro ao deletar favorita', err);
      alert('Erro ao remover favorita');
    } finally {
      setDeletandoFavorita(null);
    }
  };

  const handleClicaFavorita = (favorita) => {
    // Pre-fills the new cotacao form with favorita data
    navigate(`/nova-cotacao?favorita=${favorita.id}`, { 
      state: { favoritaData: favorita.cotacao }
    });
  };

  return (
    <DashboardLayout userType={user?.userType === "transportador" ? "transportador" : "embarcador"}>
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Minhas Cotações</h1>
          <Link to="/nova-cotacao" className="bg-gradient-to-r from-orange-500 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-orange-500/50 transition">Nova Cotação</Link>
        </div>

        {/* Seção de Favoritas */}
        {favoritas.length > 0 && (
          <section className="bg-gradient-to-r from-yellow-600/20 to-amber-600/20 backdrop-blur rounded-xl border border-yellow-500/30 shadow-lg">
            <div className="p-6">
              <h2 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
                <Star className="w-6 h-6 fill-yellow-400" />
                Cotações Favoritas
              </h2>
              {loadingFavoritas ? (
                <p className="text-slate-300">Carregando favoritas...</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {favoritas.map((fav) => (
                    <div 
                      key={fav.id} 
                      className="bg-slate-800/50 rounded-lg border border-yellow-500/30 p-4 cursor-pointer hover:border-yellow-500 hover:bg-slate-800/80 transition"
                      onClick={() => handleClicaFavorita(fav)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-white font-semibold flex-1">{fav.nome}</h3>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletarFavorita(fav.id);
                          }}
                          disabled={deletandoFavorita === fav.id}
                          className="text-slate-400 hover:text-red-400 transition disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-slate-300 text-sm mb-3">
                        Clique para usar como base para nova cotação
                      </p>
                      <div className="text-slate-400 text-xs">
                        <p>Produtos: {fav.cotacao?.metadados?.produtosLista?.length || 0}</p>
                        <p>Criada em: {new Date(fav.createdAt).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Seção de Cotações */}
        <section className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 shadow-lg">
          <div className="p-6">
            <h2 className="text-xl font-bold text-white mb-4">Todas as Cotações</h2>
            {loading ? (
              <p className="text-slate-300">Carregando...</p>
            ) : !Array.isArray(cotacoes) || cotacoes.length === 0 ? (
              <p className="text-slate-300">Você ainda não criou nenhuma cotação.</p>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {cotacoes.map((c) => (
                  <div key={c.id || c._id} className="py-4 flex justify-between items-center hover:bg-slate-700/30 transition">
                    <div>
                      <div className="text-white font-semibold">{c.titulo || `Cotação #${c.numero || c.id}`}</div>
                      <div className="text-slate-400 text-sm">{c.cidadeColeta || 'N/A'} → {c.cidadeEntrega || c.destinatarioCidade || 'N/A'}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-slate-300 text-sm">Status: <span className="font-semibold text-white uppercase">{c.status}</span></div>
                      <Link to={`/cotacoes/${c.id || c._id}`} className="text-orange-400 hover:text-orange-300 text-sm mt-2 inline-block">Ver Detalhes</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
