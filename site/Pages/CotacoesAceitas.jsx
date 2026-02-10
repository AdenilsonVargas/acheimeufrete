import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Package,
  MapPin,
  Calendar,
  Search,
  Truck,
  Weight,
  DollarSign,
  Box,
  User,
  Clock,
  ArrowRight,
  Download,
  Building2,
  Phone,
  Mail,
  ChevronDown,
  ChevronUp,
  AlertTriangle
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PageHeader from "../components/common/PageHeader";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";

export default function CotacoesAceitas() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCards, setExpandedCards] = useState({});

  const { data: user } = useQuery({
    queryKey: ['user-cotacoes-aceitas'],
    queryFn: () => base44.auth.me(),
    staleTime: 60000
  });

  const { data: cotacoes = [], isLoading } = useQuery({
    queryKey: ['cotacoes-aceitas-cliente', user?.perfilAtivoId],
    queryFn: async () => {
      if (!user) return [];
      const todasCotacoes = await base44.entities.Cotacao.filter({
        clienteId: user.perfilAtivoId
      }, "-created_date");
      // Filtrar cotações aceitas que ainda não foram coletadas OU aguardando aprovação de CT-e
      return todasCotacoes.filter(c => 
        ((c.status === "aceita" || c.status === "aguardando_coleta" || c.status === "aguardando_aprovacao_cte") && 
        !c.coletaConfirmada)
      );
    },
    enabled: !!user?.perfilAtivoId,
    staleTime: 30000
  });

  // Buscar destinatários
  const { data: destinatarios = {} } = useQuery({
    queryKey: ['destinatarios-aceitas', cotacoes.map(c => c.destinatarioId).join(',')],
    queryFn: async () => {
      const destIds = [...new Set(cotacoes.map(c => c.destinatarioId).filter(Boolean))];
      const destMap = {};
      await Promise.all(
        destIds.map(async (id) => {
          const dests = await base44.entities.Destinatario.filter({ id });
          if (dests.length > 0) destMap[id] = dests[0];
        })
      );
      return destMap;
    },
    enabled: cotacoes.length > 0
  });

  // Buscar transportadoras das respostas aceitas com dados completos
  const { data: transportadoras = {} } = useQuery({
    queryKey: ['transportadoras-aceitas-completo', cotacoes.map(c => c.respostaSelecionadaId).join(',')],
    queryFn: async () => {
      const transpMap = {};
      await Promise.all(
        cotacoes.filter(c => c.respostaSelecionadaId).map(async (cotacao) => {
          const respostas = await base44.entities.RespostaCotacao.filter({ id: cotacao.respostaSelecionadaId });
          if (respostas.length > 0) {
            const resposta = respostas[0];
            // Buscar perfil completo da transportadora
            let perfilTransportadora = null;
            const perfis = await base44.entities.PerfilTransportadora.filter({
              userIdGoogle: resposta.transportadoraId
            });
            if (perfis.length > 0) {
              perfilTransportadora = perfis[0];
            } else {
              // Tentar buscar pelo ID direto
              const todosPerfis = await base44.entities.PerfilTransportadora.filter({});
              perfilTransportadora = todosPerfis.find(p => p.id === resposta.transportadoraId);
            }
            
            transpMap[cotacao.id] = {
              nome: resposta.transportadoraNome,
              logo: resposta.transportadoraLogo,
              perfil: perfilTransportadora
            };
          }
        })
      );
      return transpMap;
    },
    enabled: cotacoes.length > 0
  });

  const toggleExpand = (cotacaoId) => {
    setExpandedCards(prev => ({
      ...prev,
      [cotacaoId]: !prev[cotacaoId]
    }));
  };

  const exportarCSVTransportadora = (cotacao, transp) => {
    const perfil = transp?.perfil;
    
    const dados = [
      ["DADOS DA TRANSPORTADORA"],
      ["Razão Social", perfil?.razaoSocial || transp?.nome || ""],
      ["CNPJ", perfil?.cnpj || ""],
      ["Telefone Comercial", perfil?.telefoneComercial || ""],
      ["Telefone Pessoal", perfil?.telefonePessoal || ""],
      ["Email", perfil?.emailAcesso || ""],
      ["Tipo de Transporte", perfil?.tipoTransporte || ""],
      [""],
      ["DADOS DA COTAÇÃO"],
      ["Número", cotacao.id],
      ["Produto", cotacao.produtoNome],
      ["NCM", cotacao.produtoNCM],
      ["Peso Total (kg)", cotacao.pesoTotal],
      ["Volumes", cotacao.quantidadeVolumes],
      ["Valor NF", cotacao.valorNotaFiscal],
      ["Tipo Frete", cotacao.tipoFrete],
      ["Data Coleta", new Date(cotacao.dataHoraColeta).toLocaleString('pt-BR')],
    ];

    const csvContent = dados.map(row => row.join(";")).join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transportadora_cotacao_${cotacao.id.slice(0, 8)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredCotacoes = cotacoes.filter(c => {
    const dest = destinatarios[c.destinatarioId];
    const transp = transportadoras[c.id];
    const searchLower = searchTerm.toLowerCase();
    return c.produtoNome?.toLowerCase().includes(searchLower) ||
           c.destinatarioCidade?.toLowerCase().includes(searchLower) ||
           dest?.nomeCompleto?.toLowerCase().includes(searchLower) ||
           transp?.nome?.toLowerCase().includes(searchLower) ||
           c.id?.toLowerCase().includes(searchLower);
  });

  if (!user || isLoading) {
    return <LoadingSpinner message="Carregando cotações aceitas..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <PageHeader
        title="Cotações Aceitas"
        description="Cotações aguardando coleta pela transportadora"
        action={
          <Link to={createPageUrl("ConfirmarColeta")}>
            <Button className="bg-green-600 hover:bg-green-700">
              <Truck className="w-4 h-4 mr-2" />
              Confirmar Coleta
            </Button>
          </Link>
        }
      />

      <div className="p-6 max-w-7xl mx-auto">
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Buscar por produto, destinatário, cidade ou transportadora..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Badge className="bg-blue-100 text-blue-800">
                {filteredCotacoes.length} aguardando coleta
              </Badge>
            </div>
          </CardContent>
        </Card>

        {filteredCotacoes.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="Nenhuma cotação aguardando coleta"
            description="Quando você aceitar uma proposta, a cotação aparecerá aqui aguardando a coleta"
          />
        ) : (
          <div className="space-y-4">
            {filteredCotacoes.map((cotacao) => {
              const dest = destinatarios[cotacao.destinatarioId];
              const transp = transportadoras[cotacao.id];

              return (
                <Card key={cotacao.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Header */}
                  <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Cotação #{cotacao.id.slice(0, 8)}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-white/20 text-white border-0">
                          {cotacao.tipoFrete}
                        </Badge>
                        {cotacao.status === "aguardando_aprovacao_cte" ? (
                          <Badge className="bg-orange-500 text-white">
                            Aprovar CT-e
                          </Badge>
                        ) : (
                          <Badge className="bg-green-500 text-white">
                            Aceita
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-0">
                    {/* Transportadora */}
                    {transp && (
                      <div className="p-3 bg-blue-50 border-b">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {transp.logo ? (
                              <img src={transp.logo} alt={transp.nome} className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                                <Truck className="w-4 h-4 text-white" />
                              </div>
                            )}
                            <div>
                              <span className="text-xs font-bold text-blue-700">TRANSPORTADORA:</span>
                              <p className="font-semibold text-sm text-gray-900">{transp.nome}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpand(cotacao.id)}
                          >
                            {expandedCards[cotacao.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            Ver Dados
                          </Button>
                        </div>

                        {/* Dados expandidos da transportadora */}
                        {expandedCards[cotacao.id] && transp.perfil && (
                          <div className="mt-4 p-4 bg-white rounded-lg border space-y-3">
                            <h4 className="font-bold text-blue-900 flex items-center gap-2">
                              <Building2 className="w-5 h-5" />
                              DADOS COMPLETOS DA TRANSPORTADORA
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="text-gray-500">Razão Social:</span>
                                <p className="font-semibold">{transp.perfil.razaoSocial || transp.nome}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">CNPJ:</span>
                                <p className="font-semibold font-mono">{transp.perfil.cnpj || "N/I"}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <div>
                                  <span className="text-gray-500">Telefone Comercial:</span>
                                  <p className="font-semibold">{transp.perfil.telefoneComercial || "N/I"}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <div>
                                  <span className="text-gray-500">Telefone Pessoal:</span>
                                  <p className="font-semibold">{transp.perfil.telefonePessoal || "N/I"}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 md:col-span-2">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <div>
                                  <span className="text-gray-500">Email:</span>
                                  <p className="font-semibold">{transp.perfil.emailAcesso || "N/I"}</p>
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-500">Tipo de Transporte:</span>
                                <p className="font-semibold capitalize">{transp.perfil.tipoTransporte || "N/I"}</p>
                              </div>
                            </div>
                            <Button
                              onClick={() => exportarCSVTransportadora(cotacao, transp)}
                              className="w-full bg-green-600 hover:bg-green-700 mt-3"
                              size="sm"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Exportar Dados da Transportadora em CSV
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Destinatário */}
                    <div className="p-3 bg-purple-50 border-b flex items-center gap-2">
                      <User className="w-4 h-4 text-purple-600" />
                      <span className="text-xs font-bold text-purple-700">DESTINATÁRIO:</span>
                      <span className="font-semibold text-sm text-gray-900">
                        {dest?.nomeCompleto || "Carregando..."}
                      </span>
                    </div>

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
                    <div className="grid grid-cols-4 divide-x border-b">
                      <div className="p-3 text-center">
                        <Package className="w-4 h-4 text-blue-600 mx-auto" />
                        <p className="text-xs text-gray-500 mt-1">Produto</p>
                        <p className="font-bold text-xs text-gray-900 truncate">{cotacao.produtoNome}</p>
                      </div>
                      <div className="p-3 text-center">
                        <Weight className="w-4 h-4 text-purple-600 mx-auto" />
                        <p className="text-xs text-gray-500 mt-1">Peso</p>
                        <p className="font-bold text-gray-900">{cotacao.pesoTotal} kg</p>
                      </div>
                      <div className="p-3 text-center">
                        <Box className="w-4 h-4 text-orange-600 mx-auto" />
                        <p className="text-xs text-gray-500 mt-1">Volumes</p>
                        <p className="font-bold text-gray-900">{cotacao.quantidadeVolumes}</p>
                      </div>
                      <div className="p-3 text-center bg-amber-50">
                        <Calendar className="w-4 h-4 text-amber-600 mx-auto" />
                        <p className="text-xs text-gray-500 mt-1">Coleta</p>
                        <p className="font-bold text-amber-700">
                          {new Date(cotacao.dataHoraColeta).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    {/* Valor Detalhado */}
                    <div className="p-4 border-b bg-gradient-to-br from-green-50 to-emerald-50">
                      {(() => {
                        // Buscar resposta selecionada para pegar valor e seguro
                        const respostaId = cotacao.respostaSelecionadaId;
                        let valorTotal = 0;
                        let valorSeguro = 0;
                        
                        // Se temos a transportadora carregada
                        const transp = transportadoras[cotacao.id];
                        if (transp) {
                          // Tentar buscar do resposta ou valores finais
                          valorTotal = cotacao.valorFinalTransportadora || cotacao.valorOriginalCotacao || cotacao.valorNotaFiscal || 0;
                        } else {
                          valorTotal = cotacao.valorNotaFiscal || 0;
                        }

                        const comissao = valorTotal * 0.05;
                        const valorFrete = valorTotal - comissao - valorSeguro;

                        return (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 mb-2">
                              <DollarSign className="w-5 h-5 text-green-600" />
                              <h4 className="font-bold text-green-900">Detalhamento de Valores</h4>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div className="p-2 bg-white rounded border border-green-200">
                                <span className="text-gray-600 text-xs">Valor do Frete</span>
                                <p className="font-bold text-green-700">R$ {valorFrete.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                              </div>
                              <div className="p-2 bg-white rounded border border-purple-200">
                                <span className="text-gray-600 text-xs">Comissão (5%)</span>
                                <p className="font-bold text-purple-700">R$ {comissao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                              </div>
                              {valorSeguro > 0 && (
                                <div className="p-2 bg-white rounded border border-orange-200">
                                  <span className="text-gray-600 text-xs">Seguro de Carga</span>
                                  <p className="font-bold text-orange-700">R$ {valorSeguro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                </div>
                              )}
                              <div className="p-2 bg-white rounded border-2 border-green-500">
                                <span className="text-gray-600 text-xs">Valor Total</span>
                                <p className="font-bold text-green-900 text-lg">R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                              <Clock className="w-3 h-3" />
                              Criada em: {new Date(cotacao.created_date).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Alerta de aprovação CT-e */}
                    {cotacao.status === "aguardando_aprovacao_cte" && (
                      <div className="p-3 bg-orange-50 border-b border-orange-200">
                        <div className="flex items-center gap-2 text-orange-800">
                          <AlertTriangle className="w-5 h-5" />
                          <div className="flex-1">
                            <p className="font-bold text-sm">Aprovação de valor necessária!</p>
                            <p className="text-xs">
                              Novo valor: R$ {cotacao.valorFinalTransportadora?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} 
                              (+ R$ {cotacao.diferencaValor?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                            </p>
                          </div>
                          <Link to={createPageUrl(`NegociacaoCTe?id=${cotacao.id}`)}>
                            <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                              Aprovar/Rejeitar
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )}

                    {/* Botões */}
                    <div className="p-3 flex justify-end gap-3 bg-gray-50">
                      <Link to={createPageUrl(`DetalheCotacao?id=${cotacao.id}`)}>
                        <Button variant="outline">
                          Ver Detalhes
                        </Button>
                      </Link>
                      {cotacao.status === "aguardando_aprovacao_cte" ? (
                        <Link to={createPageUrl(`NegociacaoCTe?id=${cotacao.id}`)}>
                          <Button className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800">
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            Aprovar Valor CT-e
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </Link>
                      ) : (
                        <Link to={createPageUrl("ConfirmarColeta")}>
                          <Button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800">
                            <Truck className="w-4 h-4 mr-2" />
                            Confirmar Coleta
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
