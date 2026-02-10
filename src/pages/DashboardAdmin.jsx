import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { BarChart3, Users, DollarSign, TrendingUp, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardAdmin() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsuarios: 245,
    totalCotacoes: 1250,
    totalValor: 340000,
    pendentes: 28
  });

  return (
    <DashboardLayout userType={user?.userType}>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-100">
              Dashboard Administrativo 🛡️
            </h1>
            <p className="text-slate-400 mt-2">Controle total da plataforma</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Usuários */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-6 border border-slate-700 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <span className="text-2xl font-bold text-slate-100">{stats.totalUsuarios}</span>
            </div>
            <p className="text-slate-300 text-sm font-medium">Total de Usuários</p>
            <p className="text-xs text-slate-400 mt-2">Ativos na plataforma</p>
          </div>

          {/* Cotações */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-6 border border-slate-700 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-cyan-500/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-cyan-400" />
              </div>
              <span className="text-2xl font-bold text-slate-100">{stats.totalCotacoes}</span>
            </div>
            <p className="text-slate-300 text-sm font-medium">Total de Cotações</p>
            <p className="text-xs text-slate-400 mt-2">Movimentadas</p>
          </div>

          {/* Volume Total */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-6 border border-slate-700 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
              <span className="text-2xl font-bold text-slate-100">R$ {(stats.totalValor / 1000).toFixed(1)}k</span>
            </div>
            <p className="text-slate-300 text-sm font-medium">Volume Total</p>
            <p className="text-xs text-slate-400 mt-2">Movimentado</p>
          </div>

          {/* Pendentes */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-6 border border-slate-700 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-500/20 rounded-lg">
                <XCircle className="w-6 h-6 text-orange-400" />
              </div>
              <span className="text-2xl font-bold text-slate-100">{stats.pendentes}</span>
            </div>
            <p className="text-slate-300 text-sm font-medium">Itens Pendentes</p>
            <p className="text-xs text-slate-400 mt-2">Aguardando ação</p>
          </div>
        </div>

        {/* Administrative Actions and Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Actions */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-6 border border-slate-700">
            <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-orange-400" />
              Ações Administrativas
            </h2>
            <div className="space-y-3">
              <button className="w-full px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 hover:text-blue-200 rounded-lg transition-all text-left font-medium">
                👥 Gerenciar Usuários
              </button>
              <button className="w-full px-4 py-3 bg-green-500/20 hover:bg-green-500/30 text-green-300 hover:text-green-200 rounded-lg transition-all text-left font-medium">
                ✅ Aprovar Cadastros
              </button>
              <button className="w-full px-4 py-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 hover:text-purple-200 rounded-lg transition-all text-left font-medium">
                📄 Verificar Documentos
              </button>
              <button className="w-full px-4 py-3 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 hover:text-cyan-200 rounded-lg transition-all text-left font-medium">
                📊 Gerar Relatórios
              </button>
            </div>
          </div>

          {/* Alerts */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-6 border border-slate-700">
            <h2 className="text-xl font-bold text-slate-100 mb-4">⚠️ Alertas Importantes</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-slate-100 font-semibold text-sm">Cotações Pendentes</p>
                  <p className="text-slate-400 text-xs mt-1">{stats.pendentes} cotações aguardando aprovação</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <span className="text-yellow-400 text-lg flex-shrink-0">⚠</span>
                <div>
                  <p className="text-slate-100 font-semibold text-sm">Documentos Vencidos</p>
                  <p className="text-slate-400 text-xs mt-1">5 usuários com documentos próximos de vencer</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
