import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/api/client';
import DashboardLayout from '@/components/DashboardLayout';
import { TrendingUp, Star, Truck, Box, DollarSign, AlertCircle, Loader } from 'lucide-react';

/**
 * Dashboard com Métricas Personalizadas
 * 
 * SEGURANÇA:
 * - Apenas usuários autenticados podem acessar
 * - Dados do usuário são carregados via API segura
 * - Apenas dados do próprio usuário são exibidos
 * 
 * FUNCIONALIDADES:
 * - Transportador: Fretes realizados, avaliação, receita total
 * - Embarcador: Fretes solicitados, custo total, avaliação média
 * - Histórico de cotações recentes
 * - Estatísticas de status
 */
export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const [metricas, setMetricas] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    // Validar autenticação
    if (!isAuthenticated || !user) {
      setErro('Você precisa estar autenticado para acessar o dashboard');
      setCarregando(false);
      return;
    }

    carregarMetricas();
  }, [isAuthenticated, user]);

  const carregarMetricas = async () => {
    try {
      setCarregando(true);
      setErro(null);

      const response = await apiClient.client.get('/metrics/meu-dashboard');

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erro ao carregar métricas');
      }

      setMetricas(response.data.data);
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
      setErro(
        error.response?.data?.error ||
        error.message ||
        'Erro ao carregar suas métricas'
      );
    } finally {
      setCarregando(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Faça login para continuar
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Você precisa estar autenticado para acessar o dashboard
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (carregando) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Carregando suas métricas...
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Aguarde um momento enquanto buscamos seus dados
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (erro) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <div className="flex items-center gap-4">
              <AlertCircle className="w-8 h-8 text-red-500 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
                  Erro ao carregar métricas
                </h3>
                <p className="text-red-700 dark:text-red-300 mt-1">{erro}</p>
                <button
                  onClick={carregarMetricas}
                  className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!metricas) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <p className="text-gray-600 dark:text-gray-400">
              Nenhuma métrica disponível no momento.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const isTransportador = metricas.userType === 'transportador';

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Cabeçalho */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Dashboard de Métricas
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Bem-vindo, {user?.nomeCompleto || user?.email}!
          </p>
        </div>

        {/* Cards Principais - Grid Responsivo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Card 1 */}
          {isTransportador ? (
            // TRANSPORTADOR: Fretes Realizados
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                    Fretes Entregues
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {metricas.fretesRealizados}
                  </p>
                </div>
                <Truck className="w-10 h-10 text-blue-500 opacity-20" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {metricas.fretesAceitos} aceitos no total
              </p>
            </div>
          ) : (
            // EMBARCADOR: Fretes Solicitados
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                    Fretes Solicitados
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {metricas.fretesSolicitados}
                  </p>
                </div>
                <Box className="w-10 h-10 text-green-500 opacity-20" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {metricas.fretesEntregues} já entregues
              </p>
            </div>
          )}

          {/* Card 2 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-l-4 border-amber-500">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                  {isTransportador ? 'Receita Total' : 'Custo Total'}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  R$ {isTransportador ? metricas.receitaTotal : metricas.custoTotal}
                </p>
              </div>
              <DollarSign className="w-10 h-10 text-amber-500 opacity-20" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isTransportador ? 'Ganho com fretes' : 'Gasto com entregas'}
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                  Avaliação Média
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {metricas.avaliacaoMedia.toFixed(1)}
                </p>
              </div>
              <Star className="w-10 h-10 text-yellow-500 opacity-20" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {metricas.totalAvaliacoes} avaliações
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                  Taxa de Conclusão
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {isTransportador
                    ? (metricas.fretesAceitos > 0
                      ? ((metricas.fretesRealizados / metricas.fretesAceitos) * 100).toFixed(1)
                      : '0')
                    : (metricas.fretesSolicitados > 0
                      ? ((metricas.fretesEntregues / metricas.fretesSolicitados) * 100).toFixed(1)
                      : '0')}
                  %
                </p>
              </div>
              <TrendingUp className="w-10 h-10 text-purple-500 opacity-20" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Fretes concluídos
            </p>
          </div>
        </div>

        {/* Seção de Estatísticas Detalhadas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Estatísticas de Status */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Estatísticas por Status
            </h3>
            <div className="space-y-4">
              {isTransportador ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Respondidos</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {metricas.estatisticasStatus.respondidos}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Aceitos</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {metricas.estatisticasStatus.aceitos}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Entregues</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {metricas.estatisticasStatus.entregues}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Cancelados</span>
                    <span className="font-semibold text-red-600 dark:text-red-400">
                      {metricas.estatisticasStatus.cancelados}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Criadas</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {metricas.estatisticasStatus.criadas}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Com Resposta</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {metricas.estatisticasStatus.comResposta}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Entregues</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {metricas.estatisticasStatus.entregues}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Canceladas</span>
                    <span className="font-semibold text-red-600 dark:text-red-400">
                      {metricas.estatisticasStatus.canceladas}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Abertas</span>
                    <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                      {metricas.estatisticasStatus.aberta}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Dicas de Segurança */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
              💡 Dicas de Segurança
            </h3>
            <ul className="space-y-3 text-sm text-blue-800 dark:text-blue-200">
              <li className="flex gap-2">
                <span>✓</span>
                <span>Mantenha seus dados de perfil atualizados</span>
              </li>
              <li className="flex gap-2">
                <span>✓</span>
                <span>Nunca compartilhe sua senha com ninguém</span>
              </li>
              <li className="flex gap-2">
                <span>✓</span>
                <span>Verifique regularmente suas transações</span>
              </li>
              <li className="flex gap-2">
                <span>✓</span>
                <span>Use conexões seguras (HTTPS) para acessar a plataforma</span>
              </li>
              <li className="flex gap-2">
                <span>✓</span>
                <span>Faça logout ao usar computadores compartilhados</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Últimas Cotações */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Últimas Cotações
          </h3>

          {metricas.ultimasCotacoes && metricas.ultimasCotacoes.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">
                      {isTransportador ? 'Cotação' : 'Número'}
                    </th>
                    <th className="text-right py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">
                      Valor (R$)
                    </th>
                    <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">
                      {isTransportador ? 'Status' : 'Transportador'}
                    </th>
                    <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">
                      Data
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {metricas.ultimasCotacoes.map((cotacao) => (
                    <tr
                      key={cotacao.id}
                      className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-100">
                        {cotacao.titulo || `Cotação #${cotacao.numero}`}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-gray-100">
                        {cotacao.valor ? `R$ ${cotacao.valor.toFixed(2)}` : '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            cotacao.status === 'concluido' ||
                            cotacao.status === 'entregue'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                              : cotacao.status === 'cancelado'
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
                          }`}
                        >
                          {cotacao.status || 'Pendente'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-sm">
                        {new Date(cotacao.criadoEm || cotacao.respondidoEm).toLocaleDateString(
                          'pt-BR',
                          { month: 'short', day: 'numeric' }
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">
                Nenhuma cotação ainda. Comece a usar a plataforma!
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
