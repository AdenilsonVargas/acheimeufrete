import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Package,
  MapPin,
  Calendar,
  DollarSign,
  Truck,
  CheckCircle2,
  AlertCircle,
  Download,
  FileText,
  Star,
  MessageSquare,
  Search,
  Clock,
  ExternalLink,
  Eye,
  Copy,
  FileCheck
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PageHeader from "../components/common/PageHeader";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";

export default function CotacoesFinalizadasCliente() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Estados para avaliação
  const [modalAvaliacaoAberto, setModalAvaliacaoAberto] = useState(false);
  const [cotacaoAvaliar, setCotacaoAvaliar] = useState(null);
  const [transportadoraAvaliar, setTransportadoraAvaliar] = useState(null);
  const [nota, setNota] = useState(0);
  const [notaHover, setNotaHover] = useState(0);
  const [comentario, setComentario] = useState("");
  const [submittingAvaliacao, setSubmittingAvaliacao] = useState(false);
  const [errorAvaliacao, setErrorAvaliacao] = useState("");
  
  // Estado para rastrear downloads
  const [documentosBaixados, setDocumentosBaixados] = useState({});

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userData = await base44.auth.me();
    setUser(userData);
  };

  // Buscar cotações finalizadas do cliente
  const { data: cotacoesFinalizadas = [], isLoading } = useQuery({
    queryKey: ['cotacoes-finalizadas-cliente', user?.perfilAtivoId],
    queryFn: async () => {
      if (!user) return [];
      
      const cotacoes = await base44.entities.Cotacao.filter({
        clienteId: user.perfilAtivoId,
        status: "finalizada"
      });
      
      return cotacoes;
    },
    enabled: !!user
  });

  // Buscar respostas selecionadas (transportadoras)
  const { data: transportadorasMap = {} } = useQuery({
    queryKey: ['transportadoras-finalizadas', cotacoesFinalizadas.map(c => c.respostaSelecionadaId).join(',')],
    queryFn: async () => {
      const respostaIds = cotacoesFinalizadas
        .filter(c => c.respostaSelecionadaId)
        .map(c => c.respostaSelecionadaId);
      
      if (respostaIds.length === 0) return {};
      
      const map = {};
      await Promise.all(
        respostaIds.map(async (id) => {
          const respostas = await base44.entities.RespostaCotacao.filter({ id });
          if (respostas.length > 0) {
            map[id] = respostas[0];
          }
        })
      );
      
      return map;
    },
    enabled: cotacoesFinalizadas.length > 0
  });

  // Contar cotações pendentes de avaliação
  const cotacoesPendentes = cotacoesFinalizadas.filter(c => !c.avaliada);
  
  // Verificar se alguma cotação passou de 24h sem avaliação
  const cotacoesVencidas = cotacoesPendentes.filter(c => {
    if (!c.dataHoraFinalizacao) return false;
    const finalizacao = new Date(c.dataHoraFinalizacao);
    const agora = new Date();
    const horasPassadas = (agora - finalizacao) / (1000 * 60 * 60);
    return horasPassadas > 24;
  });

  // Filtrar cotações pela busca
  const cotacoesFiltradas = cotacoesFinalizadas.filter(c => {
    const searchLower = searchTerm.toLowerCase();
    return c.produtoNome?.toLowerCase().includes(searchLower) ||
           c.destinatarioCidade?.toLowerCase().includes(searchLower) ||
           c.id.toLowerCase().includes(searchLower);
  });

  // Função para download de documento
  const handleDownload = (cotacaoId, url, index) => {
    // Abrir documento em nova aba
    window.open(url, '_blank');
    
    // Marcar como baixado
    setDocumentosBaixados(prev => ({
      ...prev,
      [cotacaoId]: {
        ...(prev[cotacaoId] || {}),
        [index]: true
      }
    }));
  };

  // Verificar se todos os documentos foram baixados
  const todosDocumentosBaixados = (cotacao) => {
    const docs = cotacao.documentosEntrega || [];
    const temCte = cotacao.documentoCte;
    
    // Contar total de documentos que precisam ser baixados
    let totalDocs = docs.length;
    if (temCte) totalDocs += 1;
    
    if (totalDocs === 0) return true; // Se não tem documentos, libera
    
    const baixados = documentosBaixados[cotacao.id] || {};
    
    // Verificar se todos foram baixados (incluindo CT-e como 'cte')
    let todosBaixados = true;
    if (temCte && !baixados['cte']) todosBaixados = false;
    docs.forEach((_, index) => {
      if (!baixados[index]) todosBaixados = false;
    });
    
    return todosBaixados;
  };

  // Abrir modal de avaliação
  const handleAbrirAvaliacao = (cotacao) => {
    const resposta = transportadorasMap[cotacao.respostaSelecionadaId];
    if (!resposta) return;
    
    setCotacaoAvaliar(cotacao);
    setTransportadoraAvaliar({
      id: resposta.transportadoraId,
      nome: resposta.transportadoraNome
    });
    setNota(0);
    setComentario("");
    setErrorAvaliacao("");
    setModalAvaliacaoAberto(true);
  };

  // Enviar avaliação
  const handleEnviarAvaliacao = async () => {
    if (nota === 0) {
      setErrorAvaliacao("Por favor, selecione uma nota de 1 a 5 estrelas");
      return;
    }

    setSubmittingAvaliacao(true);
    setErrorAvaliacao("");

    try {
      // Criar avaliação
      await base44.entities.Avaliacao.create({
        cotacaoId: cotacaoAvaliar.id,
        clienteId: user.perfilAtivoId,
        transportadoraId: transportadoraAvaliar.id,
        nota: nota,
        comentario: comentario.trim() || "",
        dataAvaliacao: new Date().toISOString()
      });

      // Buscar perfil da transportadora (pode ser por id ou userIdGoogle)
      let perfisTransp = await base44.entities.PerfilTransportadora.filter({
        id: transportadoraAvaliar.id
      });
      
      if (perfisTransp.length === 0) {
        perfisTransp = await base44.entities.PerfilTransportadora.filter({
          userIdGoogle: transportadoraAvaliar.id
        });
      }

      if (perfisTransp.length > 0) {
        const perfilTransp = perfisTransp[0];
        
        // Calcular nova média
        const totalAtual = perfilTransp.totalAvaliacoes || 0;
        const mediaAtual = perfilTransp.avaliacaoMedia || 0;
        const novoTotal = totalAtual + 1;
        const novaMedia = ((mediaAtual * totalAtual) + nota) / novoTotal;

        // Atualizar perfil da transportadora
        await base44.entities.PerfilTransportadora.update(perfilTransp.id, {
          avaliacaoMedia: parseFloat(novaMedia.toFixed(2)),
          totalAvaliacoes: novoTotal,
          totalEntregas: (perfilTransp.totalEntregas || 0) + 1
        });
      }

      // Marcar cotação como avaliada
      await base44.entities.Cotacao.update(cotacaoAvaliar.id, {
        avaliada: true
      });

      queryClient.invalidateQueries(['cotacoes-finalizadas-cliente']);
      setModalAvaliacaoAberto(false);
      setCotacaoAvaliar(null);
      setTransportadoraAvaliar(null);
    } catch (error) {
      console.error("Erro ao enviar avaliação:", error);
      setErrorAvaliacao("Erro ao enviar avaliação. Tente novamente.");
    }
    setSubmittingAvaliacao(false);
  };

  // Calcular tempo restante para avaliar
  const getTempoRestante = (cotacao) => {
    if (!cotacao.dataHoraFinalizacao) return null;
    const finalizacao = new Date(cotacao.dataHoraFinalizacao);
    const prazo = new Date(finalizacao.getTime() + 24 * 60 * 60 * 1000);
    const agora = new Date();
    const diff = prazo - agora;
    
    if (diff <= 0) return "Vencido";
    
    const horas = Math.floor(diff / (1000 * 60 * 60));
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${horas}h ${minutos}m`;
  };

  if (!user || isLoading) {
    return <LoadingSpinner message="Carregando cotações finalizadas..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <PageHeader
        title="Cotações Finalizadas"
        description="Avalie suas entregas e finalize o processo"
      />

      <div className="p-6 max-w-7xl mx-auto">
        {/* Alerta de cotações pendentes */}
        {cotacoesPendentes.length > 0 && (
          <Alert className={`mb-6 ${cotacoesVencidas.length > 0 ? 'bg-red-50 border-red-300' : 'bg-yellow-50 border-yellow-300'}`}>
            <AlertCircle className={`h-4 w-4 ${cotacoesVencidas.length > 0 ? 'text-red-600' : 'text-yellow-600'}`} />
            <AlertDescription className={cotacoesVencidas.length > 0 ? 'text-red-800' : 'text-yellow-800'}>
              <strong>Atenção!</strong> Você tem {cotacoesPendentes.length} cotação(ões) aguardando avaliação.
              {cotacoesVencidas.length > 0 && (
                <span className="block mt-1 font-bold">
                  ⚠️ {cotacoesVencidas.length} cotação(ões) passaram do prazo de 24 horas. 
                  A criação de novas cotações está bloqueada até que você avalie.
                </span>
              )}
              <span className="block mt-1">
                Avalie as entregas para liberar a criação de novas cotações.
              </span>
            </AlertDescription>
          </Alert>
        )}

        {/* Busca */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Buscar por produto, cidade ou número..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {cotacoesFiltradas.length} cotação(ões) encontrada(s)
          </p>
        </div>

        {cotacoesFiltradas.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="Nenhuma cotação finalizada"
            description="Suas cotações finalizadas aparecerão aqui"
          />
        ) : (
          <div className="space-y-4">
            {cotacoesFiltradas.map((cotacao) => {
              const resposta = transportadorasMap[cotacao.respostaSelecionadaId];
              const precisaAvaliar = !cotacao.avaliada;
              const tempoRestante = getTempoRestante(cotacao);
              const documentos = cotacao.documentosEntrega || [];
              const podeAvaliar = todosDocumentosBaixados(cotacao);
              
              return (
                <Card 
                  key={cotacao.id} 
                  className={`overflow-hidden hover:shadow-lg transition-shadow ${
                    precisaAvaliar ? 'border-2 border-yellow-400' : 'border-green-200'
                  }`}
                >
                  <CardHeader className={`py-3 ${precisaAvaliar ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 'bg-gradient-to-r from-green-500 to-green-600'} text-white`}>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Cotação #{cotacao.id.slice(0, 8)}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {precisaAvaliar ? (
                          <>
                            <Badge className="bg-white/20 text-white border-0">
                              <Clock className="w-3 h-3 mr-1" />
                              {tempoRestante}
                            </Badge>
                            <Badge className="bg-yellow-300 text-yellow-900">
                              Pendente Avaliação
                            </Badge>
                          </>
                        ) : (
                          <Badge className="bg-white/20 text-white border-0">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Avaliada
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 space-y-4">
                    {/* Transportadora */}
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <Truck className="w-6 h-6 text-blue-600" />
                      <div>
                        <p className="text-xs text-gray-500">Transportadora</p>
                        <p className="font-semibold text-gray-900">
                          {resposta?.transportadoraNome || "Carregando..."}
                        </p>
                      </div>
                      <div className="ml-auto text-right">
                        <p className="text-xs text-gray-500">Valor Total</p>
                        <p className="font-bold text-green-600">
                          R$ {resposta?.valorTotal?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>

                    {/* Info básica */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <Package className="w-4 h-4 text-blue-600 mx-auto" />
                        <p className="text-xs text-gray-500">Produto</p>
                        <p className="font-semibold text-sm truncate">{cotacao.produtoNome}</p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <MapPin className="w-4 h-4 text-red-600 mx-auto" />
                        <p className="text-xs text-gray-500">Destino</p>
                        <p className="font-semibold text-sm">{cotacao.destinatarioCidade}-{cotacao.destinatarioEstado}</p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <Calendar className="w-4 h-4 text-orange-600 mx-auto" />
                        <p className="text-xs text-gray-500">Finalizada em</p>
                        <p className="font-semibold text-sm">
                          {cotacao.dataHoraFinalizacao 
                            ? new Date(cotacao.dataHoraFinalizacao).toLocaleDateString('pt-BR')
                            : "N/I"}
                        </p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <DollarSign className="w-4 h-4 text-green-600 mx-auto" />
                        <p className="text-xs text-gray-500">Valor NF</p>
                        <p className="font-semibold text-sm">
                          R$ {cotacao.valorNotaFiscal?.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                        </p>
                      </div>
                    </div>

                    {/* CT-e / Documento de Transporte */}
                    {cotacao.cteRegistrado && cotacao.codigoCTe && (
                      <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <FileCheck className="w-5 h-5 text-amber-600" />
                            <span className="text-gray-600 text-sm">CT-e:</span>
                            <span className="font-mono font-bold text-amber-800">{cotacao.codigoCTe}</span>
                            <button 
                              onClick={() => navigator.clipboard.writeText(cotacao.codigoCTe)}
                              className="p-1 hover:bg-amber-200 rounded"
                              title="Copiar código"
                            >
                              <Copy className="w-3 h-3 text-amber-600" />
                            </button>
                          </div>
                          {/* Valor aprovado vs original */}
                          {cotacao.valorFinalTransportadora && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-gray-500">Valor:</span>
                              <span className="font-bold text-green-700">
                                R$ {cotacao.valorFinalTransportadora.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                              {cotacao.valorOriginalCotacao && cotacao.valorFinalTransportadora > cotacao.valorOriginalCotacao && (
                                <span className="text-gray-400 line-through text-xs">
                                  R$ {cotacao.valorOriginalCotacao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Documentos para download - sempre visível */}
                    {(documentos.length > 0 || cotacao.documentoCte) && (
                      <div className={`p-3 rounded-lg border ${precisaAvaliar ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
                        <p className={`font-semibold mb-2 flex items-center gap-2 ${precisaAvaliar ? 'text-orange-800' : 'text-gray-700'}`}>
                          <Download className="w-4 h-4" />
                          Documentos da Entrega {precisaAvaliar && '(obrigatório visualizar)'}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {/* CT-e/XML principal */}
                          {cotacao.documentoCte && (
                            <Button
                              size="sm"
                              variant={documentosBaixados[cotacao.id]?.['cte'] ? "outline" : precisaAvaliar ? "default" : "outline"}
                              className={documentosBaixados[cotacao.id]?.['cte'] ? "bg-green-50 border-green-300 text-green-700" : ""}
                              onClick={() => handleDownload(cotacao.id, cotacao.documentoCte, 'cte')}
                            >
                              {documentosBaixados[cotacao.id]?.['cte'] ? (
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                              ) : (
                                <Eye className="w-4 h-4 mr-1" />
                              )}
                              XML/PDF CT-e
                              <ExternalLink className="w-3 h-3 ml-1" />
                            </Button>
                          )}
                          {/* Outros documentos */}
                          {documentos.map((doc, index) => {
                            const baixado = documentosBaixados[cotacao.id]?.[index];
                            return (
                              <Button
                                key={index}
                                size="sm"
                                variant={baixado ? "outline" : precisaAvaliar ? "default" : "outline"}
                                className={baixado ? "bg-green-50 border-green-300 text-green-700" : ""}
                                onClick={() => handleDownload(cotacao.id, doc, index)}
                              >
                                {baixado ? (
                                  <CheckCircle2 className="w-4 h-4 mr-1" />
                                ) : (
                                  <Eye className="w-4 h-4 mr-1" />
                                )}
                                Documento {index + 1}
                                <ExternalLink className="w-3 h-3 ml-1" />
                              </Button>
                            );
                          })}
                        </div>
                        {precisaAvaliar && !podeAvaliar && (
                          <p className="text-xs text-orange-700 mt-2">
                            * Visualize todos os documentos para liberar a avaliação
                          </p>
                        )}
                      </div>
                    )}

                    {/* Rastreamento com link e código separados */}
                    {(cotacao.urlRastreamento || cotacao.codigoRastreio) && (
                      <div className="flex flex-wrap items-center gap-3 text-sm p-2 bg-blue-50 rounded-lg">
                        {cotacao.urlRastreamento && (
                          <div className="flex items-center gap-1">
                            <ExternalLink className="w-4 h-4 text-blue-500" />
                            <a 
                              href={cotacao.urlRastreamento.startsWith('http') ? cotacao.urlRastreamento : `https://${cotacao.urlRastreamento}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline font-medium"
                            >
                              Link de Rastreio
                            </a>
                            <button 
                              onClick={() => navigator.clipboard.writeText(cotacao.urlRastreamento)}
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
                              onClick={() => navigator.clipboard.writeText(cotacao.codigoRastreio)}
                              className="p-1 hover:bg-blue-100 rounded"
                              title="Copiar código"
                            >
                              <Copy className="w-3 h-3 text-blue-600" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Ações */}
                    <div className="flex items-center justify-between pt-3 border-t gap-2 flex-wrap">
                      {precisaAvaliar ? (
                        <>
                          <div className="flex gap-2 flex-1">
                            <Link to={createPageUrl(`ChatSuporte?cotacaoId=${cotacao.id}`)}>
                              <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Suporte
                              </Button>
                            </Link>
                            
                            <Button
                              onClick={() => handleAbrirAvaliacao(cotacao)}
                              disabled={!podeAvaliar}
                              className={`flex-1 ${podeAvaliar ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600' : 'bg-gray-300'}`}
                            >
                              <Star className="w-4 h-4 mr-2" />
                              {podeAvaliar ? "Avaliar e Finalizar" : "Visualize os documentos primeiro"}
                            </Button>
                          </div>
                          <Link to={createPageUrl(`DetalheEntregaCliente?id=${cotacao.id}`)}>
                            <Button variant="outline" className="border-blue-300 text-blue-600 hover:bg-blue-50">
                              <Eye className="w-4 h-4 mr-2" />
                              Ver Detalhes
                            </Button>
                          </Link>
                        </>
                      ) : (
                        <div className="flex items-center justify-between w-full flex-wrap gap-2">
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle2 className="w-5 h-5" />
                            <span className="font-medium">Cotação finalizada e avaliada</span>
                            <Badge className="bg-green-100 text-green-800">
                              <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
                              Avaliada
                            </Badge>
                          </div>
                          <Link to={createPageUrl(`DetalheEntregaCliente?id=${cotacao.id}`)}>
                            <Button variant="outline" className="border-blue-300 text-blue-600 hover:bg-blue-50">
                              <Eye className="w-4 h-4 mr-2" />
                              Ver Detalhes
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Avaliação */}
      <Dialog open={modalAvaliacaoAberto} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Avaliar Transportadora</DialogTitle>
            <DialogDescription>
              Como foi sua experiência com {transportadoraAvaliar?.nome}?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {errorAvaliacao && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorAvaliacao}</AlertDescription>
              </Alert>
            )}

            <div>
              <Label className="mb-3 block text-center">Selecione sua avaliação:</Label>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((estrela) => (
                  <button
                    key={estrela}
                    type="button"
                    className="transition-transform hover:scale-110 focus:outline-none"
                    onMouseEnter={() => setNotaHover(estrela)}
                    onMouseLeave={() => setNotaHover(0)}
                    onClick={() => setNota(estrela)}
                  >
                    <Star
                      className={`w-10 h-10 ${
                        estrela <= (notaHover || nota)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      } transition-colors`}
                    />
                  </button>
                ))}
              </div>
              {nota > 0 && (
                <p className="text-center text-sm text-gray-600 mt-2">
                  Você selecionou: {nota} {nota === 1 ? 'estrela' : 'estrelas'}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="comentario">Comentário (Opcional)</Label>
              <Textarea
                id="comentario"
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Conte sobre sua experiência com esta transportadora..."
                rows={4}
                maxLength={500}
                className="resize-none"
              />
              <p className="text-xs text-gray-500 mt-1 text-right">
                {comentario.length}/500 caracteres
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              onClick={handleEnviarAvaliacao}
              disabled={submittingAvaliacao || nota === 0}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            >
              {submittingAvaliacao ? (
                "Enviando..."
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Enviar Avaliação e Finalizar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
