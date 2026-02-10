import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Upload, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Package,
  MapPin,
  DollarSign,
  Star,
  X
} from "lucide-react";
import PageHeader from "../components/common/PageHeader";
import LoadingSpinner from "../components/common/LoadingSpinner";
import AvaliacaoClienteModal from "../components/cotacao/AvaliacaoClienteModal";

export default function DetalheEntregaTransportadora() {
  const urlParams = new URLSearchParams(window.location.search);
  const cotacaoId = urlParams.get('id');

  const [user, setUser] = useState(null);
  const [valorFinal, setValorFinal] = useState("");
  const [produtosMais, setProdutosMais] = useState("nao");
  const [observacoes, setObservacoes] = useState("");
  const [documentos, setDocumentos] = useState([]);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [modalAvaliacaoAberto, setModalAvaliacaoAberto] = useState(false);
  const [clienteParaAvaliar, setClienteParaAvaliar] = useState(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userData = await base44.auth.me();
    setUser(userData);
  };

  const { data: cotacao, isLoading } = useQuery({
    queryKey: ['cotacao-detalhe', cotacaoId],
    queryFn: async () => {
      const result = await base44.entities.Cotacao.filter({ id: cotacaoId });
      if (result.length === 0) return null;
      return result[0];
    },
    enabled: !!cotacaoId
  });

  const { data: resposta } = useQuery({
    queryKey: ['resposta-selecionada', cotacao?.respostaSelecionadaId],
    queryFn: async () => {
      if (!cotacao?.respostaSelecionadaId) return null;
      const result = await base44.entities.RespostaCotacao.filter({ 
        id: cotacao.respostaSelecionadaId 
      });
      return result[0] || null;
    },
    enabled: !!cotacao?.respostaSelecionadaId
  });

  const { data: cliente } = useQuery({
    queryKey: ['cliente-perfil', cotacao?.clienteId],
    queryFn: async () => {
      if (!cotacao?.clienteId) return null;
      const result = await base44.entities.PerfilCliente.filter({ id: cotacao.clienteId });
      return result[0] || null;
    },
    enabled: !!cotacao?.clienteId
  });

  const handleUploadDocumento = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingDocs(true);
    setError("");

    try {
      const uploadPromises = files.map(file => 
        base44.integrations.Core.UploadFile({ file })
      );
      const results = await Promise.all(uploadPromises);
      const urls = results.map(r => r.file_url);
      
      setDocumentos(prev => [...prev, ...urls]);
      setSuccess(`${files.length} documento(s) anexado(s) com sucesso!`);
    } catch (err) {
      console.error("Erro ao fazer upload:", err);
      setError("Erro ao enviar documento(s). Tente novamente.");
    }
    setUploadingDocs(false);
  };

  const handleRemoverDocumento = (index) => {
    setDocumentos(prev => prev.filter((_, i) => i !== index));
  };

  const handleAbrirAvaliacaoCliente = () => {
    if (!cliente) {
      setError("Erro ao carregar dados do cliente");
      return;
    }
    setClienteParaAvaliar(cliente);
    setModalAvaliacaoAberto(true);
  };

  const handleEnviarComprovantes = async () => {
    setError("");
    setSuccess("");

    // Validações
    if (documentos.length === 0) {
      setError("Anexe pelo menos um documento de entrega (CTE obrigatório)");
      return;
    }

    if (!valorFinal || parseFloat(valorFinal) <= 0) {
      setError("Informe o valor final da entrega");
      return;
    }

    if (!cotacao.avaliacaoClienteId) {
      setError("Você precisa avaliar o cliente antes de enviar os comprovantes");
      return;
    }

    if (!confirm("Tem certeza que deseja enviar os comprovantes de entrega? O cliente será notificado.")) {
      return;
    }

    try {
      const valorFinalNum = parseFloat(valorFinal);

      await base44.entities.Cotacao.update(cotacao.id, {
        documentosEntrega: documentos,
        valorFinalTransportadora: valorFinalNum,
        entregaProdutosMaisTransportadora: produtosMais === "sim",
        observacoesTransportadora: observacoes.trim() || null,
        dataHoraComprovanteEnviado: new Date().toISOString(),
        status: "aguardando_confirmacao"
      });

      setSuccess("Comprovantes enviados com sucesso! Aguardando confirmação do cliente.");
      queryClient.invalidateQueries({ queryKey: ['cotacao-detalhe'] });
    } catch (err) {
      console.error("Erro ao enviar comprovantes:", err);
      setError("Erro ao enviar comprovantes. Tente novamente.");
    }
  };

  const jaEnviouComprovantes = cotacao?.status === "aguardando_confirmacao" || 
                               cotacao?.status === "finalizada" ||
                               cotacao?.documentosEntrega?.length > 0;

  if (!user || isLoading) {
    return <LoadingSpinner message="Carregando detalhes..." />;
  }

  if (!cotacao) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
        <PageHeader title="Erro" showBack={true} />
        <div className="p-6 max-w-4xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Cotação não encontrada</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <PageHeader
        title="Detalhes da Entrega"
        description="Envie os documentos e finalize a entrega"
        showBack={true}
      />

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Informações da Cotação */}
        <Card>
          <CardHeader>
            <CardTitle>Informações da Cotação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="w-4 h-4 text-gray-400" />
                  <p className="text-xs font-semibold text-gray-600">PRODUTO</p>
                </div>
                <p className="font-medium text-gray-900">{cotacao.produtoNome}</p>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <p className="text-xs font-semibold text-gray-600">DESTINO</p>
                </div>
                <p className="font-medium text-gray-900">
                  {cotacao.destinatarioCidade} - {cotacao.destinatarioEstado}
                </p>
              </div>

              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <p className="text-xs font-semibold text-green-700">VALOR COTAÇÃO</p>
                </div>
                <p className="text-xl font-bold text-green-700">
                  R$ {resposta?.valorTotal?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Avaliação do Cliente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Avaliação do Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cotacao.avaliacaoClienteId ? (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Cliente avaliado com sucesso!</strong>
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                <Alert className="bg-yellow-50 border-yellow-200">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    <strong>Ação obrigatória:</strong> Você precisa avaliar o cliente antes de enviar os comprovantes de entrega.
                  </AlertDescription>
                </Alert>
                <Button
                  onClick={handleAbrirAvaliacaoCliente}
                  className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700"
                >
                  <Star className="w-4 h-4 mr-2" />
                  Avaliar Cliente Agora
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Formulário de Entrega */}
        {cotacao.avaliacaoClienteId && !jaEnviouComprovantes && (
          <>
            {/* Documentos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Documentos de Entrega
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800 text-sm">
                    <strong>Obrigatório:</strong> Anexe o CTE e outros comprovantes de entrega (fotos, assinaturas, etc)
                  </AlertDescription>
                </Alert>

                <div>
                  <Label htmlFor="upload-docs" className="cursor-pointer">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm font-medium text-gray-700">
                        Clique para anexar documentos
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PDF, PNG, JPG (máx. 10MB por arquivo)
                      </p>
                    </div>
                  </Label>
                  <input
                    id="upload-docs"
                    type="file"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleUploadDocumento}
                    className="hidden"
                    disabled={uploadingDocs}
                  />
                </div>

                {uploadingDocs && (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">Enviando documentos...</p>
                  </div>
                )}

                {documentos.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Documentos anexados:</Label>
                    {documentos.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <a 
                            href={doc} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                          >
                            Documento {index + 1}
                          </a>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoverDocumento(index)}
                        >
                          <X className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Valor Final */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Valor Final da Entrega
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="bg-yellow-50 border-yellow-200">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800 text-sm">
                    <strong>Importante:</strong> Se o valor cobrado for <strong>MAIOR</strong> que a cotação original, 
                    15% da diferença será creditado como desconto para compra do pacote Premium (cumulativo).
                    Se for menor, apenas será registrado (não cumulativo).
                  </AlertDescription>
                </Alert>

                <div>
                  <Label htmlFor="valorFinal">Valor Total Cobrado do Cliente *</Label>
                  <Input
                    id="valorFinal"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ex: 280.00"
                    value={valorFinal}
                    onChange={(e) => setValorFinal(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Valor original da cotação: R$ {resposta?.valorTotal?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div>
                  <Label className="mb-3 block">Foram entregues produtos a mais?</Label>
                  <RadioGroup value={produtosMais} onValueChange={setProdutosMais}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="sim" id="sim" />
                      <Label htmlFor="sim" className="cursor-pointer">Sim, foram entregues produtos a mais</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="nao" id="nao" />
                      <Label htmlFor="nao" className="cursor-pointer">Não, entrega conforme cotação</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label htmlFor="observacoes">Observações (opcional)</Label>
                  <Textarea
                    id="observacoes"
                    placeholder="Adicione observações sobre a entrega..."
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Botão Enviar */}
            <Button
              onClick={handleEnviarComprovantes}
              disabled={uploadingDocs || documentos.length === 0 || !valorFinal}
              className="w-full h-14 text-lg bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
            >
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Enviar Comprovantes de Entrega
            </Button>
          </>
        )}

        {/* Comprovantes já enviados */}
        {jaEnviouComprovantes && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
                <div>
                  <h3 className="font-bold text-green-900 text-lg">Comprovantes Enviados!</h3>
                  <p className="text-sm text-green-700">
                    Aguardando confirmação do cliente para finalizar a entrega
                  </p>
                </div>
              </div>
              
              <div className="space-y-2 mt-4 pt-4 border-t border-green-200">
                <p className="text-sm text-green-800">
                  <strong>Valor informado:</strong> R$ {cotacao.valorFinalTransportadora?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-green-800">
                  <strong>Documentos anexados:</strong> {cotacao.documentosEntrega?.length || 0}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {modalAvaliacaoAberto && clienteParaAvaliar && (
        <AvaliacaoClienteModal
          isOpen={modalAvaliacaoAberto}
          onClose={() => {
            setModalAvaliacaoAberto(false);
            setClienteParaAvaliar(null);
          }}
          cotacao={{ ...cotacao, transportadoraId: user?.perfilAtivoId }}
          cliente={{ ...clienteParaAvaliar, nome: clienteParaAvaliar.nomeCompleto }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['cotacao-detalhe'] });
            setSuccess("Cliente avaliado com sucesso!");
          }}
        />
      )}
    </div>
  );
}
