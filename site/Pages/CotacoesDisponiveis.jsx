import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  FileText,
  Package,
  MapPin,
  Calendar,
  Search,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Weight,
  DollarSign,
  Box,
  ArrowRight,
  Filter,
  X
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PageHeader from "../components/common/PageHeader";
import LoadingSpinner from "../components/common/LoadingSpinner";
import CountdownTimer from "../components/common/CountdownTimer";
import EmptyState from "../components/common/EmptyState";

const ESTADOS_BRASIL = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

export default function CotacoesDisponiveis() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOriginStates, setSelectedOriginStates] = useState([]);
  const [selectedDestinationStates, setSelectedDestinationStates] = useState([]);
  const [filterError, setFilterError] = useState("");
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user-cotacoes-disponiveis'],
    queryFn: () => base44.auth.me(),
    staleTime: 60000
  });

  const { data: dadosPerfil } = useQuery({
    queryKey: ['dados-perfil-transportadora', user?.perfilAtivoId],
    queryFn: async () => {
      const [opcoesEnvio, ncmsAtendidos, regioesAtendidas] = await Promise.all([
        base44.entities.OpcaoEnvio.filter({ transportadoraId: user.perfilAtivoId }),
        base44.entities.NCMAtendido.filter({ transportadoraId: user.perfilAtivoId }),
        base44.entities.RegiaoAtendida.filter({ transportadoraId: user.perfilAtivoId })
      ]);
      return { opcoesEnvio, ncmsAtendidos, regioesAtendidas };
    },
    enabled: !!user?.perfilAtivoId,
    staleTime: 60000
  });

  const { data: cotacoes = [], isLoading } = useQuery({
    queryKey: ['cotacoes-disponiveis', user?.perfilAtivoId, selectedOriginStates, selectedDestinationStates],
    queryFn: async () => {
      if (!dadosPerfil) return [];
      
      const { opcoesEnvio, ncmsAtendidos, regioesAtendidas } = dadosPerfil;
      
      const temOpcoes = opcoesEnvio.length > 0;
      const temNCMs = ncmsAtendidos.length > 0;
      const temRegioes = regioesAtendidas.length > 0;
      
      if (!temOpcoes || !temNCMs) return [];

      // Verificar se estados selecionados estão nas regiões atendidas
      const estadosAtendidos = new Set();
      regioesAtendidas.forEach(regiao => {
        if (regiao.estados && regiao.estados.length > 0) {
          regiao.estados.forEach(e => estadosAtendidos.add(e));
        }
      });

      // Validar estados de origem selecionados
      const origensInvalidas = selectedOriginStates.filter(e => !estadosAtendidos.has(e));
      const destinosInvalidos = selectedDestinationStates.filter(e => !estadosAtendidos.has(e));
      
      if (origensInvalidas.length > 0 || destinosInvalidos.length > 0) {
        const mensagemErro = [];
        if (origensInvalidas.length > 0) {
          mensagemErro.push(`Origem: ${origensInvalidas.join(', ')}`);
        }
        if (destinosInvalidos.length > 0) {
          mensagemErro.push(`Destino: ${destinosInvalidos.join(', ')}`);
        }
        setFilterError(`Estados não cadastrados nas suas regiões atendidas: ${mensagemErro.join(' | ')}. Cadastre-os primeiro em "Regiões Atendidas".`);
        return [];
      } else {
        setFilterError("");
      }

      const [todasCotacoes, minhasRespostas] = await Promise.all([
        base44.entities.Cotacao.filter({}),
        base44.entities.RespostaCotacao.filter({ transportadoraId: user.perfilAtivoId })
      ]);

      const cotacoesRespondidas = minhasRespostas.map(r => r.cotacaoId);
      const ncmCodes = ncmsAtendidos.map(n => n.ncmCode);
      const agora = new Date();

      const cotacoesAbertas = todasCotacoes.filter(c => {
        const statusValido = (c.status === "aberta" || c.status === "em_andamento" || c.status === "visualizada") &&
          c.status !== "aguardando_pagamento";
        
        // Verificar expiração: se dataHoraFim não existe, considerar como expirada (não mostrar)
        const dataFim = c.dataHoraFim ? new Date(c.dataHoraFim) : null;
        const naoExpirada = dataFim ? dataFim > agora : false;
        
        return statusValido && naoExpirada;
      });

      return cotacoesAbertas.filter(cotacao => {
        // Cotações podem não ter título (usar "Sem Título" como fallback)
        const titulo = cotacao.titulo || cotacao.descricao || "Cotação sem título";
        
        let regiaoMatch = true;
        if (temRegioes) {
          regiaoMatch = regioesAtendidas.some(regiao => {
            if (regiao.estados && regiao.estados.length > 0) {
              return regiao.estados.includes(cotacao.destinatarioEstado);
            }
            if (regiao.cepInicio && regiao.cepFim) {
              const cep = cotacao.destinatarioCep?.replace(/\D/g, '') || '';
              return cep >= regiao.cepInicio && cep <= regiao.cepFim;
            }
            return true;
          });
        }

        // Filtro de origem (se estados foram selecionados)
        let origemMatch = true;
        if (selectedOriginStates.length > 0) {
          origemMatch = selectedOriginStates.includes(cotacao.enderecoColetaEstado);
        }

        // Filtro de destino (se estados foram selecionados)
        let destinoMatch = true;
        if (selectedDestinationStates.length > 0) {
          destinoMatch = selectedDestinationStates.includes(cotacao.destinatarioEstado);
        }

        const jaRespondida = cotacoesRespondidas.includes(cotacao.id);
        return ncmMatch && regiaoMatch && origemMatch && destinoMatch && temOpcoes && !jaRespondida;
      });
    },
    enabled: !!user?.perfilAtivoId && !!dadosPerfil,
    staleTime: 30000,
    refetchInterval: 60000
  });

  const perfilCompleto = dadosPerfil?.opcoesEnvio?.length > 0 && 
                         dadosPerfil?.ncmsAtendidos?.length > 0 && 
                         dadosPerfil?.regioesAtendidas?.length > 0;

  const filteredCotacoes = cotacoes.filter(c =>
    c.produtoNome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.destinatarioCidade?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleOriginState = (estado) => {
    setSelectedOriginStates(prev => 
      prev.includes(estado) ? prev.filter(e => e !== estado) : [...prev, estado]
    );
  };

  const toggleDestinationState = (estado) => {
    setSelectedDestinationStates(prev => 
      prev.includes(estado) ? prev.filter(e => e !== estado) : [...prev, estado]
    );
  };

  const limparFiltrosOrigem = () => setSelectedOriginStates([]);
  const limparFiltrosDestino = () => setSelectedDestinationStates([]);

  const getTempoRestante = (dataHoraFim) => {
    const diff = new Date(dataHoraFim) - new Date();
    if (diff <= 0) return null;
    const minutos = Math.floor(diff / (1000 * 60));
    if (minutos < 60) return `${minutos} min`;
    const horas = Math.floor(minutos / 60);
    return `${horas}h ${minutos % 60}m`;
  };

  const extractProdutos = (observacoes) => {
    if (!observacoes) return [];
    const produtosStr = observacoes.split('|').filter(s => s.includes('NCM:') || s.includes('QTD:'));
    return produtosStr.map(str => {
      const match = str.match(/([^(]+)\s*\(NCM:\s*(\d+)\)\s*-\s*QTD:\s*(\d+)/i);
      if (match) {
        return { nome: match[1].replace('PRODUTOS:', '').trim(), ncm: match[2], qtd: parseInt(match[3]) };
      }
      return null;
    }).filter(Boolean);
  };

  if (!user || isLoading) {
    return <LoadingSpinner message="Carregando cotações..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <PageHeader
        title="Cotações Disponíveis"
        description="Responda cotações compatíveis com seu perfil"
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {!perfilCompleto && (
          <Alert className="bg-orange-50 border-orange-300">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <AlertDescription className="text-orange-900">
              <strong>Complete seu perfil!</strong> Configure suas opções de envio, NCMs e regiões atendidas.
              <div className="flex gap-2 mt-2">
                <Link to={createPageUrl("OpcoesEnvio")}>
                  <Button size="sm" variant="outline">Opções de Envio</Button>
                </Link>
                <Link to={createPageUrl("NCMsAtendidos")}>
                  <Button size="sm" variant="outline">NCMs</Button>
                </Link>
                <Link to={createPageUrl("RegioesAtendidas")}>
                  <Button size="sm" variant="outline">Regiões</Button>
                </Link>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {perfilCompleto && (
          <>
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Cotações Compatíveis</h3>
                    <p className="text-sm text-gray-500">
                      {filteredCotacoes.length} cotação(ões) aguardando resposta
                    </p>
                  </div>
                  <div className="w-80">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        placeholder="Buscar por produto, cidade ou número..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                {/* Filtros de Origem e Destino */}
                <div className="space-y-3 pt-3 border-t">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 leading-relaxed">
                        Transforme cada viagem em oportunidade. Escolha sua rota ideal e maximize seus ganhos aproveitando o caminho de volta — ou qualquer trajeto que faça sentido para você.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-semibold text-gray-800">Personalize sua Rota:</span>
                    </div>

                    {/* Filtro Origem */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="default" className="h-10 px-6 border-green-300 hover:bg-green-50 hover:border-green-400 transition-colors">
                          <MapPin className="w-4 h-4 mr-2 text-green-600" />
                          <span className="font-medium">Origem {selectedOriginStates.length > 0 && `(${selectedOriginStates.length})`}</span>
                        </Button>
                      </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-sm">Estados de Origem</h4>
                          {selectedOriginStates.length > 0 && (
                            <Button variant="ghost" size="sm" onClick={limparFiltrosOrigem} className="h-6 text-xs">
                              Limpar
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                          {ESTADOS_BRASIL.map(estado => (
                            <div key={estado} className="flex items-center space-x-2">
                              <Checkbox
                                id={`origem-${estado}`}
                                checked={selectedOriginStates.includes(estado)}
                                onCheckedChange={() => toggleOriginState(estado)}
                              />
                              <Label htmlFor={`origem-${estado}`} className="text-sm cursor-pointer">
                                {estado}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>

                    {/* Filtro Destino */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="default" className="h-10 px-6 border-red-300 hover:bg-red-50 hover:border-red-400 transition-colors">
                          <MapPin className="w-4 h-4 mr-2 text-red-600" />
                          <span className="font-medium">Destino {selectedDestinationStates.length > 0 && `(${selectedDestinationStates.length})`}</span>
                        </Button>
                      </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-sm">Estados de Destino</h4>
                          {selectedDestinationStates.length > 0 && (
                            <Button variant="ghost" size="sm" onClick={limparFiltrosDestino} className="h-6 text-xs">
                              Limpar
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                          {ESTADOS_BRASIL.map(estado => (
                            <div key={estado} className="flex items-center space-x-2">
                              <Checkbox
                                id={`destino-${estado}`}
                                checked={selectedDestinationStates.includes(estado)}
                                onCheckedChange={() => toggleDestinationState(estado)}
                              />
                              <Label htmlFor={`destino-${estado}`} className="text-sm cursor-pointer">
                                {estado}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>

                    {/* Badges dos filtros ativos */}
                    {selectedOriginStates.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="bg-green-50 text-green-800 border-green-300 px-3 py-1 text-sm font-medium">
                          Origem: {selectedOriginStates.join(', ')}
                          <X 
                            className="w-3.5 h-3.5 ml-2 cursor-pointer hover:text-green-900" 
                            onClick={limparFiltrosOrigem}
                          />
                        </Badge>
                      </div>
                    )}
                    {selectedDestinationStates.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="bg-red-50 text-red-800 border-red-300 px-3 py-1 text-sm font-medium">
                          Destino: {selectedDestinationStates.join(', ')}
                          <X 
                            className="w-3.5 h-3.5 ml-2 cursor-pointer hover:text-red-900" 
                            onClick={limparFiltrosDestino}
                          />
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Alerta de erro de filtro */}
            {filterError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{filterError}</AlertDescription>
              </Alert>
            )}

            {filteredCotacoes.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="Nenhuma cotação disponível"
                description="Não há cotações compatíveis com seu perfil no momento"
              />
            ) : (
              <div className="space-y-4">
                {filteredCotacoes.map((cotacao) => {
                  const produtos = extractProdutos(cotacao.observacoes);

                  return (
                    <Card key={cotacao.id} className="overflow-hidden hover:shadow-lg transition-shadow">
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
                            <CountdownTimer 
                              dataHoraFim={cotacao.dataHoraFim}
                              onExpire={() => {
                                // Revalidar a query para remover cotação expirada
                                queryClient.invalidateQueries(['cotacoes-disponiveis']);
                              }}
                            />
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="p-0">
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
                              CEP: {cotacao.enderecoColetaCep || "Não informado"}
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

                        <div className="grid grid-cols-4 divide-x border-b">
                          <div className="p-3 text-center">
                            <Box className="w-4 h-4 text-blue-600 mx-auto" />
                            <p className="text-xs text-gray-500 mt-1">Volumes</p>
                            <p className="font-bold text-gray-900">{cotacao.quantidadeVolumes}</p>
                          </div>
                          <div className="p-3 text-center">
                            <Weight className="w-4 h-4 text-purple-600 mx-auto" />
                            <p className="text-xs text-gray-500 mt-1">Peso</p>
                            <p className="font-bold text-gray-900">{cotacao.pesoTotal} kg</p>
                          </div>
                          <div className="p-3 text-center">
                            <DollarSign className="w-4 h-4 text-green-600 mx-auto" />
                            <p className="text-xs text-gray-500 mt-1">Valor NF</p>
                            <p className="font-bold text-gray-900">
                              R$ {(cotacao.valorNotaFiscal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                            </p>
                          </div>
                          <div className="p-3 text-center bg-amber-50">
                            <Calendar className="w-4 h-4 text-amber-600 mx-auto" />
                            <p className="text-xs text-gray-500 mt-1">Coleta</p>
                            <p className="font-bold text-gray-900">
                              {new Date(cotacao.dataHoraColeta).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                              {' '}
                              <span className="text-amber-700">
                                {new Date(cotacao.dataHoraColeta).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="p-3 border-b bg-gray-50">
                          <div className="flex items-center gap-2 mb-2">
                            <Package className="w-4 h-4 text-blue-600" />
                            <span className="text-xs font-bold text-gray-700">
                              {produtos.length > 0 ? `PRODUTOS (${produtos.length})` : 'PRODUTO'}
                            </span>
                            <span className="text-xs text-gray-500">NCM: {cotacao.produtoNCM}</span>
                          </div>
                          
                          {produtos.length > 0 ? (
                            <div className="space-y-1">
                              {produtos.slice(0, 3).map((p, i) => (
                                <div key={i} className="flex justify-between text-sm bg-white p-2 rounded">
                                  <span className="font-medium text-gray-900">{p.nome}</span>
                                  <span className="text-gray-600">Qtd: {p.qtd}</span>
                                </div>
                              ))}
                              {produtos.length > 3 && (
                                <p className="text-xs text-gray-500 text-center">
                                  + {produtos.length - 3} produto(s)
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm font-medium text-gray-900">{cotacao.produtoNome}</p>
                          )}
                        </div>

                        {(cotacao.servicosAdicionais?.precisaPalete || 
                          cotacao.servicosAdicionais?.ehUrgente || 
                          cotacao.servicosAdicionais?.ehFragil || 
                          cotacao.servicosAdicionais?.precisaCargaDedicada) && (
                          <div className="p-3 border-b flex items-center gap-2">
                            <span className="text-xs text-gray-500">Serviços:</span>
                            {cotacao.servicosAdicionais?.precisaPalete && (
                              <Badge className="bg-blue-100 text-blue-700 text-xs">Palete</Badge>
                            )}
                            {cotacao.servicosAdicionais?.ehUrgente && (
                              <Badge className="bg-orange-100 text-orange-700 text-xs">Urgente</Badge>
                            )}
                            {cotacao.servicosAdicionais?.ehFragil && (
                              <Badge className="bg-yellow-100 text-yellow-700 text-xs">Frágil</Badge>
                            )}
                            {cotacao.servicosAdicionais?.precisaCargaDedicada && (
                              <Badge className="bg-purple-100 text-purple-700 text-xs">Dedicada</Badge>
                            )}
                          </div>
                        )}

                        <div className="p-3 flex justify-end bg-gray-50">
                          <Link to={createPageUrl(`ResponderCotacao?id=${cotacao.id}`)}>
                            <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Enviar Proposta
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
