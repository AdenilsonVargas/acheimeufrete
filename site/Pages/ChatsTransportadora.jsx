import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageSquare, Package, MapPin, FileText, CheckCircle2, AlertCircle, Truck, Eye, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PageHeader from "../components/common/PageHeader";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";

export default function ChatsTransportadora() {
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
        lidoPorTransportadora: novoStatus
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['chats-transportadora']);
    }
  });

  // Buscar todos os chats desta transportadora (normal e negociação)
  const { data: chats = [], isLoading: loadingChats } = useQuery({
    queryKey: ['chats-transportadora', user?.perfilAtivoId],
    queryFn: async () => {
      if (!user) return [];
      const allChats = await base44.entities.Chat.filter({
        transportadoraId: user.perfilAtivoId
      });
      return allChats;
    },
    enabled: !!user
  });

  const { data: cotacoes, isLoading } = useQuery({
    queryKey: ['cotacoes-com-chats-transportadora', chats.map(c => c.cotacaoId).join(',')],
    queryFn: async () => {
      if (!chats || chats.length === 0) return [];
      
      const cotacoesComChat = await Promise.all(
        chats.map(async (chat) => {
          const cotacoes = await base44.entities.Cotacao.filter({
            id: chat.cotacaoId
          });

          if (cotacoes.length === 0) return null;
          
          const cotacao = cotacoes[0];

          const clientes = await base44.entities.PerfilCliente.filter({
            userIdGoogle: cotacao.clienteId
          });

          return {
            ...cotacao,
            chat,
            cliente: clientes[0] || { nomeCompleto: "Cliente" }
          };
        })
      );

      // Ordenar por data da última mensagem (mais recentes primeiro)
      const cotacoesFiltradas = cotacoesComChat.filter(c => c !== null);
      cotacoesFiltradas.sort((a, b) => {
        const dataA = new Date(a.chat.dataHoraUltimaMensagem || a.chat.dataHoraInicio);
        const dataB = new Date(b.chat.dataHoraUltimaMensagem || b.chat.dataHoraInicio);
        return dataB - dataA;
      });

      return cotacoesFiltradas;
    },
    enabled: chats.length > 0,
    initialData: []
  });

  if (!user || isLoading || loadingChats) {
    return <LoadingSpinner message="Carregando chats..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <PageHeader
        title="Chats"
        description="Converse com os clientes sobre as cotações aceitas"
      />

      <div className="p-6 max-w-7xl mx-auto">
        {cotacoes.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="Nenhum chat disponível"
            description="Aguarde os clientes aceitarem suas propostas para iniciar conversas"
            actionLabel="Ver Cotações Disponíveis"
            actionUrl={createPageUrl("CotacoesDisponiveis")}
          />
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {cotacoes.map((cotacao) => {
              const tipoChat = cotacao.chat?.tipo || "normal";
              const statusChat = cotacao.chat?.status || "ativo";
              const naoLido = cotacao.chat?.lidoPorTransportadora === false;
              const dataUltimaMensagem = cotacao.chat?.dataHoraUltimaMensagem || cotacao.chat?.dataHoraInicio;
              
              return (
                <Card 
                  key={cotacao.id} 
                  className={`hover:shadow-lg transition-all duration-300 ${
                    naoLido ? 'border-2 border-red-400 bg-red-50' : ''
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div className={`w-16 h-16 rounded-lg flex items-center justify-center ${
                              naoLido 
                                ? 'bg-gradient-to-br from-red-100 to-red-200' 
                                : 'bg-gradient-to-br from-blue-100 to-blue-200'
                            }`}>
                              <Package className={`w-8 h-8 ${naoLido ? 'text-red-600' : 'text-blue-600'}`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-gray-900 text-lg">
                                  {cotacao.cliente.nomeCompleto}
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
                              {tipoChat === "negociacao_cte" && (
                                <Badge className="mt-1 bg-orange-100 text-orange-800">
                                  Negociação CT-e
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleLidoMutation.mutate({
                              chatId: cotacao.chat.id,
                              novoStatus: !cotacao.chat.lidoPorTransportadora
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

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                              <Package className="w-3 h-3" />
                              Produto
                            </p>
                            <p className="font-semibold text-gray-900 text-sm">{cotacao.produtoNome}</p>
                          </div>

                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              Destino
                            </p>
                            <p className="font-semibold text-gray-900 text-sm">
                              {cotacao.destinatarioCidade} - {cotacao.destinatarioEstado}
                            </p>
                          </div>

                          <div className="p-3 bg-green-50 rounded-lg">
                            <p className="text-xs text-green-700 mb-1">Valor</p>
                            <p className="font-bold text-green-900 text-sm">
                              R$ {cotacao.valorOriginalCotacao?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="lg:w-56 flex flex-col justify-center">
                        <Link to={createPageUrl(`ChatConversaTransportadora?chatId=${cotacao.chat.id}`)}>
                          <Button className={`w-full ${
                            naoLido 
                              ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
                              : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                          }`}>
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Abrir Chat
                          </Button>
                        </Link>
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
