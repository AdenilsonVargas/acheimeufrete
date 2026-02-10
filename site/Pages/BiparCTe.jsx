import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  ScanLine,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  Send,
  Package,
  Upload,
  X,
  Link as LinkIcon,
  Truck
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PageHeader from "../components/common/PageHeader";
import LoadingSpinner from "../components/common/LoadingSpinner";

export default function BiparCTe() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const cotacaoId = urlParams.get("id");

  const [codigoCTe, setCodigoCTe] = useState("");
  const [valorCTe, setValorCTe] = useState("");
  const [motivoAumento, setMotivoAumento] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState("");
  const [documentos, setDocumentos] = useState([]);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [urlRastreamento, setUrlRastreamento] = useState("");
  const [codigoRastreio, setCodigoRastreio] = useState("");

  const { data: user } = useQuery({
    queryKey: ['user-bipar-cte'],
    queryFn: () => base44.auth.me(),
    staleTime: 60000
  });

  const { data: cotacao, isLoading, refetch } = useQuery({
    queryKey: ['cotacao-bipar-cte', cotacaoId],
    queryFn: async () => {
      if (!cotacaoId) return null;
      const cotacoes = await base44.entities.Cotacao.filter({ id: cotacaoId });
      if (cotacoes.length === 0) return null;
      
      const cot = cotacoes[0];
      const respostas = await base44.entities.RespostaCotacao.filter({ id: cot.respostaSelecionadaId });
      
      // Buscar transportadora
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
  const valorCTeNum = parseFloat(valorCTe) || 0;
  const diferencaValor = valorCTeNum - valorCotacao;
  const temAumento = diferencaValor > 0;
  const cteJaRegistrado = cotacao?.cteRegistrado;

  const handleUploadDocumento = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingDocs(true);
    try {
      const uploadPromises = files.map(file => 
        base44.integrations.Core.UploadFile({ file })
      );
      const results = await Promise.all(uploadPromises);
      const urls = results.map(r => r.file_url);
      setDocumentos(prev => [...prev, ...urls]);
    } catch (err) {
      console.error("Erro ao fazer upload:", err);
      alert("Erro ao enviar documento(s). Tente novamente.");
    }
    setUploadingDocs(false);
  };

  const handleRemoverDocumento = (index) => {
    setDocumentos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!codigoCTe.trim()) {
      alert("Digite o código do CT-e");
      return;
    }
    if (!valorCTe || valorCTeNum <= 0) {
      alert("Digite o valor do CT-e");
      return;
    }
    if (documentos.length === 0) {
      alert("Anexe pelo menos um documento (XML do CT-e ou MDF-e)");
      return;
    }
    if (!urlRastreamento.trim()) {
      alert("Informe a URL de rastreamento");
      return;
    }
    if (!codigoRastreio.trim()) {
      alert("Informe o código de rastreio");
      return;
    }
    if (temAumento && !motivoAumento.trim()) {
      alert("Informe o motivo do aumento de valor");
      return;
    }

    setEnviando(true);
    try {
      const agora = new Date().toISOString();
      
      const dadosAtualizacao = {
        codigoCTe: codigoCTe.trim(),
        valorFinalTransportadora: valorCTeNum,
        cteRegistrado: true,
        dataHoraCTeRegistrado: agora,
        diferencaValor: diferencaValor,
        documentoCte: documentos[0], // Primeiro documento como CT-e principal
        documentoTem: documentos.length > 1 ? documentos[1] : null, // Segundo como TEM/MDF-e
        documentosEntrega: documentos, // Todos os documentos
        urlRastreamento: urlRastreamento.trim(),
        codigoRastreio: codigoRastreio.trim(),
        status: "em_transito" // Muda status para em trânsito
      };

      // Se valor CT-e maior que cotação, precisa aprovação do cliente
      if (temAumento) {
        dadosAtualizacao.status = "aguardando_aprovacao_cte"; // Override para aguardar aprovação
        dadosAtualizacao.motivoAumentoCTe = motivoAumento.trim();

        // Criar chat de negociação automática
        await base44.entities.Chat.create({
          cotacaoId: cotacaoId,
          clienteId: cotacao.clienteId,
          transportadoraId: cotacao.resposta?.transportadoraId || "sistema",
          tipo: "negociacao_cte",
          status: "aguardando_cliente",
          tentativasNegociacao: 0, // Não conta a proposta inicial do CT-e
          valorOriginalCotacao: valorCotacao,
          valorAtualProposta: valorCTeNum,
          dataHoraInicio: agora,
          dataHoraExpiracao: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          lidoPorCliente: false,
          lidoPorTransportadora: true,
          dataHoraUltimaMensagem: agora,
          mensagens: [{
            remetente: "transportadora",
            tipoMensagem: "proposta_valor",
            valorProposto: valorCTeNum,
            mensagem: `Transportadora informou um novo valor de R$ ${valorCTeNum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} devido ao motivo: "${motivoAumento.trim()}".\n\nAguardamos sua aprovação ou rejeição para seguir com a entrega.`,
            dataHora: agora
          }]
        });

        setMensagemSucesso("CT-e registrado! Aguardando aprovação do cliente para o valor adicional.");
      } else {
        // Valor igual ou menor - só registra
        setMensagemSucesso("CT-e registrado com sucesso!");
      }

      await base44.entities.Cotacao.update(cotacaoId, dadosAtualizacao);

      queryClient.invalidateQueries(['cotacoes-aceitas']);
      queryClient.invalidateQueries(['cotacao-bipar-cte']);
      setSucesso(true);

      setTimeout(() => {
        // Se tem aumento, fica em CotacoesAceitas (aguardando aprovação)
        // Se não tem aumento, vai para Em Entrega
        if (temAumento) {
          navigate(createPageUrl("CotacoesAceitasTransportadora"));
        } else {
          navigate(createPageUrl("EmEntregaTransportadora"));
        }
      }, 3000);

    } catch (error) {
      console.error("Erro ao registrar CT-e:", error);
      alert("Erro ao registrar CT-e. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  };

  if (isLoading || !user) {
    return <LoadingSpinner message="Carregando cotação..." />;
  }

  if (!cotacao) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Cotação não encontrada.</AlertDescription>
        </Alert>
        <Link to={createPageUrl("CotacoesAceitasTransportadora")}>
          <Button className="mt-4">Voltar</Button>
        </Link>
      </div>
    );
  }

  // Se CT-e já foi registrado, mostra os dados
  if (cteJaRegistrado) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
        <PageHeader
          title="CT-e Registrado"
          description={`Cotação #${cotacao.id.slice(0, 8)}`}
          showBack
        />

        <div className="p-6 max-w-2xl mx-auto space-y-6">
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>CT-e já registrado para esta cotação!</strong>
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Dados do CT-e
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Código CT-e:</span>
                <span className="font-mono font-bold">{cotacao.codigoCTe}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Valor CT-e:</span>
                <span className="font-bold text-green-600">
                  R$ {cotacao.valorFinalTransportadora?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Valor Cotação:</span>
                <span className="font-medium">
                  R$ {valorCotacao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              {cotacao.diferencaValor > 0 && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Diferença:</span>
                    <span className="font-bold text-orange-600">
                      + R$ {cotacao.diferencaValor?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="pt-2 border-t">
                    <span className="text-gray-600 text-sm">Status:</span>
                    {cotacao.status === "aguardando_aprovacao_cte" && (
                      <Badge className="ml-2 bg-yellow-100 text-yellow-800">Aguardando Aprovação</Badge>
                    )}
                    {cotacao.cteAprovadoCliente && (
                      <Badge className="ml-2 bg-green-100 text-green-800">Aprovado pelo Cliente</Badge>
                    )}
                    {cotacao.cteRejeitadoCliente && (
                      <Badge className="ml-2 bg-red-100 text-red-800">Rejeitado - Devolução</Badge>
                    )}
                  </div>
                  {cotacao.motivoAumentoCTe && (
                    <div className="pt-2">
                      <span className="text-gray-600 text-sm">Motivo do aumento:</span>
                      <p className="text-gray-800 mt-1 bg-gray-50 p-2 rounded">{cotacao.motivoAumentoCTe}</p>
                    </div>
                  )}
                </>
              )}
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>Registrado em:</span>
                <span>{new Date(cotacao.dataHoraCTeRegistrado).toLocaleString('pt-BR')}</span>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <PageHeader
        title="Bipar CT-e"
        description={`Cotação #${cotacao.id.slice(0, 8)}`}
        showBack
      />

      <div className="p-6 max-w-2xl mx-auto space-y-6">
        {sucesso ? (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>{mensagemSucesso}</strong>
              <br />Redirecionando...
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {/* Resumo da cotação */}
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
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Valor da Cotação:</span>
                  <span className="font-bold text-green-600 text-lg">
                    R$ {valorCotacao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Formulário CT-e */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ScanLine className="w-5 h-5 text-blue-600" />
                  Registrar CT-e e Documentos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="codigoCTe">Código do CT-e / MDF-e *</Label>
                  <Input
                    id="codigoCTe"
                    placeholder="Digite ou bipe o código do CT-e ou MDF-e"
                    value={codigoCTe}
                    onChange={(e) => setCodigoCTe(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="valorCTe">Valor do CT-e (R$) *</Label>
                  <Input
                    id="valorCTe"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={valorCTe}
                    onChange={(e) => setValorCTe(e.target.value)}
                    className="mt-1"
                  />
                </div>

                {/* Upload de documentos */}
                <div className="space-y-3">
                  <Label>Documentos (XML, CT-e, MDF-e, etc) *</Label>
                  <div>
                    <Label htmlFor="upload-docs" className="cursor-pointer">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                        <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm font-medium text-gray-700">Clique para anexar documentos</p>
                        <p className="text-xs text-gray-500 mt-1">XML, PDF, PNG, JPG</p>
                      </div>
                    </Label>
                    <input
                      id="upload-docs"
                      type="file"
                      multiple
                      accept=".xml,.pdf,.png,.jpg,.jpeg"
                      onChange={handleUploadDocumento}
                      className="hidden"
                      disabled={uploadingDocs}
                    />
                  </div>

                  {uploadingDocs && (
                    <div className="text-center py-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-xs text-gray-500 mt-1">Enviando...</p>
                    </div>
                  )}

                  {documentos.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">{documentos.length} documento(s) anexado(s):</p>
                      {documentos.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-green-600" />
                            <a href={doc} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                              Documento {index + 1}
                            </a>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => handleRemoverDocumento(index)}>
                            <X className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Campo motivo - aparece quando tem aumento */}
                {valorCTeNum > 0 && temAumento && (
                  <div className="space-y-3">
                    <Alert className="bg-orange-50 border-orange-200">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <AlertDescription className="text-orange-800">
                        <strong>Atenção!</strong> O valor do CT-e é <strong>R$ {diferencaValor.toFixed(2)}</strong> maior que a cotação.
                        <br />
                        O cliente precisará aprovar este valor adicional. Caso não aprove, o produto deverá ser devolvido.
                        <br /><br />
                        <strong>⚠️ O produto NÃO será enviado sem a confirmação do cliente.</strong>
                      </AlertDescription>
                    </Alert>

                    <div>
                      <Label htmlFor="motivoAumento">Motivo do Aumento *</Label>
                      <Textarea
                        id="motivoAumento"
                        placeholder="Explique o motivo do aumento de valor (ex: peso real maior, cubagem diferente, etc.)"
                        value={motivoAumento}
                        onChange={(e) => setMotivoAumento(e.target.value)}
                        className="mt-1"
                        rows={3}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Esta mensagem será enviada automaticamente para o cliente.
                      </p>
                    </div>
                  </div>
                )}

                {/* Valor igual ou menor */}
                {valorCTeNum > 0 && !temAumento && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Valor dentro do esperado. Nenhuma aprovação adicional necessária.
                    </AlertDescription>
                  </Alert>
                )}

                {/* URL e Código de Rastreio - OBRIGATÓRIOS */}
                <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-800 flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    Dados de Rastreamento (Obrigatório)
                  </h4>

                  <div>
                    <Label htmlFor="urlRastreamento" className="flex items-center gap-2">
                      <LinkIcon className="w-4 h-4" />
                      URL de Rastreamento *
                    </Label>
                    <Input
                      id="urlRastreamento"
                      type="url"
                      placeholder="https://rastreamento.transportadora.com.br/..."
                      value={urlRastreamento}
                      onChange={(e) => setUrlRastreamento(e.target.value)}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Link onde o cliente poderá acompanhar a entrega
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="codigoRastreio">Código de Rastreio *</Label>
                    <Input
                      id="codigoRastreio"
                      placeholder="Ex: BR123456789XX"
                      value={codigoRastreio}
                      onChange={(e) => setCodigoRastreio(e.target.value)}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Código para o cliente consultar o status da entrega
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={enviando || !codigoCTe.trim() || !valorCTe || documentos.length === 0 || !urlRastreamento.trim() || !codigoRastreio.trim() || (temAumento && !motivoAumento.trim())}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                >
                  {enviando ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  {temAumento ? "Enviar para Aprovação do Cliente" : "Registrar e Iniciar Entrega"}
                </Button>
              </CardContent>
            </Card>

            <Link to={createPageUrl("CotacoesAceitasTransportadora")}>
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
