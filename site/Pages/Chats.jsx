import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Package, MapPin, CheckCircle2, AlertCircle, Clock, Eye, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import PageHeader from "../components/common/PageHeader";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";

export default function Chats() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userData = await base44.auth.me();
    setUser(userData);
  };

  const toggleLidoMutation = useMutation({
    mutationFn: async ({ chatId, novoStatus }) => {
      await base44.entities.Chat.update(chatId, {
        lidoPorCliente: novoStatus
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['chats-cliente']);
    }
  });

  // Buscar todos os chats deste cliente (normal e negociação)
  const { data: chats = [], isLoading: loadingChats } = useQuery({
    queryKey: ['chats-cliente', user?.perfilAtivoId],
    queryFn: async () => {
      if (!user) return [];
      const allChats = await base44.entities.Chat.filter({
        clienteId: user.perfilAtivoId
      });
      
      // Ordenar por data da última mensagem (mais recentes primeiro)
      allChats.sort((a, b) => {
        const dataA = new Date(a.dataHoraUltimaMensagem || a.dataHoraInicio);
        const dataB = new Date(b.dataHoraUltimaMensagem || b.dataHoraInicio);
        return dataB - dataA;
      });
      
      return allChats;
    },
    enabled: !!user
  });

  // Buscar negociações de CT-e pendentes
  const { data: negociacoesCTe = [] } = useQuery({
    queryKey: ['negociacoes-cte-cliente', user?.perfilAtivoId],
    queryFn: async () => {
      if (!user) return [];
      const chats = await base44.entities.Chat.filter({
        clienteId: user.perfilAtivoId,
        tipo: "negociacao_cte",
        status: "aguardando_cliente"
      });
      return chats;
    },
    enabled: !!user
  });

  const { data: cotacoes = [], isLoading } = useQuery({
    queryKey: ['cotacoes-com-chats-cliente', chats.map(c => c.cotacaoId).join(',')],
    queryFn: async () => {
      if (!chats || chats.length === 0) return [];
      
      const cotacoesComChat = await Promise.all(
        chats.map(async (chat) => {
          const cotacoes = await base44.entities.Cotacao.filter({
            id: chat.cotacaoId
          });

          if (cotacoes.length === 0) return null;
          
          const cotacao = cotacoes[0];

          const [respostas, transportadoras] = await Promise.all([
            base44.entities.RespostaCotacao.filter({ id: cotacao.respostaSelecionadaId }),
            base44.entities.PerfilTransportadora.filter({})
          ]);

          if (respostas.length === 0) return null;

          const resposta = respostas[0];
          const transportadora = transportadoras.find(t => t.userIdGoogle === resposta.transportadoraId);

          return {
            ...cotacao,
            chat,
            respostaSelecionada: resposta,
            transportadora: transportadora || {
              razaoSocial: resposta.transportadoraNome,
              logoUrl: resposta.transportadoraLogo
            },
            transportadoraId: resposta.transportadoraId
          };
        })
      );

      return cotacoesComChat.filter(c => c !== null);
    },
    enabled: chats.length > 0,
    initialData: []
  });

  // Buscar cotações aguardando pagamento
  const { data: cotacoesPendentes = [] } = useQuery({
    queryKey: ['cotacoes-pendentes-pagamento-chat', user?.perfilAtivoId],
    queryFn: async () => {
      if (!user) return [];
      const todasCotacoes = await base44.entities.Cotacao.filter({
        clienteId: user.perfilAtivoId,
        status: "aguardando_pagamento"
      });
      return todasCotacoes;
    },
    enabled: !!user
  });

  if (!user || isLoading || loadingChats) {
    return <LoadingSpinner message="Carregando chats..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <PageHeader
        title="Chats"
        description="Converse com as transportadoras sobre suas cotações aceitas"
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Alert de aprovação de CT-e pendente */}
        {negociacoesCTe.length > 0 && (
          <Alert className="bg-red-50 border-2 border-red-400">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <AlertDescription className="text-red-900">
              <div className="flex items-center justify-between">
                <div>
                  <strong className="text-lg">🚨 {negociacoesCTe.length} Aprovação(ões) de Valor Pendente</strong>
                  <p className="text-sm mt-1">
                    A transportadora informou um novo valor. Aprove ou rejeite para liberar a entrega.
                  </p>
                </div>
                {negociacoesCTe.length === 1 && (
                  <Link to={createPageUrl(`NegociacaoCTe?id=${negociacoesCTe[0].cotacaoId}`)}>
                    <Button className="bg-red-600 hover:bg-red-700">
                      Revisar Agora
                    </Button>
                  </Link>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Alert de cotações pendentes de pagamento */}
        {cotacoesPendentes.length > 0 && (
          <Alert className="bg-orange-50 border-2 border-orange-400">
            <Clock className="h-5 w-5 text-orange-600" />
            <AlertDescription className="text-orange-900">
              <div className="flex items-center justify-between">
                <div>
                  <strong className="text-lg">⚠️ {cotacoesPendentes.length} Cotação(ões) Aguardando Pagamento</strong>
                  <p className="text-sm mt-1">
                    Complete o pagamento para liberar o chat com a transportadora e iniciar o processo de entrega.
                  </p>
                </div>
                <Link to={createPageUrl("Creditos")}>
                  <Button className="bg-orange-600 hover:bg-orange-700">
                    Pagar Agora
                  </Button>
                </Link>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Cards de Negociações de CT-e Pendentes - Aparecem no topo */}
        {negociacoesCTe.map((negociacao) => (
          <Card key={negociacao.id} className="border-2 border-red-300 bg-red-50 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-red-200 rounded-lg flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-red-700" />
                    </div>
                    <div>
                      <h3 className="font-bold text-red-900 text-lg">
                        🚨 APROVAÇÃO DE VALOR NECESSÁRIA
                      </h3>
                      <p className="text-sm text-red-700">
                        Cotação #{negociacao.cotacaoId.slice(0, 8)}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-lg border-2 border-red-200 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Valor Original:</span>
                      <span className="font-bold">
                        R$ {negociacao.valorOriginalCotacao?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Novo Valor Proposto:</span>
                      <span className="font-bold text-red-700">
                        R$ {negociacao.valorAtualProposta?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span className="font-medium">Diferença:</span>
                      <span className="font-bold">
                        + R$ {(negociacao.valorAtualProposta - negociacao.valorOriginalCotacao)?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <Alert className="mt-4 bg-yellow-50 border-yellow-300">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800 text-sm">
                      ⚠️ O produto NÃO será enviado sem sua aprovação do novo valor
                    </AlertDescription>
                  </Alert>
                </div>

                <div className="flex flex-col justify-center md:w-48">
                  <Link to={createPageUrl(`NegociacaoCTe?id=${negociacao.cotacaoId}`)}>
                    <Button className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 h-12">
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Aprovar ou Recusar
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Todos os Chats - Histórico de conversas e negociações */}
        {cotacoes.length === 0 && cotacoesPendentes.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="Nenhum chat ativo"
            description="Aceite uma cotação para iniciar uma conversa com a transportadora"
            actionLabel="Ver Cotações"
            actionUrl={createPageUrl("Cotacoes")}
          />
        ) : (
          <div className="space-y-4">
            {cotacoes.map((cotacao) => {
              const chat = cotacao.chat;
              const naoLido = chat?.lidoPorCliente === false;
              const dataUltimaMensagem = chat?.dataHoraUltimaMensagem || chat?.dataHoraInicio;
              const ehNegociacaoCTe = chat?.tipo === "negociacao_cte";
              
              return (
                <Card 
                  key={cotacao.id} 
                  className={`hover:shadow-lg transition-all duration-300 ${
                    naoLido ? 'border-2 border-red-400 bg-red-50' : ''
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-4">
                            {cotacao.transportadora?.logoUrl ? (
                              <img
                                src={cotacao.transportadora.logoUrl}
                                alt={cotacao.transportadora.razaoSocial}
                                className={`w-16 h-16 rounded-lg object-cover border-2 ${
                                  naoLido ? 'border-red-400' : 'border-gray-200'
                                }`}
                              />
                            ) : (
                              <div className={`w-16 h-16 rounded-lg flex items-center justify-center ${
                                naoLido 
                                  ? 'bg-gradient-to-br from-red-100 to-red-200' 
                                  : 'bg-gradient-to-br from-blue-100 to-blue-200'
                              }`}>
                                <Package className={`w-8 h-8 ${naoLido ? 'text-red-600' : 'text-blue-600'}`} />
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-gray-900 text-lg">
                                  {cotacao.transportadora?.razaoSocial}
                                </h3>
                                {naoLido && (
                                  <Badge className="bg-red-500 text-white">
                                    Nova mensagem
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-500">
                                Cotação #{cotacao.id.slice(0, 8)}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(dataUltimaMensagem).toLocaleString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                              <div className="flex gap-1 mt-1">
                                {ehNegociacaoCTe && (
                                  <Badge className="bg-orange-100 text-orange-800">
                                    Negociação CT-e
                                  </Badge>
                                )}
                                {chat?.status === "aguardando_cliente" && (
                                  <Badge className="bg-red-100 text-red-800">
                                    Aguardando Resposta
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleLidoMutation.mutate({
                              chatId: chat.id,
                              novoStatus: !chat.lidoPorCliente
                            })}
                            className="flex items-center gap-2"
                          >
                            {naoLido ? (
                              <>
                                <Eye className="w-4 h-4" />
                                Marcar como lido
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-4 h-4" />
                                Marcar como não lido
                              </>
                            )}
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <Package className="w-4 h-4 text-gray-400" />
                              <p className="text-xs font-semibold text-gray-600">PRODUTO</p>
                            </div>
                            <p className="font-medium text-gray-900">{cotacao.produtoNome}</p>
                            <p className="text-xs text-gray-500">NCM: {cotacao.produtoNCM}</p>
                          </div>

                          <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <p className="text-xs font-semibold text-gray-600">DESTINO</p>
                            </div>
                            <p className="font-medium text-gray-900">
                              {cotacao.destinatarioCidade} - {cotacao.destinatarioEstado}
                            </p>
                          </div>

                          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                            <p className="text-xs font-semibold text-green-700 mb-1">VALOR TOTAL</p>
                            <p className="text-xl font-bold text-green-700">
                              R$ {cotacao.respostaSelecionada?.valorTotal?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-xs text-green-600 mt-1">
                              Prazo: {cotacao.respostaSelecionada?.tempoEntregaDias} dias
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col justify-center md:w-48 gap-2">
                        <Link to={createPageUrl(`ChatConversa?chatId=${chat.id}`)}>
                          <Button className={`w-full ${
                            naoLido 
                              ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
                              : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                          }`}>
                            <MessageSquare className="w-4 h-4 mr-2" />
                            {ehNegociacaoCTe ? 'Ver Negociação' : 'Ver Histórico'}
                          </Button>
                        </Link>
                        {ehNegociacaoCTe && chat?.status === "aguardando_cliente" && (
                          <Link to={createPageUrl(`NegociacaoCTe?id=${cotacao.id}`)}>
                            <Button className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800">
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Responder
                            </Button>
                          </Link>
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
