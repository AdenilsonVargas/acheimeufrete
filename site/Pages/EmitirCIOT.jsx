import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle, FileText, Upload, Truck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PageHeader from "../components/common/PageHeader";
import LoadingSpinner from "../components/common/LoadingSpinner";

export default function EmitirCIOT() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const cotacaoId = urlParams.get("id");

  const [codigoCIOT, setCodigoCIOT] = useState("");
  const [valorCiot, setValorCiot] = useState("");
  const [uploading, setUploading] = useState(false);
  const [documentoCiot, setDocumentoCiot] = useState(null);
  const [documentoCiotXml, setDocumentoCiotXml] = useState(null);
  const [emitindo, setEmitindo] = useState(false);
  const [error, setError] = useState("");

  const { data: user } = useQuery({
    queryKey: ['user-emitir-ciot'],
    queryFn: () => base44.auth.me()
  });

  const { data: cotacao, isLoading } = useQuery({
    queryKey: ['cotacao-ciot', cotacaoId],
    queryFn: async () => {
      const cotacoes = await base44.entities.Cotacao.filter({ id: cotacaoId });
      return cotacoes[0];
    },
    enabled: !!cotacaoId
  });

  const { data: transportadora } = useQuery({
    queryKey: ['transportadora-ciot', user?.perfilAtivoId],
    queryFn: async () => {
      const perfis = await base44.entities.PerfilTransportadora.filter({
        userIdGoogle: user.perfilAtivoId
      });
      return perfis[0];
    },
    enabled: !!user
  });

  useEffect(() => {
    if (cotacao?.valorOriginalCotacao) {
      setValorCiot(cotacao.valorOriginalCotacao.toString());
    }
  }, [cotacao]);

  const handleUploadDocumento = async (e, tipo) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      if (tipo === "ciot") {
        setDocumentoCiot(file_url);
      } else if (tipo === "xml") {
        setDocumentoCiotXml(file_url);
      }
    } catch (err) {
      console.error("Erro ao fazer upload:", err);
      setError("Erro ao enviar documento. Tente novamente.");
    }
    setUploading(false);
  };

  const handleEmitirCIOT = async () => {
    if (!codigoCIOT || !valorCiot) {
      setError("Preencha o código e o valor do CIOT");
      return;
    }

    if (!documentoCiot) {
      setError("Anexe o documento do CIOT");
      return;
    }

    setEmitindo(true);
    setError("");

    try {
      const agora = new Date().toISOString();
      const valorFinal = parseFloat(valorCiot);

      await base44.entities.Cotacao.update(cotacaoId, {
        codigoCIOT: codigoCIOT,
        ciotRegistrado: true,
        dataHoraCIOTRegistrado: agora,
        documentoCiot: documentoCiot,
        documentoCiotXml: documentoCiotXml,
        valorCiot: valorFinal,
        valorFinalTransportadora: valorFinal,
        cteRegistrado: false
      });

      queryClient.invalidateQueries(['cotacao-ciot']);
      
      // Perguntar se quer emitir MDF-e
      const querMdfe = confirm("CIOT emitido com sucesso! Deseja emitir o MDF-e agora?");
      
      if (querMdfe) {
        navigate(createPageUrl(`EmitirMDFe?id=${cotacaoId}&origem=ciot`));
      } else {
        // Mover para "Em Entrega"
        await base44.entities.Cotacao.update(cotacaoId, {
          status: "em_transito"
        });
        navigate(createPageUrl("EmEntregaTransportadora"));
      }
    } catch (error) {
      console.error("Erro ao emitir CIOT:", error);
      setError("Erro ao processar. Tente novamente.");
    }
    setEmitindo(false);
  };

  if (isLoading || !cotacao) {
    return <LoadingSpinner message="Carregando dados da cotação..." />;
  }

  if (!transportadora || transportadora.tipoTransportador !== "autonomo") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
        <PageHeader title="Emitir CIOT" showBack />
        <div className="p-6 max-w-4xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Esta funcionalidade é exclusiva para transportadores autônomos.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <PageHeader 
        title="Emitir CIOT - OBRIGATÓRIO"
        description="Emissão obrigatória do CIOT para transportadores autônomos"
        showBack
      />

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Alert className="bg-orange-50 border-orange-200">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Atenção:</strong> Como transportador autônomo, você é OBRIGADO a emitir o CIOT antes de seguir com a entrega.
          </AlertDescription>
        </Alert>

        {/* Resumo da Cotação */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-blue-50 to-white">
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-600" />
              Dados da Cotação #{cotacao.id.slice(0, 8)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Produto:</span>
                <p className="font-semibold">{cotacao.produtoNome}</p>
              </div>
              <div>
                <span className="text-gray-500">Peso Total:</span>
                <p className="font-semibold">{cotacao.pesoTotal} kg</p>
              </div>
              <div>
                <span className="text-gray-500">Origem:</span>
                <p className="font-semibold">{cotacao.enderecoColetaCidade} - {cotacao.enderecoColetaEstado}</p>
              </div>
              <div>
                <span className="text-gray-500">Destino:</span>
                <p className="font-semibold">{cotacao.destinatarioCidade} - {cotacao.destinatarioEstado}</p>
              </div>
              <div>
                <span className="text-gray-500">Valor da Cotação:</span>
                <p className="font-bold text-green-700">R$ {cotacao.valorOriginalCotacao?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                <span className="text-gray-500">Volumes:</span>
                <p className="font-semibold">{cotacao.quantidadeVolumes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formulário de Emissão */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-600" />
              Dados do CIOT
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="codigoCIOT">Código do CIOT *</Label>
              <Input
                id="codigoCIOT"
                value={codigoCIOT}
                onChange={(e) => setCodigoCIOT(e.target.value)}
                placeholder="Digite o código do CIOT"
                className="font-mono"
              />
            </div>

            <div>
              <Label htmlFor="valorCiot">Valor do CIOT (R$) *</Label>
              <Input
                id="valorCiot"
                type="number"
                step="0.01"
                value={valorCiot}
                onChange={(e) => setValorCiot(e.target.value)}
                placeholder="0.00"
              />
              <p className="text-xs text-gray-500 mt-1">
                Valor padrão baseado na cotação aceita
              </p>
            </div>

            <div>
              <Label>Documento do CIOT (PDF/Imagem) *</Label>
              <div className="flex items-center gap-3 mt-2">
                {documentoCiot ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <a href={documentoCiot} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                      Ver documento
                    </a>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Nenhum documento anexado</p>
                )}
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => handleUploadDocumento(e, "ciot")}
                    className="hidden"
                    disabled={uploading}
                  />
                  <Button size="sm" variant="outline" asChild disabled={uploading}>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? "Enviando..." : "Anexar"}
                    </span>
                  </Button>
                </label>
              </div>
            </div>

            <div>
              <Label>XML do CIOT (Opcional)</Label>
              <div className="flex items-center gap-3 mt-2">
                {documentoCiotXml ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <a href={documentoCiotXml} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                      Ver XML
                    </a>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Nenhum XML anexado</p>
                )}
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".xml"
                    onChange={(e) => handleUploadDocumento(e, "xml")}
                    className="hidden"
                    disabled={uploading}
                  />
                  <Button size="sm" variant="outline" asChild disabled={uploading}>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? "Enviando..." : "Anexar XML"}
                    </span>
                  </Button>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button
                onClick={handleEmitirCIOT}
                disabled={emitindo || !codigoCIOT || !valorCiot || !documentoCiot}
                className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800"
                size="lg"
              >
                {emitindo ? "Emitindo CIOT..." : "Emitir CIOT"}
              </Button>
              <p className="text-xs text-center text-gray-500 mt-2">
                Após emitir, você poderá escolher se deseja emitir o MDF-e
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
