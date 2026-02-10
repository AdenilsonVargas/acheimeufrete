import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Package,
  DollarSign,
  Truck,
  ArrowLeft,
  MessageSquare,
  RotateCcw
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PageHeader from "../components/common/PageHeader";
import LoadingSpinner from "../components/common/LoadingSpinner";

export default function NegociacaoCTe() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const cotacaoId = urlParams.get("id");

  const [motivoRejeicao, setMotivoRejeicao] = useState("");
  const [showRejeicaoForm, setShowRejeicaoForm] = useState(false);
  const [processando, setProcessando] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['user-negociacao'],
    queryFn: () => base44.auth.me(),
    staleTime: 60000
  });

  const { data: cotacao, isLoading: loadingCotacao } = useQuery({
    queryKey: ['cotacao-negociacao', cotacaoId],
    queryFn: async () => {
      if (!cotacaoId) return null;
      const cotacoes = await base44.entities.Cotacao.filter({ id: cotacaoId });
      return cotacoes[0] || null;
    },
    enabled: !!cotacaoId
  });

  const { data: chat, isLoading: loadingChat, refetch: refetchChat } = useQuery({
    queryKey: ['chat-negociacao', cotacaoId],
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

  const { data: transportadora } = useQuery({
    queryKey: ['transportadora-negociacao', chat?.transportadoraId],
    queryFn: async () => {
      if (!chat?.transportadoraId) return null;
      const transp = await base44.entities.PerfilTransportadora.filter({ id: chat.transportadoraId });
      return transp[0] || null;
    },
    enabled: !!chat?.transportadoraId
  });

  const handleAprovar = async () => {
    setProcessando(true);
    try {
      const agora = new Date().toISOString();

      // Atualizar chat
      const novasMensagens = [...(chat.mensagens || []), {
        remetente: "cliente",
        tipoMensagem: "aprovacao",
        mensagem: `✅ VALOR APROVADO\n\nO cliente aprovou o novo valor de R$ ${chat.valorAtualProposta?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.\n\nA entrega pode prosseguir.`,
        dataHora: agora
      }];

      await base44.entities.Chat.update(chat.id, {
        status: "aprovado",
        mensagens: novasMensagens
      });

      // Atualizar cotação com o valor APROVADO pelo cliente
      await base44.entities.Cotacao.update(cotacaoId, {
        status: "em_transito",
        cteAprovadoCliente: true,
        dataHoraAprovacaoCTe: agora,
        valorFinalTransportadora: chat.valorAtualProposta, // VALOR APROVADO
        valorFinalCliente: chat.valorAtualProposta
      });

      queryClient.invalidateQueries(['cotacoes']);
      queryClient.invalidateQueries(['chat-negociacao']);

      alert("Valor aprovado! A transportadora seguirá com a entrega.");
      navigate(createPageUrl("CotacoesColetadas"));
    } catch (error) {
      console.error("Erro ao aprovar:", error);
      alert("Erro ao aprovar. Tente novamente.");
    } finally {
      setProcessando(false);
    }
  };

  const handleRejeitar = async () => {
    if (!motivoRejeicao.trim()) {
      alert("Informe o motivo da rejeição");
      return;
    }

    setProcessando(true);
    try {
      const agora = new Date().toISOString();
      // tentativasNegociacao conta apenas as contra-propostas da transportadora (não inclui proposta inicial)
      const tentativasAtuais = chat.tentativasNegociacao || 0;
      
      // Se a transportadora já fez 3 tentativas e cliente rejeita = rejeição final
      const ehRejeicaoFinal = tentativasAtuais >= 3;

      const novasMensagens = [...(chat.mensagens || []), {
        remetente: "cliente",
        tipoMensagem: ehRejeicaoFinal ? "devolucao" : "rejeicao",
        motivoRejeicao: motivoRejeicao.trim(),
        mensagem: ehRejeicaoFinal 
          ? `❌ VALOR REJEITADO - DEVOLUÇÃO NECESSÁRIA\n\nO cliente rejeitou o valor pela terceira vez.\n\n📝 Motivo: "${motivoRejeicao.trim()}"\n\n⚠️ A carga deverá ser devolvida ao remetente. Não há mais possibilidade de negociação.`
          : `❌ Cliente recusou o valor de R$ ${chat.valorAtualProposta?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.` +
            `\n\n📝 Motivo: "${motivoRejeicao.trim()}"\n\n` +
            `Tente um novo valor e informe o motivo e por que tem que ser este valor ou aceite o valor conforme a cotação.` +
            `\n\nTentativa ${tentativasAtuais + 1}/3.`,
        dataHora: agora
      }];

      await base44.entities.Chat.update(chat.id, {
        status: ehRejeicaoFinal ? "rejeitado_final" : "aguardando_transportadora",
        motivoUltimaRejeicao: motivoRejeicao.trim(),
        mensagens: novasMensagens,
        lidoPorTransportadora: false
      });

      // Se for rejeição final, marcar cotação como devolvida
      if (ehRejeicaoFinal) {
        await base44.entities.Cotacao.update(cotacaoId, {
          status: "devolvida",
          cteRejeitadoCliente: true,
          valorFinalTransportadora: cotacao.valorOriginalCotacao, // Mantém valor original se devolvido
          dataHoraAprovacaoCTe: agora
        });
        alert("Valor rejeitado definitivamente. A carga será devolvida.");
      } else {
        alert("Valor rejeitado. A transportadora poderá enviar uma contra-proposta.");
      }

      queryClient.invalidateQueries(['cotacoes']);
      queryClient.invalidateQueries(['chat-negociacao']);
      setMotivoRejeicao("");
      setShowRejeicaoForm(false);
      refetchChat();

    } catch (error) {
      console.error("Erro ao rejeitar:", error);
      alert("Erro ao rejeitar. Tente novamente.");
    } finally {
      setProcessando(false);
    }
  };

  if (loadingCotacao || loadingChat || !user) {
    return <LoadingSpinner message="Carregando negociação..." />;
  }

  if (!cotacao || !chat) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Negociação não encontrada.</AlertDescription>
        </Alert>
        <Link to={createPageUrl("CotacoesAceitas")}>
          <Button className="mt-4">Voltar</Button>
        </Link>
      </div>
    );
  }

  const valorOriginal = chat.valorOriginalCotacao || 0;
  const valorProposto = chat.valorAtualProposta || 0;
  const diferenca = valorProposto - valorOriginal;
  const tentativas = chat.tentativasNegociacao || 0;
  const aguardandoCliente = chat.status === "aguardando_cliente";
  const aguardandoTransportadora = chat.status === "aguardando_transportadora";
  const aprovado = chat.status === "aprovado";
  const rejeitadoFinal = chat.status === "rejeitado_final";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <PageHeader
        title="Negociação de Valor"
        description={`Cotação #${cotacao.id.slice(0, 8)}`}
        showBack
      />

      <div className="p-6 max-w-2xl mx-auto space-y-6">
        {/* Status da Negociação */}
        <div className="flex items-center justify-center gap-2">
          {aguardandoCliente && (
            <Badge className="bg-yellow-100 text-yellow-800 text-sm px-4 py-2">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Aguardando sua decisão
            </Badge>
          )}
          {aguardandoTransportadora && (
            <Badge className="bg-blue-100 text-blue-800 text-sm px-4 py-2">
              <Truck className="w-4 h-4 mr-2" />
              Aguardando contra-proposta da transportadora
            </Badge>
          )}
          {aprovado && (
            <Badge className="bg-green-100 text-green-800 text-sm px-4 py-2">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Valor Aprovado - Entrega em andamento
            </Badge>
          )}
          {rejeitadoFinal && (
            <Badge className="bg-red-100 text-red-800 text-sm px-4 py-2">
              <XCircle className="w-4 h-4 mr-2" />
              Rejeitado - Carga será devolvida
            </Badge>
          )}
        </div>

        {/* Info da Cotação */}
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
              <span className="text-gray-600">Transportadora:</span>
              <span className="font-medium">{transportadora?.razaoSocial || "—"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">CT-e:</span>
              <span className="font-mono font-medium">{cotacao.codigoCTe}</span>
            </div>
          </CardContent>
        </Card>

        {/* Comparação de Valores */}
        <Card className="border-2 border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-orange-800">
              <DollarSign className="w-5 h-5" />
              Comparação de Valores
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-white rounded-lg">
              <span className="text-gray-600">Valor Original (Cotação):</span>
              <span className="font-bold text-lg">
                R$ {valorOriginal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white rounded-lg border-2 border-orange-300">
              <span className="text-gray-600">Valor Proposto (CT-e):</span>
              <span className="font-bold text-lg text-orange-700">
                R$ {valorProposto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-100 rounded-lg">
              <span className="text-red-800 font-medium">Diferença:</span>
              <span className="font-bold text-lg text-red-700">
                + R$ {diferenca.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            {cotacao.motivoAumentoCTe && (
              <div className="p-3 bg-white rounded-lg">
                <span className="text-gray-600 text-sm">Motivo do aumento:</span>
                <p className="mt-1 font-medium">{cotacao.motivoAumentoCTe}</p>
              </div>
            )}
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
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {(chat.mensagens || []).map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`p-3 rounded-lg ${
                    msg.remetente === "cliente" 
                      ? "bg-blue-50 border-l-4 border-blue-500" 
                      : msg.remetente === "transportadora"
                        ? "bg-green-50 border-l-4 border-green-500"
                        : "bg-gray-50 border-l-4 border-gray-400"
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium uppercase text-gray-500">
                      {msg.remetente === "cliente" ? "Você" : msg.remetente === "transportadora" ? "Transportadora" : "Sistema"}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(msg.dataHora).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-line">{msg.mensagem}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Ações do Cliente */}
        {aguardandoCliente && !showRejeicaoForm && (
          <Card className="border-2 border-blue-200">
            <CardContent className="p-6 space-y-4">
              <p className="text-center text-gray-600 mb-4">
                <strong>O que deseja fazer?</strong>
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={handleAprovar}
                  disabled={processando}
                  className="w-full h-16 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                >
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Aprovar Novo Valor
                </Button>
                <Button
                  onClick={() => setShowRejeicaoForm(true)}
                  disabled={processando}
                  variant="outline"
                  className="w-full h-16 border-red-300 text-red-600 hover:bg-red-50"
                >
                  <XCircle className="w-5 h-5 mr-2" />
                  Rejeitar Valor
                </Button>
              </div>
              <p className="text-xs text-center text-gray-500">
                {tentativas === 0
                  ? "⚠️ Esta é a proposta inicial. Se rejeitar, a transportadora poderá fazer mais 2 contra-propostas."
                  : tentativas === 1
                    ? "Se rejeitar novamente, a transportadora terá mais 2 tentativas para enviar uma contra-proposta."
                    : tentativas === 2
                      ? "⚠️ Se rejeitar novamente, a transportadora terá mais 1 tentativa (última chance)."
                      : tentativas >= 3
                        ? "⚠️ Se rejeitar novamente, a carga será devolvida (última tentativa da transportadora já foi feita)."
                        : ""
                }
              </p>
            </CardContent>
          </Card>
        )}

        {/* Formulário de Rejeição */}
        {aguardandoCliente && showRejeicaoForm && (
          <Card className="border-2 border-red-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-red-700">
                <XCircle className="w-5 h-5" />
                Rejeitar Valor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {tentativas === 3 && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <strong>Atenção!</strong> Esta é a última chance para a transportadora. Se rejeitar, a carga será devolvida ao remetente e a negociação será encerrada.
                  </AlertDescription>
                </Alert>
              )}
              <div>
                <Label htmlFor="motivoRejeicao">Motivo da Rejeição *</Label>
                <Textarea
                  id="motivoRejeicao"
                  placeholder="Explique por que está rejeitando o valor..."
                  value={motivoRejeicao}
                  onChange={(e) => setMotivoRejeicao(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowRejeicaoForm(false)}
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
                <Button
                  onClick={handleRejeitar}
                  disabled={processando || !motivoRejeicao.trim()}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {processando ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  ) : (
                    <XCircle className="w-4 h-4 mr-2" />
                  )}
                  Confirmar Rejeição
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mensagem quando aguardando transportadora */}
        {aguardandoTransportadora && (
          <Alert className="bg-blue-50 border-blue-200">
            <RotateCcw className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              Aguardando a transportadora enviar uma contra-proposta. Você será notificado quando houver resposta.
            </AlertDescription>
          </Alert>
        )}

        <Link to={createPageUrl("CotacoesAceitas")}>
          <Button variant="outline" className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Cotações
          </Button>
        </Link>
      </div>
    </div>
  );
}
