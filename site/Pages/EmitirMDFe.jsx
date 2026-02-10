import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, FileText, Upload, Truck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PageHeader from "../components/common/PageHeader";
import LoadingSpinner from "../components/common/LoadingSpinner";

export default function EmitirMDFe() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const cotacaoId = urlParams.get("id");
  const origem = urlParams.get("origem"); // "ciot" ou "cte"

  const [codigoMDFe, setCodigoMDFe] = useState("");
  const [uploading, setUploading] = useState(false);
  const [documentoMdfe, setDocumentoMdfe] = useState(null);
  const [documentoMdfeXml, setDocumentoMdfeXml] = useState(null);
  const [emitindo, setEmitindo] = useState(false);
  const [error, setError] = useState("");

  const { data: cotacao, isLoading } = useQuery({
    queryKey: ['cotacao-mdfe', cotacaoId],
    queryFn: async () => {
      const cotacoes = await base44.entities.Cotacao.filter({ id: cotacaoId });
      return cotacoes[0];
    },
    enabled: !!cotacaoId
  });

  const handleUploadDocumento = async (e, tipo) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      if (tipo === "mdfe") {
        setDocumentoMdfe(file_url);
      } else if (tipo === "xml") {
        setDocumentoMdfeXml(file_url);
      }
    } catch (err) {
      console.error("Erro ao fazer upload:", err);
      setError("Erro ao enviar documento. Tente novamente.");
    }
    setUploading(false);
  };

  const handleEmitirMDFe = async () => {
    if (!codigoMDFe) {
      setError("Preencha o código do MDF-e");
      return;
    }

    if (!documentoMdfe) {
      setError("Anexe o documento do MDF-e");
      return;
    }

    setEmitindo(true);
    setError("");

    try {
      const agora = new Date().toISOString();

      await base44.entities.Cotacao.update(cotacaoId, {
        codigoMDFe: codigoMDFe,
        mdfeRegistrado: true,
        dataHoraMDFeRegistrado: agora,
        documentoMdfe: documentoMdfe,
        documentoMdfeXml: documentoMdfeXml,
        status: "em_transito"
      });

      queryClient.invalidateQueries(['cotacao-mdfe']);
      alert("MDF-e emitido com sucesso! Cotação movida para 'Em Entrega'.");
      navigate(createPageUrl("EmEntregaTransportadora"));
    } catch (error) {
      console.error("Erro ao emitir MDF-e:", error);
      setError("Erro ao processar. Tente novamente.");
    }
    setEmitindo(false);
  };

  const handlePularMDFe = async () => {
    try {
      await base44.entities.Cotacao.update(cotacaoId, {
        status: "em_transito"
      });
      navigate(createPageUrl("EmEntregaTransportadora"));
    } catch (error) {
      console.error("Erro:", error);
    }
  };

  if (isLoading || !cotacao) {
    return <LoadingSpinner message="Carregando dados da cotação..." />;
  }

  const documentoReferencia = origem === "ciot" ? cotacao.codigoCIOT : cotacao.codigoCTe;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <PageHeader 
        title="Emitir MDF-e (Opcional)"
        description="Manifesto Eletrônico de Documentos Fiscais"
        showBack
      />

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            A emissão do MDF-e é <strong>opcional</strong>. Ele faz referência ao {origem === "ciot" ? "CIOT" : "CT-e"} já emitido.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader className="bg-gradient-to-r from-blue-50 to-white">
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-600" />
              Referência: {origem === "ciot" ? "CIOT" : "CT-e"} {documentoReferencia}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">
              O MDF-e será vinculado ao {origem === "ciot" ? "CIOT" : "CT-e"} informado anteriormente.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-600" />
              Dados do MDF-e
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="codigoMDFe">Código/Chave do MDF-e *</Label>
              <Input
                id="codigoMDFe"
                value={codigoMDFe}
                onChange={(e) => setCodigoMDFe(e.target.value)}
                placeholder="Digite a chave do MDF-e"
                className="font-mono"
              />
            </div>

            <div>
              <Label>Documento do MDF-e (PDF) *</Label>
              <div className="flex items-center gap-3 mt-2">
                {documentoMdfe ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <a href={documentoMdfe} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                      Ver documento
                    </a>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Nenhum documento anexado</p>
                )}
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleUploadDocumento(e, "mdfe")}
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
              <Label>XML do MDF-e (Opcional)</Label>
              <div className="flex items-center gap-3 mt-2">
                {documentoMdfeXml ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <a href={documentoMdfeXml} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
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

            <div className="pt-4 border-t flex gap-3">
              <Button
                onClick={handlePularMDFe}
                variant="outline"
                className="flex-1"
              >
                Pular MDF-e
              </Button>
              <Button
                onClick={handleEmitirMDFe}
                disabled={emitindo || !codigoMDFe || !documentoMdfe}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
              >
                {emitindo ? "Emitindo..." : "Emitir MDF-e"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
