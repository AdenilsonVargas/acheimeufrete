import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  BarChart3, 
  TrendingUp, 
  FileText, 
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Filter
} from "lucide-react";
import PageHeader from "../components/common/PageHeader";
import LoadingSpinner from "../components/common/LoadingSpinner";

const MESES = [
  { value: "all", label: "Todos os meses" },
  { value: "01", label: "Janeiro" },
  { value: "02", label: "Fevereiro" },
  { value: "03", label: "Março" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Maio" },
  { value: "06", label: "Junho" },
  { value: "07", label: "Julho" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" }
];

export default function RelatoriosTransportadora() {
  const [filtroMes, setFiltroMes] = useState("all");
  const [filtroAno, setFiltroAno] = useState(new Date().getFullYear().toString());

  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['user-relatorios-transportadora'],
    queryFn: () => base44.auth.me()
  });

  const { data: dadosRelatorio, isLoading: loadingStats, error } = useQuery({
    queryKey: ['relatorio-cotacoes-transportadora', user?.perfilAtivoId, filtroMes, filtroAno],
    queryFn: async () => {
      if (!user) return null;

      const respostas = await base44.entities.RespostaCotacao.filter({ 
        transportadoraId: user.perfilAtivoId 
      });
      
      const todasCotacoes = await base44.entities.Cotacao.filter({ status: "finalizada" });
      
      // Cotações finalizadas onde minha resposta foi aceita
      const cotacoesFinalizadas = todasCotacoes.filter(cotacao => 
        respostas.some(r => r.id === cotacao.respostaSelecionadaId)
      ).map(cotacao => {
        const resposta = respostas.find(r => r.id === cotacao.respostaSelecionadaId);
        return { ...cotacao, resposta };
      });

      // Aplicar filtros
      const cotacoesFiltradas = cotacoesFinalizadas.filter(cotacao => {
        const data = new Date(cotacao.dataHoraFinalizacao || cotacao.updated_date);
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const ano = data.getFullYear().toString();
        
        const matchMes = filtroMes === "all" || mes === filtroMes;
        const matchAno = ano === filtroAno;
        
        return matchMes && matchAno;
      });

      const totalPropostas = respostas.length;
      const propostasAceitas = cotacoesFinalizadas.length;
      const valorTotal = cotacoesFiltradas.reduce((sum, c) => sum + (c.resposta?.valorTotal || 0), 0);
      const taxaSucesso = totalPropostas > 0 ? (propostasAceitas / totalPropostas) * 100 : 0;

      return {
        totalPropostas,
        propostasAceitas,
        valorTotalGanho: valorTotal,
        taxaSucesso: taxaSucesso.toFixed(1),
        cotacoesFiltradas
      };
    },
    enabled: !!user?.perfilAtivoId,
    staleTime: 60000,
    retry: 3
  });

  const anos = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());

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
            <AlertDescription>Erro ao carregar relatórios. Recarregue a página.</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const statCards = [
    { title: "Total de Propostas", value: dadosRelatorio?.totalPropostas || 0, icon: FileText, color: "text-blue-600", bgColor: "bg-blue-50" },
    { title: "Propostas Aceitas", value: dadosRelatorio?.propostasAceitas || 0, icon: CheckCircle2, color: "text-green-600", bgColor: "bg-green-50" },
    { title: "Valor Total (Filtrado)", value: `R$ ${(dadosRelatorio?.valorTotalGanho || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: DollarSign, color: "text-purple-600", bgColor: "bg-purple-50" },
    { title: "Taxa de Sucesso", value: `${dadosRelatorio?.taxaSucesso || 0}%`, icon: TrendingUp, color: "text-orange-600", bgColor: "bg-orange-50" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <PageHeader
        title="Relatórios"
        description="Visualize suas estatísticas e desempenho"
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Cards de Estatísticas */}
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

        {/* Filtros e Lista */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Cotações Finalizadas
              </CardTitle>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <Select value={filtroMes} onValueChange={setFiltroMes}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {MESES.map((mes) => (
                      <SelectItem key={mes.value} value={mes.value}>{mes.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filtroAno} onValueChange={setFiltroAno}>
                  <SelectTrigger className="w-24">
                    <SelectValue placeholder="Ano" />
                  </SelectTrigger>
                  <SelectContent>
                    {anos.map((ano) => (
                      <SelectItem key={ano} value={ano}>{ano}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {(dadosRelatorio?.cotacoesFiltradas || []).length === 0 ? (
              <p className="text-center text-gray-500 py-8">Nenhuma cotação finalizada no período selecionado</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="text-left p-3 font-semibold text-gray-700">Nº Cotação</th>
                      <th className="text-left p-3 font-semibold text-gray-700">CEP Origem</th>
                      <th className="text-left p-3 font-semibold text-gray-700">UF</th>
                      <th className="text-left p-3 font-semibold text-gray-700">CEP Destino</th>
                      <th className="text-left p-3 font-semibold text-gray-700">UF</th>
                      <th className="text-right p-3 font-semibold text-gray-700">Valor Total</th>
                      <th className="text-center p-3 font-semibold text-gray-700">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {dadosRelatorio?.cotacoesFiltradas.map((cotacao) => (
                      <tr key={cotacao.id} className="hover:bg-gray-50">
                        <td className="p-3">
                          <span className="font-mono font-semibold text-blue-600">
                            #{cotacao.id.slice(0, 8)}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-sm">
                          {cotacao.enderecoColetaCep || "N/I"}
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            {cotacao.enderecoColetaEstado || "N/I"}
                          </Badge>
                        </td>
                        <td className="p-3 font-mono text-sm">
                          {cotacao.destinatarioCep}
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="bg-red-50 text-red-700">
                            {cotacao.destinatarioEstado}
                          </Badge>
                        </td>
                        <td className="p-3 text-right font-semibold text-green-700">
                          R$ {(cotacao.resposta?.valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-center text-sm text-gray-600">
                          {new Date(cotacao.dataHoraFinalizacao || cotacao.updated_date).toLocaleDateString('pt-BR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-blue-50">
                    <tr>
                      <td colSpan="5" className="p-3 font-bold text-gray-900">TOTAL DO PERÍODO</td>
                      <td className="p-3 text-right font-bold text-green-700 text-lg">
                        R$ {(dadosRelatorio?.valorTotalGanho || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-center font-semibold">
                        {dadosRelatorio?.cotacoesFiltradas.length} cotação(ões)
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
