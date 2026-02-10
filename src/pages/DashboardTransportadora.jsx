import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  MapPin,
  ArrowRight,
  UserCircle,
  Shield,
  BarChart3,
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import api from '@/api/client';

export default function DashboardTransportadora() {
  const { user } = useAuth();

  // Buscar cotações disponíveis REAIS
  const { data: cotacoesDisponiveis = [] } = useQuery({
    queryKey: ['dashboard-cotacoes-disponiveis', user?.id],
    queryFn: async () => {
      try {
        const res = await api.entities.cotacao.disponiveis({ limit: 100 });
        return res?.cotacoes || [];
      } catch (err) {
        console.error('Erro ao buscar cotações disponíveis:', err);
        return [];
      }
    },
    enabled: !!user,
    staleTime: 60000
  });

  // Buscar chats REAIS
  const { data: chats = [] } = useQuery({
    queryKey: ['dashboard-chats', user?.id],
    queryFn: async () => {
      try {
        const res = await api.entities.chat.list({ usuarioId: user?.id });
        return Array.isArray(res) ? res : [];
      } catch (err) {
        console.error('Erro ao buscar chats:', err);
        return [];
      }
    },
    enabled: !!user,
    staleTime: 60000
  });

  // Stats baseados em dados REAIS
  const stats = {
    cotacoesDisponiveis: cotacoesDisponiveis.length,
    cotacoesAceitas: 0, // TODO: quando tiver endpoint
    emEntrega: 0, // TODO: quando tiver endpoint
    finalizadas: 0, // TODO: quando tiver endpoint
  };

  // Pegar primeiras 3 cotações disponíveis
  const availableQuotes = cotacoesDisponiveis.slice(0, 3);

  return (
    <DashboardLayout userType={user?.userType === "transportador" ? "transportador" : "embarcador"}>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
              Bem-vindo, {user?.nomeCompleto?.split(' ')[0] || 'Motorista'}! 🚚
            </h1>
            <p className="text-slate-600 dark:text-slate-300 mt-2">Acompanhe as oportunidades de frete disponíveis</p>
          </div>
          <Link
            to="/cotacoes-disponiveis"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 font-semibold"
          >
            <TrendingUp className="w-5 h-5" />
            Ver Disponíveis
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Cotações Disponíveis */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <AlertCircle className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-2xl font-bold text-slate-900 dark:text-white">{stats.cotacoesDisponiveis}</span>
            </div>
            <p className="text-slate-700 dark:text-slate-200 text-sm font-medium">Oportunidades Disponíveis</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">Prontas para proposta</p>
          </div>

          {/* Cotações Aceitas */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-2xl font-bold text-slate-900 dark:text-white">{stats.cotacoesAceitas}</span>
            </div>
            <p className="text-slate-700 dark:text-slate-200 text-sm font-medium">Cotações Aceitas</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">Confirmadas para entrega</p>
          </div>

          {/* Em Entrega */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
                <Truck className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="text-2xl font-bold text-slate-900 dark:text-white">{stats.emEntrega}</span>
            </div>
            <p className="text-slate-700 dark:text-slate-200 text-sm font-medium">Em Entrega</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">Rotas ativas agora</p>
          </div>

          {/* Finalizadas */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-2xl font-bold text-slate-900 dark:text-white">{stats.finalizadas}</span>
            </div>
            <p className="text-slate-700 dark:text-slate-200 text-sm font-medium">Entregas Finalizadas</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">Histórico completo</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="space-y-8">
          {/* Oportunidades Disponíveis */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Oportunidades Recentes</h2>
              <Link to="/cotacoes-disponiveis" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1">
                Ver todas
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-3">
              {availableQuotes && availableQuotes.length > 0 ? (
                availableQuotes.map((quote) => (
                  <Link
                    key={quote.id}
                    to={`/responder-cotacao/${quote.id}`}
                    className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-slate-900/50 transition-all duration-200 hover:border-green-300 dark:hover:border-green-600 group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg group-hover:bg-green-50 dark:group-hover:bg-green-900/30 transition-colors">
                          <FileText className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900 dark:text-white">{quote.titulo || `Cotação #${quote.id?.substring(0, 4)}`}</h3>
                          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 mt-1">
                            <MapPin className="w-4 h-4" />
                            <span>{quote.cidadeColeta}, {quote.estadoColeta}</span>
                            <ArrowRight className="w-3 h-3" />
                            <span>{quote.cidadeEntrega}, {quote.estadoEntrega}</span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">Peso: {quote.peso || '—'} kg</p>
                        </div>
                      </div>
                      <div className="px-3 py-1 rounded-full bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700/50 text-green-700 dark:text-green-400 text-xs font-medium flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Disponível
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{new Date(quote.createdAt).toLocaleDateString('pt-BR')}</p>
                  </Link>
                ))
              ) : (
                <div className="text-center py-8">
                  <Truck className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-600 dark:text-slate-300 mb-3">Nenhuma oportunidade disponível no momento</p>
                  <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors font-medium text-sm">
                    <Clock className="w-4 h-4" />
                    Acompanhar Notificações
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700/50 shadow-lg">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Ações Rápidas</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Link
                to="/perfil-transportadora"
                className="flex flex-col items-center gap-2 p-4 rounded-lg border border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group text-center"
              >
                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                  <UserCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="font-medium text-slate-900 dark:text-white text-xs">Perfil</p>
              </Link>

              <Link
                to="/opcoes-envio"
                className="flex flex-col items-center gap-2 p-4 rounded-lg border border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group text-center"
              >
                <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-lg group-hover:bg-orange-100 dark:group-hover:bg-orange-900/30 transition-colors">
                  <Shield className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <p className="font-medium text-slate-900 dark:text-white text-xs">Opções Envio</p>
              </Link>

              <Link
                to="/regioes-atendidas"
                className="flex flex-col items-center gap-2 p-4 rounded-lg border border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group text-center"
              >
                <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg group-hover:bg-green-100 dark:group-hover:bg-green-900/30 transition-colors">
                  <MapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <p className="font-medium text-slate-900 dark:text-white text-xs">Regiões</p>
              </Link>

              <Link
                to="/financeiro-transportadora"
                className="flex flex-col items-center gap-2 p-4 rounded-lg border border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group text-center"
              >
                <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30 transition-colors">
                  <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="font-medium text-slate-900 dark:text-white text-xs">Financeiro</p>
              </Link>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-6">
          <h3 className="font-bold text-orange-900 mb-2">💡 Dica Importante</h3>
          <p className="text-orange-800 text-sm">
            Complete seu perfil com NCMs atendidos e regiões de cobertura para receber mais oportunidades compatíveis com seu serviço!
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
