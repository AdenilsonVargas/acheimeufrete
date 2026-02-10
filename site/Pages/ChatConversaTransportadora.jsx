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
  User,
  Phone,
  Mail
} from "lucide-react";
import PageHeader from "../components/common/PageHeader";
import LoadingSpinner from "../components/common/LoadingSpinner";

export default function ChatConversaTransportadora() {
  const urlParams = new URLSearchParams(window.location.search);
  const chatId = urlParams.get('chatId');

  const [user, setUser] = useState(null);
  const [mensagem, setMensagem] = useState("");
  const [novoValor, setNovoValor] = useState("");
  const [motivoProposta, setMotivoProposta] = useState("");
  const [error, setError] = useState("");
  const [tempoRestante, setTempoRestante] = useState("");
  const [enviando, setEnviando] = useState(false);
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
      const result = await base44.entities.Chat.filter({ id: chatId });
      return result.length > 0 ? result[0] : null;
    },
    enabled: !!chatId,
    refetchInterval: 5000 // Atualizar a cada 5 segundos
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

  // Buscar perfil do cliente
  const { data: perfilCliente, isLoading: loadingPerfil } = useQuery({
    queryKey: ['perfil-cliente', chat?.clienteId],
    queryFn: async () => {
      if (!chat?.clienteId) return null;
      const result = await base44.entities.PerfilCliente.filter({ 
        userIdGoogle: chat.clienteId 
      });
      return result.length > 0 ? result[0] : null;
    },
    enabled: !!chat?.clienteId
  });

  // Buscar endereço do cliente (coleta)
  const { data: enderecoCliente } = useQuery({
    queryKey: ['endereco-cliente', chat?.clienteId],
    queryFn: async () => {
      if (!chat?.clienteId) return null;
      const result = await base44.entities.Endereco.filter({ 
        userId: chat.clienteId,
        principal: true
      });
      return result.length > 0 ? result[0] : null;
    },
    enabled: !!chat?.clienteId
  });

  // Buscar destinatário
  const { data: destinatario } = useQuery({
    queryKey: ['destinatario', cotacao?.destinatarioId],
    queryFn: async () => {
      if (!cotacao?.destinatarioId) return null;
      const result = await base44.entities.Destinatario.filter({ 
        id: cotacao.destinatarioId 
      });
      return result.length > 0 ? result[0] : null;
    },
    enabled: !!cotacao?.destinatarioId
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

      const dias = Math.floor(diferenca / (1000 * 60 * 60 * 24));
      const horas = Math.floor((diferenca % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutos = Math.floor((diferenca % (1000 * 60 * 60)) / (1000 * 60));
      const segundos = Math.floor((diferenca % (1000 * 60)) / 1000);

      if (dias > 0) {
        setTempoRestante(`${dias}d ${horas}h ${minutos}m ${segundos}s`);
      } else {
        setTempoRestante(`${horas}h ${minutos}m ${segundos}s`);
      }
    };

    calcularTempo();
    const interval = setInterval(calcularTempo, 1000);

    return () => clearInterval(interval);
  }, [chat]);

  // Marcar como lido ao abrir
  useEffect(() => {
    if (chat && chat.lidoPorTransportadora === false) {
      base44.entities.Chat.update(chat.id, {
        lidoPorTransportadora: true
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
        remetente: "transportadora",
        mensagem: mensagem.trim(),
        tipoMensagem: "texto",
        dataHora: new Date().toISOString()
      };

      const mensagensAtualizadas = [...(chat.mensagens || []), novaMensagem];

      await base44.entities.Chat.update(chat.id, {
        mensagens: mensagensAtualizadas,
        dataHoraUltimaMensagem: new Date().toISOString(),
        lidoPorCliente: false
      });

      setMensagem("");
      queryClient.invalidateQueries({ queryKey: ['chat', chatId] });
    } catch (error) {
      setError("Erro ao enviar mensagem. Tente novamente.");
    }
  };

  const handleEnviarContraProposta = async () => {
    if (!novoValor || !motivoProposta.trim() || !chat) return;

    const valorNumerico = parseFloat(novoValor);
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      setError("Digite um valor válido.");
      return;
    }

    if (chat.tentativasNegociacao >= 3) {
      setError("Limite de 3 tentativas de negociação atingido.");
      return;
    }

    setError("");
    setEnviando(true);

    try {
      const novaMensagem = {
        remetente: "transportadora",
        mensagem: `Transportadora propôs novo valor de R$ ${valorNumerico.toFixed(2)} - Motivo: ${motivoProposta}`,
        tipoMensagem: "contra_proposta",
        valorProposto: valorNumerico,
        motivoRejeicao: motivoProposta,
        dataHora: new Date().toISOString()
      };

      const mensagensAtualizadas = [...(chat.mensagens || []), novaMensagem];

      // Incrementa tentativasNegociacao SOMENTE quando transportadora envia contra-proposta
      // Não conta a proposta inicial do CT-e
      await base44.entities.Chat.update(chat.id, {
        mensagens: mensagensAtualizadas,
        valorAtualProposta: valorNumerico,
        tentativasNegociacao: (chat.tentativasNegociacao || 0) + 1,
        status: "aguardando_cliente",
        dataHoraUltimaMensagem: new Date().toISOString(),
        lidoPorCliente: false
      });

      setNovoValor("");
      setMotivoProposta("");
      queryClient.invalidateQueries({ queryKey: ['chat', chatId] });
    } catch (error) {
      setError("Erro ao enviar contra-proposta. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  };

  const handleExportarCSV = () => {
    if (!cotacao || !perfilCliente) return;

    const dados = [
      ["DADOS DO CLIENTE (COLETA)"],
      ["Nome Completo", perfilCliente.nomeCompleto],
      ["CPF/CNPJ", perfilCliente.cpfOuCnpj],
      ["Email", perfilCliente.emailAcesso],
      ["Telefone Comercial", perfilCliente.telefoneComercial || ""],
      ["Telefone Pessoal", perfilCliente.telefonePessoal || ""],
      [],
      ["ENDEREÇO DE COLETA"],
      ["CEP", enderecoCliente?.cep || ""],
      ["Logradouro", enderecoCliente?.logradouro || ""],
      ["Número", enderecoCliente?.numero || ""],
      ["Complemento", enderecoCliente?.complemento || ""],
      ["Bairro", enderecoCliente?.bairro || ""],
      ["Cidade", enderecoCliente?.cidade || ""],
      ["Estado", enderecoCliente?.estado || ""],
      [],
      ["DADOS DO DESTINATÁRIO (ENTREGA)"],
      ["Nome Completo", destinatario?.nomeCompleto || ""],
      ["CEP", destinatario?.cep || ""],
      ["Logradouro", destinatario?.logradouro || ""],
      ["Número", destinatario?.numero || ""],
      ["Complemento", destinatario?.complemento || ""],
      ["Bairro", destinatario?.bairro || ""],
      ["Cidade", destinatario?.cidade || ""],
      ["Estado", destinatario?.estado || ""],
      [],
      ["DADOS DA CARGA"],
      ["Produto", cotacao.produtoNome],
      ["NCM", cotacao.produtoNCM],
      ["Peso Total", `${cotacao.pesoTotal} kg`],
      ["Volumes", cotacao.quantidadeVolumes],
      ["Data/Hora Coleta", cotacao.dataHoraColeta]
    ];

    const csvContent = dados.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `dados_entrega_${cotacao.id.slice(0, 8)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!user || loadingChat || loadingCotacao || loadingPerfil) {
    return <LoadingSpinner message="Carregando chat..." />;
  }

  if (!chat || !cotacao) {
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

  const chatExpirado = tempoRestante === "Expirado";
  const ehNegociacaoCTe = chat?.tipo === "negociacao_cte";
  const aguardandoContraPropostaTransportadora = ehNegociacaoCTe && chat?.status === "aguardando_transportadora";
  const podeEnviarContraProposta = aguardandoContraPropostaTransportadora && (chat?.tentativasNegociacao || 0) < 3;
  const somenteVisualizacao = ehNegociacaoCTe && (chat?.status === "aprovado" || chat?.status === "rejeitado_final" || !aguardandoContraPropostaTransportadora);

  // Data de expiração formatada
  const dataExpiracao = chat?.dataHoraExpiracao 
    ? new Date(chat.dataHoraExpiracao).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    : "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <PageHeader
        title={`Chat com ${perfilCliente?.nomeCompleto || "Cliente"}`}
        description={ehNegociacaoCTe ? "Negociação de valor do CT-e" : "Responda as dúvidas do cliente sobre a entrega"}
        showBack={true}
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Contador de Tempo */}
        {!ehNegociacaoCTe && (
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
                  O chat expira em: {dataExpiracao}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {ehNegociacaoCTe && (
          <Alert className="bg-orange-50 border-orange-200">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              {podeEnviarContraProposta 
                ? `Chat de Negociação CT-e - Você tem ${3 - (chat?.tentativasNegociacao || 0)} tentativa(s) restante(s). Expira em: ${dataExpiracao}`
                : chat?.status === "rejeitado_final"
                  ? "❌ Negociação rejeitada definitivamente pelo cliente. A carga deve ser devolvida ao remetente."
                  : somenteVisualizacao 
                    ? "Esta negociação já foi finalizada. Visualização do histórico apenas."
                    : `Negociação CT-e - Aguardando resposta do cliente. Expira em: ${dataExpiracao}`
              }
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
              </CardContent>
            </Card>

            {/* Dados do Cliente */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Cliente
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
                {perfilCliente ? (
                  <>
                    <div>
                      <p className="text-gray-500">Nome Completo</p>
                      <p className="font-semibold">{perfilCliente.nomeCompleto}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">CPF/CNPJ</p>
                      <p className="font-semibold">{perfilCliente.cpfOuCnpj}</p>
                    </div>
                    {perfilCliente.telefoneComercial && (
                      <div>
                        <p className="text-gray-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          Telefone Comercial
                        </p>
                        <p className="font-semibold">{perfilCliente.telefoneComercial}</p>
                      </div>
                    )}
                    {perfilCliente.telefonePessoal && (
                      <div>
                        <p className="text-gray-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          Telefone Pessoal
                        </p>
                        <p className="font-semibold">{perfilCliente.telefonePessoal}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-500 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        Email
                      </p>
                      <p className="font-semibold break-all">{perfilCliente.emailAcesso}</p>
                    </div>
                    
                    {enderecoCliente && (
                      <div className="pt-3 border-t">
                        <p className="text-gray-500 font-semibold mb-2 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          Endereço de Coleta
                        </p>
                        <div className="space-y-1 text-xs">
                          <p>{enderecoCliente.logradouro}, {enderecoCliente.numero}</p>
                          {enderecoCliente.complemento && <p>{enderecoCliente.complemento}</p>}
                          <p>{enderecoCliente.bairro}</p>
                          <p>{enderecoCliente.cidade} - {enderecoCliente.estado}</p>
                          <p>CEP: {enderecoCliente.cep}</p>
                        </div>
                      </div>
                    )}

                    {destinatario && (
                      <div className="pt-3 border-t">
                        <p className="text-gray-500 font-semibold mb-2 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          Endereço de Entrega
                        </p>
                        <div className="space-y-1 text-xs">
                          <p className="font-semibold">{destinatario.nomeCompleto}</p>
                          <p>{destinatario.logradouro}, {destinatario.numero}</p>
                          {destinatario.complemento && <p>{destinatario.complemento}</p>}
                          <p>{destinatario.bairro}</p>
                          <p>{destinatario.cidade} - {destinatario.estado}</p>
                          <p>CEP: {destinatario.cep}</p>
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
                      Nenhuma mensagem ainda.<br />Aguarde o cliente iniciar a conversa.
                    </p>
                  </div>
                ) : (
                  chat.mensagens.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${msg.remetente === "transportadora" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          msg.remetente === "transportadora"
                            ? "bg-green-600 text-white"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <p className="text-sm">{msg.mensagem}</p>
                        <p className={`text-xs mt-1 ${
                          msg.remetente === "transportadora" ? "text-green-100" : "text-gray-500"
                        }`}>
                          {new Date(msg.dataHora).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </CardContent>

              {/* Input de Mensagem ou Formulário de Negociação */}
              <div className="border-t p-4">
                {error && (
                  <Alert variant="destructive" className="mb-3">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                {/* Formulário de Contra-Proposta CT-e */}
                {podeEnviarContraProposta ? (
                  <div className="space-y-3">
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <p className="text-sm text-orange-800 font-semibold mb-2">
                        Propor Novo Valor
                      </p>
                      <p className="text-xs text-orange-700">
                        Tentativa {(chat?.tentativasNegociacao || 0) + 1} de 3
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Novo Valor (R$)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={novoValor}
                        onChange={(e) => setNovoValor(e.target.value)}
                        disabled={enviando}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Motivo da Nova Proposta
                      </label>
                      <Input
                        placeholder="Explique o motivo do novo valor..."
                        value={motivoProposta}
                        onChange={(e) => setMotivoProposta(e.target.value)}
                        disabled={enviando}
                      />
                    </div>

                    <Button
                      onClick={handleEnviarContraProposta}
                      disabled={!novoValor || !motivoProposta.trim() || enviando}
                      className="w-full bg-orange-600 hover:bg-orange-700"
                    >
                      {enviando ? "Enviando..." : "Enviar Contra-Proposta"}
                    </Button>
                  </div>
                ) : somenteVisualizacao ? (
                  <div className={`text-center py-4 text-sm ${
                    chat?.status === "rejeitado_final" 
                      ? "bg-red-50 border border-red-200 rounded-lg" 
                      : ""
                  }`}>
                    {chat?.status === "rejeitado_final" ? (
                      <p className="text-red-700 font-semibold">
                        ❌ Cliente rejeitou pela 3ª vez. A carga deve ser devolvida ao remetente.
                      </p>
                    ) : (
                      <p className="text-gray-500">
                        Esta é uma visualização do histórico de mensagens. Não é possível enviar novas mensagens.
                      </p>
                    )}
                  </div>
                ) : !ehNegociacaoCTe ? (
                  <div className="flex gap-2">
                    <Input
                      placeholder={chatExpirado ? "Chat expirado" : "Digite sua resposta..."}
                      value={mensagem}
                      onChange={(e) => setMensagem(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !chatExpirado && handleEnviarMensagem()}
                      disabled={chatExpirado}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleEnviarMensagem}
                      disabled={!mensagem.trim() || chatExpirado}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    Aguardando resposta do cliente...
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
