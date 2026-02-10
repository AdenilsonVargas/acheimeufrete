import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Upload, CheckCircle, DollarSign, Edit, Save, X } from "lucide-react";
import PageHeader from "../components/common/PageHeader";
import LoadingSpinner from "../components/common/LoadingSpinner";
import StatusBadge from "../components/common/StatusBadge";

export default function PerfilTransportadora() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [criandoPerfil, setCriandoPerfil] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({});

  const queryClient = useQueryClient();

  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['user-perfil-transportadora'],
    queryFn: async () => {
      return await base44.auth.me();
    }
  });

  const { data: perfilTransportadora, isLoading: loadingPerfil, error: perfilError } = useQuery({
    queryKey: ['perfil-transportadora-page', user?.perfilAtivoId],
    queryFn: async () => {
      if (!user) return null;
      
      try {
        const perfis = await base44.entities.PerfilTransportadora.filter({
          userIdGoogle: user.perfilAtivoId
        });
        
        if (perfis.length > 0) {
          return perfis[0];
        }
        
        // Se não encontrou, buscar por emailAcesso
        if (user.emailAcesso) {
          const perfisPorEmail = await base44.entities.PerfilTransportadora.filter({
            emailAcesso: user.emailAcesso
          });
          
          if (perfisPorEmail.length > 0) {
            // Atualizar o perfil com o userIdGoogle correto
            const perfil = perfisPorEmail[0];
            await base44.entities.PerfilTransportadora.update(perfil.id, {
              userIdGoogle: user.perfilAtivoId
            });
            return perfil;
          }
        }
        
        return null;
      } catch (err) {
        console.error("Erro ao buscar perfil:", err);
        return null;
      }
    },
    enabled: !!user?.perfilAtivoId,
    retry: 1
  });

  const criarPerfilAutomatico = async () => {
    if (!user) return;
    
    setCriandoPerfil(true);
    setError("");
    
    try {
      const novoPerfil = await base44.entities.PerfilTransportadora.create({
        userIdGoogle: user.perfilAtivoId,
        emailAcesso: user.emailAcesso || user.email,
        razaoSocial: user.razaoSocial || "Nome da Empresa",
        cnpj: "",
        telefoneComercial: "",
        telefonePessoal: "",
        status: "pending",
        perfilCompleto: false,
        isPremium: false
      });
      
      setSuccess("Perfil criado com sucesso! Complete suas informações.");
      queryClient.invalidateQueries({ queryKey: ['perfil-transportadora-page'] });
    } catch (error) {
      console.error("Erro ao criar perfil:", error);
      setError("Erro ao criar perfil. Por favor, entre em contato com o suporte.");
    }
    
    setCriandoPerfil(false);
  };

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    setError("");
    setSuccess("");
    setUploading(true);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      await base44.entities.PerfilTransportadora.update(perfilTransportadora.id, {
        [field]: file_url
      });
      
      setSuccess("Documento enviado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['perfil-transportadora-page'] });
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      setError("Erro ao fazer upload do documento");
    }
    setUploading(false);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingLogo(true);
    setError("");
    setSuccess("");

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      await base44.entities.PerfilTransportadora.update(perfilTransportadora.id, {
        logoUrl: file_url
      });
      
      setSuccess("Logo atualizada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['perfil-transportadora-page'] });
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      setError("Erro ao fazer upload da logo");
    }
    setUploadingLogo(false);
  };

  const handleEditToggle = () => {
    if (editMode) {
      setEditMode(false);
      setFormData({});
    } else {
      setEditMode(true);
      setFormData({ ...perfilTransportadora });
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMultiFileUpload = async (e, field) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = files.map(file => base44.integrations.Core.UploadFile({ file }));
      const results = await Promise.all(uploadPromises);
      const urls = results.map(r => r.file_url);
      
      handleInputChange(field, [...(formData[field] || []), ...urls]);
      setSuccess(`${files.length} documento(s) anexado(s)!`);
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      setError("Erro ao fazer upload dos documentos");
    }
    setUploading(false);
  };

  const handleRemoveFile = (field, index) => {
    const newFiles = [...(formData[field] || [])];
    newFiles.splice(index, 1);
    handleInputChange(field, newFiles);
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      // Campos que afetam emissões fiscais
      const camposCriticos = [
        'tipoTransportador', 'tipoRegistro', 'razaoSocial', 'cnpj', 'cpf', 
        'inscricaoEstadual', 'regimeTributario', 'cnae', 'rntrcNumero',
        'certificadoDigitalPossui', 'certificadoTipo', 'cnhNumero', 'veiculoPlaca'
      ];

      const alterouCamposCriticos = camposCriticos.some(campo => 
        formData[campo] !== perfilTransportadora[campo]
      );

      const dataToUpdate = { ...formData };

      // Se alterou campos críticos, marcar para análise
      if (alterouCamposCriticos) {
        dataToUpdate.statusVerificacao = "pendente";
        dataToUpdate.status = "pending";
        dataToUpdate.alteracoesEmAnalise = true;
        dataToUpdate.alteracoesPendentes = {
          dataAlteracao: new Date().toISOString(),
          camposAlterados: camposCriticos.filter(c => formData[c] !== perfilTransportadora[c]),
          dadosAnteriores: camposCriticos.reduce((acc, c) => {
            if (formData[c] !== perfilTransportadora[c]) {
              acc[c] = perfilTransportadora[c];
            }
            return acc;
          }, {})
        };
      }

      await base44.entities.PerfilTransportadora.update(perfilTransportadora.id, dataToUpdate);

      if (alterouCamposCriticos) {
        setSuccess("Dados salvos! Alterações em documentos fiscais estão em análise. Você não poderá criar novas cotações até aprovação.");
      } else {
        setSuccess("Dados atualizados com sucesso!");
      }

      setEditMode(false);
      queryClient.invalidateQueries({ queryKey: ['perfil-transportadora-page'] });
    } catch (error) {
      console.error("Erro ao salvar:", error);
      setError("Erro ao salvar alterações. Tente novamente.");
    }

    setSaving(false);
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
            <AlertDescription>Erro ao carregar usuário. Por favor, faça login novamente.</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!perfilTransportadora) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
        <PageHeader title="Perfil" />
        <div className="p-6 max-w-4xl mx-auto space-y-4">
          <Alert className="bg-orange-50 border-orange-200">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Perfil não encontrado.</strong> Parece que você ainda não tem um perfil de transportadora.
              <br />
              <span className="text-sm">
                Email: {user.emailAcesso || user.email} | ID: {user.perfilAtivoId}
              </span>
            </AlertDescription>
          </Alert>
          
          <Card>
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold mb-2">Criar Perfil</h3>
              <p className="text-gray-600 mb-4">
                Clique no botão abaixo para criar seu perfil de transportadora automaticamente.
              </p>
              <Button 
                onClick={criarPerfilAutomatico}
                disabled={criandoPerfil}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                {criandoPerfil ? "Criando perfil..." : "Criar Perfil Agora"}
              </Button>
            </CardContent>
          </Card>

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
        </div>
      </div>
    );
  }

  const saldoDesconto = perfilTransportadora?.saldoDescontoPremium || 0;
  const profileComplete = perfilTransportadora?.perfilCompleto;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <PageHeader
        title="Perfil da Transportadora"
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

        {!profileComplete && (
          <Alert className="bg-orange-50 border-orange-200">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              Complete seu perfil cadastrando opções de envio, NCMs atendidos e regiões atendidas para visualizar cotações disponíveis.
            </AlertDescription>
          </Alert>
        )}

        <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-900">
              <DollarSign className="w-5 h-5" />
              Seu Crédito Premium
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-yellow-700 mb-2">Saldo Disponível</p>
                <p className="text-4xl font-bold text-yellow-900">
                  R$ {saldoDesconto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-yellow-600 mt-2">
                  💡 Use para comprar pacote Premium
                </p>
              </div>

              <div>
                <p className="text-sm text-yellow-700 mb-2">Últimos Ganhos</p>
                <div className="space-y-2">
                  {perfilTransportadora.historicoValoresAMais?.slice(-3).reverse().map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-white rounded-lg">
                      <span className="text-xs text-gray-600">
                        Cotação {item.cotacaoId?.slice(0, 8)}
                      </span>
                      <Badge className="bg-yellow-100 text-yellow-800">
                        +R$ {item.credito?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </Badge>
                    </div>
                  ))}
                  {(!perfilTransportadora.historicoValoresAMais || perfilTransportadora.historicoValoresAMais.length === 0) && (
                    <p className="text-xs text-gray-500 italic">Nenhum ganho ainda</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Informações da Empresa</CardTitle>
              <div className="flex items-center gap-2">
                <StatusBadge status={perfilTransportadora?.status} />
                {!editMode ? (
                  <Button onClick={handleEditToggle} size="sm" variant="outline">
                    <Edit className="w-4 h-4 mr-2" />
                    Editar Cadastro
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={handleSaveChanges} size="sm" disabled={saving}>
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? "Salvando..." : "Salvar"}
                    </Button>
                    <Button onClick={handleEditToggle} size="sm" variant="outline">
                      <X className="w-4 h-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">{editMode && (
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Modo de Edição:</strong> Alterações em campos críticos (tipo, documentos fiscais) requerem aprovação.
                </AlertDescription>
              </Alert>
            )}
            <div className="flex items-center gap-6">
              <div className="relative">
                {perfilTransportadora?.logoUrl ? (
                  <img 
                    src={perfilTransportadora.logoUrl} 
                    alt="Logo" 
                    className="w-24 h-24 rounded-lg object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-blue-600" />
                  </div>
                )}
                <label className="absolute -bottom-2 -right-2 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    disabled={uploadingLogo}
                  />
                  <div className="bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors">
                    <Upload className="w-4 h-4" />
                  </div>
                </label>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900">Logo da Empresa</h3>
                <p className="text-sm text-gray-500">Clique no ícone para atualizar a logo</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Tipo de Transportador *</Label>
                {editMode ? (
                  <Select value={formData.tipoTransportador} onValueChange={(v) => handleInputChange('tipoTransportador', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pj">PJ - Pessoa Jurídica</SelectItem>
                      <SelectItem value="autonomo">Autônomo</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="mt-2">
                    {perfilTransportadora?.tipoTransportador === "autonomo" ? (
                      <Badge className="bg-orange-100 text-orange-800">Autônomo</Badge>
                    ) : (
                      <Badge className="bg-blue-100 text-blue-800">PJ</Badge>
                    )}
                  </div>
                )}
              </div>

              {(editMode ? formData.tipoTransportador === "autonomo" : perfilTransportadora?.tipoTransportador === "autonomo") && (
                <div>
                  <Label>Tipo de Registro *</Label>
                  {editMode ? (
                    <Select value={formData.tipoRegistro} onValueChange={(v) => handleInputChange('tipoRegistro', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PF">PF - Pessoa Física</SelectItem>
                        <SelectItem value="MEI">MEI</SelectItem>
                        <SelectItem value="PJ">PJ Individual</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input value={perfilTransportadora?.tipoRegistro || ""} disabled />
                  )}
                </div>
              )}

              <div>
                <Label>{(editMode ? formData.tipoTransportador === "autonomo" : perfilTransportadora?.tipoTransportador === "autonomo") ? "Nome Completo *" : "Razão Social *"}</Label>
                {editMode ? (
                  <Input value={formData.razaoSocial} onChange={(e) => handleInputChange('razaoSocial', e.target.value)} />
                ) : (
                  <Input value={perfilTransportadora?.razaoSocial || ""} disabled />
                )}
              </div>

              <div>
                <Label>Nome Fantasia</Label>
                {editMode ? (
                  <Input value={formData.nomeFantasia} onChange={(e) => handleInputChange('nomeFantasia', e.target.value)} />
                ) : (
                  <Input value={perfilTransportadora?.nomeFantasia || ""} disabled />
                )}
              </div>

              {(editMode ? formData.tipoTransportador === "autonomo" : perfilTransportadora?.tipoTransportador === "autonomo") && (
                <>
                  <div>
                    <Label>CPF *</Label>
                    {editMode ? (
                      <Input value={formData.cpf} onChange={(e) => handleInputChange('cpf', e.target.value)} />
                    ) : (
                      <Input value={perfilTransportadora?.cpf || ""} disabled />
                    )}
                  </div>
                  <div>
                    <Label>RG *</Label>
                    {editMode ? (
                      <Input value={formData.rg} onChange={(e) => handleInputChange('rg', e.target.value)} />
                    ) : (
                      <Input value={perfilTransportadora?.rg || ""} disabled />
                    )}
                  </div>
                  <div>
                    <Label>Data de Nascimento *</Label>
                    {editMode ? (
                      <Input type="date" value={formData.dataNascimento} onChange={(e) => handleInputChange('dataNascimento', e.target.value)} />
                    ) : (
                      <Input value={perfilTransportadora?.dataNascimento || ""} disabled />
                    )}
                  </div>
                </>
              )}

              <div>
                <Label>CNPJ {(editMode ? formData.tipoTransportador === "pj" : perfilTransportadora?.tipoTransportador === "pj") && "*"}</Label>
                {editMode ? (
                  <Input value={formData.cnpj} onChange={(e) => handleInputChange('cnpj', e.target.value)} />
                ) : (
                  <Input value={perfilTransportadora?.cnpj || ""} disabled />
                )}
              </div>

              {(editMode ? formData.tipoTransportador === "pj" : perfilTransportadora?.tipoTransportador === "pj") && (
                <>
                  <div>
                    <Label>Inscrição Estadual</Label>
                    {editMode ? (
                      <Input value={formData.inscricaoEstadual} onChange={(e) => handleInputChange('inscricaoEstadual', e.target.value)} />
                    ) : (
                      <Input value={perfilTransportadora?.inscricaoEstadual || ""} disabled />
                    )}
                  </div>
                  <div>
                    <Label>Regime Tributário *</Label>
                    {editMode ? (
                      <Select value={formData.regimeTributario} onValueChange={(v) => handleInputChange('regimeTributario', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Simples">Simples Nacional</SelectItem>
                          <SelectItem value="Presumido">Lucro Presumido</SelectItem>
                          <SelectItem value="Real">Lucro Real</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input value={perfilTransportadora?.regimeTributario || ""} disabled />
                    )}
                  </div>
                  <div>
                    <Label>CNAE *</Label>
                    {editMode ? (
                      <Input value={formData.cnae} onChange={(e) => handleInputChange('cnae', e.target.value)} placeholder="Ex: 4930-2/02" />
                    ) : (
                      <Input value={perfilTransportadora?.cnae || ""} disabled />
                    )}
                  </div>
                </>
              )}

              <div>
                <Label>Telefone Comercial *</Label>
                {editMode ? (
                  <Input value={formData.telefoneComercial} onChange={(e) => handleInputChange('telefoneComercial', e.target.value)} />
                ) : (
                  <Input value={perfilTransportadora?.telefoneComercial || ""} disabled />
                )}
              </div>

              <div>
                <Label>Telefone Pessoal</Label>
                {editMode ? (
                  <Input value={formData.telefonePessoal} onChange={(e) => handleInputChange('telefonePessoal', e.target.value)} />
                ) : (
                  <Input value={perfilTransportadora?.telefonePessoal || ""} disabled />
                )}
              </div>

              <div>
                <Label>RNTRC/ANTT *</Label>
                {editMode ? (
                  <Input value={formData.rntrcNumero} onChange={(e) => handleInputChange('rntrcNumero', e.target.value)} />
                ) : (
                  <Input value={perfilTransportadora?.rntrcNumero || ""} disabled />
                )}
              </div>

              {(editMode ? formData.tipoTransportador === "autonomo" : perfilTransportadora?.tipoTransportador === "autonomo") && (
                <>
                  <div>
                    <Label>TAC/Cooperativa</Label>
                    {editMode ? (
                      <Input value={formData.tacNumero} onChange={(e) => handleInputChange('tacNumero', e.target.value)} />
                    ) : (
                      <Input value={perfilTransportadora?.tacNumero || ""} disabled />
                    )}
                  </div>
                  <div>
                    <Label>CNH Número *</Label>
                    {editMode ? (
                      <Input value={formData.cnhNumero} onChange={(e) => handleInputChange('cnhNumero', e.target.value)} />
                    ) : (
                      <Input value={perfilTransportadora?.cnhNumero || ""} disabled />
                    )}
                  </div>
                  <div>
                    <Label>CNH Categoria *</Label>
                    {editMode ? (
                      <Input value={formData.cnhCategoria} onChange={(e) => handleInputChange('cnhCategoria', e.target.value)} placeholder="Ex: C, CE" />
                    ) : (
                      <Input value={perfilTransportadora?.cnhCategoria || ""} disabled />
                    )}
                  </div>
                  <div>
                    <Label>CNH Validade *</Label>
                    {editMode ? (
                      <Input type="date" value={formData.cnhValidade} onChange={(e) => handleInputChange('cnhValidade', e.target.value)} />
                    ) : (
                      <Input value={perfilTransportadora?.cnhValidade || ""} disabled />
                    )}
                  </div>
                  <div>
                    <Label>Veículo Placa *</Label>
                    {editMode ? (
                      <Input value={formData.veiculoPlaca} onChange={(e) => handleInputChange('veiculoPlaca', e.target.value.toUpperCase())} />
                    ) : (
                      <Input value={perfilTransportadora?.veiculoPlaca || ""} disabled />
                    )}
                  </div>
                  <div>
                    <Label>Veículo Tipo *</Label>
                    {editMode ? (
                      <Select value={formData.veiculoTipo} onValueChange={(v) => handleInputChange('veiculoTipo', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="caminhão">Caminhão</SelectItem>
                          <SelectItem value="caminhonete">Caminhonete</SelectItem>
                          <SelectItem value="vuc">VUC</SelectItem>
                          <SelectItem value="bitrem">Bitrem</SelectItem>
                          <SelectItem value="carreta">Carreta</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input value={perfilTransportadora?.veiculoTipo || ""} disabled />
                    )}
                  </div>
                  <div>
                    <Label>Capacidade do Veículo *</Label>
                    {editMode ? (
                      <Input value={formData.veiculoCapacidade} onChange={(e) => handleInputChange('veiculoCapacidade', e.target.value)} placeholder="Ex: 8 toneladas" />
                    ) : (
                      <Input value={perfilTransportadora?.veiculoCapacidade || ""} disabled />
                    )}
                  </div>
                </>
              )}

              <div>
                <Label>Certificado Digital</Label>
                {editMode ? (
                  <Select value={formData.certificadoTipo} onValueChange={(v) => handleInputChange('certificadoTipo', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sem">Não Possui</SelectItem>
                      <SelectItem value="A1">A1</SelectItem>
                      <SelectItem value="A3">A3</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value={perfilTransportadora?.certificadoTipo || "sem"} disabled />
                )}
              </div>

              <div>
                <Label>Tipo de Conta</Label>
                <Input value={perfilTransportadora?.isPremium ? "Premium ⭐" : "Padrão"} disabled />
              </div>
            </div>

            {editMode && (
              <div className="pt-4 border-t">
                <h4 className="font-semibold mb-3">Anexar Documentos</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(formData.tipoTransportador === "autonomo") && (
                    <>
                      <div>
                        <Label>CNH (frente/verso)</Label>
                        <Input type="file" multiple accept="image/*,application/pdf" onChange={(e) => handleMultiFileUpload(e, 'anexoCnh')} />
                        {formData.anexoCnh?.map((url, idx) => (
                          <div key={idx} className="flex items-center justify-between mt-1 p-1 bg-gray-50 rounded text-xs">
                            <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600">Doc {idx + 1}</a>
                            <Button size="sm" variant="ghost" onClick={() => handleRemoveFile('anexoCnh', idx)}>
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <div>
                        <Label>CRLV Veículo</Label>
                        <Input type="file" multiple accept="image/*,application/pdf" onChange={(e) => handleMultiFileUpload(e, 'anexoCrlv')} />
                        {formData.anexoCrlv?.map((url, idx) => (
                          <div key={idx} className="flex items-center justify-between mt-1 p-1 bg-gray-50 rounded text-xs">
                            <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600">Doc {idx + 1}</a>
                            <Button size="sm" variant="ghost" onClick={() => handleRemoveFile('anexoCrlv', idx)}>
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  <div>
                    <Label>RNTRC/ANTT</Label>
                    <Input type="file" multiple accept="image/*,application/pdf" onChange={(e) => handleMultiFileUpload(e, 'anexoRntrc')} />
                    {formData.anexoRntrc?.map((url, idx) => (
                      <div key={idx} className="flex items-center justify-between mt-1 p-1 bg-gray-50 rounded text-xs">
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600">Doc {idx + 1}</a>
                        <Button size="sm" variant="ghost" onClick={() => handleRemoveFile('anexoRntrc', idx)}>
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  {(formData.tipoTransportador === "autonomo") && (
                    <div>
                      <Label>TAC/Cooperativa</Label>
                      <Input type="file" multiple accept="image/*,application/pdf" onChange={(e) => handleMultiFileUpload(e, 'anexoTac')} />
                      {formData.anexoTac?.map((url, idx) => (
                        <div key={idx} className="flex items-center justify-between mt-1 p-1 bg-gray-50 rounded text-xs">
                          <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600">Doc {idx + 1}</a>
                          <Button size="sm" variant="ghost" onClick={() => handleRemoveFile('anexoTac', idx)}>
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documentos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>CNPJ Digitalizado</Label>
              <div className="flex items-center gap-3 mt-2">
                {perfilTransportadora?.documentoCnpjScan ? (
                  <a 
                    href={perfilTransportadora.documentoCnpjScan} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Ver documento
                  </a>
                ) : (
                  <p className="text-gray-500 text-sm">Nenhum documento enviado</p>
                )}
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileUpload(e, "documentoCnpjScan")}
                    className="hidden"
                    disabled={uploading}
                  />
                  <Button size="sm" variant="outline" asChild disabled={uploading}>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? "Enviando..." : (perfilTransportadora?.documentoCnpjScan ? "Atualizar" : "Enviar")}
                    </span>
                  </Button>
                </label>
              </div>
            </div>

            <div>
              <Label>Alvará de Funcionamento</Label>
              <div className="flex items-center gap-3 mt-2">
                {perfilTransportadora?.documentoAlvara ? (
                  <a 
                    href={perfilTransportadora.documentoAlvara} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Ver documento
                  </a>
                ) : (
                  <p className="text-gray-500 text-sm">Nenhum documento enviado</p>
                )}
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileUpload(e, "documentoAlvara")}
                    className="hidden"
                    disabled={uploading}
                  />
                  <Button size="sm" variant="outline" asChild disabled={uploading}>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? "Enviando..." : (perfilTransportadora?.documentoAlvara ? "Atualizar" : "Enviar")}
                    </span>
                  </Button>
                </label>
              </div>
            </div>

            <div>
              <Label>Comprovante de Endereço</Label>
              <div className="flex items-center gap-3 mt-2">
                {perfilTransportadora?.documentoComprovanteEndereco ? (
                  <a 
                    href={perfilTransportadora.documentoComprovanteEndereco} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Ver documento
                  </a>
                ) : (
                  <p className="text-gray-500 text-sm">Nenhum documento enviado</p>
                )}
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
                      {uploading ? "Enviando..." : (perfilTransportadora?.documentoComprovanteEndereco ? "Atualizar" : "Enviar")}
                    </span>
                  </Button>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {perfilTransportadora?.status === "pending" && (
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Seu cadastro está em análise. Envie todos os documentos necessários para acelerar a aprovação.
            </AlertDescription>
          </Alert>
        )}

        {perfilTransportadora?.status === "rejected" && perfilTransportadora?.motivoRejeicao && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Motivo da rejeição:</strong> {perfilTransportadora.motivoRejeicao}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
