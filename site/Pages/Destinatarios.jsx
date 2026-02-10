import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, MapPin, Search, Edit, Trash2, AlertCircle, Bike } from "lucide-react";
import PageHeader from "../components/common/PageHeader";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Destinatarios() {
  const [user, setUser] = useState(null);
  const [destinatarios, setDestinatarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingDestinatario, setEditingDestinatario] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    nomeCompleto: "",
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    pais: "Brasil",
    aceitaMotoCarAte100km: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      
      const destinatariosData = await base44.entities.Destinatario.filter({ clienteId: userData.perfilAtivoId }, "-created_date");
      setDestinatarios(destinatariosData);
    } catch (error) {
      console.error("Erro ao carregar destinatários:", error);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.nomeCompleto !== formData.nomeCompleto.toUpperCase()) {
      setError("O nome deve estar em MAIÚSCULAS");
      return;
    }

    if (formData.logradouro !== formData.logradouro.toUpperCase()) {
      setError("O logradouro deve estar em MAIÚSCULAS");
      return;
    }

    if (formData.bairro !== formData.bairro.toUpperCase()) {
      setError("O bairro deve estar em MAIÚSCULAS");
      return;
    }

    if (formData.cidade !== formData.cidade.toUpperCase()) {
      setError("A cidade deve estar em MAIÚSCULAS");
      return;
    }

    try {
      const destinatarioData = {
        ...formData,
        clienteId: user.perfilAtivoId
      };

      if (editingDestinatario) {
        await base44.entities.Destinatario.update(editingDestinatario.id, destinatarioData);
      } else {
        await base44.entities.Destinatario.create(destinatarioData);
      }

      setShowDialog(false);
      setEditingDestinatario(null);
      setFormData({
        nomeCompleto: "",
        cep: "",
        logradouro: "",
        numero: "",
        complemento: "",
        bairro: "",
        cidade: "",
        estado: "",
        pais: "Brasil",
        aceitaMotoCarAte100km: false
      });
      loadData();
    } catch (error) {
      setError("Erro ao salvar destinatário. Tente novamente.");
    }
  };

  const handleEdit = (destinatario) => {
    setEditingDestinatario(destinatario);
    setFormData({
      nomeCompleto: destinatario.nomeCompleto,
      cep: destinatario.cep,
      logradouro: destinatario.logradouro,
      numero: destinatario.numero,
      complemento: destinatario.complemento || "",
      bairro: destinatario.bairro,
      cidade: destinatario.cidade,
      estado: destinatario.estado,
      pais: destinatario.pais || "Brasil",
      aceitaMotoCarAte100km: destinatario.aceitaMotoCarAte100km || false
    });
    setShowDialog(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Tem certeza que deseja excluir este destinatário?")) {
      await base44.entities.Destinatario.delete(id);
      loadData();
    }
  };

  const filteredDestinatarios = destinatarios.filter(d => 
    d.nomeCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.cidade.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <LoadingSpinner message="Carregando destinatários..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <PageHeader
        title="Destinatários"
        description="Gerencie seus destinatários cadastrados"
        action={
          <Button 
            onClick={() => {
              setEditingDestinatario(null);
              setFormData({
                nomeCompleto: "",
                cep: "",
                logradouro: "",
                numero: "",
                complemento: "",
                bairro: "",
                cidade: "",
                estado: "",
                pais: "Brasil",
                aceitaMotoCarAte100km: false
              });
              setShowDialog(true);
            }}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Destinatário
          </Button>
        }
      />

      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Buscar destinatários por nome ou cidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {filteredDestinatarios.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title="Nenhum destinatário cadastrado"
            description="Cadastre destinatários para utilizá-los nas cotações de frete"
            actionLabel="Cadastrar Primeiro Destinatário"
            actionUrl="#"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDestinatarios.map((destinatario) => (
              <Card key={destinatario.id} className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{destinatario.nomeCompleto}</h3>
                        <p className="text-xs text-gray-500">CEP: {destinatario.cep}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-gray-500">Endereço:</p>
                      <p className="font-medium text-gray-900">
                        {destinatario.logradouro}, {destinatario.numero}
                      </p>
                      {destinatario.complemento && (
                        <p className="text-gray-600 text-xs">{destinatario.complemento}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-gray-500">Bairro:</p>
                      <p className="font-medium text-gray-900">{destinatario.bairro}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Cidade/Estado:</p>
                      <p className="font-medium text-gray-900">
                        {destinatario.cidade} - {destinatario.estado}
                      </p>
                    </div>
                    {destinatario.aceitaMotoCarAte100km && (
                      <div className="pt-2">
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          <Bike className="w-3 h-3 mr-1" />
                          Aceita moto/carro até 100km
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 mt-4 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(destinatario)}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(destinatario.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingDestinatario ? "Editar Destinatário" : "Novo Destinatário"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div>
              <Label htmlFor="nomeCompleto">Nome Completo (EM MAIÚSCULAS) *</Label>
              <Input
                id="nomeCompleto"
                value={formData.nomeCompleto}
                onChange={(e) => setFormData({ ...formData, nomeCompleto: e.target.value.toUpperCase() })}
                placeholder="DIGITE O NOME EM MAIÚSCULAS"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cep">CEP *</Label>
                <Input
                  id="cep"
                  value={formData.cep}
                  onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                  placeholder="00000-000"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="logradouro">Logradouro (EM MAIÚSCULAS) *</Label>
              <Input
                id="logradouro"
                value={formData.logradouro}
                onChange={(e) => setFormData({ ...formData, logradouro: e.target.value.toUpperCase() })}
                placeholder="RUA, AVENIDA, ETC"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="numero">Número *</Label>
                <Input
                  id="numero"
                  value={formData.numero}
                  onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="complemento">Complemento</Label>
                <Input
                  id="complemento"
                  value={formData.complemento}
                  onChange={(e) => setFormData({ ...formData, complemento: e.target.value.toUpperCase() })}
                  placeholder="APTO, SALA, ETC"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="bairro">Bairro (EM MAIÚSCULAS) *</Label>
              <Input
                id="bairro"
                value={formData.bairro}
                onChange={(e) => setFormData({ ...formData, bairro: e.target.value.toUpperCase() })}
                placeholder="NOME DO BAIRRO"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cidade">Cidade (EM MAIÚSCULAS) *</Label>
                <Input
                  id="cidade"
                  value={formData.cidade}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value.toUpperCase() })}
                  placeholder="NOME DA CIDADE"
                  required
                />
              </div>
              <div>
                <Label htmlFor="estado">Estado *</Label>
                <Input
                  id="estado"
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value.toUpperCase() })}
                  placeholder="SP"
                  maxLength={2}
                  required
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg">
                <Checkbox
                  id="aceitaMotoCarAte100km"
                  checked={formData.aceitaMotoCarAte100km}
                  onCheckedChange={(checked) => setFormData({ ...formData, aceitaMotoCarAte100km: checked })}
                />
                <div>
                  <Label htmlFor="aceitaMotoCarAte100km" className="cursor-pointer font-medium">
                    <Bike className="w-4 h-4 inline mr-2" />
                    Aceita moto/carro para entregas até 100km
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">
                    Marque esta opção se este destino aceita entregas por moto ou carro quando a distância for até 100km do endereço de coleta.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-blue-600 to-blue-700">
                {editingDestinatario ? "Atualizar" : "Cadastrar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
