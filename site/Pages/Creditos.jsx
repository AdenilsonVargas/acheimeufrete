import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DollarSign,
  Plus,
  CreditCard,
  AlertCircle,
  Clock,
  CheckCircle2,
  FileText,
  Wallet,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "../components/common/PageHeader";
import LoadingSpinner from "../components/common/LoadingSpinner";

export default function Creditos() {
  const [modalAberto, setModalAberto] = useState(false);
  const [valorAdicionar, setValorAdicionar] = useState("");
  const [metodoPagamento, setMetodoPagamento] = useState("pix");
  const [processando, setProcessando] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const queryClient = useQueryClient();

  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['user-creditos'],
    queryFn: async () => {
      return await base44.auth.me();
    }
  });

  const { data: perfilCliente, isLoading: loadingPerfil } = useQuery({
    queryKey: ['perfil-cliente-creditos', user?.perfilAtivoId],
    queryFn: async () => {
      if (!user) return null;
      const perfis = await base44.entities.PerfilCliente.filter({
        userIdGoogle: user.perfilAtivoId
      });
      return perfis[0] || null;
    },
    enabled: !!user?.perfilAtivoId
  });

  const { data: cotacoesPendentes = [] } = useQuery({
    queryKey: ['cotacoes-pendentes-pagamento', user?.perfilAtivoId],
    queryFn: async () => {
      if (!user) return [];
      const cotacoes = await base44.entities.Cotacao.filter({
        clienteId: user.perfilAtivoId,
        status: "aguardando_pagamento"
      });
      return cotacoes;
    },
    enabled: !!user?.perfilAtivoId
  });

  const { data: pagamentos = [] } = useQuery({
    queryKey: ['historico-pagamentos', user?.perfilAtivoId],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.Pagamento.filter(
        { clienteId: user.perfilAtivoId },
        "-created_date",
        20
      );
    },
    enabled: !!user?.perfilAtivoId
  });

  const handleAdicionarCreditos = async () => {
    setError("");
    setSuccess("");

    const valor = parseFloat(valorAdicionar);
    if (!valor || valor <= 0) {
      setError("Digite um valor válido");
      return;
    }

    if (valor < 10) {
      setError("Valor mínimo: R$ 10,00");
      return;
    }

    if (!confirm(`Adicionar R$ ${valor.toFixed(2)} em créditos via ${metodoPagamento.replace("_", " ")}?`)) {
      return;
    }

    setProcessando(true);

    try {
      const pagamento = await base44.entities.Pagamento.create({
        clienteId: user.perfilAtivoId,
        tipo: "creditos",
        valor: valor,
        metodo: metodoPagamento,
        status: "processando",
        dataHoraPagamento: new Date().toISOString(),
        observacoes: "Adição de créditos"
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      await base44.entities.Pagamento.update(pagamento.id, {
        status: "aprovado",
        dataHoraAprovacao: new Date().toISOString()
      });

      const novoSaldo = (perfilCliente.saldoCreditos || 0) + valor;
      const historicoAtualizado = [
        ...(perfilCliente.historicoCreditos || []),
        {
          tipo: "adicao",
          valor: valor,
          descricao: `Créditos adicionados via ${metodoPagamento}`,
          pagamentoId: pagamento.id,
          data: new Date().toISOString()
        }
      ];

      await base44.entities.PerfilCliente.update(perfilCliente.id, {
        saldoCreditos: novoSaldo,
        historicoCreditos: historicoAtualizado
      });

      setSuccess(`R$ ${valor.toFixed(2)} adicionados com sucesso!`);
      setValorAdicionar("");
      setModalAberto(false);
      
      queryClient.invalidateQueries({ queryKey: ['perfil-cliente-creditos'] });
      queryClient.invalidateQueries({ queryKey: ['historico-pagamentos'] });
    } catch (error) {
      console.error("Erro ao adicionar créditos:", error);
      setError("Erro ao processar pagamento. Tente novamente.");
    }

    setProcessando(false);
  };

  const handlePagarCotacao = async (cotacao) => {
    setError("");
    setSuccess("");

    const valor = cotacao.valorOriginalCotacao;
    const saldoDisponivel = (perfilCliente?.saldoCreditos || 0) + (perfilCliente?.saldoCashback || 0);

    if (saldoDisponivel < valor) {
      setError(`Saldo insuficiente. Você tem R$ ${saldoDisponivel.toFixed(2)} e precisa de R$ ${valor.toFixed(2)}`);
      return;
    }

    if (!confirm(`Pagar cotação?\n\nValor: R$ ${valor.toFixed(2)}\nSeu saldo após pagamento: R$ ${(saldoDisponivel - valor).toFixed(2)}`)) {
      return;
    }

    setProcessando(true);

    try {
      let valorRestante = valor;
      let cashbackUsado = 0;
      let creditosUsados = 0;

      const saldoCashback = perfilCliente?.saldoCashback || 0;
      const saldoCreditos = perfilCliente?.saldoCreditos || 0;

      if (saldoCashback > 0) {
        cashbackUsado = Math.min(saldoCashback, valorRestante);
        valorRestante -= cashbackUsado;
      }

      if (valorRestante > 0) {
        creditosUsados = valorRestante;
      }

      const pagamento = await base44.entities.Pagamento.create({
        clienteId: user.perfilAtivoId,
        cotacaoId: cotacao.id,
        tipo: "cotacao",
        valor: valor,
        metodo: "creditos",
        status: "aprovado",
        dataHoraPagamento: new Date().toISOString(),
        dataHoraAprovacao: new Date().toISOString(),
        observacoes: `Cashback: R$ ${cashbackUsado.toFixed(2)}, Créditos: R$ ${creditosUsados.toFixed(2)}`
      });

      const novoSaldoCashback = saldoCashback - cashbackUsado;
      const novoSaldoCreditos = saldoCreditos - creditosUsados;
      
      const historicoAtualizado = [
        ...(perfilCliente.historicoCreditos || []),
        {
          tipo: "uso",
          valor: valor,
          descricao: `Pagamento cotação #${cotacao.id.slice(0, 8)}`,
          cotacaoId: cotacao.id,
          pagamentoId: pagamento.id,
          data: new Date().toISOString()
        }
      ];

      await base44.entities.PerfilCliente.update(perfilCliente.id, {
        saldoCashback: novoSaldoCashback,
        saldoCreditos: novoSaldoCreditos,
        historicoCreditos: historicoAtualizado
      });

      await base44.entities.Cotacao.update(cotacao.id, {
        statusPagamento: "pago",
        valorPago: valor,
        dataPagamento: new Date().toISOString(),
        metodoPagamento: "creditos",
        pagamentoId: pagamento.id,
        status: "aceita"
      });

      setSuccess("Pagamento realizado com sucesso! A transportadora foi notificada.");
      
      queryClient.invalidateQueries({ queryKey: ['cotacoes-pendentes-pagamento'] });
      queryClient.invalidateQueries({ queryKey: ['historico-pagamentos'] });
      queryClient.invalidateQueries({ queryKey: ['perfil-cliente-creditos'] });
    } catch (error) {
      console.error("Erro ao pagar cotação:", error);
      setError("Erro ao processar pagamento. Tente novamente.");
    }

    setProcessando(false);
  };

  if (loadingUser || loadingPerfil) {
    return <LoadingSpinner message="Carregando..." />;
  }

  if (!user || !perfilCliente) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
        <PageHeader title="Créditos" showBack={true} />
        <div className="p-6 max-w-4xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Erro ao carregar perfil. Tente novamente.</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const ehCPF = perfilCliente.cpfOuCnpj?.length === 11 || perfilCliente.cpfOuCnpj?.length === 14;
  const saldoTotal = (perfilCliente.saldoCreditos || 0) + (perfilCliente.saldoCashback || 0);

  const statusColors = {
    pendente: "bg-yellow-100 text-yellow-800",
    processando: "bg-blue-100 text-blue-800",
    aprovado: "bg-green-100 text-green-800",
    rejeitado: "bg-red-100 text-red-800"
  };

  const statusLabels = {
    pendente: "Pendente",
    processando: "Processando",
    aprovado: "Aprovado",
    rejeitado: "Rejeitado"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <PageHeader
        title="Créditos e Pagamentos"
        description="Gerencie seus créditos e pague cotações pendentes"
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

        {ehCPF && (
          <Alert className="bg-blue-50 border-blue-300">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              <strong>Importante!</strong> Como cliente CPF, você precisa fazer pagamento antecipado antes de conversar com a transportadora.
            </AlertDescription>
          </Alert>
        )}

        {/* Card de Saldo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Saldo Total</p>
                  <p className="text-3xl font-bold text-green-900 mt-2">
                    R$ {saldoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Créditos + Cashback
                  </p>
                </div>
                <Wallet className="w-12 h-12 text-green-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Créditos</p>
                  <p className="text-3xl font-bold text-blue-900 mt-2">
                    R$ {(perfilCliente.saldoCreditos || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Disponível para uso
                  </p>
                </div>
                <DollarSign className="w-12 h-12 text-blue-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Cashback</p>
                  <p className="text-3xl font-bold text-purple-900 mt-2">
                    R$ {(perfilCliente.saldoCashback || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-purple-600 mt-1">
                    15% de valores extras
                  </p>
                </div>
                <TrendingUp className="w-12 h-12 text-purple-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Botão Adicionar Créditos */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Adicionar Créditos</h3>
                <p className="text-sm text-gray-500">Recarregue seu saldo para pagar cotações</p>
              </div>
              <Button
                onClick={() => setModalAberto(true)}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Créditos
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Cotações Pendentes de Pagamento */}
        {cotacoesPendentes.length > 0 && (
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-600" />
                Cotações Pendentes de Pagamento ({cotacoesPendentes.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {cotacoesPendentes.map((cotacao) => (
                  <div
                    key={cotacao.id}
                    className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 bg-orange-50 border border-orange-200 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <FileText className="w-8 h-8 text-orange-600 flex-shrink-0" />
                      <div>
                        <h4 className="font-bold text-gray-900">{cotacao.produtoNome}</h4>
                        <p className="text-sm text-gray-600">
                          {cotacao.destinatarioCidade} - {cotacao.destinatarioEstado}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Criada em: {new Date(cotacao.created_date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right w-full md:w-auto">
                      <p className="text-2xl font-bold text-orange-900">
                        R$ {cotacao.valorOriginalCotacao?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <Button
                        onClick={() => handlePagarCotacao(cotacao)}
                        disabled={processando || saldoTotal < cotacao.valorOriginalCotacao}
                        className="mt-2 w-full md:w-auto bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800"
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        {saldoTotal < cotacao.valorOriginalCotacao ? "Saldo Insuficiente" : "Pagar Agora"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Histórico */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Histórico</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs defaultValue="creditos">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="creditos">Movimentação de Créditos</TabsTrigger>
                <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
              </TabsList>

              <TabsContent value="creditos" className="mt-4">
                <div className="space-y-2">
                  {perfilCliente.historicoCreditos?.slice(-10).reverse().map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {item.tipo === "adicao" ? (
                          <TrendingUp className="w-5 h-5 text-green-600" />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-red-600" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{item.descricao}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(item.data).toLocaleDateString('pt-BR')} às {new Date(item.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <p className={`font-bold ${item.tipo === "adicao" ? "text-green-600" : "text-red-600"}`}>
                        {item.tipo === "adicao" ? "+" : "-"}R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  ))}
                  {(!perfilCliente.historicoCreditos || perfilCliente.historicoCreditos.length === 0) && (
                    <p className="text-center text-gray-500 py-8">Nenhuma movimentação ainda</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="pagamentos" className="mt-4">
                <div className="space-y-2">
                  {pagamentos.map((pagamento) => (
                    <div
                      key={pagamento.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {pagamento.tipo === "creditos" && "Adição de Créditos"}
                            {pagamento.tipo === "cotacao" && `Pagamento Cotação #${pagamento.cotacaoId?.slice(0, 8)}`}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(pagamento.created_date).toLocaleDateString('pt-BR')} - {pagamento.metodo.replace("_", " ")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">
                          R$ {pagamento.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <Badge className={statusColors[pagamento.status]}>
                          {statusLabels[pagamento.status]}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {pagamentos.length === 0 && (
                    <p className="text-center text-gray-500 py-8">Nenhum pagamento ainda</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Modal Adicionar Créditos */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Créditos</DialogTitle>
            <DialogDescription>
              Escolha o valor e o método de pagamento
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                Valor (mínimo R$ 10,00)
              </label>
              <Input
                type="number"
                placeholder="0,00"
                value={valorAdicionar}
                onChange={(e) => setValorAdicionar(e.target.value)}
                min="10"
                step="0.01"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                Método de Pagamento
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "pix", label: "PIX", icon: "💳" },
                  { value: "cartao_credito", label: "Cartão Crédito", icon: "💳" },
                  { value: "cartao_debito", label: "Cartão Débito", icon: "💳" },
                  { value: "boleto", label: "Boleto", icon: "📄" }
                ].map((metodo) => (
                  <Button
                    key={metodo.value}
                    type="button"
                    variant={metodoPagamento === metodo.value ? "default" : "outline"}
                    onClick={() => setMetodoPagamento(metodo.value)}
                    className="justify-start"
                  >
                    <span className="mr-2">{metodo.icon}</span>
                    {metodo.label}
                  </Button>
                ))}
              </div>
            </div>

            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-sm">
                Os créditos serão adicionados automaticamente após a aprovação do pagamento
              </AlertDescription>
            </Alert>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalAberto(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleAdicionarCreditos}
              disabled={processando}
              className="bg-gradient-to-r from-green-600 to-green-700"
            >
              {processando ? "Processando..." : "Confirmar Pagamento"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
