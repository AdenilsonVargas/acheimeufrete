import React, { useState, useEffect } from 'react';
import useAuthStore from '@/hooks/useAuthStore';
import { apiClient } from '@/api/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Star, Loader, AlertCircle } from 'lucide-react';

/**
 * Página: Avaliações Recebidas
 * 
 * Exibe todas as avaliações que o usuário recebeu de outros usuários.
 * - Transportadores veem avaliações de clientes
 * - Clientes veem avaliações de transportadores
 */

const Avaliacoes = () => {
  const { user } = useAuthStore();
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    carregarAvaliacoes();
  }, []);

  const carregarAvaliacoes = async () => {
    try {
      setCarregando(true);
      setErro(null);

      const tipo = user?.userType === 'transportador' ? 'cliente' : 'transportador';
      const response = await apiClient.get('/api/avaliacoes/recebidas', {
        params: { tipo }
      });

      if (response.data.success) {
        setAvaliacoes(response.data.data || []);
      } else {
        setErro(response.data.error || 'Erro ao carregar avaliações');
      }
    } catch (err) {
      console.error('Erro ao carregar avaliações:', err);
      setErro('Falha ao carregar avaliações. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  const renderStars = (nota) => {
    if (!nota) return null;
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={16}
            className={i < nota ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}
          />
        ))}
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-2">
          {nota.toFixed(1)}
        </span>
      </div>
    );
  };

  const calcularMediaGeral = () => {
    if (avaliacoes.length === 0) return 0;
    const soma = avaliacoes.reduce((acc, av) => acc + av.nota, 0);
    return (soma / avaliacoes.length).toFixed(2);
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto p-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Minhas Avaliações
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {user?.userType === 'transportador'
              ? 'Avaliações recebidas de clientes'
              : 'Avaliações recebidas de transportadores'}
          </p>
        </div>

        {/* Card de Resumo */}
        {avaliacoes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">
                Avaliação Média
              </p>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {calcularMediaGeral()}
              </div>
              <div className="mt-2">
                {renderStars(parseFloat(calcularMediaGeral()))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">
                Total de Avaliações
              </p>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {avaliacoes.length}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">
                Período
              </p>
              <div className="text-sm text-gray-900 dark:text-white">
                Últimos 90 dias
              </div>
            </div>
          </div>
        )}

        {/* Estado de Carregamento */}
        {carregando && (
          <div className="flex justify-center items-center py-12">
            <Loader className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        )}

        {/* Erro */}
        {erro && !carregando && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 flex gap-4 mb-6">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-400">Erro ao carregar</h3>
              <p className="text-red-700 dark:text-red-300 text-sm mt-1">{erro}</p>
            </div>
          </div>
        )}

        {/* Lista de Avaliações */}
        {!carregando && avaliacoes.length > 0 && (
          <div className="space-y-4">
            {avaliacoes.map((avaliacao, index) => (
              <div
                key={avaliacao.id}
                className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md dark:hover:shadow-gray-700/50 transition-shadow"
              >
                {/* Cabeçalho */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {avaliacao.avaliadorNome}
                    </h3>
                    {avaliacao.cotacaoTitulo && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Cotação: {avaliacao.cotacaoTitulo}
                      </p>
                    )}
                  </div>
                  <time className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(avaliacao.data).toLocaleDateString('pt-BR')}
                  </time>
                </div>

                {/* Nota Geral */}
                <div className="mb-4">
                  {renderStars(avaliacao.nota)}
                </div>

                {/* Critérios */}
                {(avaliacao.pontualidade || avaliacao.comunicacao || avaliacao.qualidade) && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    {avaliacao.pontualidade && (
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Pontualidade
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={12}
                                className={i < avaliacao.pontualidade ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {avaliacao.pontualidade}
                          </span>
                        </div>
                      </div>
                    )}

                    {avaliacao.comunicacao && (
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Comunicação
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={12}
                                className={i < avaliacao.comunicacao ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {avaliacao.comunicacao}
                          </span>
                        </div>
                      </div>
                    )}

                    {avaliacao.qualidade && (
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Qualidade
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={12}
                                className={i < avaliacao.qualidade ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {avaliacao.qualidade}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Comentário */}
                {avaliacao.comentario && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                      "{avaliacao.comentario}"
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Sem Avaliações */}
        {!carregando && avaliacoes.length === 0 && !erro && (
          <div className="text-center py-12">
            <div className="inline-block p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
              <Star className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Nenhuma avaliação recebida
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {user?.userType === 'transportador'
                ? 'Quando clientes avaliarem seus serviços, aparecerão aqui.'
                : 'Quando transportadores avaliarem seus pedidos, aparecerão aqui.'}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Avaliacoes;
