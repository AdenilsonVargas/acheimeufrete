import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  CheckCircle2,
  DollarSign,
  FileText,
  Calendar,
  TrendingDown
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "../components/common/PageHeader";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function DashboardEmbarcador() {
  const [mesReferencia, setMesReferencia] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [token, setToken] = useState("");

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    setToken(storedToken || "");
  }, []);

  const { data: dashboard = {}, isLoading } = useQuery({
    queryKey: ['dashboard-embarcador', mesReferencia],
    queryFn: async () => {
      if (!token) return {};
      
      const [mes, ano] = mesReferencia.split('-');
      const response = await fetch(
        `${API_BASE}/dashboard/embarcador?mes=${mes}&ano=${ano}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (!response.ok) throw new Error('Erro ao buscar dashboard');
      return response.json();
    },
    enabled: !!token && !!mesReferencia
  });

  const generateMonthOptions = () => {
    const options = [];
    const today = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const value = date.toISOString().slice(0, 7);
      const label = date.toLocaleDateString('pt-BR', { 
        month: 'long', 
        year: 'numeric' 
      });
      options.push({ value, label });
    }
    return options;
  };

  if (isLoading) {
    return <LoadingSpinner message="Carregando suas contas..." />;
  }

  const resumo = dashboard?.data?.resumo || {};
  const cotacoesEmAberto = dashboard?.data?.cotacoesEmAberto || [];
  const cotacoesPagas = dashboard?.data?.cotacoesPagas || [];
  const boletosAguardando = dashboard?.data?.boletosAguardando || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <PageHeader 
        title="Minhas Contas" 
        subtitle="Controle de pagamentos a realizar"
        icon={DollarSign}
      />

      {/* Filtro de Mês */}
      <div className="mb-6 max-w-md">
        <label className="block text-sm font-medium mb-2">Período</label>
        <Select value={mesReferencia} onValueChange={setMesReferencia}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {generateMonthOptions().map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Resumo Executivo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-white shadow-lg border-2 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Total a Pagar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">
              R$ {resumo?.totalAPagar?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {resumo?.cotacoesEmAberto} cotações pendentes
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Total Pago (Mês)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              R$ {resumo?.totalPagoMes?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {resumo?.cotacoesPagasMes} cotações pagas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-600 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Boletos Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-600">
              R$ {resumo?.totalBoletosEmAberto?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {resumo?.boletosAguardando} boletos
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Período
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold text-gray-900">
              {`${String(resumo?.mes || '').padStart(2, '0')}/${resumo?.ano}`}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Dados do período selecionado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cotações em Aberto */}
      {cotacoesEmAberto && cotacoesEmAberto.length > 0 ? (
        <Card className="mb-6 border-2 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-600" />
              Cotações com Pagamento Pendente
              <Badge variant="destructive">{cotacoesEmAberto.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-red-100 border-b">
                  <tr>
                    <th className="text-left p-3 font-semibold">Cotação</th>
                    <th className="text-left p-3 font-semibold">Transportadora</th>
                    <th className="text-right p-3 font-semibold">Valor</th>
                    <th className="text-center p-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {cotacoesEmAberto.map(cotacao => (
                    <tr key={cotacao.id} className="border-b hover:bg-red-100">
                      <td className="p-3 font-semibold">#{cotacao.numero}</td>
                      <td className="p-3">
                        <p className="font-semibold">
                          {cotacao.respostaSelecionada?.transportador?.razaoSocial || 
                           cotacao.respostaSelecionada?.transportador?.nomeCompleto}
                        </p>
                      </td>
                      <td className="text-right p-3 font-semibold text-red-600">
                        R$ {(cotacao.valorFinalTransportadora || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="text-center p-3">
                        <Badge variant="destructive">
                          {cotacao.statusPagamento || 'Pendente'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Boletos Aguardando */}
      {boletosAguardando && boletosAguardando.length > 0 ? (
        <Card className="mb-6 border-2 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-600" />
              Boletos Gerados (Não Pagos)
              <Badge variant="secondary">{boletosAguardando.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {boletosAguardando.map(boleto => (
                <div key={boleto.id} className="p-4 bg-white rounded-lg border border-orange-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">Cotação #{boleto.numero}</p>
                      <p className="text-sm text-gray-600">{boleto.titulo}</p>
                      <p className="text-sm text-orange-600 font-semibold mt-2">
                        Valor: R$ {(boleto.valorFinalTransportadora || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      {boleto.dataBoletoGerado && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3" />
                          Gerado em {new Date(boleto.dataBoletoGerado).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                    <Button variant="outline" size="sm">
                      Pagar Boleto
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Cotações Pagas */}
      {cotacoesPagas && cotacoesPagas.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Cotações Pagas neste Período
              <Badge className="bg-green-600">{cotacoesPagas.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-green-100 border-b">
                  <tr>
                    <th className="text-left p-3 font-semibold">Cotação</th>
                    <th className="text-left p-3 font-semibold">Transportadora</th>
                    <th className="text-right p-3 font-semibold">Valor</th>
                    <th className="text-center p-3 font-semibold">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {cotacoesPagas.map(cotacao => (
                    <tr key={cotacao.id} className="border-b hover:bg-green-50">
                      <td className="p-3 font-semibold">#{cotacao.numero}</td>
                      <td className="p-3">
                        {cotacao.respostaSelecionada?.transportador?.razaoSocial || 
                         cotacao.respostaSelecionada?.transportador?.nomeCompleto}
                      </td>
                      <td className="text-right p-3 font-semibold text-green-600">
                        R$ {(cotacao.valorFinalTransportadora || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="text-center p-3 text-gray-600">
                        {cotacao.pagamentoConfirmadoEm ? 
                          new Date(cotacao.pagamentoConfirmadoEm).toLocaleDateString('pt-BR') :
                          '-'
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <EmptyState 
              title="Sem cotações pagas" 
              description="Você ainda não pagou nenhuma cotação neste período"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
