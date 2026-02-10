import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Package,
  DollarSign,
  Truck,
  ArrowLeft
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PageHeader from "../components/common/PageHeader";
import LoadingSpinner from "../components/common/LoadingSpinner";

export default function AprovarCTe() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const cotacaoId = urlParams.get("id");

  // Redirecionar para a nova página de negociação
  React.useEffect(() => {
    if (cotacaoId) {
      navigate(createPageUrl(`NegociacaoCTe?id=${cotacaoId}`), { replace: true });
    }
  }, [cotacaoId, navigate]);

  const [processando, setProcessando] = useState(false);
  const [resultado, setResultado] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['user-aprovar-cte'],
    queryFn: () => base44.auth.me(),
    staleTime: 60000
  });

  const { data: cotacao, isLoading } = useQuery({
    queryKey: ['cotacao-aprovar-cte', cotacaoId],
    queryFn: async () => {
      if (!cotacaoId) return null;
      const cotacoes = await base44.entities.Cotacao.filter({ id: cotacaoId });
      if (cotacoes.length === 0) return null;
      
      const cot = cotacoes[0];
      const respostas = await base44.entities.RespostaCotacao.filter({ id: cot.respostaSelecionadaId });
      
      let transportadora = null;
      if (respostas[0]?.transportadoraId) {
        const transp = await base44.entities.PerfilTransportadora.filter({ id: respostas[0].transportadoraId });
        transportadora = transp[0];
      }
      
      return { ...cot, resposta: respostas[0], transportadora };
    },
    enabled: !!cotacaoId
  });

  const valorCotacao = cotacao?.resposta?.valorTotal || 0;
  const valorCTe = cotacao?.valorFinalTransportadora || 0;
  const diferencaValor = cotacao?.diferencaValor || 0;

  const handleAprovar = async () => {
    setProcessando(true);
    try {
      await base44.entities.Cotacao.update(cotacaoId, {
        cteAprovadoCliente: true,
        cteRejeitadoCliente: false,
        dataHoraAprovacaoCTe: new Date().toISOString(),
        status: "em_transito",
        valorFinalCliente: valorCTe
      });

      queryClient.invalidateQueries(['cotacoes']);
      setResultado("aprovado");

      setTimeout(() => {
        navigate(createPageUrl("CotacoesColetadas"));
      }, 2000);
    } catch (error) {
      console.error("Erro ao aprovar:", error);
      alert("Erro ao aprovar. Tente novamente.");
    } finally {
      setProcessando(false);
    }
  };

  const handleRejeitar = async () => {
    if (!confirm("Tem certeza que deseja REJEITAR o novo valor? A carga será DEVOLVIDA.")) {
      return;
    }

    setProcessando(true);
    try {
      await base44.entities.Cotacao.update(cotacaoId, {
        cteAprovadoCliente: false,
        cteRejeitadoCliente: true,
        dataHoraAprovacaoCTe: new Date().toISOString(),
        status: "devolvida"
      });

      queryClient.invalidateQueries(['cotacoes']);
      setResultado("rejeitado");

      setTimeout(() => {
        navigate(createPageUrl("CotacoesAceitas"));
      }, 2000);
    } catch (error) {
      console.error("Erro ao rejeitar:", error);
      alert("Erro ao rejeitar. Tente novamente.");
    } finally {
      setProcessando(false);
    }
  };

  if (isLoading || !user) {
    return <LoadingSpinner message="Carregando..." />;
  }

  if (!cotacao) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Cotação não encontrada.</AlertDescription>
        </Alert>
        <Link to={createPageUrl("CotacoesAceitas")}>
          <Button className="mt-4">Voltar</Button>
        </Link>
      </div>
    );
  }

  // Já foi decidido
  if (cotacao.cteAprovadoCliente || cotacao.cteRejeitadoCliente) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
        <PageHeader
          title="Aprovação CT-e"
          description={`Cotação #${cotacao.id.slice(0, 8)}`}
          showBack
        />
        <div className="p-6 max-w-2xl mx-auto">
          {cotacao.cteAprovadoCliente ? (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Você já aprovou este CT-e.</strong> A transportadora seguirá com a entrega.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="bg-red-50 border-red-200">
              <XCircle className="h-5 w-5 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Você rejeitou este CT-e.</strong> A carga será devolvida.
              </AlertDescription>
            </Alert>
          )}
          <Link to={createPageUrl("CotacoesAceitas")}>
            <Button className="mt-4 w-full" variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Cotações
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <PageHeader
        title="Aprovar Valor CT-e"
        description={`Cotação #${cotacao.id.slice(0, 8)}`}
        showBack
      />

      <div className="p-6 max-w-2xl mx-auto space-y-6">
        {resultado ? (
          <Alert className={resultado === "aprovado" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
            {resultado === "aprovado" ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            <AlertDescription className={resultado === "aprovado" ? "text-green-800" : "text-red-800"}>
              {resultado === "aprovado" ? (
                <strong>Valor aprovado! A transportadora seguirá com a entrega.</strong>
              ) : (
                <strong>Valor rejeitado. A carga será devolvida.</strong>
              )}
              <br />Redirecionando...
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <Alert className="bg-orange-50 border-orange-300">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <AlertDescription className="text-orange-900">
                <strong>⚠️ APROVAÇÃO NECESSÁRIA</strong>
                <p className="mt-1">A transportadora informou um valor de CT-e diferente da cotação original.</p>
                <p className="mt-2 font-bold">O produto NÃO será enviado sem sua confirmação.</p>
              </AlertDescription>
            </Alert>

            {/* Dados do Produto */}
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
                  <span className="text-gray-600">NCM:</span>
                  <span className="font-mono text-sm">{cotacao.produtoNCM}</span>
                </div>
                {cotacao.transportadora && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Transportadora:</span>
                    <span className="font-medium">{cotacao.transportadora.razaoSocial}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Comparativo de Valores */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  Comparativo de Valores
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Valor da Cotação Original:</span>
                  <span className="font-bold text-lg">
                    R$ {valorCotacao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <span className="text-blue-700">Valor do CT-e:</span>
                  <span className="font-bold text-xl text-blue-700">
                    R$ {valorCTe.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <span className="text-orange-700 font-semibold">Diferença:</span>
                  <span className="font-bold text-xl text-orange-700">
                    + R$ {diferencaValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Motivo do Aumento */}
            {cotacao.motivoAumentoCTe && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Motivo informado pela Transportadora</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg italic">
                    "{cotacao.motivoAumentoCTe}"
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Ações */}
            <Card className="border-2 border-gray-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Sua Decisão</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="bg-blue-50 border-blue-200">
                  <Truck className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800 text-sm">
                    <strong>✅ Se ACEITAR:</strong> A transportadora seguirá com a entrega pelo novo valor de <strong>R$ {valorCTe.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>.
                  </AlertDescription>
                </Alert>

                <Alert className="bg-red-50 border-red-200">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800 text-sm">
                    <strong>❌ Se RECUSAR:</strong> A carga será <strong>DEVOLVIDA</strong> e a entrega não será realizada.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleRejeitar}
                    disabled={processando}
                    variant="destructive"
                    className="flex-1"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Recusar e Devolver
                  </Button>
                  <Button
                    onClick={handleAprovar}
                    disabled={processando}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {processando ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                    )}
                    Aprovar Novo Valor
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Link to={createPageUrl("CotacoesAceitas")}>
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar (decidir depois)
              </Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
