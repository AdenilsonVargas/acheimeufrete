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

export default function EmitirCTe() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const cotacaoId = urlParams.get("id");

  const [codigoCTe, setCodigoCTe] = useState("");
  const [valorCte, setValorCte] = useState("");
  const [uploading, setUploading] = useState(false);
  const [documentoCte, setDocumentoCte] = useState(null);
  const [documentoCteXml, setDocumentoCteXml] = useState(null);
  const [emitindo, setEmitindo] = useState(false);
  const [error, setError] = useState("");

  const { data: user } = useQuery({
    queryKey: ['user-emitir-cte'],
    queryFn: () => base44.auth.me()
  });

  const { data: cotacao, isLoading } = useQuery({
    queryKey: ['cotacao-cte', cotacaoId],
    queryFn: async () => {
      const cotacoes = await base44.entities.Cotacao.filter({ id: cotacaoId });
      return cotacoes[0];
    },
    enabled: !!cotacaoId
  });

  useEffect(() => {
    if (cotacao?.valorOriginalCotacao) {
      setValorCte(cotacao.valorOriginalCotacao.toString());
    }
  }, [cotacao]);

  const handleUploadDocumento = async (e, tipo) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      if (tipo === "cte") {
        setDocumentoCte(file_url);
      } else if (tipo === "xml") {
        setDocumentoCteXml(file_url);
      }
    } catch (err) {
      console.error("Erro ao fazer upload:", err);
      setError("Erro ao enviar documento. Tente novamente.");
    }
    setUploading(false);
  };

  const handleEmitirCTe = async () => {
    if (!codigoCTe || !valorCte) {
      setError("Preencha o código e o valor do CT-e");
      return;
    }

    if (!documentoCte) {
      setError("Anexe o documento do CT-e");
      return;
    }

    setEmitindo(true);
    setError("");

    try {
      const agora = new Date().toISOString();
      const valorFinal = parseFloat(valorCte);

      await base44.entities.Cotacao.update(cotacaoId, {
        codigoCTe: codigoCTe,
        cteRegistrado: true,
        dataHoraCTeRegistrado: agora,
        documentoCte: documentoCte,
        documentosEntrega: documentoCte ? [documentoCte] : [],
        valorFinalTransportadora: valorFinal,
        ciotRegistrado: false
      });

      queryClient.invalidateQueries(['cotacao-cte']);
      
      // Perguntar se quer emitir MDF-e
      const querMdfe = confirm("CT-e emitido com sucesso! Deseja emitir o MDF-e agora?");
      
      if (querMdfe) {
        navigate(createPageUrl(`EmitirMDFe?id=${cotacaoId}&origem=cte`));
      } else {
        // Mover para "Em Entrega"
        await base44.entities.Cotacao.update(cotacaoId, {
          status: "em_transito"
        });
        navigate(createPageUrl("EmEntregaTransportadora"));
      }
    } catch (error) {
      console.error("Erro ao emitir CT-e:", error);
      setError("Erro ao processar. Tente novamente.");
    }
    setEmitindo(false);
  };

  if (isLoading || !cotacao) {
    return <LoadingSpinner message="Carregando dados da cotação..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <PageHeader 
        title="Emitir CT-e"
        description="Emissão de Conhecimento de Transporte Eletrônico"
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
            Emissão opcional do CT-e. Todos os dados da cotação serão utilizados automaticamente.
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
              <FileText className="w-5 h-5 text-blue-600" />
              Dados do CT-e
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="codigoCTe">Código/Chave do CT-e *</Label>
              <Input
                id="codigoCTe"
                value={codigoCTe}
                onChange={(e) => setCodigoCTe(e.target.value)}
                placeholder="Digite a chave do CT-e"
                className="font-mono"
              />
            </div>

            <div>
              <Label htmlFor="valorCte">Valor do CT-e (R$) *</Label>
              <Input
                id="valorCte"
                type="number"
                step="0.01"
                value={valorCte}
                onChange={(e) => setValorCte(e.target.value)}
                placeholder="0.00"
              />
              <p className="text-xs text-gray-500 mt-1">
                Valor padrão baseado na cotação aceita
              </p>
            </div>

            <div>
              <Label>Documento do CT-e (PDF) *</Label>
              <div className="flex items-center gap-3 mt-2">
                {documentoCte ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <a href={documentoCte} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
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
                    onChange={(e) => handleUploadDocumento(e, "cte")}
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
              <Label>XML do CT-e (Opcional)</Label>
              <div className="flex items-center gap-3 mt-2">
                {documentoCteXml ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <a href={documentoCteXml} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
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
                onClick={handleEmitirCTe}
                disabled={emitindo || !codigoCTe || !valorCte || !documentoCte}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                size="lg"
              >
                {emitindo ? "Emitindo CT-e..." : "Emitir CT-e"}
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
