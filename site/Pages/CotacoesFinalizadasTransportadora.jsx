import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Package,
  MapPin,
  Calendar,
  Search,
  CheckCircle2,
  Weight,
  DollarSign,
  Box,
  Filter,
  Wallet,
  Receipt
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PageHeader from "../components/common/PageHeader";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";

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

const ESTADOS = [
  { value: "all", label: "Todos os estados" },
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", 
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

export default function CotacoesFinalizadasTransportadora() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroMes, setFiltroMes] = useState("all");
  const [filtroAno, setFiltroAno] = useState(new Date().getFullYear().toString());
  const [filtroEstado, setFiltroEstado] = useState("all");

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  // Buscar ID do perfil da transportadora
  const { data: perfilTransportadora } = useQuery({
    queryKey: ['perfil-transportadora-id', user?.perfilAtivoId],
    queryFn: async () => {
      // Tentar buscar por userIdGoogle primeiro
      let perfis = await base44.entities.PerfilTransportadora.filter({ userIdGoogle: user.perfilAtivoId });
      if (perfis.length > 0) return perfis[0];
      
      // Tentar buscar por id
      perfis = await base44.entities.PerfilTransportadora.filter({ id: user.perfilAtivoId });
      return perfis[0] || null;
    },
    enabled: !!user && user.tipo === "transportadora"
  });

  const { data: cotacoesFinalizadas = [], isLoading } = useQuery({
    queryKey: ['cotacoes-finalizadas-transportadora', perfilTransportadora?.id],
    queryFn: async () => {
      if (!perfilTransportadora) return [];
      
      // Buscar minhas respostas aceitas usando o ID do perfil
      const minhasRespostas = await base44.entities.RespostaCotacao.filter({
        transportadoraId: perfilTransportadora.id
      });
      
      // Buscar todas as cotações finalizadas
      const todasCotacoes = await base44.entities.Cotacao.filter({ status: "finalizada" });
      
      // Filtrar cotações onde minha resposta foi selecionada
      const cotacoesMinhas = todasCotacoes.filter(cotacao => 
        minhasRespostas.some(r => r.id === cotacao.respostaSelecionadaId)
      );
      
      // Adicionar informações da resposta
      return cotacoesMinhas.map(cotacao => {
        const resposta = minhasRespostas.find(r => r.id === cotacao.respostaSelecionadaId);
        return { ...cotacao, resposta };
      });
    },
    enabled: !!perfilTransportadora
  });

  // Buscar resumo financeiro do mês atual
  const { data: financeiroMesAtual } = useQuery({
    queryKey: ['financeiro-mes-atual', perfilTransportadora?.id],
    queryFn: async () => {
      if (!perfilTransportadora) return null;
      const mesAtual = new Date().toISOString().slice(0, 7);
      const registros = await base44.entities.Financeiro.filter({
        transportadoraId: perfilTransportadora.id,
        mesReferencia: mesAtual
      });
      return registros[0] || null;
    },
    enabled: !!perfilTransportadora
  });

  // Filtros
  const cotacoesFiltradas = cotacoesFinalizadas.filter(cotacao => {
    const dataFinalizacao = new Date(cotacao.dataHoraFinalizacao || cotacao.updated_date);
    const mes = String(dataFinalizacao.getMonth() + 1).padStart(2, '0');
    const ano = dataFinalizacao.getFullYear().toString();
    
    const matchMes = filtroMes === "all" || mes === filtroMes;
    const matchAno = ano === filtroAno;
    const matchEstado = filtroEstado === "all" || cotacao.destinatarioEstado === filtroEstado;
    const matchSearch = searchTerm === "" || 
      cotacao.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cotacao.produtoNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cotacao.destinatarioCidade.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchMes && matchAno && matchEstado && matchSearch;
  });

  const anos = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());

  if (isLoading) {
    return <LoadingSpinner message="Carregando cotações finalizadas..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <PageHeader
        title="Cotações Finalizadas"
        description="Histórico de entregas concluídas"
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Resumo Financeiro do Mês */}
        {financeiroMesAtual && (
          <Alert className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <Wallet className="h-5 w-5 text-green-600" />
            <AlertDescription className="text-gray-800">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <strong className="text-green-700">Crédito acumulado este mês:</strong>{" "}
                  <span className="text-2xl font-bold text-green-700">
                    R$ {(financeiroMesAtual.valorTotalTransportadora || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-sm text-gray-600 ml-2">
                    (5% comissão: R$ {(financeiroMesAtual.valorTotalComissao || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                  </span>
                </div>
                <Link to={createPageUrl("FinanceiroTransportadora")}>
                  <Button variant="outline" className="border-green-300 text-green-700 hover:bg-green-100">
                    <Receipt className="w-4 h-4 mr-2" />
                    Ver Financeiro Completo
                  </Button>
                </Link>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Pagamento liberado no último dia do mês após 12:00 (horário de Brasília)
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Filtros */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filtros:</span>
              </div>
              
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por número, produto ou cidade..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={filtroMes} onValueChange={setFiltroMes}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Mês" />
                </SelectTrigger>
                <SelectContent>
                  {MESES.map((mes) => (
                    <SelectItem key={mes.value} value={mes.value}>{mes.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filtroAno} onValueChange={setFiltroAno}>
                <SelectTrigger className="w-28">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  {anos.map((ano) => (
                    <SelectItem key={ano} value={ano}>{ano}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Estado destino" />
                </SelectTrigger>
                <SelectContent>
                  {ESTADOS.map((estado) => (
                    typeof estado === 'string' 
                      ? <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                      : <SelectItem key={estado.value} value={estado.value}>{estado.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="mt-3 text-sm text-gray-500">
              {cotacoesFiltradas.length} cotação(ões) encontrada(s)
            </div>
          </CardContent>
        </Card>

        {/* Lista de Cotações */}
        {cotacoesFiltradas.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Nenhuma cotação finalizada"
            description="Você ainda não tem cotações finalizadas com os filtros selecionados"
          />
        ) : (
          <div className="space-y-4">
            {cotacoesFiltradas.map((cotacao) => (
              <Card key={cotacao.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white py-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      Cotação #{cotacao.id.slice(0, 8)}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-white/20 text-white border-0">
                        {cotacao.tipoFrete}
                      </Badge>
                      <Badge className="bg-green-500 text-white">
                        Finalizada
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-0">
                  {/* Rotas */}
                  <div className="grid grid-cols-2 divide-x border-b">
                    <div className="p-3 bg-green-50">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                          <MapPin className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-xs font-bold text-green-700">ORIGEM</span>
                      </div>
                      <p className="font-semibold text-sm text-gray-900">
                        {cotacao.enderecoColetaCidade || "N/I"} - {cotacao.enderecoColetaEstado || ""}
                      </p>
                      <p className="text-xs text-green-700 font-mono">
                        CEP: {cotacao.enderecoColetaCep || "N/I"}
                      </p>
                    </div>
                    
                    <div className="p-3 bg-red-50">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
                          <MapPin className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-xs font-bold text-red-700">DESTINO</span>
                      </div>
                      <p className="font-semibold text-sm text-gray-900">
                        {cotacao.destinatarioCidade} - {cotacao.destinatarioEstado}
                      </p>
                      <p className="text-xs text-red-700 font-mono">
                        CEP: {cotacao.destinatarioCep}
                      </p>
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-5 divide-x border-b">
                    <div className="p-3 text-center">
                      <Package className="w-4 h-4 text-blue-600 mx-auto" />
                      <p className="text-xs text-gray-500 mt-1">Produto</p>
                      <p className="font-semibold text-gray-900 text-sm truncate">{cotacao.produtoNome}</p>
                    </div>
                    <div className="p-3 text-center">
                      <Box className="w-4 h-4 text-purple-600 mx-auto" />
                      <p className="text-xs text-gray-500 mt-1">Volumes</p>
                      <p className="font-bold text-gray-900">{cotacao.quantidadeVolumes}</p>
                    </div>
                    <div className="p-3 text-center">
                      <Weight className="w-4 h-4 text-orange-600 mx-auto" />
                      <p className="text-xs text-gray-500 mt-1">Peso</p>
                      <p className="font-bold text-gray-900">{cotacao.pesoTotal} kg</p>
                    </div>
                    <div className="p-3 text-center bg-green-50">
                      <DollarSign className="w-4 h-4 text-green-600 mx-auto" />
                      <p className="text-xs text-gray-500 mt-1">Valor Total</p>
                      <p className="font-bold text-green-700">
                        R$ {(cotacao.valorFinalTransportadora || cotacao.resposta?.valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-green-600">
                        Você recebe 95%
                      </p>
                    </div>
                    <div className="p-3 text-center">
                      <Calendar className="w-4 h-4 text-gray-600 mx-auto" />
                      <p className="text-xs text-gray-500 mt-1">Finalizada</p>
                      <p className="font-semibold text-gray-900 text-sm">
                        {new Date(cotacao.dataHoraFinalizacao || cotacao.updated_date).toLocaleDateString('pt-BR')}
                      </p>
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
