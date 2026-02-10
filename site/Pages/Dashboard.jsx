import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Package, 
  MapPin, 
  FileText, 
  Plus, 
  TrendingUp, 
  Eye,
  AlertCircle,
  Star,
  XCircle,
  DollarSign,
  Gift
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PageHeader from "../components/common/PageHeader";
import LoadingSpinner from "../components/common/LoadingSpinner";
import StatusBadge from "../components/common/StatusBadge";
import DashboardLayout from "./common/DashboardLayout";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      const mesAtual = new Date().toISOString().slice(0, 7);
      if (userData.mesReferenciaCancel !== mesAtual) {
        await base44.auth.updateMe({
          cancelamentosRealizadosMes: 0,
          mesReferenciaCancel: mesAtual
        });
      }
    } catch (error) {
      console.error("Erro ao carregar usuário:", error);
    }
    setLoading(false);
  };

  const { data: stats = {}, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats', user?.perfilAtivoId],
    queryFn: async () => {
      if (!user) return {};

      const [produtos, destinatarios, cotacoes] = await Promise.all([
        base44.entities.Produto.filter({ clienteId: user.perfilAtivoId }),
        base44.entities.Destinatario.filter({ clienteId: user.perfilAtivoId }),
        base44.entities.Cotacao.filter({ clienteId: user.perfilAtivoId })
      ]);

      return {
        totalProdutos: produtos.length,
        totalDestinatarios: destinatarios.length,
        totalCotacoes: cotacoes.length
      };
    },
    enabled: !!user
  });

  const { data: cotacoesRecentes = [] } = useQuery({
    queryKey: ['cotacoes-recentes', user?.perfilAtivoId],
    queryFn: async () => {
      if (!user) return [];
      const cotacoes = await base44.entities.Cotacao.filter(
        { clienteId: user.perfilAtivoId },
        "-created_date",
        5
      );
      return cotacoes;
    },
    enabled: !!user
  });

  const { data: cotacoesSemAvaliacao = [] } = useQuery({
    queryKey: ['cotacoes-sem-avaliacao-dashboard', user?.perfilAtivoId],
    queryFn: async () => {
      if (!user) return [];
      const todasCotacoes = await base44.entities.Cotacao.filter({
        clienteId: user.perfilAtivoId
      });
      return todasCotacoes.filter(c => c.status === "finalizada" && !c.avaliada);
    },
    enabled: !!user
  });

  const { data: perfilCliente } = useQuery({
    queryKey: ['perfil-cliente-dashboard', user?.perfilAtivoId],
    queryFn: async () => {
      if (!user) return null;
      const perfis = await base44.entities.PerfilCliente.filter({
        userIdGoogle: user.perfilAtivoId
      });
      return perfis[0] || null;
    },
    enabled: !!user
  });

  const { data: assinaturaPremium } = useQuery({
    queryKey: ['assinatura-premium-cliente', user?.perfilAtivoId],
    queryFn: async () => {
      if (!user) return null;
      const assinaturas = await base44.entities.AssinaturaPremium.filter({
        userId: user.perfilAtivoId,
        tipo: "cliente",
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
    enabled: !!user
  });

  if (loading || statsLoading) {
    return <LoadingSpinner message="Carregando dashboard..." />;
  }

  const statCards = [
    {
      title: "Produtos Cadastrados",
      value: stats.totalProdutos || 0,
      icon: Package,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Destinatários",
      value: stats.totalDestinatarios || 0,
      icon: MapPin,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Cotações",
      value: stats.totalCotacoes || 0,
      icon: FileText,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50"
    }
  ];

  const isPremium = !!assinaturaPremium;
  const cashbackPorcentagem = isPremium ? 10 : 5;
  const saldoCashbackTotal = perfilCliente?.saldoCashback || 0;
  const cashbackDisponivel = saldoCashbackTotal * (cashbackPorcentagem / 100);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Alert className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-300">
          <DollarSign className="h-5 w-5 text-green-600" />
          <AlertDescription className="text-green-900">
            <div className="flex items-center justify-between">
              <div>
                <strong className="text-lg">💰 Cashback Disponível</strong>
                <p className="text-sm mt-1">
                  Cashback {cashbackPorcentagem}% {isPremium && "⭐"}: <span className="text-2xl font-bold text-green-700">
                    R$ {cashbackDisponivel.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </p>
                <p className="text-xs mt-1 text-green-700">
                  {isPremium 
                    ? "🌟 Como Premium, você ganha 10% de cashback!"
                    : "💡 Ganhe 5% de cashback sobre valores a mais pagos. Com Premium, ganhe 10%!"
                  }
                </p>
                <p className="text-xs mt-1 text-green-600">
                  Total acumulado: R$ {saldoCashbackTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <Link to={createPageUrl("PacotesPremium")}>
                <Button className="bg-green-600 hover:bg-green-700">
                  Ver Pacotes
                </Button>
              </Link>
            </div>
          </AlertDescription>
        </Alert>

        {cotacoesSemAvaliacao.length > 0 && (
          <Alert className="bg-yellow-50 border-yellow-300">
            <Star className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Atenção!</strong> Você tem {cotacoesSemAvaliacao.length} cotação(ões) finalizada(s) 
              aguardando avaliação. Por favor, avalie antes de criar uma nova cotação.
              <Link to={createPageUrl("Cotacoes")} className="ml-2 underline font-semibold">
                Ir para Cotações
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {user?.status === "pending" && (
          <Alert className="bg-yellow-50 border-yellow-300">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Cadastro em análise:</strong> Seu cadastro está sendo analisado pela equipe. 
              Você será notificado quando for aprovado.
            </AlertDescription>
          </Alert>
        )}

        {user?.status === "rejected" && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Cadastro rejeitado:</strong> {user.motivoRejeicao || "Entre em contato com o suporte."}
            </AlertDescription>
          </Alert>
        )}

        {user?.status === "blocked" && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Conta bloqueada:</strong> Entre em contato com o suporte para mais informações.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statCards.map((stat, index) => (
            <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-0">
                <div className={`p-6 ${stat.bgColor}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                    </div>
                    <div className={`w-16 h-16 bg-gradient-to-br ${stat.color} rounded-full flex items-center justify-center shadow-lg`}>
                      <stat.icon className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Cotações Recentes</CardTitle>
              <Link to={createPageUrl("Cotacoes")}>
                <Button variant="outline" size="sm">
                  Ver Todas
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {cotacoesRecentes.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Nenhuma cotação criada ainda</p>
                <Link to={createPageUrl("NovaCotacao")}>
                  <Button 
                    disabled={user?.status !== "approved" || cotacoesSemAvaliacao.length > 0}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeira Cotação
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {cotacoesRecentes.map((cotacao) => (
                  <div
                    key={cotacao.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{cotacao.produtoNome}</h4>
                        <p className="text-sm text-gray-500">
                          {cotacao.destinatarioCidade} - {cotacao.destinatarioEstado}
                        </p>
                      </div>
                      <StatusBadge status={cotacao.status} />
                    </div>
                    <Link to={createPageUrl(`DetalheCotacao?id=${cotacao.id}`)}>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        Ver
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link to={createPageUrl("NovaCotacao")}>
                <Button 
                  className="w-full h-24 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                  disabled={user?.status !== "approved" || cotacoesSemAvaliacao.length > 0}
                >
                  <div className="text-center">
                    <Plus className="w-8 h-8 mx-auto mb-2" />
                    <span>Nova Cotação</span>
                  </div>
                </Button>
              </Link>

              <Link to={createPageUrl("Produtos")}>
                <Button variant="outline" className="w-full h-24">
                  <div className="text-center">
                    <Package className="w-8 h-8 mx-auto mb-2" />
                    <span>Gerenciar Produtos</span>
                  </div>
                </Button>
              </Link>

              <Link to={createPageUrl("Destinatarios")}>
                <Button variant="outline" className="w-full h-24">
                  <div className="text-center">
                    <MapPin className="w-8 h-8 mx-auto mb-2" />
                    <span>Gerenciar Destinatários</span>
                  </div>
                </Button>
              </Link>

              <Link to={createPageUrl("PacotesPremium")}>
                <Button variant="outline" className="w-full h-24">
                  <div className="text-center">
                    <Star className="w-8 h-8 mx-auto mb-2" />
                    <span>Ver Pacotes Premium</span>
                  </div>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
