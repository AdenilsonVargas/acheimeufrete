import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Upload,
  FileText,
  Link as LinkIcon,
  Hash,
  CheckCircle2,
  ArrowLeft,
  Save,
  X,
  ExternalLink
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PageHeader from "../components/common/PageHeader";
import LoadingSpinner from "../components/common/LoadingSpinner";

export default function AnexarDocumentos() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const cotacaoId = urlParams.get("id");

  const [urlRastreamento, setUrlRastreamento] = useState("");
  const [codigoRastreio, setCodigoRastreio] = useState("");
  const [documentos, setDocumentos] = useState([]);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['user-anexar-docs'],
    queryFn: () => base44.auth.me(),
    staleTime: 60000
  });

  const { data: cotacao, isLoading } = useQuery({
    queryKey: ['cotacao-anexar-docs', cotacaoId],
    queryFn: async () => {
      if (!cotacaoId) return null;
      const cotacoes = await base44.entities.Cotacao.filter({ id: cotacaoId });
      return cotacoes[0] || null;
    },
    enabled: !!cotacaoId,
    onSuccess: (data) => {
      if (data) {
        setUrlRastreamento(data.urlRastreamento || "");
        setCodigoRastreio(data.codigoRastreio || "");
        setDocumentos(data.documentosEntrega || []);
      }
    }
  });

  // Carregar dados iniciais quando cotação carrega
  React.useEffect(() => {
    if (cotacao) {
      setUrlRastreamento(cotacao.urlRastreamento || "");
      setCodigoRastreio(cotacao.codigoRastreio || "");
      setDocumentos(cotacao.documentosEntrega || []);
    }
  }, [cotacao]);

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

  const handleSalvar = async () => {
    setSalvando(true);
    try {
      await base44.entities.Cotacao.update(cotacaoId, {
        urlRastreamento: urlRastreamento.trim(),
        codigoRastreio: codigoRastreio.trim(),
        documentosEntrega: documentos
      });

      queryClient.invalidateQueries(['cotacoes-aceitas']);
      setSucesso(true);

      setTimeout(() => {
        navigate(createPageUrl("CotacoesAceitasTransportadora"));
      }, 2000);
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  };

  if (isLoading || !user) {
    return <LoadingSpinner message="Carregando..." />;
  }

  if (!cotacao) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 p-6">
        <Alert variant="destructive">
          <AlertDescription>Cotação não encontrada.</AlertDescription>
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
        title="Anexar Documentos"
        description={`Cotação #${cotacao.id.slice(0, 8)}`}
        showBack
      />

      <div className="p-6 max-w-2xl mx-auto space-y-6">
        {sucesso ? (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Documentos salvos com sucesso!</strong>
              <br />Redirecionando...
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {/* Upload de Documentos */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Upload className="w-5 h-5 text-blue-600" />
                  Documentos de Transporte
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="upload-docs" className="cursor-pointer">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                      <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-700">Clique para anexar documentos</p>
                      <p className="text-xs text-gray-500 mt-1">CT-e, MDF-e, Nota Fiscal, Comprovantes (XML, PDF, PNG, JPG)</p>
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
                      <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-green-600" />
                          <a href={doc} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                            Documento {index + 1}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleRemoverDocumento(index)}>
                          <X className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* URL de Rastreamento */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <LinkIcon className="w-5 h-5 text-blue-600" />
                  Rastreamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="urlRastreamento">URL de Rastreamento</Label>
                  <Input
                    id="urlRastreamento"
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
                  <Label htmlFor="codigoRastreio">Código de Rastreio</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Hash className="w-4 h-4 text-gray-400" />
                    <Input
                      id="codigoRastreio"
                      placeholder="Ex: BR123456789XX"
                      value={codigoRastreio}
                      onChange={(e) => setCodigoRastreio(e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Código que o cliente poderá usar para rastrear
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Botões */}
            <div className="flex gap-3">
              <Link to={createPageUrl("CotacoesAceitasTransportadora")} className="flex-1">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <Button
                onClick={handleSalvar}
                disabled={salvando}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                {salvando ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Salvar
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
