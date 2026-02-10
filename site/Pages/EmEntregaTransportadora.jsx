import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import {
  Truck,
  Package,
  MapPin,
  DollarSign,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  Star,
  X,
  Weight,
  Box,
  Calendar,
  Clock
} from "lucide-react";
import { calcularDiasRestantes, formatarDiasRestantes, getClasseDiasRestantes } from "../components/atraso/CalculadoraDiasEntrega";
import ModalInformarAtraso from "../components/atraso/ModalInformarAtraso";
import AlertaAtrasoTransportadora from "../components/atraso/AlertaAtrasoTransportadora";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PageHeader from "../components/common/PageHeader";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";
import AvaliacaoClienteModal from "../components/cotacao/AvaliacaoClienteModal";

export default function EmEntregaTransportadora() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [expandedCards, setExpandedCards] = useState({});
  const [modalAvaliacaoAberto, setModalAvaliacaoAberto] = useState(false);
  const [cotacaoParaFinalizar, setCotacaoParaFinalizar] = useState(null);
  const [clienteParaAvaliar, setClienteParaAvaliar] = useState(null);
  const [documentosEntrega, setDocumentosEntrega] = useState({});
  const [uploadingDocs, setUploadingDocs] = useState({});
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState({});
  const [finalizando, setFinalizando] = useState(false);
  const [modalAtrasoAberto, setModalAtrasoAberto] = useState(false);
  const [cotacaoParaAtraso, setCotacaoParaAtraso] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['user-em-entrega'],
    queryFn: () => base44.auth.me(),
    staleTime: 60000
  });

  // Buscar perfil da transportadora
  const { data: perfilTransportadora } = useQuery({
    queryKey: ['perfil-transportadora', user?.perfilAtivoId],
    queryFn: async () => {
      if (!user) return null;
      const perfis = await base44.entities.PerfilTransportadora.filter({
        userIdGoogle: user.perfilAtivoId
      });
      if (perfis.length === 0) {
        const perfisPorId = await base44.entities.PerfilTransportadora.filter({
          id: user.perfilAtivoId
        });
        return perfisPorId[0] || null;
      }
      return perfis[0];
    },
    enabled: !!user,
    staleTime: 60000
  });

  // Buscar cotações em trânsito - REGRA: só aparece aqui se tiver:
  // 1. CT-e registrado (codigoCTe preenchido)
  // 2. Documentos anexados (documentoCte ou documentosEntrega)
  // 3. URL e código de rastreio preenchidos
  const { data: cotacoesEmEntrega = [], isLoading } = useQuery({
    queryKey: ['cotacoes-em-entrega', user?.perfilAtivoId],
    queryFn: async () => {
      if (!user) return [];

      const minhasRespostas = await base44.entities.RespostaCotacao.filter({
        transportadoraId: user.perfilAtivoId
      });
      
      if (minhasRespostas.length === 0) return [];

      const idsMinhasRespostas = minhasRespostas.map(r => r.id);
      const respostasMap = {};
      minhasRespostas.forEach(r => respostasMap[r.id] = r);
      
      const todasCotacoes = await base44.entities.Cotacao.filter({});
      
      // Filtrar: status em_transito E todos os dados obrigatórios preenchidos
      const cotacoesEmTransito = todasCotacoes.filter(c => {
        const minhaResposta = idsMinhasRespostas.includes(c.respostaSelecionadaId);
        const emTransito = c.status === "em_transito";
        const naoFinalizada = c.status !== "finalizada";
        const naoRejeitada = !c.cteRejeitadoCliente;
        
        // Verificações obrigatórias para aparecer em "Em Entrega":
        const temCTeRegistrado = c.cteRegistrado && c.codigoCTe;
        const temDocumentos = c.documentoCte || (c.documentosEntrega && c.documentosEntrega.length > 0);
        const temRastreio = c.urlRastreamento && c.codigoRastreio;
        
        // Só entra em "Em Entrega" se tiver TUDO preenchido
        return minhaResposta && emTransito && naoFinalizada && naoRejeitada && 
               temCTeRegistrado && temDocumentos && temRastreio;
      });

      return cotacoesEmTransito.map(c => ({
        ...c,
        resposta: respostasMap[c.respostaSelecionadaId]
      }));
    },
    enabled: !!user,
    staleTime: 60000
  });

  // Carregar dados de clientes quando necessário
  const [clientesCarregados, setClientesCarregados] = useState({});

  const carregarCliente = async (cotacao) => {
    if (clientesCarregados[cotacao.clienteId]) return clientesCarregados[cotacao.clienteId];
    
    const result = await base44.entities.PerfilCliente.filter({ id: cotacao.clienteId });
    const cliente = result[0] || null;
    
    setClientesCarregados(prev => ({
      ...prev,
      [cotacao.clienteId]: cliente
    }));
    
    return cliente;
  };

  const handleUploadDocumento = async (cotacaoId, e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingDocs(prev => ({ ...prev, [cotacaoId]: true }));
    setErrors(prev => ({ ...prev, [cotacaoId]: "" }));

    try {
      const uploadPromises = files.map(file => 
        base44.integrations.Core.UploadFile({ file })
      );
      const results = await Promise.all(uploadPromises);
      const urls = results.map(r => r.file_url);
      
      setDocumentosEntrega(prev => ({
        ...prev,
        [cotacaoId]: [...(prev[cotacaoId] || []), ...urls]
      }));
      setSuccess(prev => ({ ...prev, [cotacaoId]: `${files.length} documento(s) anexado(s)!` }));
    } catch (err) {
      console.error("Erro ao fazer upload:", err);
      setErrors(prev => ({ ...prev, [cotacaoId]: "Erro ao enviar documento(s)." }));
    }
    setUploadingDocs(prev => ({ ...prev, [cotacaoId]: false }));
  };

  const handleRemoverDocumento = (cotacaoId, index) => {
    setDocumentosEntrega(prev => ({
      ...prev,
      [cotacaoId]: (prev[cotacaoId] || []).filter((_, i) => i !== index)
    }));
  };

  const handleIniciarFinalizacao = async (cotacao) => {
    const docs = documentosEntrega[cotacao.id] || [];
    
    if (docs.length === 0) {
      setErrors(prev => ({ ...prev, [cotacao.id]: "Anexe o comprovante de entrega assinado pelo destinatário" }));
      return;
    }

    // Carregar cliente e abrir modal de avaliação
    const cliente = await carregarCliente(cotacao);
    if (!cliente) {
      setErrors(prev => ({ ...prev, [cotacao.id]: "Erro ao carregar dados do cliente" }));
      return;
    }

    setCotacaoParaFinalizar(cotacao);
    setClienteParaAvaliar(cliente);
    setModalAvaliacaoAberto(true);
  };

  const handleFinalizarCotacao = async () => {
    if (!cotacaoParaFinalizar || finalizando) return;

    setFinalizando(true);
    const docs = documentosEntrega[cotacaoParaFinalizar.id] || [];
    const agora = new Date().toISOString();

    try {
      // 1. Verificar se houve atraso na segunda data (deve bloquear)
      const agora2 = new Date();
      const atrasouSegundaData = cotacaoParaFinalizar.dataNovaPrevisaoEntrega && 
                                  new Date(cotacaoParaFinalizar.dataNovaPrevisaoEntrega) < agora2;
      
      // 2. Atualizar cotação para finalizada
      await base44.entities.Cotacao.update(cotacaoParaFinalizar.id, {
        documentoCanhoto: docs[0],
        documentosEntrega: docs,
        status: "finalizada",
        dataHoraFinalizacao: agora
      });

      // 3. Verificar se entregou com atraso e atualizar contadores
      const estaAtrasada = cotacaoParaFinalizar.atrasada;
      let atualizarPerfil = {};
      
      if (estaAtrasada && perfilTransportadora) {
        const agora = new Date();
        const mesAtual = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`;
        const anoAtual = String(agora.getFullYear());
        
        // Reset mensal se mudou de mês
        let entregasAtrasoMes = perfilTransportadora.entregasAtrasoMes || 0;
        if (perfilTransportadora.mesReferenciaAtraso !== mesAtual) {
          entregasAtrasoMes = 0;
        }
        
        // Reset anual se mudou de ano
        let entregasAtrasoAno = perfilTransportadora.entregasAtrasoAno || 0;
        if (perfilTransportadora.anoReferenciaAtraso !== anoAtual) {
          entregasAtrasoAno = 0;
        }
        
        entregasAtrasoMes += 1;
        entregasAtrasoAno += 1;
        
        atualizarPerfil = {
          entregasAtrasoMes,
          entregasAtrasoAno,
          mesReferenciaAtraso: mesAtual,
          anoReferenciaAtraso: anoAtual
        };
        
        // Desbloquear se estava bloqueada (só se não atrasou na segunda data)
        if (perfilTransportadora.bloqueadaCotacoes && !atrasouSegundaData) {
          atualizarPerfil.bloqueadaCotacoes = false;
          atualizarPerfil.motivoBloqueio = "";
        }
        
        // Se atrasou na segunda data prevista, BLOQUEAR
        if (atrasouSegundaData) {
          atualizarPerfil.bloqueadaCotacoes = true;
          atualizarPerfil.motivoBloqueio = "Atraso na segunda data prevista de entrega. Finalize todas as entregas pendentes para desbloquear.";
        }
      }
      
      // 3. Calcular valores financeiros
      const valorCotacao = cotacaoParaFinalizar.valorFinalTransportadora || cotacaoParaFinalizar.resposta?.valorTotal || 0;
      const comissaoPlataforma = valorCotacao * 0.05; // 5%
      const valorTransportadora = valorCotacao - comissaoPlataforma; // 95%

      // 4. Atualizar perfil da transportadora se houve atraso
      if (Object.keys(atualizarPerfil).length > 0 && perfilTransportadora) {
        await base44.entities.PerfilTransportadora.update(perfilTransportadora.id, atualizarPerfil);
      }
      
      // 5. Buscar ou criar registro financeiro do mês
      // Primeiro buscar o perfil da transportadora
      let perfilTransp = await base44.entities.PerfilTransportadora.filter({ userIdGoogle: user.perfilAtivoId });
      if (perfilTransp.length === 0) {
        perfilTransp = await base44.entities.PerfilTransportadora.filter({ id: user.perfilAtivoId });
      }
      const transportadoraId = perfilTransp[0]?.id || user.perfilAtivoId;
      const nomeTransportadora = perfilTransp[0]?.razaoSocial || "Transportadora";

      const mesReferencia = new Date().toISOString().slice(0, 7); // YYYY-MM
      const financeirosExistentes = await base44.entities.Financeiro.filter({
        transportadoraId: transportadoraId,
        mesReferencia: mesReferencia
      });

      if (financeirosExistentes.length > 0) {
        // Atualizar registro existente
        const financeiroAtual = financeirosExistentes[0];
        const cotacoesLista = [...(financeiroAtual.cotacoes || []), {
          cotacaoId: cotacaoParaFinalizar.id,
          numeroCotacao: cotacaoParaFinalizar.id.slice(0, 8),
          valorCotacao: valorCotacao,
          valorTransportadora: valorTransportadora,
          valorComissao: comissaoPlataforma,
          dataFinalizacao: agora
        }];

        await base44.entities.Financeiro.update(financeiroAtual.id, {
          cotacoes: cotacoesLista,
          valorTotalCotacoes: (financeiroAtual.valorTotalCotacoes || 0) + valorCotacao,
          valorTotalTransportadora: (financeiroAtual.valorTotalTransportadora || 0) + valorTransportadora,
          valorTotalComissao: (financeiroAtual.valorTotalComissao || 0) + comissaoPlataforma
        });
      } else {
        // Criar novo registro financeiro
        await base44.entities.Financeiro.create({
          transportadoraId: transportadoraId,
          transportadoraNome: nomeTransportadora,
          mesReferencia: mesReferencia,
          cotacoes: [{
            cotacaoId: cotacaoParaFinalizar.id,
            numeroCotacao: cotacaoParaFinalizar.id.slice(0, 8),
            valorCotacao: valorCotacao,
            valorTransportadora: valorTransportadora,
            valorComissao: comissaoPlataforma,
            dataFinalizacao: agora
          }],
          valorTotalCotacoes: valorCotacao,
          valorTotalTransportadora: valorTransportadora,
          valorTotalComissao: comissaoPlataforma,
          boletoGerado: false,
          boletoPago: false
        });
      }

      // 6. Invalidar queries e redirecionar rapidamente
      queryClient.invalidateQueries(['cotacoes-em-entrega']);
      queryClient.invalidateQueries(['cotacoes-finalizadas']);
      queryClient.invalidateQueries(['financeiro-transportadora']);
      
      setModalAvaliacaoAberto(false);
      setCotacaoParaFinalizar(null);
      setClienteParaAvaliar(null);
      setFinalizando(false);

      // 7. Redirecionar imediatamente para Cotações Finalizadas
      navigate(createPageUrl("CotacoesFinalizadasTransportadora"));
      
    } catch (err) {
      console.error("Erro ao finalizar:", err);
      setErrors(prev => ({ ...prev, [cotacaoParaFinalizar.id]: "Erro ao finalizar cotação." }));
      setFinalizando(false);
    }
  };

  if (!user || isLoading) {
    return <LoadingSpinner message="Carregando entregas em andamento..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <PageHeader
        title="Em Entrega"
        description="Cotações em processo de entrega - Finalize anexando o comprovante"
      />

      <div className="p-6 max-w-7xl mx-auto space-y-4">
        {/* Alerta de atrasos */}
        <AlertaAtrasoTransportadora 
          perfilTransportadora={perfilTransportadora}
          cotacoesAtrasadas={cotacoesEmEntrega.filter(c => c.atrasada)}
        />
        {cotacoesEmEntrega.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="Nenhuma entrega em andamento"
            description="Quando você registrar o CT-e de uma cotação, ela aparecerá aqui"
            actionLabel="Ver Cotações Aceitas"
            actionUrl={createPageUrl("CotacoesAceitasTransportadora")}
          />
        ) : (
          <div className="space-y-4">
            {cotacoesEmEntrega.map((cotacao) => {
              const docs = documentosEntrega[cotacao.id] || [];
              const isUploading = uploadingDocs[cotacao.id];
              const error = errors[cotacao.id];
              const successMsg = success[cotacao.id];
              
              // Calcular dias restantes para entrega
              const dataParaCalculo = cotacao.dataNovaPrevisaoEntrega || cotacao.dataPrevistaEntrega;
              const diasRestantes = calcularDiasRestantes(dataParaCalculo);
              const textoRestantes = formatarDiasRestantes(diasRestantes);
              const classeRestantes = getClasseDiasRestantes(diasRestantes);
              const atrasado = diasRestantes !== null && diasRestantes < 0;
              const podeInformarAtraso = atrasado && !cotacao.atrasoInformadoCliente;
              
              return (
                <Card key={cotacao.id} className="hover:shadow-lg transition-shadow duration-300">
                  <CardHeader className="border-b bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Truck className="w-5 h-5" />
                        Cotação #{cotacao.id.slice(0, 8)}
                      </CardTitle>
                      <Badge className="bg-white/20 text-white border-0">
                        Em Trânsito
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 space-y-4">
                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    {successMsg && (
                      <Alert className="bg-green-50 border-green-200">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">{successMsg}</AlertDescription>
                      </Alert>
                    )}

                    {/* Resumo da cotação */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Package className="w-4 h-4 text-blue-600" />
                          <span className="text-xs font-semibold text-gray-600">PRODUTO</span>
                        </div>
                        <p className="font-medium text-gray-900 text-sm truncate">{cotacao.produtoNome}</p>
                      </div>

                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin className="w-4 h-4 text-red-600" />
                          <span className="text-xs font-semibold text-gray-600">DESTINO</span>
                        </div>
                        <p className="font-medium text-gray-900 text-sm">{cotacao.destinatarioCidade} - {cotacao.destinatarioEstado}</p>
                      </div>

                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="text-xs font-semibold text-green-700">VALOR APROVADO</span>
                        </div>
                        <p className="font-bold text-green-700">
                          R$ {(cotacao.valorFinalTransportadora || cotacao.valorOriginalCotacao || cotacao.resposta?.valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>

                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <span className="text-xs font-semibold text-blue-700">CT-e</span>
                        </div>
                        <p className="font-mono font-medium text-blue-700 text-sm">{cotacao.codigoCTe}</p>
                      </div>
                    </div>

                    {/* Prazo de Entrega - DESTAQUE */}
                    {dataParaCalculo && (
                      <div className={`p-3 border-l-4 ${atrasado ? 'bg-red-50 border-red-500' : 'bg-yellow-50 border-yellow-500'}`}>
                        <div className="flex items-center gap-3">
                          <Clock className={`w-5 h-5 ${atrasado ? 'text-red-600' : 'text-yellow-600'}`} />
                          <div className="flex-1">
                            <p className="text-xs text-gray-600">Prazo de Entrega:</p>
                            <p className={`font-bold ${classeRestantes}`}>
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
                          {podeInformarAtraso && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setCotacaoParaAtraso(cotacao);
                                setModalAtrasoAberto(true);
                              }}
                              className="bg-orange-600 hover:bg-orange-700 animate-pulse"
                            >
                              <AlertCircle className="w-4 h-4 mr-1" />
                              Informar Atraso
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Info adicional compacta */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded">
                        <Weight className="w-3 h-3 text-gray-500" />
                        <span>{cotacao.pesoTotal} kg</span>
                      </div>
                      <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded">
                        <Box className="w-3 h-3 text-gray-500" />
                        <span>{cotacao.quantidadeVolumes} vol</span>
                      </div>
                      <Badge variant="outline" className="text-xs">{cotacao.tipoFrete}</Badge>
                      {cotacao.cteAprovadoCliente && (
                        <Badge className="bg-green-100 text-green-800 text-xs">CT-e Aprovado</Badge>
                      )}
                    </div>

                    {/* Upload de comprovante de entrega */}
                    <div className="border-t pt-4 space-y-3">
                      <Label className="text-sm font-semibold flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        Comprovante de Entrega (Canhoto Assinado) *
                      </Label>
                      
                      <div>
                        <Label htmlFor={`upload-${cotacao.id}`} className="cursor-pointer">
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition-colors">
                            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm font-medium text-gray-700">Clique para anexar</p>
                            <p className="text-xs text-gray-500">Foto do canhoto assinado pelo destinatário</p>
                          </div>
                        </Label>
                        <input
                          id={`upload-${cotacao.id}`}
                          type="file"
                          multiple
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={(e) => handleUploadDocumento(cotacao.id, e)}
                          className="hidden"
                          disabled={isUploading}
                        />
                      </div>

                      {isUploading && (
                        <div className="text-center py-2">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                          <p className="text-xs text-gray-500 mt-1">Enviando...</p>
                        </div>
                      )}

                      {docs.length > 0 && (
                        <div className="space-y-2">
                          {docs.map((doc, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                <a href={doc} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                                  Documento {index + 1}
                                </a>
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => handleRemoverDocumento(cotacao.id, index)}>
                                <X className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Botão Finalizar */}
                      <Button
                        onClick={() => handleIniciarFinalizacao(cotacao)}
                        disabled={docs.length === 0 || isUploading}
                        className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Finalizar Cotação
                      </Button>

                      <p className="text-xs text-gray-500 text-center">
                        Ao finalizar, você será solicitado a avaliar o cliente
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Avaliação - Obrigatória */}
      {modalAvaliacaoAberto && clienteParaAvaliar && cotacaoParaFinalizar && (
        <AvaliacaoClienteModal
          isOpen={modalAvaliacaoAberto}
          onClose={() => {
            // Não permite fechar sem avaliar
            if (!finalizando) {
              alert("A avaliação do cliente é obrigatória para finalizar a entrega.");
            }
          }}
          cotacao={{ ...cotacaoParaFinalizar, transportadoraId: user?.perfilAtivoId }}
          cliente={{ ...clienteParaAvaliar, nome: clienteParaAvaliar.nomeCompleto }}
          onSuccess={handleFinalizarCotacao}
          obrigatorio={true}
        />
      )}

      {/* Modal Informar Atraso */}
      {modalAtrasoAberto && cotacaoParaAtraso && (
        <ModalInformarAtraso
          cotacao={cotacaoParaAtraso}
          aberto={modalAtrasoAberto}
          onFechar={() => {
            setModalAtrasoAberto(false);
            setCotacaoParaAtraso(null);
          }}
          onSucesso={() => {
            queryClient.invalidateQueries(['cotacoes-em-entrega']);
            setSuccess(prev => ({ ...prev, [cotacaoParaAtraso.id]: "Atraso informado ao cliente com sucesso!" }));
          }}
        />
      )}
    </div>
  );
}
