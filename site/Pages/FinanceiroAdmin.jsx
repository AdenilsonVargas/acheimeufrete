import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  FileText,
  CheckCircle2,
  AlertCircle,
  Download,
  Truck,
  Calendar
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "../components/common/PageHeader";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";

export default function FinanceiroAdmin() {
  const [user, setUser] = useState(null);
  const [mesReferencia, setMesReferencia] = useState(new Date().toISOString().slice(0, 7));

  const queryClient = useQueryClient();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userData = await base44.auth.me();
    setUser(userData);
  };

  const { data: registrosFinanceiros = [], isLoading } = useQuery({
    queryKey: ['financeiro-admin', mesReferencia],
    queryFn: async () => {
      return await base44.entities.Financeiro.filter({ mesReferencia }, "-created_date");
    },
    enabled: !!mesReferencia
  });

  const handleGerarBoleto = async (registro) => {
    if (!confirm(`Gerar boleto para ${registro.transportadoraNome}?\n\nValor Total: R$ ${registro.valorTotalComissao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)) {
      return;
    }

    try {
      await base44.entities.Financeiro.update(registro.id, {
        boletoGerado: true,
        dataBoletoGerado: new Date().toISOString()
      });

      alert("Boleto gerado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['financeiro-admin'] });
    } catch (error) {
      console.error("Erro ao gerar boleto:", error);
      alert("Erro ao gerar boleto. Tente novamente.");
    }
  };

  const handleMarcarComoPago = async (registro) => {
    if (!confirm(`Marcar boleto de ${registro.transportadoraNome} como pago?`)) {
      return;
    }

    try {
      await base44.entities.Financeiro.update(registro.id, {
        boletoPago: true,
        dataBoletoPago: new Date().toISOString()
      });

      alert("Boleto marcado como pago!");
      queryClient.invalidateQueries({ queryKey: ['financeiro-admin'] });
    } catch (error) {
      console.error("Erro ao marcar como pago:", error);
      alert("Erro ao atualizar status. Tente novamente.");
    }
  };

  // Gerar lista de meses (últimos 12 meses)
  const generateMonthOptions = () => {
    const options = [];
    const today = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const value = date.toISOString().slice(0, 7);
      const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      options.push({ value, label });
    }
    return options;
  };

  if (!user || isLoading) {
    return <LoadingSpinner message="Carregando financeiro..." />;
  }

  const totalGeral = registrosFinanceiros.reduce((sum, r) => sum + r.valorTotalComissao, 0);
  const totalPendente = registrosFinanceiros.filter(r => !r.boletoPago).reduce((sum, r) => sum + r.valorTotalComissao, 0);
  const totalPago = registrosFinanceiros.filter(r => r.boletoPago).reduce((sum, r) => sum + r.valorTotalComissao, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <PageHeader
        title="Financeiro - Transportadoras"
        description="Gerencie boletos e comissões das transportadoras"
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Seletor de Mês */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Calendar className="w-5 h-5 text-gray-500" />
              <div className="flex-1">
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Mês de Referência
                </label>
                <Select value={mesReferencia} onValueChange={setMesReferencia}>
                  <SelectTrigger className="w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {generateMonthOptions().map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Total Geral</p>
                  <p className="text-3xl font-bold text-blue-900 mt-2">
                    R$ {totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {registrosFinanceiros.length} transportadora(s)
                  </p>
                </div>
                <DollarSign className="w-12 h-12 text-blue-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700">Pendente</p>
                  <p className="text-3xl font-bold text-orange-900 mt-2">
                    R$ {totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-orange-600 mt-1">
                    {registrosFinanceiros.filter(r => !r.boletoPago).length} boleto(s)
                  </p>
                </div>
                <AlertCircle className="w-12 h-12 text-orange-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Pago</p>
                  <p className="text-3xl font-bold text-green-900 mt-2">
                    R$ {totalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    {registrosFinanceiros.filter(r => r.boletoPago).length} boleto(s)
                  </p>
                </div>
                <CheckCircle2 className="w-12 h-12 text-green-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Transportadoras */}
        {registrosFinanceiros.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Nenhum registro financeiro"
            description={`Não há cotações finalizadas no mês selecionado`}
          />
        ) : (
          <div className="space-y-4">
            {registrosFinanceiros.map((registro) => (
              <Card key={registro.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Truck className="w-6 h-6 text-blue-600" />
                      <div>
                        <CardTitle className="text-lg">{registro.transportadoraNome}</CardTitle>
                        <p className="text-sm text-gray-500">
                          {registro.cotacoes?.length || 0} cotação(ões) finalizada(s)
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {registro.boletoPago ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Pago
                        </Badge>
                      ) : registro.boletoGerado ? (
                        <Badge className="bg-orange-100 text-orange-800">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Pendente
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800">
                          Aguardando Boleto
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  {/* Detalhes Financeiros */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-600 font-semibold mb-1">VALOR TOTAL COTAÇÕES</p>
                      <p className="text-2xl font-bold text-blue-900">
                        R$ {registro.valorTotalCotacoes?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>

                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-xs text-green-600 font-semibold mb-1">COMISSÃO 15%</p>
                      <p className="text-2xl font-bold text-green-900">
                        R$ {registro.valorTotalComissao?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 font-semibold mb-1">COTAÇÕES</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {registro.cotacoes?.length || 0}
                      </p>
                    </div>
                  </div>

                  {/* Lista de Cotações */}
                  {registro.cotacoes && registro.cotacoes.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Cotações Finalizadas:</p>
                      <div className="space-y-2">
                        {registro.cotacoes.map((cotacao, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <FileText className="w-4 h-4 text-gray-400" />
                              <div>
                                <p className="font-medium text-gray-900">
                                  Cotação #{cotacao.numeroCotacao}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(cotacao.dataFinalizacao).toLocaleDateString('pt-BR')}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">
                                R$ {cotacao.valorCotacao?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                              <p className="text-xs text-green-600">
                                Comissão: R$ {cotacao.valorComissao?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Status e Ações */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-gray-600">
                      {registro.boletoGerado && (
                        <p>
                          Boleto gerado em: {new Date(registro.dataBoletoGerado).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                      {registro.boletoPago && (
                        <p className="text-green-600 font-medium">
                          Pago em: {new Date(registro.dataBoletoPago).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {!registro.boletoGerado && (
                        <Button
                          onClick={() => handleGerarBoleto(registro)}
                          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Gerar Boleto
                        </Button>
                      )}

                      {registro.boletoGerado && !registro.boletoPago && (
                        <Button
                          onClick={() => handleMarcarComoPago(registro)}
                          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Marcar como Pago
                        </Button>
                      )}

                      {registro.boletoPago && (
                        <Button disabled variant="outline">
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Boleto Pago
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
