import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  FileText,
  CheckCircle2,
  AlertCircle,
  Truck,
  Calendar,
  TrendingUp,
  Users
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "../components/common/PageHeader";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function FinanceiroAdmin() {
  const [mesReferencia, setMesReferencia] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [token, setToken] = useState("");

  const queryClient = useQueryClient();

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    setToken(storedToken || "");
  }, []);

  const { data: dashboard = {}, isLoading } = useQuery({
    queryKey: ['dashboard-admin', mesReferencia],
    queryFn: async () => {
      if (!token) return {};
      
      const [mes, ano] = mesReferencia.split('-');
      const response = await fetch(
        `${API_BASE}/dashboard/admin?mes=${mes}&ano=${ano}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (!response.ok) throw new Error('Erro ao buscar dashboard');
      return response.json();
    },
    enabled: !!token && !!mesReferencia
  });

  const { data: boletos = [], isLoading: loadingBoletos } = useQuery({
    queryKey: ['boleto-solicitacoes', mesReferencia],
    queryFn: async () => {
      if (!token) return [];
      
      const response = await fetch(
        `${API_BASE}/admin/boleto/solicitacoes`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (!response.ok) throw new Error('Erro ao buscar boletos');
      const data = await response.json();
      return data.data || [];
    },
    enabled: !!token
  });

  const handleAprovarBoleto = async (clienteId, clienteNome) => {
    if (!confirm(`Aprovar boleto para ${clienteNome}?`)) return;

    try {
      const response = await fetch(
        `${API_BASE}/admin/boleto/${clienteId}/aprovar`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ justificativa: "Aprovado pelo administrador" })
        }
      );

      if (!response.ok) throw new Error('Erro ao aprovar');
      
      alert('Boleto aprovado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['boleto-solicitacoes'] });
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao aprovar boleto');
    }
  };

  const handleRejeitarBoleto = async (clienteId, clienteNome) => {
    const justificativa = prompt('Motivo da rejeição:');
    if (!justificativa || justificativa.length < 10) {
      alert('Justificativa obrigatória (mínimo 10 caracteres)');
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/admin/boleto/${clienteId}/rejeitar`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ justificativa })
        }
      );

      if (!response.ok) throw new Error('Erro ao rejeitar');
      
      alert('Boleto rejeitado!');
      queryClient.invalidateQueries({ queryKey: ['boleto-solicitacoes'] });
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao rejeitar boleto');
    }
  };

  // Gerar opções de meses
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

  if (isLoading || loadingBoletos) {
    return <LoadingSpinner message="Carregando financeiro..." />;
  }

  const resumo = dashboard?.data?.resumo || {};
  const transportadores = dashboard?.data?.financeiroTransportadores || [];
  const cotacoesFinalizadas = dashboard?.data?.cotacoesFinalizadasMes || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <PageHeader 
        title="Painel Financeiro" 
        subtitle="Gestão de receitas, comissões e pagamentos"
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
        <Card className="bg-white shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              Faturamento Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">
              R$ {resumo?.totalFaturadoMes?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {resumo?.cotacoesFinalizadasMes} cotações finalizadas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-600" />
              Comissões
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">
              R$ {resumo?.totalComissoesMes?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Taxa: {resumo?.taxaComissao}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-purple-600" />
              Para Transportadores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">
              R$ {resumo?.totalRecebidoTransportadores?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {resumo?.transportadoresAtivos} transportadores
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg border-2 border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Pagamentos Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">
              R$ {resumo?.totalPagamentosEmAberto?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-orange-500 mt-1">
              {resumo?.cotacoesPagamentosPendentes} cotações
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Solicitações de Boleto Pendentes */}
      {boletos && boletos.length > 0 && (
        <Card className="mb-6 border-2 border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Solicitações de Boleto Pendentes
              <Badge variant="destructive">{boletos.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {boletos.map(solicitacao => (
                <div key={solicitacao.id} className="p-4 bg-white rounded-lg border border-yellow-200 flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{solicitacao.nomeCompleto || solicitacao.email}</p>
                    <p className="text-sm text-gray-600">
                      Status: <Badge variant={solicitacao.solicitacaoBoletoStatus === 'pendente' ? 'secondary' : 'outline'}>
                        {solicitacao.solicitacaoBoletoStatus || 'Pendente'}
                      </Badge>
                    </p>
                    {solicitacao.dataSolicitacaoBoleto && (
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(solicitacao.dataSolicitacaoBoleto).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleAprovarBoleto(solicitacao.id, solicitacao.nomeCompleto || solicitacao.email)}
                      className="bg-green-600 hover:bg-green-700"
                      size="sm"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Aprovar
                    </Button>
                    <Button
                      onClick={() => handleRejeitarBoleto(solicitacao.id, solicitacao.nomeCompleto || solicitacao.email)}
                      variant="destructive"
                      size="sm"
                    >
                      Rejeitar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Financeiro das Transportadoras */}
      {transportadores && transportadores.length > 0 ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Financeiro de Transportadoras
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="text-left p-3 font-semibold">Transportadora</th>
                    <th className="text-right p-3 font-semibold">Total Faturado</th>
                    <th className="text-right p-3 font-semibold">Comissão (5%)</th>
                    <th className="text-right p-3 font-semibold">A Receber</th>
                    <th className="text-center p-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transportadores.map(transporte => (
                    <tr key={transporte.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <p className="font-semibold">{transporte.transportadora?.razaoSocial || transporte.transportadora?.nomeCompleto}</p>
                        <p className="text-xs text-gray-500">{transporte.transportadora?.email}</p>
                      </td>
                      <td className="text-right p-3 font-semibold">
                        R$ {(transporte.totalFaturado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="text-right p-3">
                        R$ {(transporte.totalComissao || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="text-right p-3 font-semibold text-green-600">
                        R$ {(transporte.totalReceber || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="text-center p-3">
                        <Badge variant={transporte.status === 'pago' ? 'default' : 'secondary'}>
                          {transporte.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <EmptyState 
              title="Sem dados" 
              description="Não há registros financeiros para este período"
            />
          </CardContent>
        </Card>
      )}

      {/* Cotações Finalizadas */}
      {cotacoesFinalizadas && cotacoesFinalizadas.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Cotações Finalizadas no Período</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="text-left p-3 font-semibold">Cotação</th>
                    <th className="text-left p-3 font-semibold">Embarcador</th>
                    <th className="text-left p-3 font-semibold">Transportadora</th>
                    <th className="text-right p-3 font-semibold">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {cotacoesFinalizadas.map(cot => (
                    <tr key={cot.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-semibold">#{cot.numero}</td>
                      <td className="p-3">{cot.user?.nomeFantasia || cot.user?.nomeCompleto}</td>
                      <td className="p-3">{cot.respostaSelecionada?.transportador?.razaoSocial || cot.respostaSelecionada?.transportador?.nomeCompleto}</td>
                      <td className="text-right p-3 font-semibold">
                        R$ {(cot.respostaSelecionada?.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
