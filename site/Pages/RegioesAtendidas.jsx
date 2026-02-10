import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { RegiaoAtendida } from "@/entities/RegiaoAtendida";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, MapPinned, Trash2, Edit } from "lucide-react";
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
import { AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

const ESTADOS_BRASIL = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

export default function RegioesAtendidas() {
  const [user, setUser] = useState(null);
  const [regioes, setRegioes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingRegiao, setEditingRegiao] = useState(null);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    cepInicio: "",
    cepFim: "",
    estados: []
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      
      const regioesData = await RegiaoAtendida.filter({ transportadoraId: userData.perfilAtivoId });
      setRegioes(regioesData);
    } catch (error) {
      console.error("Erro ao carregar regiões:", error);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.estados.length === 0) {
      setError("Selecione pelo menos um estado");
      return;
    }

    try {
      const regiaoData = {
        transportadoraId: user.perfilAtivoId,
        cepInicio: formData.cepInicio,
        cepFim: formData.cepFim,
        estados: formData.estados
      };

      if (editingRegiao) {
        await RegiaoAtendida.update(editingRegiao.id, regiaoData);
      } else {
        await RegiaoAtendida.create(regiaoData);
      }

      setShowDialog(false);
      setEditingRegiao(null);
      setFormData({ cepInicio: "", cepFim: "", estados: [] });
      loadData();
    } catch (error) {
      setError("Erro ao salvar região. Tente novamente.");
    }
  };

  const handleEstadoToggle = (estado) => {
    setFormData(prev => ({
      ...prev,
      estados: prev.estados.includes(estado)
        ? prev.estados.filter(e => e !== estado)
        : [...prev.estados, estado]
    }));
  };

  const handleEdit = (regiao) => {
    setEditingRegiao(regiao);
    setFormData({
      cepInicio: regiao.cepInicio || "",
      cepFim: regiao.cepFim || "",
      estados: regiao.estados || []
    });
    setShowDialog(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Tem certeza que deseja remover esta região?")) {
      await RegiaoAtendida.delete(id);
      loadData();
    }
  };

  if (loading) {
    return <LoadingSpinner message="Carregando regiões..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <PageHeader
        title="Regiões Atendidas"
        description="Configure as regiões e estados que sua transportadora atende"
        action={
          <Button 
            onClick={() => {
              setEditingRegiao(null);
              setFormData({ cepInicio: "", cepFim: "", estados: [] });
              setShowDialog(true);
            }}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Região
          </Button>
        }
      />

      <div className="p-6 max-w-7xl mx-auto">
        {regioes.length === 0 ? (
          <EmptyState
            icon={MapPinned}
            title="Nenhuma região cadastrada"
            description="Cadastre as regiões que sua transportadora atende para receber cotações relevantes"
            actionLabel="Cadastrar Primeira Região"
            actionUrl="#"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regioes.map((regiao) => (
              <Card key={regiao.id} className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center">
                        <MapPinned className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">Região {regiao.id.slice(0, 8)}</h3>
                        <p className="text-xs text-gray-500">{regiao.estados?.length || 0} estados</p>
                      </div>
                    </div>
                  </div>

                  {(regiao.cepInicio || regiao.cepFim) && (
                    <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">Faixa de CEP:</p>
                      <p className="font-medium text-sm">
                        {regiao.cepInicio || "00000-000"} a {regiao.cepFim || "99999-999"}
                      </p>
                    </div>
                  )}

                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2">Estados Atendidos:</p>
                    <div className="flex flex-wrap gap-1">
                      {regiao.estados?.map(estado => (
                        <Badge key={estado} variant="outline" className="text-xs">
                          {estado}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(regiao)}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(regiao.id)}
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
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRegiao ? "Editar Região Atendida" : "Nova Região Atendida"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cepInicio">CEP Inicial (Opcional)</Label>
                <Input
                  id="cepInicio"
                  value={formData.cepInicio}
                  onChange={(e) => setFormData({ ...formData, cepInicio: e.target.value })}
                  placeholder="00000-000"
                />
              </div>
              <div>
                <Label htmlFor="cepFim">CEP Final (Opcional)</Label>
                <Input
                  id="cepFim"
                  value={formData.cepFim}
                  onChange={(e) => setFormData({ ...formData, cepFim: e.target.value })}
                  placeholder="99999-999"
                />
              </div>
            </div>

            <div>
              <Label className="mb-3 block">Estados Atendidos *</Label>
              <div className="grid grid-cols-4 md:grid-cols-6 gap-3 max-h-60 overflow-y-auto p-4 border rounded-lg">
                {ESTADOS_BRASIL.map((estado) => (
                  <div key={estado} className="flex items-center space-x-2">
                    <Checkbox
                      id={estado}
                      checked={formData.estados.includes(estado)}
                      onCheckedChange={() => handleEstadoToggle(estado)}
                    />
                    <label
                      htmlFor={estado}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {estado}
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {formData.estados.length} estado{formData.estados.length !== 1 ? 's' : ''} selecionado{formData.estados.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-blue-600 to-blue-700">
                {editingRegiao ? "Atualizar" : "Cadastrar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
