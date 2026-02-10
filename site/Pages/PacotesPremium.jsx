import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Star,
  Check,
  Gift,
  Shield,
  Zap,
  TrendingUp,
  Crown,
  Sparkles,
  AlertCircle
} from "lucide-react";
import PageHeader from "../components/common/PageHeader";
import LoadingSpinner from "../components/common/LoadingSpinner";

export default function PacotesPremium() {
  const [comprando, setComprando] = useState(false);
  const [erro, setErro] = useState("");
  const queryClient = useQueryClient();

  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['user-pacotes'],
    queryFn: async () => await base44.auth.me()
  });

  const { data: pacotes = [], isLoading: loadingPacotes } = useQuery({
    queryKey: ['pacotes-premium', user?.tipo],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.PacotePremium.filter({
        tipo: user.tipo,
        ativo: true
      });
    },
    enabled: !!user
  });

  const { data: perfil } = useQuery({
    queryKey: ['perfil-usuario-pacotes', user?.perfilAtivoId, user?.tipo],
    queryFn: async () => {
      if (!user) return null;
      const entidade = user.tipo === "cliente" ? "PerfilCliente" : "PerfilTransportadora";
      const perfis = await base44.entities[entidade].filter({
        userIdGoogle: user.perfilAtivoId
      });
      return perfis[0] || null;
    },
    enabled: !!user
  });

  const { data: assinaturaAtual } = useQuery({
    queryKey: ['assinatura-atual', user?.perfilAtivoId],
    queryFn: async () => {
      if (!user) return null;
      const assinaturas = await base44.entities.AssinaturaPremium.filter({
        userId: user.perfilAtivoId,
        tipo: user.tipo,
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

  const comprarPacoteMutation = useMutation({
    mutationFn: async (pacote) => {
      const cashbackPorcentagem = assinaturaAtual ? 10 : 5;
      const saldoTotal = user.tipo === "cliente" 
        ? (perfil?.saldoCashback || 0)
        : (perfil?.saldoDescontoPremium || 0);
      
      const cashbackDisponivel = saldoTotal * (cashbackPorcentagem / 100);
      const valorFinal = Math.max(0, pacote.valor - cashbackDisponivel);
      
      // Criar assinatura
      const dataInicio = new Date();
      const dataFim = new Date();
      dataFim.setMonth(dataFim.getMonth() + 1);
      
      await base44.entities.AssinaturaPremium.create({
        userId: user.perfilAtivoId,
        tipo: user.tipo,
        pacoteId: pacote.id,
        pacoteNome: pacote.nome,
        pacoteNivel: pacote.nivel,
        valorPago: valorFinal,
        valorDescontoCashback: cashbackDisponivel,
        dataInicio: dataInicio.toISOString(),
        dataFim: dataFim.toISOString(),
        ativa: true,
        cancelamentosMesAtual: 0,
        entregasSemMultaMesAtual: 0,
        descontosUtilizados: 0,
        mesReferencia: new Date().toISOString().slice(0, 7),
        diasDestaqueRestantes: pacote.diasDestaque || 0
      });

      // Atualizar perfil
      const entidade = user.tipo === "cliente" ? "PerfilCliente" : "PerfilTransportadora";
      const campoSaldo = user.tipo === "cliente" ? "saldoCashback" : "saldoDescontoPremium";
      
      await base44.entities[entidade].update(perfil.id, {
        isPremium: true,
        [campoSaldo]: Math.max(0, saldoTotal - (cashbackDisponivel / (cashbackPorcentagem / 100)))
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assinatura-atual'] });
      queryClient.invalidateQueries({ queryKey: ['perfil-usuario-pacotes'] });
      alert("Pacote Premium adquirido com sucesso! 🎉");
      setComprando(false);
      setErro("");
    },
    onError: (error) => {
      setErro("Erro ao processar compra. Tente novamente.");
      setComprando(false);
    }
  });

  const handleComprar = async (pacote) => {
    if (comprando) return;
    
    const cashbackPorcentagem = assinaturaAtual ? 10 : 5;
    const saldoTotal = user.tipo === "cliente" 
      ? (perfil?.saldoCashback || 0)
      : (perfil?.saldoDescontoPremium || 0);
    
    const cashbackDisponivel = saldoTotal * (cashbackPorcentagem / 100);
    const valorFinal = Math.max(0, pacote.valor - cashbackDisponivel);
    
    const msg = cashbackDisponivel > 0
      ? `Comprar ${pacote.nome} por R$ ${valorFinal.toFixed(2)}? (Desconto de R$ ${cashbackDisponivel.toFixed(2)} aplicado)`
      : `Comprar ${pacote.nome} por R$ ${pacote.valor.toFixed(2)}?`;
    
    if (confirm(msg)) {
      setComprando(true);
      comprarPacoteMutation.mutate(pacote);
    }
  };

  if (loadingUser || loadingPacotes) {
    return <LoadingSpinner message="Carregando pacotes..." />;
  }

  const cashbackPorcentagem = assinaturaAtual ? 10 : 5;
  const saldoTotal = user.tipo === "cliente" 
    ? (perfil?.saldoCashback || 0)
    : (perfil?.saldoDescontoPremium || 0);
  const cashbackDisponivel = saldoTotal * (cashbackPorcentagem / 100);

  const nivelIcones = [Star, Sparkles, Crown, Zap, Gift];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <PageHeader
        title="Pacotes Premium"
        description={user?.tipo === "cliente" ? "Escolha o melhor plano para suas necessidades" : "Destaque-se e ganhe mais vantagens"}
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {assinaturaAtual && (
          <Alert className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-300">
            <Crown className="h-5 w-5 text-purple-600" />
            <AlertDescription className="text-purple-900">
              <strong>Você já é Premium {assinaturaAtual.pacoteNome}! ⭐</strong>
              <p className="text-sm mt-1">
                Válido até: {new Date(assinaturaAtual.dataFim).toLocaleDateString('pt-BR')}
              </p>
            </AlertDescription>
          </Alert>
        )}

        {cashbackDisponivel > 0 && (
          <Alert className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-300">
            <Gift className="h-5 w-5 text-green-600" />
            <AlertDescription className="text-green-900">
              <strong>💰 Você tem crédito disponível!</strong>
              <p className="text-sm mt-1">
                R$ {cashbackDisponivel.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} 
                ({cashbackPorcentagem}% de R$ {saldoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) 
                pode ser usado na compra de qualquer pacote
              </p>
            </AlertDescription>
          </Alert>
        )}

        {erro && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{erro}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pacotes.sort((a, b) => a.nivel - b.nivel).map((pacote, index) => {
            const IconComponent = nivelIcones[index % nivelIcones.length];
            const valorFinal = Math.max(0, pacote.valor - cashbackDisponivel);
            const temDesconto = cashbackDisponivel > 0 && cashbackDisponivel < pacote.valor;
            
            return (
              <Card 
                key={pacote.id} 
                className={`relative overflow-hidden hover:shadow-2xl transition-all duration-300 ${
                  pacote.nivel === 5 ? 'border-2 border-yellow-400 shadow-xl' : ''
                }`}
              >
                {pacote.nivel === 5 && (
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-yellow-400 to-yellow-500 text-yellow-900 px-4 py-1 text-xs font-bold rounded-bl-lg">
                    MAIS POPULAR
                  </div>
                )}
                
                <CardHeader className="bg-gradient-to-br from-blue-600 to-blue-700 text-white pb-8">
                  <div className="flex items-center justify-between">
                    <IconComponent className="w-10 h-10" />
                    <Badge className="bg-white/20 text-white">
                      Nível {pacote.nivel}
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl mt-4">{pacote.nome}</CardTitle>
                  <div className="mt-4">
                    {temDesconto && (
                      <p className="text-sm line-through text-blue-200">
                        R$ {pacote.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    )}
                    <p className="text-4xl font-bold">
                      R$ {valorFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-sm text-blue-100 mt-1">por mês</p>
                  </div>
                </CardHeader>

                <CardContent className="p-6 space-y-4">
                  {user?.tipo === "transportadora" ? (
                    <>
                      <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                          <p className="font-medium">Cancelamentos</p>
                          <p className="text-sm text-gray-600">{pacote.cancelamentosMes}/mês sem bloqueio</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                          <p className="font-medium">Entregas</p>
                          <p className="text-sm text-gray-600">{pacote.entregasSemMulta}/mês sem multa por atraso</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                          <p className="font-medium">Destaque</p>
                          <p className="text-sm text-gray-600">{pacote.diasDestaque} dias no topo das cotações</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Gift className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                          <p className="font-medium">Cashback Premium</p>
                          <p className="text-sm text-gray-600">10% sobre valores a mais</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-start gap-3">
                        <Gift className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                          <p className="font-medium">Descontos</p>
                          <p className="text-sm text-gray-600">
                            R$ {pacote.beneficioDesconto} em cotações ≥ R$ 40
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                          <p className="font-medium">Cancelamentos</p>
                          <p className="text-sm text-gray-600">{pacote.cancelamentosMes}/mês sem bloqueio</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Star className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                          <p className="font-medium">Cashback Premium</p>
                          <p className="text-sm text-gray-600">10% sobre valores a mais pagos</p>
                        </div>
                      </div>
                    </>
                  )}

                  <Button
                    onClick={() => handleComprar(pacote)}
                    disabled={comprando}
                    className={`w-full mt-4 ${
                      pacote.nivel === 5 
                        ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700' 
                        : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                    }`}
                  >
                    {comprando ? "Processando..." : "Adquirir Agora"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
