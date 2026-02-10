import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, Plus, Star, AlertCircle, FileCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import PageHeader from "../components/common/PageHeader";
import LoadingSpinner from "../components/common/LoadingSpinner";

export default function EnderecosColeta() {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [showTermoDialog, setShowTermoDialog] = useState(false);
  const [termoAceito, setTermoAceito] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    apelido: "",
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    principal: false
  });

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: enderecos = [], isLoading } = useQuery({
    queryKey: ['enderecos-coleta', user?.perfilAtivoId],
    queryFn: () => base44.entities.EnderecoColeta.filter({ clienteId: user.perfilAtivoId }),
    enabled: !!user
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      if (data.principal) {
        const outros = enderecos.filter(e => e.principal);
        for (const e of outros) {
          await base44.entities.EnderecoColeta.update(e.id, { principal: false });
        }
      }
      return base44.entities.EnderecoColeta.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enderecos-coleta'] });
      setShowDialog(false);
      resetForm();
    }
  });

  const setPrincipalMutation = useMutation({
    mutationFn: async (enderecoId) => {
      for (const e of enderecos) {
        await base44.entities.EnderecoColeta.update(e.id, { principal: e.id === enderecoId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enderecos-coleta'] });
    }
  });

  const resetForm = () => {
    setFormData({
      apelido: "",
      cep: "",
      logradouro: "",
      numero: "",
      complemento: "",
      bairro: "",
      cidade: "",
      estado: "",
      principal: false
    });
    setTermoAceito(false);
    setError("");
  };

  const buscarCep = async (cep) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            logradouro: (data.logradouro || "").toUpperCase(),
            bairro: (data.bairro || "").toUpperCase(),
            cidade: (data.localidade || "").toUpperCase(),
            estado: (data.uf || "").toUpperCase()
          }));
        }
      } catch (err) {
        console.error("Erro ao buscar CEP:", err);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!formData.apelido || !formData.cep || !formData.logradouro || !formData.numero || !formData.cidade || !formData.estado) {
      setError("Preencha todos os campos obrigatórios");
      return;
    }

    setShowTermoDialog(true);
  };

  const confirmarCadastro = () => {
    if (!termoAceito) {
      setError("Você precisa aceitar o termo de responsabilidade");
      return;
    }

    createMutation.mutate({
      ...formData,
      clienteId: user.perfilAtivoId,
      termoAceito: true,
      dataTermoAceito: new Date().toISOString(),
      ativo: true
    });

    setShowTermoDialog(false);
  };

  if (isLoading) {
    return <LoadingSpinner message="Carregando endereços..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <PageHeader
        title="Endereços de Coleta"
        description="Gerencie seus endereços de coleta para cotações"
        action={
          <Button onClick={() => { resetForm(); setShowDialog(true); }} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Novo Endereço
          </Button>
        }
      />

      <div className="p-6 max-w-7xl mx-auto">
        <Alert className="mb-6 bg-yellow-50 border-yellow-300">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Importante:</strong> Os endereços de coleta não podem ser excluídos após o cadastro por questões de auditoria e rastreabilidade.
          </AlertDescription>
        </Alert>

        {enderecos.length === 0 ? (
          <Card className="p-12 text-center">
            <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhum endereço cadastrado</h3>
            <p className="text-gray-500 mb-4">Cadastre endereços de coleta para usar nas cotações</p>
            <Button onClick={() => setShowDialog(true)} className="bg-blue-600">
              <Plus className="w-4 h-4 mr-2" />
              Cadastrar Primeiro Endereço
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enderecos.map((endereco) => (
              <Card key={endereco.id} className={`hover:shadow-lg transition-shadow ${endereco.principal ? 'ring-2 ring-blue-500' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{endereco.apelido}</h3>
                        {endereco.principal && (
                          <Badge className="bg-blue-100 text-blue-800 text-xs">
                            <Star className="w-3 h-3 mr-1" />
                            Principal
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 text-sm text-gray-600">
                    <p>{endereco.logradouro}, {endereco.numero}</p>
                    {endereco.complemento && <p>{endereco.complemento}</p>}
                    <p>{endereco.bairro}</p>
                    <p>{endereco.cidade} - {endereco.estado}</p>
                    <p className="font-medium">CEP: {endereco.cep}</p>
                  </div>

                  {endereco.termoAceito && (
                    <div className="mt-3 flex items-center gap-1 text-xs text-green-600">
                      <FileCheck className="w-3 h-3" />
                      <span>Termo aceito em {new Date(endereco.dataTermoAceito).toLocaleDateString('pt-BR')}</span>
                    </div>
                  )}

                  {!endereco.principal && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPrincipalMutation.mutate(endereco.id)}
                      className="w-full mt-4"
                    >
                      <Star className="w-4 h-4 mr-2" />
                      Definir como Principal
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog Cadastro */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Endereço de Coleta</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div>
              <Label>Apelido/Nome do Endereço *</Label>
              <Input
                value={formData.apelido}
                onChange={(e) => setFormData({ ...formData, apelido: e.target.value.toUpperCase() })}
                placeholder="EX: MATRIZ, FILIAL SP, GALPÃO 01"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>CEP *</Label>
                <Input
                  value={formData.cep}
                  onChange={(e) => {
                    setFormData({ ...formData, cep: e.target.value });
                    buscarCep(e.target.value);
                  }}
                  placeholder="00000-000"
                  required
                />
              </div>
              <div>
                <Label>Número *</Label>
                <Input
                  value={formData.numero}
                  onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label>Logradouro *</Label>
              <Input
                value={formData.logradouro}
                onChange={(e) => setFormData({ ...formData, logradouro: e.target.value.toUpperCase() })}
                required
              />
            </div>

            <div>
              <Label>Complemento</Label>
              <Input
                value={formData.complemento}
                onChange={(e) => setFormData({ ...formData, complemento: e.target.value.toUpperCase() })}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Bairro *</Label>
                <Input
                  value={formData.bairro}
                  onChange={(e) => setFormData({ ...formData, bairro: e.target.value.toUpperCase() })}
                  required
                />
              </div>
              <div>
                <Label>Cidade *</Label>
                <Input
                  value={formData.cidade}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value.toUpperCase() })}
                  required
                />
              </div>
              <div>
                <Label>Estado *</Label>
                <Input
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value.toUpperCase() })}
                  maxLength={2}
                  required
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="principal"
                checked={formData.principal}
                onCheckedChange={(checked) => setFormData({ ...formData, principal: checked })}
              />
              <Label htmlFor="principal">Definir como endereço principal</Label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600">
                Continuar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Termo */}
      <Dialog open={showTermoDialog} onOpenChange={setShowTermoDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Termo de Responsabilidade</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-700 max-h-60 overflow-y-auto">
              <p className="font-semibold mb-2">TERMO DE RESPONSABILIDADE - ENDEREÇO DE COLETA</p>
              <p className="mb-2">
                Ao cadastrar este endereço de coleta, declaro que:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>O endereço informado é de minha responsabilidade ou tenho autorização para utilizá-lo.</li>
                <li>As informações prestadas são verdadeiras e estou ciente de que informações falsas podem acarretar penalidades.</li>
                <li>Entendo que este endereço não poderá ser excluído após o cadastro, apenas desativado.</li>
                <li>Comprometo-me a manter as informações atualizadas e comunicar quaisquer alterações.</li>
                <li>Autorizo a plataforma a utilizar este endereço para fins de logística e rastreabilidade das operações.</li>
              </ul>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="termo"
                checked={termoAceito}
                onCheckedChange={setTermoAceito}
              />
              <Label htmlFor="termo" className="text-sm">
                Li e aceito o termo de responsabilidade
              </Label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowTermoDialog(false)}>
                Voltar
              </Button>
              <Button onClick={confirmarCadastro} disabled={!termoAceito} className="bg-blue-600">
                <FileCheck className="w-4 h-4 mr-2" />
                Confirmar Cadastro
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
