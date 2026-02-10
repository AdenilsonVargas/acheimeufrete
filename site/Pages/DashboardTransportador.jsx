import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Truck,
  Calendar
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "../components/common/PageHeader";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function DashboardTransportador() {
  const [mesReferencia, setMesReferencia] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [token, setToken] = useState("");

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    setToken(storedToken || "");
  }, []);

  const { data: dashboard = {}, isLoading } = useQuery({
    queryKey: ['dashboard-transportador', mesReferencia],
    queryFn: async () => {
      if (!token) return {};
      
      const [mes, ano] = mesReferencia.split('-');
      const response = await fetch(
        `${API_BASE}/dashboard/transportador?mes=${mes}&ano=${ano}`,
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
    return <LoadingSpinner message="Carregando seus ganhos..." />;
  }

  const resumo = dashboard?.data?.resumo || {};
  const cotacoesRecebidas = dashboard?.data?.cotacoesRecebidas || [];
  const cotacoesAReceber = dashboard?.data?.cotacoesAReceber || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-6">
      <PageHeader 
        title="Meus Ganhos" 
        subtitle="Controle de receitas e comissões"
        icon={TrendingUp}
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
        <Card className="bg-white shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Faturado (Mês)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">
              R$ {resumo?.totalFaturadoMes?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {resumo?.cotacoesRecebidas} cotações
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg border-2 border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Comissão (5%)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-600">
              R$ {resumo?.comissaoMes?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Descontado automaticamente
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Recebido (Mês)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              R$ {resumo?.totalRecebidoMes?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Líquido a você
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg border-2 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600 flex items-center gap-2">
              <Truck className="w-4 h-4" />
              A Receber
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">
              R$ {resumo?.totalLiquidoAReceber?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {resumo?.cotacoesAReceber} cotações pendentes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cotações a Receber */}
      {cotacoesAReceber && cotacoesAReceber.length > 0 ? (
        <Card className="mb-6 border-2 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Cotações com Pagamento Pendente
              <Badge variant="destructive">{cotacoesAReceber.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-red-100 border-b">
                  <tr>
                    <th className="text-left p-3 font-semibold">Cotação</th>
                    <th className="text-left p-3 font-semibold">Embarcador</th>
                    <th className="text-right p-3 font-semibold">Valor Bruto</th>
                    <th className="text-right p-3 font-semibold">Comissão (5%)</th>
                    <th className="text-right p-3 font-semibold">Líquido</th>
                  </tr>
                </thead>
                <tbody>
                  {cotacoesAReceber.map(cotacao => {
                    const taxa = 0.05;
                    const comissao = (cotacao.respostaSelecionada?.valor || 0) * taxa;
                    const liquido = (cotacao.respostaSelecionada?.valor || 0) - comissao;
                    
                    return (
                      <tr key={cotacao.id} className="border-b hover:bg-red-100">
                        <td className="p-3 font-semibold">#{cotacao.numero}</td>
                        <td className="p-3">
                          {cotacao.user?.nomeFantasia || cotacao.user?.nomeCompleto}
                        </td>
                        <td className="text-right p-3 font-semibold text-red-600">
                          R$ {(cotacao.respostaSelecionada?.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="text-right p-3 text-orange-600">
                          R$ {comissao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="text-right p-3 font-semibold text-green-600">
                          R$ {liquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Cotações Recebidas */}
      {cotacoesRecebidas && cotacoesRecebidas.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Cotações Pagas neste Período
              <Badge className="bg-green-600">{cotacoesRecebidas.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-green-100 border-b">
                  <tr>
                    <th className="text-left p-3 font-semibold">Cotação</th>
                    <th className="text-left p-3 font-semibold">Embarcador</th>
                    <th className="text-right p-3 font-semibold">Valor Bruto</th>
                    <th className="text-right p-3 font-semibold">Comissão (5%)</th>
                    <th className="text-right p-3 font-semibold">Você Recebeu</th>
                    <th className="text-center p-3 font-semibold">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {cotacoesRecebidas.map(cotacao => {
                    const taxa = 0.05;
                    const bruto = cotacao.respostaSelecionada?.valor || 0;
                    const comissao = bruto * taxa;
                    const liquido = bruto - comissao;
                    
                    return (
                      <tr key={cotacao.id} className="border-b hover:bg-green-50">
                        <td className="p-3 font-semibold">#{cotacao.numero}</td>
                        <td className="p-3">
                          {cotacao.user?.nomeFantasia || cotacao.user?.nomeCompleto}
                        </td>
                        <td className="text-right p-3">
                          R$ {bruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="text-right p-3 text-orange-600">
                          R$ {comissao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="text-right p-3 font-semibold text-green-600">
                          R$ {liquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="text-center p-3">
                          {cotacao.pagamentoConfirmadoEm ? 
                            new Date(cotacao.pagamentoConfirmadoEm).toLocaleDateString('pt-BR') :
                            '-'
                          }
                        </td>
                      </tr>
                    );
                  })}
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
              description="Você ainda não recebeu nenhum pagamento neste período"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
