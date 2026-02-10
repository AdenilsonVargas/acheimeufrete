import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Upload, CheckCircle, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import PageHeader from "../components/common/PageHeader";
import LoadingSpinner from "../components/common/LoadingSpinner";
import StatusBadge from "../components/common/StatusBadge";

export default function Perfil() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploading, setUploading] = useState(false);

  const queryClient = useQueryClient();

  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['user-perfil'],
    queryFn: async () => {
      return await base44.auth.me();
    }
  });

  const { data: perfilCliente, isLoading: loadingPerfil, error: perfilError } = useQuery({
    queryKey: ['perfil-cliente-page', user?.perfilAtivoId],
    queryFn: async () => {
      if (!user) return null;
      
      // Tentar buscar pelo ID direto primeiro
      try {
        const perfilDireto = await base44.entities.PerfilCliente.filter({ id: user.perfilAtivoId });
        if (perfilDireto.length > 0) return perfilDireto[0];
      } catch (e) {
        console.log("Tentando busca alternativa...");
      }
      
      // Fallback: buscar por userIdGoogle
      const perfis = await base44.entities.PerfilCliente.filter({
        userIdGoogle: user.perfilAtivoId
      });
      if (perfis.length > 0) return perfis[0];
      
      // Último fallback: buscar pelo ID do user base44
      const perfisPorUserId = await base44.entities.PerfilCliente.filter({
        userIdGoogle: user.id
      });
      return perfisPorUserId[0] || null;
    },
    enabled: !!user?.perfilAtivoId
  });

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    setError("");
    setSuccess("");
    setUploading(true);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      await base44.entities.PerfilCliente.update(perfilCliente.id, {
        [field]: file_url
      });
      
      setSuccess("Documento enviado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['perfil-cliente-page'] });
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      setError("Erro ao fazer upload do documento");
    }
    setUploading(false);
  };

  if (loadingUser || loadingPerfil) {
    return <LoadingSpinner message="Carregando perfil..." />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
        <PageHeader title="Perfil" />
        <div className="p-6 max-w-4xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Erro ao carregar usuário.</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Se não encontrou perfil mas temos user, usar dados do user
  const dadosPerfil = perfilCliente || {
    nomeCompleto: user.nomeCompleto || user.full_name || "",
    cpfOuCnpj: user.cpfOuCnpj || "",
    emailAcesso: user.emailAcesso || user.email || "",
    telefoneComercial: user.telefoneComercial || "",
    telefonePessoal: user.telefonePessoal || "",
    isPremium: user.isPremium || false,
    status: user.status || "pending",
    saldoCashback: user.saldoCashback || 0,
    historicoValoresAMais: user.historicoValoresAMais || [],
    documentoCpfScan: user.documentoCpfScan || "",
    documentoComprovanteEndereco: user.documentoComprovanteEndereco || ""
  };

  const saldoCashback = dadosPerfil?.saldoCashback || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <PageHeader
        title="Meu Perfil"
        description="Gerencie suas informações e documentos"
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
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Card de Cashback */}
        {saldoCashback > 0 && (
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900">
                <DollarSign className="w-5 h-5" />
                Seu Cashback
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-green-700 mb-2">Saldo Disponível</p>
                  <p className="text-4xl font-bold text-green-900">
                    R$ {saldoCashback.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-green-600 mt-2">
                    💡 Use em suas próximas cotações
                  </p>
                </div>

                <div>
                  <p className="text-sm text-green-700 mb-2">Últimos Ganhos</p>
                  <div className="space-y-2">
                    {dadosPerfil.historicoValoresAMais?.slice(-3).reverse().map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-white rounded-lg">
                        <span className="text-xs text-gray-600">
                          Cotação {item.cotacaoId?.slice(0, 8)}
                        </span>
                        <Badge className="bg-green-100 text-green-800">
                          +R$ {item.cashback?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </Badge>
                      </div>
                    ))}
                    {(!dadosPerfil.historicoValoresAMais || dadosPerfil.historicoValoresAMais.length === 0) && (
                      <p className="text-xs text-gray-500 italic">Nenhum ganho ainda</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Informações Pessoais</CardTitle>
              <StatusBadge status={dadosPerfil?.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nome Completo</Label>
                <Input value={dadosPerfil?.nomeCompleto || ""} disabled />
              </div>
              <div>
                <Label>CPF/CNPJ</Label>
                <Input value={dadosPerfil?.cpfOuCnpj || ""} disabled />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={dadosPerfil?.emailAcesso || ""} disabled />
              </div>
              <div>
                <Label>Telefone Comercial</Label>
                <Input value={dadosPerfil?.telefoneComercial || ""} disabled />
              </div>
              <div>
                <Label>Telefone Pessoal</Label>
                <Input value={dadosPerfil?.telefonePessoal || ""} disabled />
              </div>
              <div>
                <Label>Tipo de Conta</Label>
                <Input value={dadosPerfil?.isPremium ? "Premium ⭐" : "Padrão"} disabled />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documentos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>CPF/CNPJ Digitalizado</Label>
              <div className="flex items-center gap-3 mt-2">
                {dadosPerfil?.documentoCpfScan ? (
                  <a 
                    href={dadosPerfil.documentoCpfScan} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Ver documento
                  </a>
                ) : (
                  <p className="text-gray-500 text-sm">Nenhum documento enviado</p>
                )}
                {perfilCliente && (
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleFileUpload(e, "documentoCpfScan")}
                      className="hidden"
                      disabled={uploading}
                    />
                    <Button size="sm" variant="outline" asChild disabled={uploading}>
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        {uploading ? "Enviando..." : (dadosPerfil?.documentoCpfScan ? "Atualizar" : "Enviar")}
                      </span>
                    </Button>
                  </label>
                )}
              </div>
            </div>

            <div>
              <Label>Comprovante de Endereço</Label>
              <div className="flex items-center gap-3 mt-2">
                {dadosPerfil?.documentoComprovanteEndereco ? (
                  <a 
                    href={dadosPerfil.documentoComprovanteEndereco} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Ver documento
                  </a>
                ) : (
                  <p className="text-gray-500 text-sm">Nenhum documento enviado</p>
                )}
                {perfilCliente && (
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleFileUpload(e, "documentoComprovanteEndereco")}
                      className="hidden"
                      disabled={uploading}
                    />
                    <Button size="sm" variant="outline" asChild disabled={uploading}>
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        {uploading ? "Enviando..." : (dadosPerfil?.documentoComprovanteEndereco ? "Atualizar" : "Enviar")}
                      </span>
                    </Button>
                  </label>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {dadosPerfil?.status === "pending" && (
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Seu cadastro está em análise. Envie todos os documentos necessários para acelerar a aprovação.
            </AlertDescription>
          </Alert>
        )}

        {dadosPerfil?.status === "rejected" && user?.motivoRejeicao && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Motivo da rejeição:</strong> {user.motivoRejeicao}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
