import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Package,
  MapPin,
  Clock,
  Send,
  Download,
  AlertCircle,
  Building2,
  User,
  Phone,
  Mail,
  Calendar
} from "lucide-react";
import PageHeader from "../components/common/PageHeader";
import LoadingSpinner from "../components/common/LoadingSpinner";

export default function ChatConversa() {
  const urlParams = new URLSearchParams(window.location.search);
  const chatId = urlParams.get('chatId');

  const [user, setUser] = useState(null);
  const [mensagem, setMensagem] = useState("");
  const [error, setError] = useState("");
  const [tempoRestante, setTempoRestante] = useState("");
  const messagesEndRef = useRef(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userData = await base44.auth.me();
    setUser(userData);
  };

  // Buscar chat
  const { data: chat, isLoading: loadingChat } = useQuery({
    queryKey: ['chat', chatId],
    queryFn: async () => {
      if (!chatId) return null;
      const chats = await base44.entities.Chat.filter({ id: chatId });
      return chats.length > 0 ? chats[0] : null;
    },
    enabled: !!chatId,
    refetchInterval: 5000
  });

  // Buscar cotação
  const { data: cotacao, isLoading: loadingCotacao } = useQuery({
    queryKey: ['cotacao', chat?.cotacaoId],
    queryFn: async () => {
      if (!chat?.cotacaoId) return null;
      const result = await base44.entities.Cotacao.filter({ id: chat.cotacaoId });
      return result.length > 0 ? result[0] : null;
    },
    enabled: !!chat?.cotacaoId
  });

  // Buscar resposta selecionada
  const { data: respostaSelecionada, isLoading: loadingResposta } = useQuery({
    queryKey: ['resposta-selecionada', cotacao?.respostaSelecionadaId],
    queryFn: async () => {
      if (!cotacao?.respostaSelecionadaId) return null;
      const result = await base44.entities.RespostaCotacao.filter({ 
        id: cotacao.respostaSelecionadaId 
      });
      return result.length > 0 ? result[0] : null;
    },
    enabled: !!cotacao?.respostaSelecionadaId
  });

  // Buscar perfil da transportadora
  const { data: perfilTransportadora, isLoading: loadingPerfil } = useQuery({
    queryKey: ['perfil-transportadora', respostaSelecionada?.transportadoraId],
    queryFn: async () => {
      if (!respostaSelecionada?.transportadoraId) return null;
      const result = await base44.entities.PerfilTransportadora.filter({ 
        userIdGoogle: respostaSelecionada.transportadoraId 
      });
      return result.length > 0 ? result[0] : null;
    },
    enabled: !!respostaSelecionada?.transportadoraId
  });

  // Buscar endereço da transportadora
  const { data: enderecoTransportadora } = useQuery({
    queryKey: ['endereco-transportadora', respostaSelecionada?.transportadoraId],
    queryFn: async () => {
      if (!respostaSelecionada?.transportadoraId) return null;
      const result = await base44.entities.Endereco.filter({ 
        userId: respostaSelecionada.transportadoraId,
        principal: true
      });
      return result.length > 0 ? result[0] : null;
    },
    enabled: !!respostaSelecionada?.transportadoraId
  });


  // Calcular tempo restante
  useEffect(() => {
    if (!chat?.dataHoraExpiracao) return;

    const calcularTempo = () => {
      const agora = new Date();
      const expiracao = new Date(chat.dataHoraExpiracao);
      const diferenca = expiracao - agora;

      if (diferenca <= 0) {
        setTempoRestante("Expirado");
        return;
      }

      const horas = Math.floor(diferenca / (1000 * 60 * 60));
      const minutos = Math.floor((diferenca % (1000 * 60 * 60)) / (1000 * 60));
      const segundos = Math.floor((diferenca % (1000 * 60)) / 1000);

      setTempoRestante(`${horas}h ${minutos}m ${segundos}s`);
    };

    calcularTempo();
    const interval = setInterval(calcularTempo, 1000);

    return () => clearInterval(interval);
  }, [chat]);

  // Marcar como lido ao abrir
  useEffect(() => {
    if (chat && chat.lidoPorCliente === false) {
      base44.entities.Chat.update(chat.id, {
        lidoPorCliente: true
      });
      queryClient.invalidateQueries(['chat']);
    }
  }, [chat?.id]);

  // Scroll automático para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.mensagens]);

  const handleEnviarMensagem = async () => {
    if (!mensagem.trim() || !chat) return;

    setError("");

    try {
      const novaMensagem = {
        remetente: "cliente",
        mensagem: mensagem.trim(),
        dataHora: new Date().toISOString()
      };

      const mensagensAtualizadas = [...(chat.mensagens || []), novaMensagem];

      await base44.entities.Chat.update(chat.id, {
        mensagens: mensagensAtualizadas,
        dataHoraUltimaMensagem: new Date().toISOString(),
        lidoPorTransportadora: false
      });

      setMensagem("");
      queryClient.invalidateQueries({ queryKey: ['chat', chatId] });
    } catch (error) {
      setError("Erro ao enviar mensagem. Tente novamente.");
    }
  };

  const handleExportarCSV = () => {
    if (!cotacao || !perfilTransportadora) return;

    const dados = [
      ["DADOS DA TRANSPORTADORA"],
      ["Razão Social", perfilTransportadora.razaoSocial],
      ["CNPJ", perfilTransportadora.cnpj],
      ["Telefone Comercial", perfilTransportadora.telefoneComercial || ""],
      ["Telefone Pessoal", perfilTransportadora.telefonePessoal || ""],
      ["Email", perfilTransportadora.emailAcesso],
      [],
      ["ENDEREÇO DA TRANSPORTADORA"],
      ["CEP", enderecoTransportadora?.cep || ""],
      ["Logradouro", enderecoTransportadora?.logradouro || ""],
      ["Número", enderecoTransportadora?.numero || ""],
      ["Complemento", enderecoTransportadora?.complemento || ""],
      ["Bairro", enderecoTransportadora?.bairro || ""],
      ["Cidade", enderecoTransportadora?.cidade || ""],
      ["Estado", enderecoTransportadora?.estado || ""],
      [],
      ["DADOS DO FRETE"],
      ["Produto", cotacao.produtoNome],
      ["NCM", cotacao.produtoNCM],
      ["Peso Total", `${cotacao.pesoTotal} kg`],
      ["Volumes", cotacao.quantidadeVolumes],
      ["Valor Nota Fiscal", `R$ ${cotacao.valorNotaFiscal.toFixed(2)}`],
      ["Valor Frete Base", `R$ ${respostaSelecionada?.valorBase.toFixed(2)}`],
      ["Valor Frete Total", `R$ ${respostaSelecionada?.valorTotal.toFixed(2)}`],
      ["Destino", `${cotacao.destinatarioCidade} - ${cotacao.destinatarioEstado}`],
      ["Data/Hora Coleta", cotacao.dataHoraColeta]
    ];

    const csvContent = dados.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `dados_transportadora_${cotacao.id.slice(0, 8)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!user || loadingChat || loadingCotacao || loadingResposta || loadingPerfil) {
    return <LoadingSpinner message="Carregando chat..." />;
  }

  if (!chat) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
        <PageHeader title="Erro" showBack={true} />
        <div className="p-6 max-w-4xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Chat não encontrado.</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!cotacao || !respostaSelecionada) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
        <PageHeader title="Erro" showBack={true} />
        <div className="p-6 max-w-4xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Cotação não encontrada ou não aceita.</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const chatExpirado = chat.tipo === "normal" && tempoRestante === "Expirado";
  const ehNegociacaoCTe = chat.tipo === "negociacao_cte";
  const somenteVisualizacao = ehNegociacaoCTe || chatExpirado;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <PageHeader
        title={ehNegociacaoCTe ? `Negociação CT-e - Cotação #${cotacao.id.slice(0, 8)}` : `Chat com ${respostaSelecionada.transportadoraNome}`}
        description={ehNegociacaoCTe ? "Histórico da negociação de valor" : "Histórico de conversas sobre a entrega"}
        showBack={true}
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Contador de Tempo - apenas para chats normais */}
        {chat.tipo === "normal" && (
          <Card className={chatExpirado ? "border-red-300 bg-red-50" : "border-orange-300 bg-orange-50"}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className={`w-6 h-6 ${chatExpirado ? "text-red-600" : "text-orange-600"}`} />
                  <div>
                    <p className="font-semibold text-gray-900">
                      {chatExpirado ? "Chat Expirado" : "Tempo Restante"}
                    </p>
                    <p className={`text-2xl font-bold ${chatExpirado ? "text-red-600" : "text-orange-600"}`}>
                      {tempoRestante}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  O chat expira às 23:59:59 de hoje
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Alerta de histórico apenas visualização */}
        {somenteVisualizacao && (
          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              Esta é uma visualização do histórico de mensagens. Não é possível enviar novas mensagens.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Esquerda - Informações */}
          <div className="lg:col-span-1 space-y-6">
            {/* Dados da Cotação */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Dados da Cotação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-500">Cotação</p>
                  <p className="font-semibold">#{cotacao.id.slice(0, 8)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Produto</p>
                  <p className="font-semibold">{cotacao.produtoNome}</p>
                </div>
                <div>
                  <p className="text-gray-500">NCM</p>
                  <p className="font-semibold">{cotacao.produtoNCM}</p>
                </div>
                <div>
                  <p className="text-gray-500">Peso Total</p>
                  <p className="font-semibold">{cotacao.pesoTotal} kg</p>
                </div>
                <div>
                  <p className="text-gray-500">Volumes</p>
                  <p className="font-semibold">{cotacao.quantidadeVolumes}</p>
                </div>
                <div>
                  <p className="text-gray-500">Destino</p>
                  <p className="font-semibold">{cotacao.destinatarioCidade} - {cotacao.destinatarioEstado}</p>
                </div>
                <div className="pt-3 border-t">
                  <p className="text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Horário de Coleta
                  </p>
                  <p className="font-bold text-blue-600">
                    {new Date(cotacao.dataHoraColeta).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="pt-3 border-t">
                  <p className="text-xs text-gray-500 mb-2">VALORES DO FRETE</p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Valor Base:</span>
                      <span className="font-semibold">
                        R$ {respostaSelecionada.valorBase.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    {respostaSelecionada.valorPalete > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">+ Paletização:</span>
                        <span className="text-gray-700">
                          R$ {respostaSelecionada.valorPalete.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}

                    {respostaSelecionada.valorUrgente > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">+ Urgente:</span>
                        <span className="text-gray-700">
                          R$ {respostaSelecionada.valorUrgente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}

                    {respostaSelecionada.valorFragil > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">+ Frágil:</span>
                        <span className="text-gray-700">
                          R$ {respostaSelecionada.valorFragil.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}

                    {respostaSelecionada.valorCargaDedicada > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">+ Carga Dedicada:</span>
                        <span className="text-gray-700">
                          R$ {respostaSelecionada.valorCargaDedicada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-gray-200 flex justify-between">
                      <span className="font-semibold text-gray-700">Valor Total:</span>
                      <span className="text-lg font-bold text-green-600">
                        R$ {respostaSelecionada.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dados da Transportadora */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Transportadora
                </CardTitle>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleExportarCSV}
                >
                  <Download className="w-4 h-4 mr-1" />
                  CSV
                </Button>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {perfilTransportadora ? (
                  <>
                    <div>
                      <p className="text-gray-500">Razão Social</p>
                      <p className="font-semibold">{perfilTransportadora.razaoSocial}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">CNPJ</p>
                      <p className="font-semibold">{perfilTransportadora.cnpj}</p>
                    </div>
                    {perfilTransportadora.telefoneComercial && (
                      <div>
                        <p className="text-gray-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          Telefone Comercial
                        </p>
                        <p className="font-semibold">{perfilTransportadora.telefoneComercial}</p>
                      </div>
                    )}
                    {perfilTransportadora.telefonePessoal && (
                      <div>
                        <p className="text-gray-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          Telefone Pessoal
                        </p>
                        <p className="font-semibold">{perfilTransportadora.telefonePessoal}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-500 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        Email
                      </p>
                      <p className="font-semibold break-all">{perfilTransportadora.emailAcesso}</p>
                    </div>
                    
                    {enderecoTransportadora && (
                      <div className="pt-3 border-t">
                        <p className="text-gray-500 font-semibold mb-2 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          Endereço
                        </p>
                        <div className="space-y-1 text-xs">
                          <p>{enderecoTransportadora.logradouro}, {enderecoTransportadora.numero}</p>
                          {enderecoTransportadora.complemento && <p>{enderecoTransportadora.complemento}</p>}
                          <p>{enderecoTransportadora.bairro}</p>
                          <p>{enderecoTransportadora.cidade} - {enderecoTransportadora.estado}</p>
                          <p>CEP: {enderecoTransportadora.cep}</p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-gray-500 italic">Carregando dados...</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Coluna Direita - Chat */}
          <div className="lg:col-span-2">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Mensagens
                </CardTitle>
              </CardHeader>

              {/* Área de Mensagens */}
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {!chat?.mensagens || chat.mensagens.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-400 text-center">
                      Nenhuma mensagem ainda.<br />Inicie a conversa com a transportadora!
                    </p>
                  </div>
                ) : (
                  chat.mensagens.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${msg.remetente === "cliente" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          msg.remetente === "cliente"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <p className="text-sm">{msg.mensagem}</p>
                        <p className={`text-xs mt-1 ${
                          msg.remetente === "cliente" ? "text-blue-100" : "text-gray-500"
                        }`}>
                          {new Date(msg.dataHora).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </CardContent>

              {/* Input de Mensagem - apenas para chats normais ativos */}
              {!somenteVisualizacao && (
                <div className="border-t p-4">
                  {error && (
                    <Alert variant="destructive" className="mb-3">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="flex gap-2">
                    <Input
                      placeholder="Digite sua mensagem..."
                      value={mensagem}
                      onChange={(e) => setMensagem(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleEnviarMensagem()}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleEnviarMensagem}
                      disabled={!mensagem.trim()}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
