import React, { useState, useEffect } from "react";
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
  Clock,
  CheckCircle2,
  Weight,
  DollarSign,
  Box,
  Truck,
  User,
  ExternalLink,
  Copy,
  Download,
  FileCheck,
  AlertTriangle
} from "lucide-react";
import { calcularDiasRestantes, formatarDiasRestantes, getClasseDiasRestantes } from "../components/atraso/CalculadoraDiasEntrega";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PageHeader from "../components/common/PageHeader";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";
import StatusBadge from "../components/common/StatusBadge";

export default function CotacoesColetadas() {
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userData = await base44.auth.me();
    setUser(userData);
  };

  const { data: cotacoes = [], isLoading } = useQuery({
    queryKey: ['cotacoes-coletadas', user?.perfilAtivoId],
    queryFn: async () => {
      if (!user) return [];
      const todasCotacoes = await base44.entities.Cotacao.filter(
        { clienteId: user.perfilAtivoId },
        "-dataHoraColetaConfirmada"
      );
      // Filtrar apenas cotações que foram coletadas mas NÃO finalizadas (em_transito, aguardando_confirmacao)
      // Finalizadas vão para a página Cotações Finalizadas
      return todasCotacoes.filter(c => 
        (c.coletaConfirmada === true || 
        c.status === "em_transito" || 
        c.status === "aguardando_confirmacao") &&
        c.status !== "finalizada"
      );
    },
    enabled: !!user
  });

  // Buscar destinatários
  const { data: destinatarios = {} } = useQuery({
    queryKey: ['destinatarios-coletadas', cotacoes.map(c => c.destinatarioId).join(',')],
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

  // Buscar transportadoras das respostas aceitas
  const { data: transportadoras = {} } = useQuery({
    queryKey: ['transportadoras-coletadas', cotacoes.map(c => c.respostaSelecionadaId).join(',')],
    queryFn: async () => {
      const transpMap = {};
      await Promise.all(
        cotacoes.filter(c => c.respostaSelecionadaId).map(async (cotacao) => {
          const respostas = await base44.entities.RespostaCotacao.filter({ id: cotacao.respostaSelecionadaId });
          if (respostas.length > 0) {
            transpMap[cotacao.id] = {
              nome: respostas[0].transportadoraNome,
              logo: respostas[0].transportadoraLogo
            };
          }
        })
      );
      return transpMap;
    },
    enabled: cotacoes.length > 0
  });

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
    return <LoadingSpinner message="Carregando cotações coletadas..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <PageHeader
        title="Cotações Coletadas"
        description="Acompanhe as cotações que já foram coletadas"
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
              <Badge className="bg-green-100 text-green-800">
                {filteredCotacoes.length} coletada(s)
              </Badge>
            </div>
          </CardContent>
        </Card>

        {filteredCotacoes.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="Nenhuma cotação coletada"
            description="Quando suas cotações forem coletadas, elas aparecerão aqui"
          />
        ) : (
          <div className="space-y-4">
            {filteredCotacoes.map((cotacao) => {
              const dest = destinatarios[cotacao.destinatarioId];
              const transp = transportadoras[cotacao.id];
              
              // Calcular dias restantes para entrega
              const dataParaCalculo = cotacao.dataNovaPrevisaoEntrega || cotacao.dataPrevistaEntrega;
              const diasRestantes = calcularDiasRestantes(dataParaCalculo);
              const textoRestantes = formatarDiasRestantes(diasRestantes);
              const classeRestantes = getClasseDiasRestantes(diasRestantes);
              const atrasado = diasRestantes !== null && diasRestantes < 0;

              return (
                <Card key={cotacao.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  {/* Header Compacto */}
                  <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white py-2 px-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        #{cotacao.id.slice(0, 8)}
                      </CardTitle>
                      <div className="flex items-center gap-1">
                        <Badge className="bg-white/20 text-white border-0 text-xs px-1.5 py-0">
                          {cotacao.tipoFrete}
                        </Badge>
                        <StatusBadge status={cotacao.status} />
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-0">
                    {/* Transportadora + Destinatário em linha */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-2 py-1.5 bg-gray-50 border-b text-xs">
                      {transp && (
                        <div className="flex items-center gap-1">
                          {transp.logo ? (
                            <img src={transp.logo} alt={transp.nome} className="w-5 h-5 rounded-full object-cover" />
                          ) : (
                            <Truck className="w-4 h-4 text-blue-600" />
                          )}
                          <span className="text-gray-500">Transp:</span>
                          <span className="font-semibold text-gray-800 truncate max-w-[150px]">{transp.nome}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3 text-purple-600" />
                        <span className="text-gray-500">Dest:</span>
                        <span className="font-semibold text-gray-800 truncate max-w-[120px]">
                          {dest?.nomeCompleto || "..."}
                        </span>
                      </div>
                    </div>

                    {/* Rotas Compactas */}
                    <div className="grid grid-cols-2 divide-x border-b text-xs">
                      <div className="px-2 py-1.5 bg-green-50 flex items-center gap-2">
                        <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-2.5 h-2.5 text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">
                            {cotacao.enderecoColetaCidade || "N/I"} - {cotacao.enderecoColetaEstado || ""}
                          </p>
                          <p className="text-green-700 font-mono text-[10px]">{cotacao.enderecoColetaCep || "N/I"}</p>
                        </div>
                      </div>
                      <div className="px-2 py-1.5 bg-red-50 flex items-center gap-2">
                        <div className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-2.5 h-2.5 text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">
                            {cotacao.destinatarioCidade} - {cotacao.destinatarioEstado}
                          </p>
                          <p className="text-red-700 font-mono text-[10px]">{cotacao.destinatarioCep}</p>
                        </div>
                      </div>
                    </div>

                    {/* Info Grid Compacto */}
                    <div className="grid grid-cols-5 divide-x border-b text-xs">
                      <div className="px-1.5 py-1.5 text-center">
                        <Package className="w-3 h-3 text-blue-600 mx-auto" />
                        <p className="font-semibold text-gray-900 truncate text-[10px]" title={cotacao.produtoNome}>{cotacao.produtoNome?.slice(0, 12)}</p>
                      </div>
                      <div className="px-1.5 py-1.5 text-center">
                        <Weight className="w-3 h-3 text-purple-600 mx-auto" />
                        <p className="font-semibold text-gray-900">{cotacao.pesoTotal}kg</p>
                      </div>
                      <div className="px-1.5 py-1.5 text-center">
                        <DollarSign className="w-3 h-3 text-green-600 mx-auto" />
                        <p className="font-semibold text-gray-900">
                          R${(cotacao.valorNotaFiscal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                        </p>
                      </div>
                      {/* Valor aprovado se diferente */}
                      <div className="px-1.5 py-1.5 text-center bg-amber-50">
                        <DollarSign className="w-3 h-3 text-amber-600 mx-auto" />
                        <p className="font-semibold text-amber-700">
                          R${(cotacao.valorFinalTransportadora || cotacao.valorOriginalCotacao || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                        </p>
                        <p className="text-[9px] text-gray-500">Frete</p>
                      </div>
                      <div className="px-1.5 py-1.5 text-center bg-green-50">
                        <CheckCircle2 className="w-3 h-3 text-green-600 mx-auto" />
                        <p className="font-semibold text-green-700 text-[10px]">
                          {cotacao.dataHoraColetaConfirmada 
                            ? new Date(cotacao.dataHoraColetaConfirmada).toLocaleDateString('pt-BR')
                            : "Sim"}
                        </p>
                      </div>
                    </div>

                    {/* CT-e / Documentos de Transporte */}
                    {cotacao.cteRegistrado && (
                      <div className="p-2 border-b bg-amber-50">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <FileCheck className="w-4 h-4 text-amber-600" />
                              <span className="text-gray-600">CT-e:</span>
                              <span className="font-mono font-bold text-amber-800">{cotacao.codigoCTe}</span>
                              <button 
                                onClick={() => navigator.clipboard.writeText(cotacao.codigoCTe)}
                                className="p-1 hover:bg-amber-200 rounded"
                                title="Copiar código"
                              >
                                <Copy className="w-3 h-3 text-amber-600" />
                              </button>
                            </div>
                            {/* Valor aprovado vs valor original */}
                            {cotacao.valorFinalTransportadora && cotacao.valorOriginalCotacao && cotacao.valorFinalTransportadora !== cotacao.valorOriginalCotacao && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500">Valor Aprovado:</span>
                                <span className="font-bold text-green-700">
                                  R$ {cotacao.valorFinalTransportadora.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                                <span className="text-gray-400 line-through text-xs">
                                  R$ {cotacao.valorOriginalCotacao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            )}
                          </div>
                          {/* Documentos para download */}
                          {(cotacao.documentosEntrega?.length > 0 || cotacao.documentoCte) && (
                            <div className="flex items-center gap-1">
                              {cotacao.documentoCte && (
                                <a href={cotacao.documentoCte} target="_blank" rel="noopener noreferrer">
                                  <Button size="sm" variant="outline" className="h-6 text-xs px-2">
                                    <Download className="w-3 h-3 mr-1" />
                                    XML/PDF
                                  </Button>
                                </a>
                              )}
                              {cotacao.documentosEntrega?.slice(0, 2).map((doc, idx) => (
                                <a key={idx} href={doc} target="_blank" rel="noopener noreferrer">
                                  <Button size="sm" variant="outline" className="h-6 text-xs px-2">
                                    <Download className="w-3 h-3 mr-1" />
                                    Doc {idx + 1}
                                  </Button>
                                </a>
                              ))}
                              {cotacao.documentosEntrega?.length > 2 && (
                                <span className="text-xs text-gray-500">+{cotacao.documentosEntrega.length - 2}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Prazo de Entrega - DESTAQUE EM AMARELO */}
                    {dataParaCalculo && (
                      <div className={`px-3 py-2 border-l-4 ${atrasado ? 'bg-red-50 border-red-500' : 'bg-yellow-50 border-yellow-500'}`}>
                        <div className="flex items-center gap-3">
                          <Clock className={`w-4 h-4 ${atrasado ? 'text-red-600' : 'text-yellow-600'}`} />
                          <div>
                            <p className="text-xs text-gray-600">Prazo de Entrega:</p>
                            <p className={`font-bold text-sm ${classeRestantes}`}>
                              {textoRestantes}
                            </p>
                            {cotacao.dataNovaPrevisaoEntrega && (
                              <p className="text-xs text-gray-500 mt-1">
                                Nova data: {new Date(cotacao.dataNovaPrevisaoEntrega).toLocaleDateString('pt-BR')}
                                {cotacao.dataPrevistaEntrega && (
                                  <span className="line-through ml-1">
                                    {new Date(cotacao.dataPrevistaEntrega).toLocaleDateString('pt-BR')}
                                  </span>
                                )}
                              </p>
                            )}
                          </div>
                          {atrasado && (
                            <AlertTriangle className="w-5 h-5 text-red-600 ml-auto animate-pulse" />
                          )}
                        </div>
                        {cotacao.motivoAtraso && (
                          <p className="text-xs text-gray-600 mt-2 italic">
                            Motivo: {cotacao.motivoAtraso}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Rastreio + Botão */}
                    <div className="px-2 py-1.5 flex flex-wrap items-center justify-between gap-2 bg-gray-50">
                      {/* Rastreio ao lado esquerdo */}
                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        {cotacao.urlRastreamento && (
                          <div className="flex items-center gap-1">
                            <ExternalLink className="w-3 h-3 text-blue-500" />
                            <a 
                              href={cotacao.urlRastreamento} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline font-medium truncate max-w-[150px]"
                              title={cotacao.urlRastreamento}
                            >
                              Link de Rastreio
                            </a>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(cotacao.urlRastreamento);
                              }}
                              className="p-1 hover:bg-blue-100 rounded"
                              title="Copiar link"
                            >
                              <Copy className="w-3 h-3 text-blue-600" />
                            </button>
                          </div>
                        )}
                        {cotacao.codigoRastreio && (
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500">Código:</span>
                            <span className="font-mono font-bold text-blue-700">{cotacao.codigoRastreio}</span>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(cotacao.codigoRastreio);
                              }}
                              className="p-1 hover:bg-blue-100 rounded"
                              title="Copiar código"
                            >
                              <Copy className="w-3 h-3 text-blue-600" />
                            </button>
                          </div>
                        )}
                      </div>
                      {/* Botão à direita */}
                      <Link to={createPageUrl(`DetalheEntregaCliente?id=${cotacao.id}`)}>
                        <Button size="sm" className="h-7 text-xs bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Ver Detalhes
                        </Button>
                      </Link>
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
