import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  AlertTriangle,
  DollarSign,
  Package,
  ArrowLeft,
  XCircle,
  MessageSquare,
  CheckCircle2
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PageHeader from "../components/common/PageHeader";
import LoadingSpinner from "../components/common/LoadingSpinner";

export default function ContraPropostaCTe() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const cotacaoId = urlParams.get("id");

  const [novoValor, setNovoValor] = useState("");
  const [motivo, setMotivo] = useState("");
  const [processando, setProcessando] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['user-contraproposta'],
    queryFn: () => base44.auth.me(),
    staleTime: 60000
  });

  const { data: cotacao, isLoading: loadingCotacao } = useQuery({
    queryKey: ['cotacao-contraproposta', cotacaoId],
    queryFn: async () => {
      if (!cotacaoId) return null;
      const cotacoes = await base44.entities.Cotacao.filter({ id: cotacaoId });
      return cotacoes[0] || null;
    },
    enabled: !!cotacaoId
  });

  const { data: chat, isLoading: loadingChat } = useQuery({
    queryKey: ['chat-contraproposta', cotacaoId],
    queryFn: async () => {
      if (!cotacaoId) return null;
      const chats = await base44.entities.Chat.filter({ 
        cotacaoId: cotacaoId,
        tipo: "negociacao_cte"
      });
      return chats[0] || null;
    },
    enabled: !!cotacaoId
  });

  const handleEnviarContraproposta = async () => {
    if (!novoValor || parseFloat(novoValor) <= 0) {
      alert("Informe um valor válido");
      return;
    }
    if (!motivo.trim()) {
      alert("Informe o motivo da contra-proposta");
      return;
    }

    const novoValorNum = parseFloat(novoValor);
    const valorOriginal = chat.valorOriginalCotacao || 0;

    if (novoValorNum <= valorOriginal) {
      alert("O novo valor deve ser maior que o valor original da cotação");
      return;
    }

    setProcessando(true);
    try {
      const agora = new Date().toISOString();
      const tentativasAtuais = chat.tentativasNegociacao || 1; // Começa em 1 (proposta inicial)
      const novasTentativas = tentativasAtuais + 1;

      // Máximo de 3 tentativas de negociação
      if (novasTentativas > 3) {
        alert("Você já atingiu o limite de 3 tentativas de negociação.");
        setProcessando(false);
        return;
      }

      const diferenca = novoValorNum - valorOriginal;

      const novasMensagens = [...(chat.mensagens || []), {
        remetente: "transportadora",
        tipoMensagem: "contra_proposta",
        valorProposto: novoValorNum,
        mensagem: `Transportadora propõe novo valor de R$ ${novoValorNum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.\n\nMotivo: "${motivo.trim()}".\n\nTentativa ${novasTentativas}/3.`,
        dataHora: agora
      }];

      await base44.entities.Chat.update(chat.id, {
        status: "aguardando_cliente",
        valorAtualProposta: novoValorNum,
        tentativasNegociacao: novasTentativas,
        mensagens: novasMensagens,
        lidoPorCliente: false,
        lidoPorTransportadora: true,
        dataHoraUltimaMensagem: agora
      });

      // Atualizar cotação
      await base44.entities.Cotacao.update(cotacaoId, {
        valorFinalTransportadora: novoValorNum,
        motivoAumentoCTe: motivo.trim(),
        diferencaValor: diferenca
      });

      queryClient.invalidateQueries(['cotacoes-aceitas']);
      queryClient.invalidateQueries(['chat-contraproposta']);

      alert("Contra-proposta enviada! O cliente será notificado.");
      navigate(createPageUrl("CotacoesAceitasTransportadora"));
    } catch (error) {
      console.error("Erro ao enviar contra-proposta:", error);
      alert("Erro ao enviar contra-proposta. Tente novamente.");
    } finally {
      setProcessando(false);
    }
  };

  const handleAceitarValorOriginal = async () => {
    if (!confirm("Tem certeza que deseja aceitar o valor original da cotação e seguir com a entrega?")) {
      return;
    }

    setProcessando(true);
    try {
      const agora = new Date().toISOString();

      const novasMensagens = [...(chat.mensagens || []), {
        remetente: "transportadora",
        tipoMensagem: "aprovacao",
        mensagem: `✅ VALOR ORIGINAL ACEITO\n\nA transportadora optou por aceitar o valor original de R$ ${chat.valorOriginalCotacao?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.\n\nA entrega pode prosseguir.`,
        dataHora: agora
      }];

      await base44.entities.Chat.update(chat.id, {
        status: "aprovado",
        mensagens: novasMensagens,
        valorAtualProposta: chat.valorOriginalCotacao,
        tentativasNegociacao: 0
      });

      await base44.entities.Cotacao.update(cotacaoId, {
        status: "em_transito",
        cteAprovadoCliente: true,
        dataHoraAprovacaoCTe: agora,
        valorFinalTransportadora: chat.valorOriginalCotacao,
        valorFinalCliente: chat.valorOriginalCotacao,
        diferencaValor: 0,
        motivoAumentoCTe: null
      });

      queryClient.invalidateQueries(['cotacoes-aceitas']);
      queryClient.invalidateQueries(['chat-contraproposta']);

      alert("Você aceitou o valor original da cotação. A entrega seguirá.");
      navigate(createPageUrl("EmEntregaTransportadora"));
    } catch (error) {
      console.error("Erro ao aceitar valor original:", error);
      alert("Erro ao processar. Tente novamente.");
    } finally {
      setProcessando(false);
    }
  };

  const handleDesistir = async () => {
    if (!confirm("Tem certeza que deseja DEVOLVER A CARGA? Esta ação não pode ser desfeita.")) {
      return;
    }

    setProcessando(true);
    try {
      const agora = new Date().toISOString();

      const novasMensagens = [...(chat.mensagens || []), {
        remetente: "transportadora",
        tipoMensagem: "devolucao",
        mensagem: `🚫 TRANSPORTADORA DESISTIU\n\nA transportadora optou por devolver a carga ao invés de continuar a negociação.\n\nA carga será devolvida ao remetente.`,
        dataHora: agora
      }];

      await base44.entities.Chat.update(chat.id, {
        status: "rejeitado_final",
        mensagens: novasMensagens
      });

      await base44.entities.Cotacao.update(cotacaoId, {
        status: "devolvida",
        cteRejeitadoCliente: true
      });

      queryClient.invalidateQueries(['cotacoes-aceitas']);

      alert("Você optou por devolver a carga.");
      navigate(createPageUrl("CotacoesAceitasTransportadora"));
    } catch (error) {
      console.error("Erro ao desistir:", error);
      alert("Erro ao processar. Tente novamente.");
    } finally {
      setProcessando(false);
    }
  };

  if (loadingCotacao || loadingChat || !user) {
    return <LoadingSpinner message="Carregando..." />;
  }

  if (!cotacao || !chat) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Negociação não encontrada.</AlertDescription>
        </Alert>
        <Link to={createPageUrl("CotacoesAceitasTransportadora")}>
          <Button className="mt-4">Voltar</Button>
        </Link>
      </div>
    );
  }

  const valorOriginal = chat.valorOriginalCotacao || 0;
  const valorAtual = chat.valorAtualProposta || 0;
  const tentativas = chat.tentativasNegociacao || 1; // Começa em 1
  const tentativasRestantes = 3 - tentativas;
  const podeProporNovoValor = chat.status === "aguardando_transportadora" && tentativasRestantes > 0;

  // Se foi rejeitado final (3 tentativas esgotadas), não pode mais negociar
  if (chat.status === "rejeitado_final" && tentativasRestantes === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Esta negociação foi encerrada. As 3 tentativas foram esgotadas e a carga será devolvida.
          </AlertDescription>
        </Alert>
        <Link to={createPageUrl("CotacoesAceitasTransportadora")}>
          <Button className="mt-4">Voltar</Button>
        </Link>
      </div>
    );
  }

  // Se não está aguardando transportadora, redireciona
  if (chat.status !== "aguardando_transportadora" && chat.status !== "aprovado") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 p-6">
        <Alert>
          <AlertDescription>
            Esta negociação não requer sua ação no momento.
          </AlertDescription>
        </Alert>
        <Link to={createPageUrl("CotacoesAceitasTransportadora")}>
          <Button className="mt-4">Voltar</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <PageHeader
        title="Enviar Contra-Proposta"
        description={`Cotação #${cotacao.id.slice(0, 8)}`}
        showBack
      />

      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <Alert className="bg-yellow-50 border-yellow-300">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-900">
            <strong>O cliente rejeitou seu valor anterior.</strong>
            <p className="mt-1">Você tem <strong>{tentativasRestantes} tentativa(s)</strong> restante(s) para enviar uma nova proposta.</p>
            {chat.motivoUltimaRejeicao && (
              <p className="mt-2 text-sm italic bg-yellow-100 p-2 rounded">
                Motivo da rejeição: "{chat.motivoUltimaRejeicao}"
              </p>
            )}
          </AlertDescription>
        </Alert>

        {/* Info Cotação */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              Dados da Cotação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Produto:</span>
              <span className="font-medium">{cotacao.produtoNome}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Valor Original:</span>
              <span className="font-bold text-gray-900">
                R$ {valorOriginal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Valor Rejeitado:</span>
              <span className="font-bold text-red-600 line-through">
                R$ {valorAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Histórico de Mensagens */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              Histórico da Negociação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {(chat.mensagens || []).slice(-3).map((msg, idx) => (
                <div key={idx} className={`p-2 rounded text-xs ${
                  msg.remetente === "transportadora" 
                    ? "bg-green-50 border-l-2 border-green-500" 
                    : "bg-blue-50 border-l-2 border-blue-500"
                }`}>
                  <p className="font-mono text-xs text-gray-500 mb-1">
                    {new Date(msg.dataHora).toLocaleString('pt-BR')}
                  </p>
                  <p className="whitespace-pre-line">{msg.mensagem}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Formulário */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Sua Resposta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {podeProporNovoValor && (
              <Card className="border-2 border-green-200 bg-green-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2 text-green-700">
                    <DollarSign className="w-5 h-5" />
                    Nova Proposta de Valor
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="novoValor">Novo Valor (R$) *</Label>
                    <Input
                      id="novoValor"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      value={novoValor}
                      onChange={(e) => setNovoValor(e.target.value)}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Deve ser maior que R$ {valorOriginal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="motivo">Motivo da Contra-Proposta *</Label>
                    <Textarea
                      id="motivo"
                      placeholder="Explique o motivo deste valor..."
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                  <Button
                    onClick={handleEnviarContraproposta}
                    disabled={processando || !novoValor || !motivo.trim()}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700"
                  >
                    {processando ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Enviar Contra-Proposta
                  </Button>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <Button
                onClick={handleDesistir}
                disabled={processando}
                variant="destructive"
                className="h-12"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Devolver Produto
              </Button>
              <Button
                onClick={handleAceitarValorOriginal}
                disabled={processando}
                className="h-12 bg-gray-600 hover:bg-gray-700"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Aceitar Valor da Cotação Original
              </Button>
            </div>
          </CardContent>
        </Card>

        <Link to={createPageUrl("CotacoesAceitasTransportadora")}>
          <Button variant="outline" className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>
      </div>
    </div>
  );
}
