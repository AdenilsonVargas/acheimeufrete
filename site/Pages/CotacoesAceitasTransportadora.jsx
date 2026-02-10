import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Package,
  MapPin,
  Calendar,
  DollarSign,
  User,
  CheckCircle2,
  AlertCircle,
  Truck,
  Download,
  Building2,
  Phone,
  Mail,
  ChevronDown,
  ChevronUp,
  ScanLine,
  Weight,
  Box,
  Upload,
  Link as LinkIcon,
  FileText,
  X
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PageHeader from "../components/common/PageHeader";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";

export default function CotacoesAceitasTransportadora() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [expandedCards, setExpandedCards] = useState({});
  
  // Estados para edição inline
  const [editandoRastreio, setEditandoRastreio] = useState({});
  const [urlRastreioTemp, setUrlRastreioTemp] = useState({});
  const [codigoRastreioTemp, setCodigoRastreioTemp] = useState({});
  const [salvandoRastreio, setSalvandoRastreio] = useState({});
  
  // Estados para upload de documentos
  const [uploadingDocs, setUploadingDocs] = useState({});
  const [documentosTemp, setDocumentosTemp] = useState({});
  
  // Estados para aceitar valor inicial
  const [aceitandoValorInicial, setAceitandoValorInicial] = useState({});

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userData = await base44.auth.me();
    setUser(userData);
  };

  // Primeira query: buscar apenas cotações aceitas (dados básicos)
  const { data: cotacoesBasicas = [], isLoading } = useQuery({
    queryKey: ['cotacoes-aceitas-basicas', user?.perfilAtivoId],
    queryFn: async () => {
      if (!user) return [];

      // Buscar respostas desta transportadora
      const minhasRespostas = await base44.entities.RespostaCotacao.filter({
        transportadoraId: user.perfilAtivoId
      });
      
      if (minhasRespostas.length === 0) return [];

      const idsMinhasRespostas = minhasRespostas.map(r => r.id);
      const respostasMap = {};
      minhasRespostas.forEach(r => respostasMap[r.id] = r);
      
      // Buscar apenas cotações que têm resposta selecionada
      const todasCotacoes = await base44.entities.Cotacao.filter({});
      // Mostrar cotações aceitas que ainda precisam de CT-e, documentos ou rastreio
      // OU que estão em negociação de CT-e
      const cotacoesAceitas = todasCotacoes.filter(c => {
        const minhaResposta = c.respostaSelecionadaId && idsMinhasRespostas.includes(c.respostaSelecionadaId);
        const naoFinalizada = c.status !== "finalizada";
        const naoDevolvida = c.status !== "devolvida";

        // Verificar se está completa para ir para "Em Entrega"
        const temCTeRegistrado = c.cteRegistrado && c.codigoCTe;
        const temDocumentos = c.documentoCte || (c.documentosEntrega && c.documentosEntrega.length > 0);
        const temRastreio = c.urlRastreamento && c.codigoRastreio;
        const completaParaEntrega = temCTeRegistrado && temDocumentos && temRastreio;

        // Se está aguardando aprovação de CT-e, SEMPRE fica aqui
        const aguardandoAprovacao = c.status === "aguardando_aprovacao_cte";

        // Fica em "Cotações Aceitas" se:
        // - É minha resposta
        // - Não está finalizada nem devolvida
        // - E (falta algum dado obrigatório OU está aguardando aprovação de CT-e)
        return minhaResposta && naoFinalizada && naoDevolvida && (!completaParaEntrega || aguardandoAprovacao);
      });

      // Retornar cotações com resposta anexada (sem dados extras)
      return cotacoesAceitas.map(c => ({
        ...c,
        resposta: respostasMap[c.respostaSelecionadaId]
      }));
    },
    enabled: !!user,
    staleTime: 120000
  });

  // Segunda query: buscar detalhes apenas quando o card é expandido
  const [detalhesCarregados, setDetalhesCarregados] = useState({});

  const carregarDetalhes = async (cotacao) => {
    if (detalhesCarregados[cotacao.id]) return;

    try {
      const [clienteResult, destinatarioResult, enderecosResult] = await Promise.all([
        base44.entities.PerfilCliente.filter({ id: cotacao.clienteId }),
        cotacao.destinatarioId ? base44.entities.Destinatario.filter({ id: cotacao.destinatarioId }) : Promise.resolve([]),
        base44.entities.EnderecoColeta.filter({ clienteId: cotacao.clienteId })
      ]);

      let cliente = clienteResult[0];
      if (!cliente) {
        const clientePorGoogle = await base44.entities.PerfilCliente.filter({ userIdGoogle: cotacao.clienteId });
        cliente = clientePorGoogle[0] || { nomeCompleto: "Cliente não encontrado" };
      }

      const destinatario = destinatarioResult[0] || null;
      
      let enderecoColeta = null;
      if (cotacao.enderecoColetaId) {
        enderecoColeta = enderecosResult.find(e => e.id === cotacao.enderecoColetaId);
      }
      if (!enderecoColeta) {
        enderecoColeta = enderecosResult.find(e => e.principal) || enderecosResult[0] || null;
      }

      setDetalhesCarregados(prev => ({
        ...prev,
        [cotacao.id]: { cliente, destinatario, enderecoColeta }
      }));
    } catch (error) {
      console.error("Erro ao carregar detalhes:", error);
    }
  };

  // Combinar dados básicos com detalhes carregados
  const cotacoes = cotacoesBasicas.map(c => ({
    ...c,
    cliente: detalhesCarregados[c.id]?.cliente || null,
    destinatario: detalhesCarregados[c.id]?.destinatario || null,
    enderecoColeta: detalhesCarregados[c.id]?.enderecoColeta || null
  }));

  const toggleExpand = async (cotacao) => {
    const cotacaoId = cotacao.id;
    const novoEstado = !expandedCards[cotacaoId];
    
    setExpandedCards(prev => ({
      ...prev,
      [cotacaoId]: novoEstado
    }));

    // Carregar detalhes apenas quando expandir
    if (novoEstado && !detalhesCarregados[cotacaoId]) {
      await carregarDetalhes(cotacao);
    }
  };

  const exportarCSV = (cotacao) => {
    const cliente = cotacao.cliente;
    const enderecoColeta = cotacao.enderecoColeta;
    const destinatario = cotacao.destinatario;

    const dados = [
      ["DADOS DO REMETENTE (CLIENTE)"],
      ["Nome/Razão Social", cliente?.nomeCompleto || ""],
      ["CPF/CNPJ", cliente?.cpfOuCnpj || ""],
      ["Telefone Comercial", cliente?.telefoneComercial || ""],
      ["Telefone Pessoal", cliente?.telefonePessoal || ""],
      ["Email", cliente?.emailAcesso || ""],
      [""],
      ["ENDEREÇO DE COLETA"],
      ["Apelido", enderecoColeta?.apelido || ""],
      ["Logradouro", enderecoColeta?.logradouro || ""],
      ["Número", enderecoColeta?.numero || ""],
      ["Complemento", enderecoColeta?.complemento || ""],
      ["Bairro", enderecoColeta?.bairro || ""],
      ["Cidade", enderecoColeta?.cidade || ""],
      ["Estado", enderecoColeta?.estado || ""],
      ["CEP", enderecoColeta?.cep || ""],
      [""],
      ["DADOS DO DESTINATÁRIO"],
      ["Nome Completo", destinatario?.nomeCompleto || ""],
      ["Logradouro", destinatario?.logradouro || ""],
      ["Número", destinatario?.numero || ""],
      ["Complemento", destinatario?.complemento || ""],
      ["Bairro", destinatario?.bairro || ""],
      ["Cidade", destinatario?.cidade || ""],
      ["Estado", destinatario?.estado || ""],
      ["CEP", destinatario?.cep || ""],
      [""],
      ["DADOS DA COTAÇÃO"],
      ["Número na Plataforma", `#${cotacao.id.slice(0, 8)}`],
      ["ID Completo", cotacao.id],
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
    link.download = `cotacao_${cotacao.id.slice(0, 8)}_dados.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Funções para salvar rastreio
  const handleSalvarRastreio = async (cotacaoId) => {
    const url = urlRastreioTemp[cotacaoId];
    const codigo = codigoRastreioTemp[cotacaoId];
    
    if (!url?.trim() || !codigo?.trim()) {
      alert("Preencha a URL e o código de rastreio");
      return;
    }

    setSalvandoRastreio(prev => ({ ...prev, [cotacaoId]: true }));
    try {
      await base44.entities.Cotacao.update(cotacaoId, {
        urlRastreamento: url.trim(),
        codigoRastreio: codigo.trim()
      });
      
      setEditandoRastreio(prev => ({ ...prev, [cotacaoId]: false }));
      queryClient.invalidateQueries(['cotacoes-aceitas-basicas']);
    } catch (error) {
      console.error("Erro ao salvar rastreio:", error);
      alert("Erro ao salvar. Tente novamente.");
    }
    setSalvandoRastreio(prev => ({ ...prev, [cotacaoId]: false }));
  };

  // Funções para upload de documentos
  const handleUploadDocumento = async (cotacaoId, e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingDocs(prev => ({ ...prev, [cotacaoId]: true }));
    try {
      const uploadPromises = files.map(file => 
        base44.integrations.Core.UploadFile({ file })
      );
      const results = await Promise.all(uploadPromises);
      const urls = results.map(r => r.file_url);
      
      // Buscar cotação atual para pegar documentos existentes
      const cotacaoAtual = cotacoesBasicas.find(c => c.id === cotacaoId);
      const docsExistentes = cotacaoAtual?.documentosEntrega || [];
      const novosDocumentos = [...docsExistentes, ...urls];
      
      await base44.entities.Cotacao.update(cotacaoId, {
        documentosEntrega: novosDocumentos,
        documentoCte: novosDocumentos[0] // Primeiro como principal
      });
      
      queryClient.invalidateQueries(['cotacoes-aceitas-basicas']);
    } catch (err) {
      console.error("Erro ao fazer upload:", err);
      alert("Erro ao enviar documento(s).");
    }
    setUploadingDocs(prev => ({ ...prev, [cotacaoId]: false }));
  };

  const handleRemoverDocumento = async (cotacaoId, index) => {
    const cotacaoAtual = cotacoesBasicas.find(c => c.id === cotacaoId);
    const docsExistentes = cotacaoAtual?.documentosEntrega || [];
    const novosDocumentos = docsExistentes.filter((_, i) => i !== index);
    
    try {
      await base44.entities.Cotacao.update(cotacaoId, {
        documentosEntrega: novosDocumentos,
        documentoCte: novosDocumentos[0] || null
      });
      queryClient.invalidateQueries(['cotacoes-aceitas-basicas']);
    } catch (err) {
      console.error("Erro ao remover:", err);
    }
  };

  const handleAceitarValorInicial = async (cotacaoId) => {
    if (!confirm("Confirma que deseja aceitar o valor inicial da cotação e prosseguir com a entrega?")) {
      return;
    }

    setAceitandoValorInicial(prev => ({ ...prev, [cotacaoId]: true }));
    try {
      const cotacao = cotacoesBasicas.find(c => c.id === cotacaoId);
      const agora = new Date().toISOString();
      const valorOriginal = cotacao.resposta?.valorTotal || 0;

      // Buscar chat de negociação
      const chats = await base44.entities.Chat.filter({
        cotacaoId: cotacaoId,
        tipo: "negociacao_cte"
      });

      if (chats.length > 0) {
        const chat = chats[0];
        
        // Adicionar mensagem no chat
        const novasMensagens = [...(chat.mensagens || []), {
          remetente: "transportadora",
          tipoMensagem: "aprovacao",
          mensagem: `✅ Transportadora aceitou preço inicial de R$ ${valorOriginal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.\n\nA entrega pode prosseguir.`,
          dataHora: agora
        }];

        await base44.entities.Chat.update(chat.id, {
          status: "aprovado",
          mensagens: novasMensagens,
          valorAtualProposta: valorOriginal,
          lidoPorCliente: false,
          dataHoraUltimaMensagem: agora
        });
      }

      // Atualizar cotação
      await base44.entities.Cotacao.update(cotacaoId, {
        status: "em_transito",
        cteAprovadoCliente: true,
        dataHoraAprovacaoCTe: agora,
        valorFinalTransportadora: valorOriginal,
        valorFinalCliente: valorOriginal,
        diferencaValor: 0,
        motivoAumentoCTe: null
      });

      queryClient.invalidateQueries(['cotacoes-aceitas-basicas']);
      alert("Valor inicial aceito! A cotação foi movida para 'Em Entrega'.");
    } catch (error) {
      console.error("Erro ao aceitar valor inicial:", error);
      alert("Erro ao processar. Tente novamente.");
    }
    setAceitandoValorInicial(prev => ({ ...prev, [cotacaoId]: false }));
  };

  if (!user || isLoading) {
    return <LoadingSpinner message="Carregando cotações aceitas..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <PageHeader
        title="Cotações Aceitas"
        description="Todas as cotações onde sua proposta foi aceita pelo cliente"
      />

      <div className="p-6 max-w-7xl mx-auto">
        {cotacoes.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="Nenhuma cotação aceita"
            description="Aguarde os clientes aceitarem suas propostas"
            actionLabel="Ver Cotações Disponíveis"
            actionUrl={createPageUrl("CotacoesDisponiveis")}
          />
        ) : (
          <div className="space-y-4">
            {cotacoes.map((cotacao) => {
              const isExpanded = expandedCards[cotacao.id];
              
              return (
                <Card key={cotacao.id} className="hover:shadow-lg transition-shadow duration-300">
                  <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-white">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Truck className="w-5 h-5 text-blue-600" />
                        Cotação #{cotacao.id.slice(0, 8)}
                      </CardTitle>
                      <div className="flex items-center gap-2 flex-wrap">
                        {cotacao.status === "finalizada" && (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Finalizada
                          </Badge>
                        )}
                        {cotacao.status === "em_transito" && (
                          <Badge className="bg-blue-100 text-blue-800">
                            <Truck className="w-3 h-3 mr-1" />
                            Em Entrega
                          </Badge>
                        )}
                        {cotacao.status === "aguardando_aprovacao_cte" && (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Aguardando Aprovação CT-e
                          </Badge>
                        )}
                        {cotacao.status === "devolvida" && (
                          <Badge className="bg-red-100 text-red-800">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Devolvida
                          </Badge>
                        )}
                        {!cotacao.cteRegistrado && cotacao.status !== "finalizada" && cotacao.status !== "devolvida" && (
                          <Badge className="bg-orange-100 text-orange-800">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Pendente CT-e
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Botão para expandir/recolher dados */}
                      <Button
                        variant="outline"
                        onClick={() => toggleExpand(cotacao)}
                        className="w-full justify-between"
                      >
                        <span className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Ver Dados Completos do Remetente e Destinatário
                        </span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>

                      {isExpanded && (
                        <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
                          {!detalhesCarregados[cotacao.id] ? (
                            <div className="flex items-center justify-center py-8">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                              <span className="ml-3 text-gray-500">Carregando detalhes...</span>
                            </div>
                          ) : (
                            <>
                          {/* Dados do Remetente (Cliente) */}
                          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-bold text-blue-900 flex items-center gap-2">
                                <Building2 className="w-5 h-5" />
                                REMETENTE (CLIENTE)
                              </h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="text-gray-500">Nome/Razão Social:</span>
                                <p className="font-semibold">{cotacao.cliente?.nomeCompleto || "N/I"}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">CPF/CNPJ:</span>
                                <p className="font-semibold font-mono">{cotacao.cliente?.cpfOuCnpj || "N/I"}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <div>
                                  <span className="text-gray-500">Telefone Comercial:</span>
                                  <p className="font-semibold">{cotacao.cliente?.telefoneComercial || "N/I"}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <div>
                                  <span className="text-gray-500">Telefone Pessoal:</span>
                                  <p className="font-semibold">{cotacao.cliente?.telefonePessoal || "N/I"}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 md:col-span-2">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <div>
                                  <span className="text-gray-500">Email:</span>
                                  <p className="font-semibold">{cotacao.cliente?.emailAcesso || "N/I"}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Endereço de Coleta */}
                          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                            <h4 className="font-bold text-green-900 flex items-center gap-2 mb-3">
                              <MapPin className="w-5 h-5" />
                              ENDEREÇO DE COLETA
                            </h4>
                            {cotacao.enderecoColeta ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                <div>
                                  <span className="text-gray-500">Apelido:</span>
                                  <p className="font-semibold">{cotacao.enderecoColeta.apelido}</p>
                                </div>
                                <div>
                                  <span className="text-gray-500">CEP:</span>
                                  <p className="font-semibold font-mono">{cotacao.enderecoColeta.cep}</p>
                                </div>
                                <div className="md:col-span-2">
                                  <span className="text-gray-500">Endereço:</span>
                                  <p className="font-semibold">
                                    {cotacao.enderecoColeta.logradouro}, {cotacao.enderecoColeta.numero}
                                    {cotacao.enderecoColeta.complemento && ` - ${cotacao.enderecoColeta.complemento}`}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-gray-500">Bairro:</span>
                                  <p className="font-semibold">{cotacao.enderecoColeta.bairro}</p>
                                </div>
                                <div>
                                  <span className="text-gray-500">Cidade/Estado:</span>
                                  <p className="font-semibold">{cotacao.enderecoColeta.cidade} - {cotacao.enderecoColeta.estado}</p>
                                </div>
                              </div>
                            ) : (
                              <p className="text-gray-500">Endereço de coleta não encontrado</p>
                            )}
                          </div>

                          {/* Dados do Destinatário */}
                          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                            <h4 className="font-bold text-red-900 flex items-center gap-2 mb-3">
                              <User className="w-5 h-5" />
                              DESTINATÁRIO
                            </h4>
                            {cotacao.destinatario ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                <div className="md:col-span-2">
                                  <span className="text-gray-500">Nome Completo:</span>
                                  <p className="font-semibold">{cotacao.destinatario.nomeCompleto}</p>
                                </div>
                                <div>
                                  <span className="text-gray-500">CEP:</span>
                                  <p className="font-semibold font-mono">{cotacao.destinatario.cep}</p>
                                </div>
                                <div className="md:col-span-2">
                                  <span className="text-gray-500">Endereço:</span>
                                  <p className="font-semibold">
                                    {cotacao.destinatario.logradouro}, {cotacao.destinatario.numero}
                                    {cotacao.destinatario.complemento && ` - ${cotacao.destinatario.complemento}`}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-gray-500">Bairro:</span>
                                  <p className="font-semibold">{cotacao.destinatario.bairro}</p>
                                </div>
                                <div>
                                  <span className="text-gray-500">Cidade/Estado:</span>
                                  <p className="font-semibold">{cotacao.destinatario.cidade} - {cotacao.destinatario.estado}</p>
                                </div>
                              </div>
                            ) : (
                              <p className="text-gray-500">Destinatário não encontrado</p>
                            )}
                          </div>

                          {/* Botão Exportar CSV */}
                          <Button
                            onClick={() => exportarCSV(cotacao)}
                            className="w-full bg-green-600 hover:bg-green-700"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Exportar Dados em CSV
                          </Button>
                          </>
                          )}
                        </div>
                      )}

                      {/* Produtos em lista compacta */}
                      <div className="text-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <Package className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-700">{cotacao.produtoNome}</span>
                          <span className="text-xs text-gray-400 font-mono">NCM: {cotacao.produtoNCM}</span>
                        </div>
                      </div>

                      {/* Info compacta em linha */}
                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        <div className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
                          <Calendar className="w-4 h-4 text-amber-600" />
                          <span className="font-semibold text-amber-700">
                            {new Date(cotacao.dataHoraColeta).toLocaleDateString('pt-BR')} {new Date(cotacao.dataHoraColeta).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-1 mb-1">
                            <DollarSign className="w-4 h-4 text-green-600" />
                            <span className="text-xs font-semibold text-green-700">VALORES</span>
                          </div>
                          {(() => {
                            const valorTotal = cotacao.resposta?.valorTotal || 0;
                            const valorSeguro = cotacao.resposta?.valorSeguro || 0;
                            const comissao = valorTotal * 0.05;
                            const valorFrete = valorTotal - comissao - valorSeguro;

                            return (
                              <div className="space-y-0.5 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Frete:</span>
                                  <span className="font-bold text-green-800">R$ {valorFrete.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Comissão:</span>
                                  <span className="font-bold text-purple-700">R$ {comissao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </div>
                                {valorSeguro > 0 && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Seguro:</span>
                                    <span className="font-bold text-orange-700">R$ {valorSeguro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                  </div>
                                )}
                                <div className="flex justify-between pt-0.5 border-t border-green-300">
                                  <span className="font-semibold text-gray-700">Total:</span>
                                  <span className="font-bold text-green-900">R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                        <div className="flex items-center gap-1 px-2 py-1.5 bg-gray-50 rounded-lg">
                          <Weight className="w-3 h-3 text-gray-500" />
                          <span className="text-gray-700">{cotacao.pesoTotal} kg</span>
                        </div>
                        <div className="flex items-center gap-1 px-2 py-1.5 bg-gray-50 rounded-lg">
                          <Box className="w-3 h-3 text-gray-500" />
                          <span className="text-gray-700">{cotacao.quantidadeVolumes} vol</span>
                        </div>
                        <Badge variant="outline" className="text-xs">{cotacao.tipoFrete}</Badge>
                      </div>

                      {/* Serviços Adicionais compacto */}
                      {cotacao.servicosAdicionais && (cotacao.servicosAdicionais.precisaPalete || cotacao.servicosAdicionais.ehUrgente || cotacao.servicosAdicionais.ehFragil || cotacao.servicosAdicionais.precisaCargaDedicada) && (
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="text-xs text-gray-500">Serviços:</span>
                          {cotacao.servicosAdicionais.precisaPalete && <Badge variant="outline" className="text-xs">Palete</Badge>}
                          {cotacao.servicosAdicionais.ehUrgente && <Badge variant="outline" className="text-xs">Urgente</Badge>}
                          {cotacao.servicosAdicionais.ehFragil && <Badge variant="outline" className="text-xs">Frágil</Badge>}
                          {cotacao.servicosAdicionais.precisaCargaDedicada && <Badge variant="outline" className="text-xs">Dedicada</Badge>}
                        </div>
                      )}

                      {/* ETAPAS OBRIGATÓRIAS */}
                      <div className="space-y-3 pt-3 border-t">
                        <h4 className="font-semibold text-gray-700 text-sm">Etapas Obrigatórias para Entrega:</h4>
                        
                        {/* ETAPA 1: Conhecimento/Documento de Transporte */}
                        <div className={`p-3 rounded-lg border ${cotacao.cteRegistrado ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200"}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {cotacao.cteRegistrado ? (
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                              ) : (
                                <AlertCircle className="w-5 h-5 text-orange-600" />
                              )}
                              <div>
                                <span className="font-medium text-sm">1. Conhecimento de Transporte</span>
                                {cotacao.cteRegistrado && (
                                  <p className="text-xs text-gray-600">
                                    Código: <span className="font-mono">{cotacao.codigoCTe}</span> | 
                                    Valor: R$ {cotacao.valorFinalTransportadora?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Link to={createPageUrl(`BiparCTe?id=${cotacao.id}`)}>
                              <Button size="sm" variant={cotacao.cteRegistrado ? "outline" : "default"}>
                                <ScanLine className="w-4 h-4 mr-1" />
                                {cotacao.cteRegistrado ? "Editar" : "Informar"}
                              </Button>
                            </Link>
                          </div>
                        </div>

                        {/* ETAPA 2: Documentos Anexados */}
                        <div className={`p-3 rounded-lg border ${(cotacao.documentosEntrega?.length > 0 || cotacao.documentoCte) ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200"}`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {(cotacao.documentosEntrega?.length > 0 || cotacao.documentoCte) ? (
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                              ) : (
                                <AlertCircle className="w-5 h-5 text-orange-600" />
                              )}
                              <span className="font-medium text-sm">2. Documentos (XML, PDF, etc)</span>
                            </div>
                            <div>
                              <Label htmlFor={`upload-doc-${cotacao.id}`} className="cursor-pointer">
                                <Button size="sm" variant="outline" asChild disabled={uploadingDocs[cotacao.id]}>
                                  <span>
                                    {uploadingDocs[cotacao.id] ? (
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-1" />
                                    ) : (
                                      <Upload className="w-4 h-4 mr-1" />
                                    )}
                                    Anexar
                                  </span>
                                </Button>
                              </Label>
                              <input
                                id={`upload-doc-${cotacao.id}`}
                                type="file"
                                multiple
                                accept=".xml,.pdf,.png,.jpg,.jpeg"
                                onChange={(e) => handleUploadDocumento(cotacao.id, e)}
                                className="hidden"
                                disabled={uploadingDocs[cotacao.id]}
                              />
                            </div>
                          </div>
                          {cotacao.documentosEntrega?.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {cotacao.documentosEntrega.map((doc, idx) => (
                                <div key={idx} className="flex items-center gap-1 px-2 py-1 bg-white rounded border text-xs">
                                  <FileText className="w-3 h-3 text-blue-600" />
                                  <a href={doc} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                    Doc {idx + 1}
                                  </a>
                                  <button onClick={() => handleRemoverDocumento(cotacao.id, idx)} className="ml-1 text-red-500 hover:text-red-700">
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* ETAPA 3: Rastreamento */}
                        <div className={`p-3 rounded-lg border ${(cotacao.urlRastreamento && cotacao.codigoRastreio) ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200"}`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {(cotacao.urlRastreamento && cotacao.codigoRastreio) ? (
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                              ) : (
                                <AlertCircle className="w-5 h-5 text-orange-600" />
                              )}
                              <span className="font-medium text-sm">3. Rastreamento</span>
                            </div>
                            {!editandoRastreio[cotacao.id] && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setEditandoRastreio(prev => ({ ...prev, [cotacao.id]: true }));
                                  setUrlRastreioTemp(prev => ({ ...prev, [cotacao.id]: cotacao.urlRastreamento || "" }));
                                  setCodigoRastreioTemp(prev => ({ ...prev, [cotacao.id]: cotacao.codigoRastreio || "" }));
                                }}
                              >
                                <LinkIcon className="w-4 h-4 mr-1" />
                                {(cotacao.urlRastreamento && cotacao.codigoRastreio) ? "Editar" : "Informar"}
                              </Button>
                            )}
                          </div>
                          
                          {(cotacao.urlRastreamento && cotacao.codigoRastreio) && !editandoRastreio[cotacao.id] && (
                            <div className="text-xs space-y-1">
                              <p><span className="text-gray-500">URL:</span> <a href={cotacao.urlRastreamento} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">{cotacao.urlRastreamento}</a></p>
                              <p><span className="text-gray-500">Código:</span> <span className="font-mono">{cotacao.codigoRastreio}</span></p>
                            </div>
                          )}

                          {editandoRastreio[cotacao.id] && (
                            <div className="space-y-2 mt-2">
                              <div>
                                <Label className="text-xs">URL de Rastreamento</Label>
                                <Input
                                  type="url"
                                  placeholder="https://rastreamento.transportadora.com.br/..."
                                  value={urlRastreioTemp[cotacao.id] || ""}
                                  onChange={(e) => setUrlRastreioTemp(prev => ({ ...prev, [cotacao.id]: e.target.value }))}
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Código de Rastreio</Label>
                                <Input
                                  placeholder="Ex: BR123456789XX"
                                  value={codigoRastreioTemp[cotacao.id] || ""}
                                  onChange={(e) => setCodigoRastreioTemp(prev => ({ ...prev, [cotacao.id]: e.target.value }))}
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => setEditandoRastreio(prev => ({ ...prev, [cotacao.id]: false }))}
                                >
                                  Cancelar
                                </Button>
                                <Button 
                                  size="sm"
                                  onClick={() => handleSalvarRastreio(cotacao.id)}
                                  disabled={salvandoRastreio[cotacao.id]}
                                >
                                  {salvandoRastreio[cotacao.id] ? "Salvando..." : "Salvar"}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Status de Aprovação de CT-e e Botão Aceitar Valor Inicial */}
                        {cotacao.status === "aguardando_aprovacao_cte" && (
                          <div className="space-y-3">
                            <Alert className="bg-yellow-50 border-yellow-200 py-2">
                              <AlertCircle className="h-4 w-4 text-yellow-600" />
                              <AlertDescription className="text-yellow-800 text-sm">
                                Aguardando aprovação do cliente para o valor informado.
                                <Link to={createPageUrl(`ContraPropostaCTe?id=${cotacao.id}`)} className="ml-2 underline font-medium">
                                  Ver negociação
                                </Link>
                              </AlertDescription>
                            </Alert>

                            <Button
                              onClick={() => handleAceitarValorInicial(cotacao.id)}
                              disabled={aceitandoValorInicial[cotacao.id]}
                              className="w-full bg-gray-600 hover:bg-gray-700"
                            >
                              {aceitandoValorInicial[cotacao.id] ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                              )}
                              Aceitar Valor Inicial da Cotação
                            </Button>
                          </div>
                        )}

                        {/* Mensagem de conclusão */}
                        {cotacao.cteRegistrado && (cotacao.documentosEntrega?.length > 0 || cotacao.documentoCte) && cotacao.urlRastreamento && cotacao.codigoRastreio && cotacao.status !== "aguardando_aprovacao_cte" && (
                          <Alert className="bg-green-50 border-green-200 py-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-800 text-sm">
                              <strong>Tudo pronto!</strong> Esta cotação foi movida para "Em Entrega". Acesse o menu para finalizar após a entrega.
                            </AlertDescription>
                          </Alert>
                        )}

                        {/* Aviso de pendências */}
                        {(!cotacao.cteRegistrado || !(cotacao.documentosEntrega?.length > 0 || cotacao.documentoCte) || !cotacao.urlRastreamento || !cotacao.codigoRastreio) && cotacao.status !== "aguardando_aprovacao_cte" && (
                          <p className="text-xs text-gray-500 text-center">
                            Complete todas as etapas acima para liberar a cotação para "Em Entrega"
                          </p>
                        )}
                      </div>
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
