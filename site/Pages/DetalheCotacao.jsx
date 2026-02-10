import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Package,
  MapPin,
  Clock,
  TrendingUp,
  Star,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Plane,
  Ship,
  Truck,
  Target,
  Calendar,
  Weight,
  DollarSign,
  Box,
  User,
  FileText
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PageHeader from "../components/common/PageHeader";
import LoadingSpinner from "../components/common/LoadingSpinner";
import StatusBadge from "../components/common/StatusBadge";
import CountdownTimer from "../components/common/CountdownTimer";

export default function DetalheCotacao() {
  const urlParams = new URLSearchParams(window.location.search);
  const cotacaoId = urlParams.get('id');

  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [transportadoraSelecionada, setTransportadoraSelecionada] = useState({});
  const [transportadoraExpandida, setTransportadoraExpandida] = useState({}); // New state for transportadora card expansion
  const [adicionaisExpandido, setAdicionaisExpandido] = useState({});
  const visualizadaRef = useRef(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userData = await base44.auth.me();
    setUser(userData);
  };

  const { data: cotacao, isLoading: loadingCotacao } = useQuery({
    queryKey: ['cotacao', cotacaoId],
    queryFn: async () => {
      const result = await base44.entities.Cotacao.filter({ id: cotacaoId });
      if (result.length === 0) {
        setError("Cotação não encontrada");
        return null;
      }
      return result[0];
    },
    enabled: !!cotacaoId
  });

  const { data: respostas = [], isLoading: loadingRespostas } = useQuery({
    queryKey: ['respostas-cotacao', cotacaoId],
    queryFn: async () => {
      return await base44.entities.RespostaCotacao.filter({ cotacaoId }, "-created_date");
    },
    enabled: !!cotacaoId
  });

  // Buscar perfil do cliente para verificar CPF/CNPJ
  const { data: perfilCliente } = useQuery({
    queryKey: ['perfil-cliente-cotacao', user?.perfilAtivoId],
    queryFn: async () => {
      if (!user || !user.perfilAtivoId) return null;
      const perfis = await base44.entities.PerfilCliente.filter({
        userIdGoogle: user.perfilAtivoId
      });
      return perfis[0] || null;
    },
    enabled: !!user && !!user.perfilAtivoId
  });

  // Buscar destinatário da cotação
  const { data: destinatario } = useQuery({
    queryKey: ['destinatario-cotacao', cotacao?.destinatarioId],
    queryFn: async () => {
      if (!cotacao?.destinatarioId) return null;
      const dests = await base44.entities.Destinatario.filter({ id: cotacao.destinatarioId });
      return dests[0] || null;
    },
    enabled: !!cotacao?.destinatarioId
  });

  // Buscar perfis das transportadoras para pegar avaliações
  const { data: perfisTransportadoras = {} } = useQuery({
    queryKey: ['perfis-transportadoras', respostas.map(r => r.transportadoraId).join(',')],
    queryFn: async () => {
      const transportadorasIds = [...new Set(respostas.map(r => r.transportadoraId))];
      const perfis = await Promise.all(
        transportadorasIds.map(id =>
          base44.entities.PerfilTransportadora.filter({ userIdGoogle: id })
        )
      );

      const perfisMap = {};
      perfis.forEach((perfilArray, index) => {
        if (perfilArray.length > 0) {
          perfisMap[transportadorasIds[index]] = perfilArray[0];
        }
      });
      return perfisMap;
    },
    enabled: respostas.length > 0
  });

  useEffect(() => {
    const marcarVisualizada = async () => {
      if (cotacao && respostas.length > 0 && !cotacao.primeiraVisualizacao &&
          !visualizadaRef.current && user &&
          (cotacao.status === "aberta" || cotacao.status === "em_andamento")) {
        visualizadaRef.current = true;
        try {
          await base44.entities.Cotacao.update(cotacao.id, {
            status: "visualizada",
            primeiraVisualizacao: new Date().toISOString()
          });
          queryClient.invalidateQueries({ queryKey: ['cotacao', cotacaoId] });
        } catch (error) {
          console.error("Erro ao marcar como visualizada:", error);
        }
      }
    };

    marcarVisualizada();
  }, [cotacao, respostas, user, cotacaoId, queryClient]);

  const handleSelecionarOpcaoEnvio = (transportadoraId, respostaId) => {
    setTransportadoraSelecionada(prev => ({
      ...prev,
      [transportadoraId]: {
        ...prev[transportadoraId],
        opcaoEnvioSelecionada: respostaId,
        adicionaisSelecionados: prev[transportadoraId]?.adicionaisSelecionados || {}
      }
    }));
  };

  const handleToggleAdicional = (transportadoraId, adicional) => {
    setTransportadoraSelecionada(prev => ({
      ...prev,
      [transportadoraId]: {
        ...prev[transportadoraId],
        adicionaisSelecionados: {
          ...prev[transportadoraId]?.adicionaisSelecionados,
          [adicional]: !prev[transportadoraId]?.adicionaisSelecionados?.[adicional]
        }
      }
    }));
  };

  const calcularValorTotal = (resposta, adicionaisSelecionados = {}) => {
    let total = resposta.valorBase;

    if (adicionaisSelecionados.palete && resposta.valorPalete > 0) {
      total += resposta.valorPalete;
    }
    if (adicionaisSelecionados.urgente && resposta.valorUrgente > 0) {
      total += resposta.valorUrgente;
    }
    if (adicionaisSelecionados.fragil && resposta.valorFragil > 0) {
      total += resposta.valorFragil;
    }
    if (adicionaisSelecionados.cargaDedicada && resposta.valorCargaDedicada > 0) {
      total += resposta.valorCargaDedicada;
    }

    return total;
  };

  const handleAceitarProposta = async (transportadoraId) => {
    const selecao = transportadoraSelecionada[transportadoraId];

    if (!selecao?.opcaoEnvioSelecionada) {
      setError("Selecione uma opção de envio antes de aceitar");
      return;
    }

    const respostaOriginal = respostas.find(r => r.id === selecao.opcaoEnvioSelecionada);
    const valorTotalCalculado = calcularValorTotal(respostaOriginal, selecao.adicionaisSelecionados);

    // Atualizar a resposta com os valores selecionados
    await base44.entities.RespostaCotacao.update(selecao.opcaoEnvioSelecionada, {
      valorPalete: selecao.adicionaisSelecionados?.palete ? respostaOriginal.valorPalete : 0,
      valorUrgente: selecao.adicionaisSelecionados?.urgente ? respostaOriginal.valorUrgente : 0,
      valorFragil: selecao.adicionaisSelecionados?.fragil ? respostaOriginal.valorFragil : 0,
      valorCargaDedicada: selecao.adicionaisSelecionados?.cargaDedicada ? respostaOriginal.valorCargaDedicada : 0,
      valorTotal: valorTotalCalculado
    });

    // Verificar se é CPF e precisa de pagamento antecipado
    const ehCPF = perfilCliente?.cpfOuCnpj && (perfilCliente.cpfOuCnpj.length === 11 || perfilCliente.cpfOuCnpj.length === 14);

    if (ehCPF) {
      if (!confirm(`Tem certeza que deseja aceitar esta proposta?\n\nOpção: ${respostaOriginal.opcaoEnvioNome}\nValor Total: R$ ${valorTotalCalculado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n⚠️ ATENÇÃO: Como cliente CPF, você será direcionado para realizar o pagamento antecipado.`)) {
        return;
      }

      try {
        // Atualizar cotação para aguardando pagamento
        await base44.entities.Cotacao.update(cotacao.id, {
          status: "aguardando_pagamento",
          statusPagamento: "pendente",
          respostaSelecionadaId: selecao.opcaoEnvioSelecionada,
          valorOriginalCotacao: valorTotalCalculado
        });
        
        setSuccess("Proposta selecionada! Você será direcionado para a página de pagamento.");
        
        // Redirecionar para página de créditos após 2 segundos
        setTimeout(() => {
          window.location.href = createPageUrl("Creditos");
        }, 2000);
        
      } catch (error) {
        setError("Erro ao aceitar proposta");
      }
    } else {
      // Cliente CNPJ - fluxo normal
      if (!confirm(`Tem certeza que deseja aceitar esta proposta?\n\nOpção: ${respostaOriginal.opcaoEnvioNome}\nValor Total: R$ ${valorTotalCalculado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\nIsso iniciará o processo de entrega.`)) {
        return;
      }

      try {
        await base44.entities.Cotacao.update(cotacao.id, {
          status: "aceita",
          statusPagamento: "nao_requerido",
          respostaSelecionadaId: selecao.opcaoEnvioSelecionada,
          valorOriginalCotacao: valorTotalCalculado
        });
        setSuccess("Proposta aceita com sucesso! Acesse a página de Chats para conversar com a transportadora.");
        queryClient.invalidateQueries({ queryKey: ['cotacao', cotacaoId] });
      } catch (error) {
        setError("Erro ao aceitar proposta");
      }
    }
  };

  const handleCancelarCotacao = async () => {
    if (!user?.isPremium) {
      setError("Apenas usuários Premium podem cancelar cotações");
      return;
    }

    const mesAtual = new Date().toISOString().slice(0, 7);
    let updatedUser = { ...user };

    if (user.mesReferenciaCancel !== mesAtual) {
      const newUserData = {
        cancelamentosRealizadosMes: 0,
        mesReferenciaCancel: mesAtual
      };
      await base44.auth.updateMe(newUserData);
      updatedUser = { ...updatedUser, ...newUserData };
      setUser(updatedUser);
    }

    const cancelamentosRealizados = updatedUser.cancelamentosRealizadosMes || 0;
    const limiteCancelamentos = updatedUser.limiteCancelamentosMes || 3;

    if (cancelamentosRealizados >= limiteCancelamentos) {
      setError(`Você atingiu o limite de ${limiteCancelamentos} cancelamentos por mês.`);
      return;
    }

    const remainingCancellations = limiteCancelamentos - cancelamentosRealizados - 1;
    const confirmMessage = `Tem certeza que deseja cancelar esta cotação? Você poderá cancelar mais ${remainingCancellations >= 0 ? remainingCancellations : 0} cotação(ões) este mês.`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      await base44.entities.Cotacao.update(cotacao.id, { status: "cancelada" });
      await base44.auth.updateMe({
        cancelamentosRealizadosMes: cancelamentosRealizados + 1
      });
      setSuccess("Cotação cancelada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['cotacao', cotacaoId] });
    } catch (error) {
      console.error("Erro ao cancelar cotação:", error);
      setError("Erro ao cancelar cotação");
    }
  };

  const renderEstrelas = (nota) => {
    const estrelas = [];
    for (let i = 1; i <= 5; i++) {
      estrelas.push(
        <Star
          key={i}
          className={`w-4 h-4 ${i <= nota ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
        />
      );
    }
    return estrelas;
  };

  if (!user || loadingCotacao || loadingRespostas || perfilCliente === undefined) {
    return <LoadingSpinner message="Carregando cotação..." />;
  }

  if (error && !cotacao) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
        <PageHeader title="Erro" showBack={true} />
        <div className="p-6 max-w-4xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!cotacao) {
    return <LoadingSpinner message="Carregando cotação..." />;
  }

  // Agrupar respostas por transportadora
  const respostasPorTransportadora = respostas.reduce((acc, resposta) => {
    if (!acc[resposta.transportadoraId]) {
      acc[resposta.transportadoraId] = {
        transportadoraId: resposta.transportadoraId,
        transportadoraNome: resposta.transportadoraNome,
        transportadoraLogo: resposta.transportadoraLogo,
        isPremium: resposta.isPremium,
        respostas: []
      };
    }
    acc[resposta.transportadoraId].respostas.push(resposta);
    return acc;
  }, {});

  let transportadorasArray = Object.values(respostasPorTransportadora);

  // Calcular menor valor base de cada transportadora
  transportadorasArray.forEach(transp => {
    transp.menorValorBase = Math.min(...transp.respostas.map(r => r.valorBase));
    const perfil = perfisTransportadoras[transp.transportadoraId];
    transp.avaliacaoMedia = perfil?.avaliacaoMedia || 0;
    transp.totalAvaliacoes = perfil?.totalAvaliacoes || 0;
  });

  // Separar premium e não-premium, e ordenar por menor valor base
  const transportadorasPremium = transportadorasArray
    .filter(t => t.isPremium)
    .sort((a, b) => a.menorValorBase - b.menorValorBase);

  const transportadorasNormal = transportadorasArray
    .filter(t => !t.isPremium)
    .sort((a, b) => a.menorValorBase - b.menorValorBase);

  const transportadorasOrdenadas = [...transportadorasPremium, ...transportadorasNormal];

  const cotacaoAtiva = cotacao?.dataHoraFim && new Date(cotacao.dataHoraFim) > new Date() && (cotacao.status === "aberta" || cotacao.status === "em_andamento");
  const podeSelecionar = (cotacao.status === "em_andamento" || cotacao.status === "visualizada") && respostas.length > 0;

  const iconesEnvio = {
    "Aéreo": <Plane className="w-4 h-4" />,
    "Marítimo": <Ship className="w-4 h-4" />,
    "Terrestre": <Truck className="w-4 h-4" />,
    "Dedicado": <Target className="w-4 h-4" />
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <PageHeader
        title="Detalhes da Cotação"
        description="Visualize e gerencie sua cotação"
        showBack={true}
      />

      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4 md:space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {cotacao.status === "aguardando_pagamento" && (
          <Alert className="bg-orange-50 border-orange-300">
            <Clock className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-900">
              <strong>⚠️ Pagamento Pendente</strong><br />
              Esta cotação está aguardando pagamento antecipado. Complete o pagamento para iniciar o processo de entrega.
              <Link to={createPageUrl("Creditos")}>
                <Button size="sm" className="ml-3 mt-2 bg-orange-600 hover:bg-orange-700">
                  Pagar Agora
                </Button>
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {cotacao.status === "aceita" && cotacao.respostaSelecionadaId && (
          <Alert className="bg-blue-50 border-blue-200">
            <MessageSquare className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Cotação aceita!</strong> Entre em contato com a transportadora através do chat.
              <Link to={createPageUrl("Chats")}>
                <Button size="sm" className="ml-3 bg-blue-600 hover:bg-blue-700">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Abrir Chat
                </Button>
              </Link>
            </AlertDescription>
          </Alert>
        )}

        <Card className="overflow-hidden">
          {/* Header */}
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2 text-white">
                <FileText className="w-5 h-5" />
                Cotação #{cotacao.id.slice(0, 8)}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge className="bg-white/20 text-white border-0">
                  {cotacao.tipoFrete}
                </Badge>
                <StatusBadge status={cotacao.status} />
                {cotacaoAtiva && (
                  <CountdownTimer 
                    dataHoraFim={cotacao.dataHoraFim}
                    onExpire={() => {
                      queryClient.invalidateQueries(['cotacao', cotacaoId]);
                    }}
                  />
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* Alerta para Transportador - Dados Limitados */}
            {user?.tipo === "transportadora" && (
              <Alert className="m-3 bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 text-sm">
                  <strong>Por segurança:</strong> Você visualiza CEP, cidade, estado, valor NF e horário de coleta. Endereço e nome do embarcador são revelados apenas após aceitar sua proposta.
                </AlertDescription>
              </Alert>
            )}

            {/* Destinatário - Visível apenas para embarcador */}
            {user?.tipo === "cliente" && (
              <>
                <div className="p-3 bg-purple-50 border-b flex items-center gap-2">
                  <User className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-bold text-purple-700">DESTINATÁRIO:</span>
                  <span className="font-semibold text-sm text-gray-900">
                    {destinatario?.nomeCompleto || "Carregando..."}
                  </span>
                </div>

                {/* Endereço Completo Destinatário - Visível apenas para embarcador */}
                {destinatario && (
                  <div className="p-3 bg-purple-50/50 border-b text-xs text-gray-600">
                    <span className="font-medium">Endereço:</span> {destinatario.logradouro}, {destinatario.numero}
                    {destinatario.complemento && ` - ${destinatario.complemento}`}
                    {" - "}{destinatario.bairro}, {destinatario.cidade}/{destinatario.estado}
                  </div>
                )}
              </>
            )}

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

            {/* Info Grid */}
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
              
              {/* Valor NF - Visível para todos (embarcador e transportador) */}
              <div className="p-3 text-center">
                <DollarSign className="w-4 h-4 text-green-600 mx-auto" />
                <p className="text-xs text-gray-500 mt-1">Valor NF</p>
                <p className="font-bold text-gray-900">
                  R$ {(cotacao.valorNotaFiscal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                </p>
              </div>

              {/* Data e Horário de Coleta - Visível para todos */}
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

            {/* Produtos */}
            <div className="p-3 border-b bg-gray-50">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-gray-700">PRODUTO</span>
                <span className="text-xs text-gray-500">NCM: {cotacao.produtoNCM}</span>
              </div>
              <p className="text-sm font-medium text-gray-900">{cotacao.produtoNome}</p>
              
              {cotacao.produtosLista && cotacao.produtosLista.length > 0 && (
                <div className="mt-2 space-y-1">
                  {cotacao.produtosLista.map((p, i) => (
                    <div key={i} className="flex justify-between text-sm bg-white p-2 rounded">
                      <span className="font-medium text-gray-900">{p.nome}</span>
                      <span className="text-gray-600">Qtd: {p.quantidade}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Serviços Adicionais */}
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

            {/* Footer */}
            <div className="p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gray-50">
              <div className="text-sm text-gray-600">
                <span className="font-semibold">Propostas recebidas:</span> {respostas.length}
              </div>
              {(cotacao.status === "aberta" || cotacao.status === "em_andamento" || cotacao.status === "visualizada") && !user?.isPremium && (
                <p className="text-xs md:text-sm text-gray-500">
                  Apenas usuários Premium podem cancelar cotações
                </p>
              )}
              {(cotacao.status === "aberta" || cotacao.status === "em_andamento" || cotacao.status === "visualizada") && user?.isPremium && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelarCotacao}
                  className="text-red-600 hover:bg-red-50 text-xs md:text-sm"
                >
                  <XCircle className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                  Cancelar Cotação
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3 md:space-y-4">
          {/* Seção de Propostas - Visível apenas para embarcador */}
          {user?.tipo === "cliente" && (
            <>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                Propostas Recebidas ({transportadorasOrdenadas.length} transportadora{transportadorasOrdenadas.length !== 1 ? 's' : ''})
              </h2>

              {transportadorasOrdenadas.length === 0 ? (
                <Card>
                  <CardContent className="p-8 md:p-12 text-center">
                    <TrendingUp className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">
                      Nenhuma proposta recebida ainda
                    </h3>
                    <p className="text-sm md:text-base text-gray-500">
                      Aguarde as transportadoras enviarem suas propostas
                    </p>
                  </CardContent>
                </Card>
              ) : (
                transportadorasOrdenadas.map((transportadora) => {
              const isExpanded = transportadoraExpandida[transportadora.transportadoraId];
              const selecao = transportadoraSelecionada[transportadora.transportadoraId] || {};
              const respostaSelecionada = transportadora.respostas.find(r => r.id === selecao.opcaoEnvioSelecionada);
              const valorTotal = respostaSelecionada ? calcularValorTotal(respostaSelecionada, selecao.adicionaisSelecionados) : 0;
              const adicionaisOpen = adicionaisExpandido[transportadora.transportadoraId];

              // Verificar quais adicionais estão disponíveis
              const temAdicionais = transportadora.respostas.some(r =>
                r.valorPalete > 0 || r.valorUrgente > 0 || r.valorFragil > 0 || r.valorCargaDedicada > 0
              );

              const cotacaoAceita = cotacao.respostaSelecionadaId &&
                                     transportadora.respostas.some(r => r.id === cotacao.respostaSelecionadaId);

              return (
                <Card
                  key={transportadora.transportadoraId}
                  className={`transition-shadow duration-300 ${
                    transportadora.isPremium ? 'border-2 border-yellow-400 bg-gradient-to-r from-yellow-50 to-white' : ''
                  } ${
                    cotacaoAceita ? 'border-2 border-green-500 bg-green-50' : ''
                  }`}
                >
                  {/* Cabeçalho Clicável */}
                  <div
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setTransportadoraExpandida(prev => ({
                      ...prev,
                      [transportadora.transportadoraId]: !prev[transportadora.transportadoraId]
                    }))}
                  >
                    <div className="flex items-center gap-3 md:gap-4">
                      {transportadora.transportadoraLogo ? (
                        <img
                          src={transportadora.transportadoraLogo}
                          alt={transportadora.transportadoraNome}
                          className="w-12 h-12 md:w-16 md:h-16 rounded-lg object-cover border-2 border-gray-200 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Package className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-bold text-gray-900 text-sm md:text-lg truncate">
                            {transportadora.transportadoraNome}
                          </h3>
                          {transportadora.isPremium && (
                            <Badge className="bg-yellow-400 text-yellow-900 border-yellow-500 text-xs flex-shrink-0">
                              <Star className="w-3 h-3 mr-1 fill-yellow-900" />
                              Premium
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap text-xs md:text-sm">
                          <Badge className="bg-blue-100 text-blue-800 text-xs">
                            {transportadora.respostas.length} {transportadora.respostas.length === 1 ? 'opção' : 'opções'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            A partir de R$ {transportadora.menorValorBase.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </Badge>
                          <div className="flex items-center gap-1">
                            {renderEstrelas(Math.round(transportadora.avaliacaoMedia))}
                            <span className="text-xs text-gray-600 ml-1">
                              {transportadora.avaliacaoMedia.toFixed(1)} ({transportadora.totalAvaliacoes})
                            </span>
                          </div>
                        </div>
                      </div>

                      {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />}
                    </div>
                  </div>

                  {/* Conteúdo Expansível */}
                  {isExpanded && (
                    <CardContent className="pt-0 pb-4 px-4 space-y-4">
                      {/* Opções de Envio - GRID 2 COLUNAS */}
                      <div>
                        <Label className="text-sm font-semibold text-gray-700 mb-3 block">
                          Selecione uma Opção de Envio:
                        </Label>
                        <RadioGroup
                          value={selecao.opcaoEnvioSelecionada || ""}
                          onValueChange={(value) => handleSelecionarOpcaoEnvio(transportadora.transportadoraId, value)}
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {transportadora.respostas.map((resposta) => (
                              <div
                                key={resposta.id}
                                className={`flex items-start space-x-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                  selecao.opcaoEnvioSelecionada === resposta.id
                                    ? 'border-blue-600 bg-blue-50'
                                    : 'border-gray-200 hover:border-blue-300'
                                }`}
                                onClick={() => handleSelecionarOpcaoEnvio(transportadora.transportadoraId, resposta.id)}
                              >
                                <RadioGroupItem value={resposta.id} id={resposta.id} className="mt-1 flex-shrink-0" />
                                <Label
                                  htmlFor={resposta.id}
                                  className="flex-1 cursor-pointer"
                                >
                                  <div className="flex items-center gap-2 font-semibold text-gray-900 text-sm mb-2">
                                    {iconesEnvio[resposta.opcaoEnvioNome]}
                                    {resposta.opcaoEnvioNome}
                                  </div>
                                  <div className="flex items-center justify-between text-xs">
                                    <div>
                                      <p className="text-gray-500">Valor Base</p>
                                      <p className="font-bold text-gray-900">
                                        R$ {resposta.valorBase.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-gray-500">Prazo</p>
                                      <p className="font-bold text-gray-900">
                                        {resposta.tempoEntregaDias} {resposta.tempoEntregaDias === 1 ? 'dia' : 'dias'}
                                      </p>
                                    </div>
                                  </div>
                                </Label>
                              </div>
                            ))}
                          </div>
                        </RadioGroup>
                      </div>

                      {/* Serviços Adicionais */}
                      {temAdicionais && respostaSelecionada && (
                        <div className="border-t pt-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full flex items-center justify-between p-2"
                            onClick={() => setAdicionaisExpandido(prev => ({
                              ...prev,
                              [transportadora.transportadoraId]: !prev[transportadora.transportadoraId]
                            }))}
                          >
                            <span className="text-sm font-semibold text-gray-700">Serviços Adicionais (Opcionais)</span>
                            {adicionaisOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </Button>

                          {adicionaisOpen && (
                            <div className="mt-3 space-y-2 p-3 bg-gray-50 rounded-lg">
                              {respostaSelecionada.valorPalete > 0 && (
                                <div className="flex items-center justify-between text-sm">
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`palete-${transportadora.transportadoraId}`}
                                      checked={selecao.adicionaisSelecionados?.palete || false}
                                      onCheckedChange={() => handleToggleAdicional(transportadora.transportadoraId, 'palete')}
                                    />
                                    <Label htmlFor={`palete-${transportadora.transportadoraId}`} className="cursor-pointer text-sm">
                                      Paletização
                                    </Label>
                                  </div>
                                  <span className="font-semibold text-gray-900 text-sm">
                                    + R$ {respostaSelecionada.valorPalete.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                              )}

                              {respostaSelecionada.valorUrgente > 0 && (
                                <div className="flex items-center justify-between text-sm">
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`urgente-${transportadora.transportadoraId}`}
                                      checked={selecao.adicionaisSelecionados?.urgente || false}
                                      onCheckedChange={() => handleToggleAdicional(transportadora.transportadoraId, 'urgente')}
                                    />
                                    <Label htmlFor={`urgente-${transportadora.transportadoraId}`} className="cursor-pointer text-sm">
                                      Entrega Urgente
                                    </Label>
                                  </div>
                                  <span className="font-semibold text-gray-900 text-sm">
                                    + R$ {respostaSelecionada.valorUrgente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                              )}

                              {respostaSelecionada.valorFragil > 0 && (
                                <div className="flex items-center justify-between text-sm">
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`fragil-${transportadora.transportadoraId}`}
                                      checked={selecao.adicionaisSelecionados?.fragil || false}
                                      onCheckedChange={() => handleToggleAdicional(transportadora.transportadoraId, 'fragil')}
                                    />
                                    <Label htmlFor={`fragil-${transportadora.transportadoraId}`} className="cursor-pointer text-sm">
                                      Carga Frágil
                                    </Label>
                                  </div>
                                  <span className="font-semibold text-gray-900 text-sm">
                                    + R$ {respostaSelecionada.valorFragil.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                              )}

                              {respostaSelecionada.valorCargaDedicada > 0 && (
                                <div className="flex items-center justify-between text-sm">
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`cargaDedicada-${transportadora.transportadoraId}`}
                                      checked={selecao.adicionaisSelecionados?.cargaDedicada || false}
                                      onCheckedChange={() => handleToggleAdicional(transportadora.transportadoraId, 'cargaDedicada')}
                                    />
                                    <Label htmlFor={`cargaDedicada-${transportadora.transportadoraId}`} className="cursor-pointer text-sm">
                                      Carga Dedicada
                                    </Label>
                                  </div>
                                  <span className="font-semibold text-gray-900 text-sm">
                                    + R$ {respostaSelecionada.valorCargaDedicada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Valor Total e Botão */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t">
                        <div>
                          {respostaSelecionada ? (
                            <>
                              <p className="text-xs text-gray-500 mb-1">Valor Total</p>
                              <p className="text-2xl md:text-3xl font-bold text-green-600">
                                R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Prazo: {respostaSelecionada.tempoEntregaDias} {respostaSelecionada.tempoEntregaDias === 1 ? 'dia' : 'dias'}
                              </p>
                            </>
                          ) : (
                            <p className="text-sm text-gray-500 italic">Selecione uma opção de envio</p>
                          )}
                        </div>

                        {cotacaoAceita ? (
                          <Button disabled className="bg-green-600 w-full sm:w-auto">
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Aceita
                          </Button>
                        ) : cotacao.status === "aguardando_pagamento" ? (
                          <Button disabled className="bg-orange-600 w-full sm:w-auto">
                            <Clock className="w-4 h-4 mr-2" />
                            Aguardando Pagamento
                          </Button>
                        ) : podeSelecionar ? (
                          <Button
                            onClick={() => handleAceitarProposta(transportadora.transportadoraId)}
                            disabled={!respostaSelecionada}
                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 w-full sm:w-auto text-sm"
                          >
                            Aceitar Proposta
                          </Button>
                        ) : (cotacao.status === "aberta" || cotacao.status === "em_andamento") ? (
                          <p className="text-sm text-gray-500 text-center">
                            Aguarde o fim do prazo
                          </p>
                        ) : null}
                      </div>

                      {respostaSelecionada?.observacoes && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-xs">
                          <p className="text-xs text-gray-500 mb-1">Observações:</p>
                          <p className="text-sm text-gray-700">{respostaSelecionada.observacoes}</p>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })
          )}
            </>
          )}

          {/* Mensagem para Transportador */}
          {user?.tipo === "transportadora" && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Proposta enviada!</strong> Você receberá uma notificação quando o embarcador visualizar sua proposta ou tomar uma decisão. Volte a <Link to={createPageUrl("CotacoesDisponiveis")} className="font-semibold underline">CotaçõesDisponíveis</Link> para responder outras cotações.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}
