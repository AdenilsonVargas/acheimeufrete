import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  BarChart3, 
  TrendingUp, 
  FileText, 
  DollarSign,
  Package,
  AlertCircle
} from "lucide-react";
import PageHeader from "../components/common/PageHeader";
import LoadingSpinner from "../components/common/LoadingSpinner";

export default function Relatorios() {
  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['user-relatorios'],
    queryFn: async () => {
      return await base44.auth.me();
    }
  });

  const { data: stats, isLoading: loadingStats, error } = useQuery({
    queryKey: ['stats-cliente', user?.perfilAtivoId],
    queryFn: async () => {
      if (!user) return null;

      const cotacoes = await base44.entities.Cotacao.filter({ 
        clienteId: user.perfilAtivoId 
      });
      
      const cotacoesFinalizadas = cotacoes.filter(c => c.status === "finalizada");
      const valorTotal = cotacoesFinalizadas.reduce((sum, c) => sum + (c.valorFinalCliente || c.valorNotaFiscal || 0), 0);

      return {
        totalCotacoes: cotacoes.length,
        cotacoesAbertas: cotacoes.filter(c => 
          c.status === "aberta" || 
          c.status === "em_andamento" || 
          c.status === "visualizada" ||
          c.status === "aguardando_pagamento"
        ).length,
        cotacoesFinalizadas: cotacoesFinalizadas.length,
        valorTotalGasto: valorTotal
      };
    },
    enabled: !!user?.perfilAtivoId,
    staleTime: 60000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000)
  });

  if (loadingUser || loadingStats) {
    return <LoadingSpinner message="Carregando relatórios..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
        <PageHeader title="Relatórios" />
        <div className="p-6 max-w-4xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Erro ao carregar relatórios. Por favor, aguarde alguns segundos e recarregue a página.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total de Cotações",
      value: stats?.totalCotacoes || 0,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Cotações Abertas",
      value: stats?.cotacoesAbertas || 0,
      icon: Package,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    },
    {
      title: "Cotações Finalizadas",
      value: stats?.cotacoesFinalizadas || 0,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Valor Total em Fretes",
      value: `R$ ${(stats?.valorTotalGasto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <PageHeader
        title="Relatórios"
        description="Visualize suas estatísticas e histórico"
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 mb-2">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Histórico Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">Em breve: gráficos detalhados e análises de gastos</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
