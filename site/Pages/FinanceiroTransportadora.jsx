import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Wallet,
  ArrowUpRight,
  Car,
  Shield,
  Star,
  History,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  CreditCard,
  FileText,
  Receipt,
  Clock
} from "lucide-react";
import PageHeader from "../components/common/PageHeader";
import LoadingSpinner from "../components/common/LoadingSpinner";

export default function FinanceiroTransportadora() {
  const queryClient = useQueryClient();
  const [showSaqueDialog, setShowSaqueDialog] = useState(false);
  const [showPedagioDialog, setShowPedagioDialog] = useState(false);
  const [showSeguroDialog, setShowSeguroDialog] = useState(false);
  const [showPremiumDialog, setShowPremiumDialog] = useState(false);
  const [valorSaque, setValorSaque] = useState("");
  const [valorPedagio, setValorPedagio] = useState("");
  const [valorSeguro, setValorSeguro] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [mesSelecionado, setMesSelecionado] = useState(new Date().toISOString().slice(0, 7));

  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: perfil, isLoading: loadingPerfil } = useQuery({
    queryKey: ['perfil-transportadora-financeiro', user?.perfilAtivoId],
    queryFn: async () => {
      // Tentar buscar por userIdGoogle primeiro
      let perfis = await base44.entities.PerfilTransportadora.filter({ userIdGoogle: user.perfilAtivoId });
      if (perfis.length > 0) return perfis[0];
      
      // Tentar buscar por id
      perfis = await base44.entities.PerfilTransportadora.filter({ id: user.perfilAtivoId });
      return perfis[0] || null;
    },
    enabled: !!user
  });

  const { data: pacotesPremium = [] } = useQuery({
    queryKey: ['pacotes-premium-transportadora'],
    queryFn: () => base44.entities.PacotePremium.filter({ tipo: 'transportadora', ativo: true })
  });

  const { data: assinaturaAtiva } = useQuery({
    queryKey: ['assinatura-ativa-transportadora', user?.perfilAtivoId],
    queryFn: async () => {
      const assinaturas = await base44.entities.AssinaturaPremium.filter({
        userId: user.perfilAtivoId,
        tipo: 'transportadora',
        ativa: true
      });
      if (assinaturas.length > 0 && new Date(assinaturas[0].dataFim) > new Date()) {
        return assinaturas[0];
      }
      return null;
    },
    enabled: !!user
  });

  // Buscar dados financeiros do mês selecionado
  const { data: financeiroMes } = useQuery({
    queryKey: ['financeiro-mes', perfil?.id, mesSelecionado],
    queryFn: async () => {
      if (!perfil) return null;
      const registros = await base44.entities.Financeiro.filter({
        transportadoraId: perfil.id,
        mesReferencia: mesSelecionado
      });
      return registros[0] || null;
    },
    enabled: !!perfil
  });

  // Verificar se é último dia do mês após 12h
  const verificarLiberacaoNota = () => {
    const agora = new Date();
    const ultimoDia = new Date(agora.getFullYear(), agora.getMonth() + 1, 0).getDate();
    const diaAtual = agora.getDate();
    const horaAtual = agora.getHours();
    
    // Libera no último dia do mês após 12:00 (horário de Brasília)
    return diaAtual === ultimoDia && horaAtual >= 12;
  };

  const podeEmitirNota = verificarLiberacaoNota();

  // Gerar lista de meses disponíveis
  const gerarMesesDisponiveis = () => {
    const meses = [];
    const agora = new Date();
    for (let i = 0; i < 12; i++) {
      const data = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
      const valor = data.toISOString().slice(0, 7);
      const label = data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      meses.push({ valor, label: label.charAt(0).toUpperCase() + label.slice(1) });
    }
    return meses;
  };

  const mesesDisponiveis = gerarMesesDisponiveis();

  const saqueMutation = useMutation({
    mutationFn: async (valor) => {
      const novoSaldo = (perfil.saldoCarteira || 0) - valor;
      const novoHistorico = [...(perfil.historicoCarteira || []), {
        tipo: 'saque',
        valor: -valor,
        descricao: 'Saque solicitado',
        data: new Date().toISOString()
      }];
      await base44.entities.PerfilTransportadora.update(perfil.id, {
        saldoCarteira: novoSaldo,
        historicoCarteira: novoHistorico
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['perfil-transportadora-financeiro'] });
      setSuccess("Saque solicitado com sucesso!");
      setShowSaqueDialog(false);
      setValorSaque("");
    },
    onError: () => setError("Erro ao solicitar saque")
  });

  const compraPedagioMutation = useMutation({
    mutationFn: async (valor) => {
      const novoSaldo = (perfil.saldoCarteira || 0) - valor;
      const novoCreditoPedagio = (perfil.saldoCreditosPedagio || 0) + valor;
      const novoHistorico = [...(perfil.historicoCarteira || []), {
        tipo: 'compra_pedagio',
        valor: -valor,
        descricao: `Compra de créditos de pedágio (Sem Parar) - R$ ${valor.toFixed(2)}`,
        data: new Date().toISOString()
      }];
      await base44.entities.PerfilTransportadora.update(perfil.id, {
        saldoCarteira: novoSaldo,
        saldoCreditosPedagio: novoCreditoPedagio,
        historicoCarteira: novoHistorico
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['perfil-transportadora-financeiro'] });
      setSuccess("Créditos de pedágio adquiridos com sucesso!");
      setShowPedagioDialog(false);
      setValorPedagio("");
    },
    onError: () => setError("Erro ao comprar créditos")
  });

  const compraSeguroMutation = useMutation({
    mutationFn: async (valor) => {
      const novoSaldo = (perfil.saldoCarteira || 0) - valor;
      const novoHistorico = [...(perfil.historicoCarteira || []), {
        tipo: 'compra_seguro',
        valor: -valor,
        descricao: `Compra de seguro - R$ ${valor.toFixed(2)}`,
        data: new Date().toISOString()
      }];
      await base44.entities.PerfilTransportadora.update(perfil.id, {
        saldoCarteira: novoSaldo,
        historicoCarteira: novoHistorico
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['perfil-transportadora-financeiro'] });
      setSuccess("Seguro adquirido com sucesso!");
      setShowSeguroDialog(false);
      setValorSeguro("");
    },
    onError: () => setError("Erro ao comprar seguro")
  });

  const compraPremiumMutation = useMutation({
    mutationFn: async (pacote) => {
      const desconto = Math.min(perfil.saldoDescontoPremium || 0, pacote.valor);
      const valorFinal = pacote.valor - desconto;
      
      if ((perfil.saldoCarteira || 0) < valorFinal) {
        throw new Error("Saldo insuficiente");
      }

      const novoSaldo = (perfil.saldoCarteira || 0) - valorFinal;
      const novoHistorico = [...(perfil.historicoCarteira || []), {
        tipo: 'compra_premium',
        valor: -valorFinal,
        descricao: `Compra do pacote ${pacote.nome} - Desconto: R$ ${desconto.toFixed(2)}`,
        data: new Date().toISOString()
      }];

      await base44.entities.PerfilTransportadora.update(perfil.id, {
        saldoCarteira: novoSaldo,
        saldoDescontoPremium: (perfil.saldoDescontoPremium || 0) - desconto,
        isPremium: true,
        historicoCarteira: novoHistorico
      });

      const dataInicio = new Date();
      const dataFim = new Date();
      dataFim.setMonth(dataFim.getMonth() + 1);

      await base44.entities.AssinaturaPremium.create({
        userId: user.perfilAtivoId,
        tipo: 'transportadora',
        pacoteId: pacote.id,
        pacoteNome: pacote.nome,
        pacoteNivel: pacote.nivel,
        valorPago: valorFinal,
        valorDescontoCashback: desconto,
        dataInicio: dataInicio.toISOString(),
        dataFim: dataFim.toISOString(),
        ativa: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['perfil-transportadora-financeiro'] });
      queryClient.invalidateQueries({ queryKey: ['assinatura-ativa-transportadora'] });
      setSuccess("Pacote Premium adquirido com sucesso!");
      setShowPremiumDialog(false);
    },
    onError: (err) => setError(err.message || "Erro ao comprar pacote")
  });

  const handleSaque = () => {
    const valor = parseFloat(valorSaque);
    if (!valor || valor <= 0) {
      setError("Informe um valor válido");
      return;
    }
    if (valor > (perfil.saldoCarteira || 0)) {
      setError("Saldo insuficiente");
      return;
    }
    setError("");
    saqueMutation.mutate(valor);
  };

  const handleCompraPedagio = () => {
    const valor = parseFloat(valorPedagio);
    if (!valor || valor <= 0) {
      setError("Informe um valor válido");
      return;
    }
    if (valor > (perfil.saldoCarteira || 0)) {
      setError("Saldo insuficiente");
      return;
    }
    setError("");
    compraPedagioMutation.mutate(valor);
  };

  if (loadingUser || loadingPerfil) {
    return <LoadingSpinner message="Carregando financeiro..." />;
  }

  const saldoCarteira = perfil?.saldoCarteira || 0;
  const saldoPedagio = perfil?.saldoCreditosPedagio || 0;
  const saldoDesconto = perfil?.saldoDescontoPremium || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <PageHeader
        title="Financeiro"
        description="Gerencie sua carteira e compre serviços"
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Cards de Saldo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-100">Saldo Disponível</p>
                  <p className="text-3xl font-bold mt-1">
                    R$ {saldoCarteira.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <Wallet className="w-12 h-12 text-green-200" />
              </div>
              <Button
                onClick={() => setShowSaqueDialog(true)}
                variant="secondary"
                className="w-full mt-4"
                disabled={saldoCarteira <= 0}
              >
                <ArrowUpRight className="w-4 h-4 mr-2" />
                Solicitar Saque
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-100">Créditos Pedágio (Sem Parar)</p>
                  <p className="text-3xl font-bold mt-1">
                    R$ {saldoPedagio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <Car className="w-12 h-12 text-blue-200" />
              </div>
              <Button
                onClick={() => setShowPedagioDialog(true)}
                variant="secondary"
                className="w-full mt-4"
                disabled={saldoCarteira <= 0}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Comprar Créditos
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500 to-orange-500 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-100">Desconto Premium Acumulado</p>
                  <p className="text-3xl font-bold mt-1">
                    R$ {saldoDesconto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <Star className="w-12 h-12 text-yellow-200" />
              </div>
              {assinaturaAtiva ? (
                <Badge className="w-full mt-4 bg-white/20 text-white justify-center py-2">
                  Premium até {new Date(assinaturaAtiva.dataFim).toLocaleDateString('pt-BR')}
                </Badge>
              ) : (
                <Button
                  onClick={() => setShowPremiumDialog(true)}
                  variant="secondary"
                  className="w-full mt-4"
                >
                  <Star className="w-4 h-4 mr-2" />
                  Comprar Premium
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Ações Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setShowSeguroDialog(true)}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-14 h-14 bg-purple-100 rounded-lg flex items-center justify-center">
                <Shield className="w-7 h-7 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Comprar Seguro</h3>
                <p className="text-sm text-gray-500">Adquira seguros para suas cargas</p>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setShowPremiumDialog(true)}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-14 h-14 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Star className="w-7 h-7 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Pacotes Premium</h3>
                <p className="text-sm text-gray-500">Benefícios exclusivos para sua empresa</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SEÇÃO FINANCEIRO DO MÊS */}
        <Card className="border-2 border-blue-200">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-600" />
                Cotações Finalizadas do Mês
              </CardTitle>
              <Select value={mesSelecionado} onValueChange={setMesSelecionado}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Selecione o mês" />
                </SelectTrigger>
                <SelectContent>
                  {mesesDisponiveis.map((mes) => (
                    <SelectItem key={mes.valor} value={mes.valor}>{mes.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {!financeiroMes ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Nenhuma cotação finalizada neste mês</p>
              </div>
            ) : (
              <>
                {/* Resumo do mês */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-700 font-medium">Valor a Receber (95%)</p>
                    <p className="text-2xl font-bold text-green-700">
                      R$ {(financeiroMes.valorTotalTransportadora || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <p className="text-sm text-orange-700 font-medium">Comissão Plataforma (5%)</p>
                    <p className="text-2xl font-bold text-orange-700">
                      R$ {(financeiroMes.valorTotalComissao || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-700 font-medium">Total Cotações</p>
                    <p className="text-2xl font-bold text-blue-700">
                      R$ {(financeiroMes.valorTotalCotacoes || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                {/* Aviso de pagamento */}
                <Alert className="bg-blue-50 border-blue-200">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>Pagamento:</strong> O valor de R$ {(financeiroMes.valorTotalTransportadora || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} será pago e a nota fiscal será emitida no último dia do mês após 12:00 (horário de Brasília).
                  </AlertDescription>
                </Alert>

                {/* Botão emitir nota - só aparece no último dia após 12h */}
                {podeEmitirNota && !financeiroMes.notaEmitida && (
                  <Button 
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                    onClick={() => {
                      alert("Nota fiscal será emitida automaticamente pelo sistema. Aguarde processamento.");
                    }}
                  >
                    <Receipt className="w-4 h-4 mr-2" />
                    Emitir Nota Fiscal de Serviço
                  </Button>
                )}

                {financeiroMes.notaEmitida && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Nota fiscal emitida em {new Date(financeiroMes.dataNotaEmitida).toLocaleDateString('pt-BR')}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Lista de cotações do mês */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-100 p-3 font-semibold text-sm grid grid-cols-4 gap-2">
                    <span>Cotação</span>
                    <span>Valor Total</span>
                    <span className="text-green-700">Você Recebe (95%)</span>
                    <span className="text-orange-700">Comissão (5%)</span>
                  </div>
                  <div className="divide-y max-h-64 overflow-y-auto">
                    {(financeiroMes.cotacoes || []).map((cot, idx) => (
                      <div key={idx} className="p-3 grid grid-cols-4 gap-2 text-sm hover:bg-gray-50">
                        <span className="font-mono text-blue-600">#{cot.numeroCotacao}</span>
                        <span>R$ {cot.valorCotacao?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        <span className="text-green-700 font-semibold">R$ {cot.valorTransportadora?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        <span className="text-orange-700">R$ {cot.valorComissao?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-gray-100 p-3 font-bold text-sm grid grid-cols-4 gap-2 border-t-2">
                    <span>TOTAL</span>
                    <span>R$ {(financeiroMes.valorTotalCotacoes || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    <span className="text-green-700">R$ {(financeiroMes.valorTotalTransportadora || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    <span className="text-orange-700">R$ {(financeiroMes.valorTotalComissao || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Histórico */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Histórico de Movimentações
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(perfil?.historicoCarteira || []).length === 0 ? (
              <p className="text-center text-gray-500 py-8">Nenhuma movimentação registrada</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {[...(perfil?.historicoCarteira || [])].reverse().map((mov, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        mov.valor > 0 ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        <DollarSign className={`w-5 h-5 ${mov.valor > 0 ? 'text-green-600' : 'text-red-600'}`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{mov.descricao}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(mov.data).toLocaleDateString('pt-BR')} às {new Date(mov.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <span className={`font-bold ${mov.valor > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {mov.valor > 0 ? '+' : ''} R$ {Math.abs(mov.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog Saque */}
      <Dialog open={showSaqueDialog} onOpenChange={setShowSaqueDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar Saque</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                Saldo disponível: R$ {saldoCarteira.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </AlertDescription>
            </Alert>
            <div>
              <Label>Valor do Saque (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={valorSaque}
                onChange={(e) => setValorSaque(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowSaqueDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaque} className="bg-green-600 hover:bg-green-700">
                Confirmar Saque
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Pedágio */}
      <Dialog open={showPedagioDialog} onOpenChange={setShowPedagioDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Comprar Créditos de Pedágio (Sem Parar)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert className="bg-blue-50 border-blue-200">
              <Car className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                Compre créditos para usar no Sem Parar. Transferência sem custos adicionais!
              </AlertDescription>
            </Alert>
            <div>
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={valorPedagio}
                onChange={(e) => setValorPedagio(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <p className="text-sm text-gray-500">
              Saldo disponível: R$ {saldoCarteira.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowPedagioDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCompraPedagio} className="bg-blue-600 hover:bg-blue-700">
                Comprar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Premium */}
      <Dialog open={showPremiumDialog} onOpenChange={setShowPremiumDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pacotes Premium</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {saldoDesconto > 0 && (
              <Alert className="bg-yellow-50 border-yellow-200">
                <Star className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  Você tem R$ {saldoDesconto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} de desconto acumulado!
                </AlertDescription>
              </Alert>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pacotesPremium.map((pacote) => {
                const desconto = Math.min(saldoDesconto, pacote.valor);
                const valorFinal = pacote.valor - desconto;
                const podePagar = saldoCarteira >= valorFinal;

                return (
                  <Card key={pacote.id} className={`${!podePagar ? 'opacity-60' : ''}`}>
                    <CardContent className="p-4">
                      <h3 className="font-bold text-lg">{pacote.nome}</h3>
                      <div className="mt-2 space-y-1 text-sm">
                        <p>Comissão: {pacote.comissao}%</p>
                        <p>Entregas sem multa: {pacote.entregasSemMulta}/mês</p>
                        <p>Dias destaque: {pacote.diasDestaque}</p>
                      </div>
                      <div className="mt-4">
                        {desconto > 0 && (
                          <p className="text-sm text-gray-500 line-through">
                            R$ {pacote.valor.toFixed(2)}
                          </p>
                        )}
                        <p className="text-2xl font-bold text-blue-600">
                          R$ {valorFinal.toFixed(2)}
                        </p>
                      </div>
                      <Button
                        onClick={() => compraPremiumMutation.mutate(pacote)}
                        disabled={!podePagar || compraPremiumMutation.isPending}
                        className="w-full mt-4 bg-yellow-500 hover:bg-yellow-600"
                      >
                        {podePagar ? 'Comprar' : 'Saldo insuficiente'}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
