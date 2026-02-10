import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Truck,
  FileText,
  Settings,
  List,
  MapPinned,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Star,
  Gift
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PageHeader from "../components/common/PageHeader";
import LoadingSpinner from "../components/common/LoadingSpinner";
import AlertaLimitacoesSemBackend from "../components/atraso/AlertaLimitacoesSemBackend";
import AlertaAtrasoTransportadora from "../components/atraso/AlertaAtrasoTransportadora";
import DashboardLayout from "./common/DashboardLayout";

export default function DashboardTransportadora() {
  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['user-dashboard-transportadora'],
    queryFn: () => base44.auth.me(),
    staleTime: 60000
  });

  const { data: dashboardData, isLoading: loadingData } = useQuery({
    queryKey: ['dashboard-transportadora-stats', user?.perfilAtivoId],
    queryFn: async () => {
      if (!user || user.tipo !== "transportadora") return null;

      const [respostas, opcoes, ncms, regioes] = await Promise.all([
        base44.entities.RespostaCotacao.filter({ transportadoraId: user.perfilAtivoId }),
        base44.entities.OpcaoEnvio.filter({ transportadoraId: user.perfilAtivoId }),
        base44.entities.NCMAtendido.filter({ transportadoraId: user.perfilAtivoId }),
        base44.entities.RegiaoAtendida.filter({ transportadoraId: user.perfilAtivoId })
      ]);

      return {
        stats: {
          respostasEnviadas: respostas.length,
          opcoesEnvio: opcoes.length,
          ncmsAtendidos: ncms.length
        },
        perfilCompleto: opcoes.length > 0 && ncms.length > 0 && regioes.length > 0
      };
    },
    enabled: !!user && user.tipo === "transportadora",
    staleTime: 120000
  });

  const stats = dashboardData?.stats || { respostasEnviadas: 0, opcoesEnvio: 0, ncmsAtendidos: 0 };
  const perfilCompleto = dashboardData?.perfilCompleto || false;
  const loading = loadingUser || loadingData;

  const { data: perfilTransportadora } = useQuery({
    queryKey: ['perfil-transportadora-dashboard', user?.perfilAtivoId],
    queryFn: async () => {
      if (!user) return null;
      const perfis = await base44.entities.PerfilTransportadora.filter({
        userIdGoogle: user.perfilAtivoId
      });
      return perfis[0] || null;
    },
    enabled: !!user,
    staleTime: 60000
  });

  const { data: assinaturaPremium } = useQuery({
    queryKey: ['assinatura-premium-transportadora', user?.perfilAtivoId],
    queryFn: async () => {
      if (!user) return null;
      const assinaturas = await base44.entities.AssinaturaPremium.filter({
        userId: user.perfilAtivoId,
        tipo: "transportadora",
        ativa: true
      });
      
      if (assinaturas.length > 0) {
        const assinatura = assinaturas[0];
        if (new Date(assinatura.dataFim) > new Date()) {
          return assinatura;
        }
      }
      return null;
    },
    enabled: !!user,
    staleTime: 60000
  });

  if (loading) {
    return <LoadingSpinner message="Carregando dashboard..." />;
  }

  const statCards = [
    {
      title: "Respostas Enviadas",
      value: stats.respostasEnviadas,
      icon: FileText,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Opções de Envio",
      value: stats.opcoesEnvio,
      icon: Settings,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      title: "NCMs Atendidos",
      value: stats.ncmsAtendidos,
      icon: List,
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50"
    }
  ];

  const isPremium = !!assinaturaPremium;
  const cashbackPorcentagem = isPremium ? 10 : 5;
  const saldoDescontoTotal = perfilTransportadora?.saldoDescontoPremium || 0;
  const cashbackDisponivel = saldoDescontoTotal * (cashbackPorcentagem / 100);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <AlertaLimitacoesSemBackend />
        
        <AlertaAtrasoTransportadora 
          perfilTransportadora={perfilTransportadora}
        />
        
        <Alert className="bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-300">
          <Gift className="h-5 w-5 text-yellow-600" />
          <AlertDescription className="text-yellow-900">
            <div className="flex items-center justify-between">
              <div>
                <strong className="text-lg">🌟 Crédito Premium Disponível</strong>
                <p className="text-sm mt-1">
                  Crédito {cashbackPorcentagem}% {isPremium && "⭐"}: <span className="text-2xl font-bold text-yellow-700">
                    R$ {cashbackDisponivel.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </p>
                <p className="text-xs mt-1 text-yellow-700">
                  {isPremium 
                    ? "🌟 Como Premium, você ganha 10% de crédito!"
                    : "💡 Ganhe 5% de crédito sobre valores a mais. Com Premium, ganhe 10%!"
                  }
                </p>
                <p className="text-xs mt-1 text-yellow-600">
                  Total acumulado: R$ {saldoDescontoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <Link to={createPageUrl("PacotesPremium")}>
                <Button className="bg-yellow-600 hover:bg-yellow-700">
                  Ver Pacotes
                </Button>
              </Link>
            </div>
          </AlertDescription>
        </Alert>

        {user?.status === "pending" && (
          <Alert className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
            <Clock className="h-5 w-5 text-yellow-600 flex-shrink-0" />
            <AlertDescription>
              <div>
                <h3 className="font-semibold text-yellow-900 mb-1">Cadastro em Análise</h3>
                <p className="text-yellow-800 text-sm">
                  Seu cadastro está sendo analisado pela equipe. Você poderá responder cotações assim que for aprovado.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {user?.status === "rejected" && (
          <Alert variant="destructive" className="bg-gradient-to-r from-red-50 to-orange-50 border-red-300">
            <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <AlertDescription>
              <div>
                <h3 className="font-semibold text-red-900 mb-2">Cadastro Rejeitado</h3>
                {user?.motivoRejeicao && (
                  <div className="mb-3 p-3 bg-red-100 border border-red-200 rounded-lg">
                    <p className="text-sm font-semibold text-red-800">Motivo:</p>
                    <p className="text-sm text-red-900">{user.motivoRejeicao}</p>
                  </div>
                )}
                <p className="text-red-800 text-sm">
                  Entre em contato com o suporte para mais informações.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {user?.status === "blocked" && (
          <Alert variant="destructive">
            <AlertTriangle className="h-5 w-5" />
            <AlertDescription>
              <div>
                <h3 className="font-semibold text-red-900 mb-1">Conta Bloqueada</h3>
                <p className="text-red-800 text-sm">Sua conta foi bloqueada. Entre em contato com o suporte.</p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {!perfilCompleto && user?.status === "approved" && (
          <Alert className="bg-blue-50 border-blue-200">
            <AlertTriangle className="h-5 w-5 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Complete seu perfil!</strong> Configure suas opções de envio, NCMs e regiões atendidas para começar a receber cotações.
              <div className="flex gap-2 mt-2">
                <Link to={createPageUrl("OpcoesEnvio")}>
                  <Button size="sm" variant="outline">Opções de Envio</Button>
                </Link>
                <Link to={createPageUrl("NCMsAtendidos")}>
                  <Button size="sm" variant="outline">NCMs</Button>
                </Link>
                <Link to={createPageUrl("RegioesAtendidas")}>
                  <Button size="sm" variant="outline">Regiões</Button>
                </Link>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <stat.icon className={`w-6 h-6 bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`} style={{ WebkitTextFillColor: 'transparent' }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="shadow-lg bg-gradient-to-br from-blue-600 to-blue-700 text-white">
            <CardContent className="p-6">
              <FileText className="w-12 h-12 mb-4 opacity-80" />
              <h3 className="text-xl font-bold mb-2">Cotações Disponíveis</h3>
              <p className="text-blue-100 mb-4 text-sm">
                Veja as cotações abertas e envie suas propostas
              </p>
              <Link to={createPageUrl("CotacoesDisponiveis")}>
                <Button 
                  className="w-full bg-white text-blue-700 hover:bg-blue-50"
                  disabled={!perfilCompleto || user?.status !== "approved"}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Ver Cotações
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="shadow-lg bg-gradient-to-br from-green-600 to-green-700 text-white">
            <CardContent className="p-6">
              <CheckCircle2 className="w-12 h-12 mb-4 opacity-80" />
              <h3 className="text-xl font-bold mb-2">Cotações Aceitas</h3>
              <p className="text-green-100 mb-4 text-sm">
                Gerencie as cotações onde sua proposta foi aceita
              </p>
              <Link to={createPageUrl("CotacoesAceitasTransportadora")}>
                <Button className="w-full bg-white text-green-700 hover:bg-green-50">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Ver Aceitas
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-lg font-bold">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            <Link to={createPageUrl("OpcoesEnvio")}>
              <Button variant="outline" className="w-full justify-start">
                <Settings className="w-4 h-4 mr-2" />
                Gerenciar Opções de Envio
              </Button>
            </Link>
            <Link to={createPageUrl("NCMsAtendidos")}>
              <Button variant="outline" className="w-full justify-start">
                <List className="w-4 h-4 mr-2" />
                Gerenciar NCMs
              </Button>
            </Link>
            <Link to={createPageUrl("RegioesAtendidas")}>
              <Button variant="outline" className="w-full justify-start">
                <MapPinned className="w-4 h-4 mr-2" />
                Gerenciar Regiões
              </Button>
            </Link>
            <Link to={createPageUrl("PacotesPremium")}>
              <Button variant="outline" className="w-full justify-start">
                <Star className="w-4 h-4 mr-2" />
                Ver Pacotes Premium
              </Button>
            </Link>
            <Link to={createPageUrl("RelatoriosTransportadora")}>
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="w-4 h-4 mr-2" />
                Ver Relatórios
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
