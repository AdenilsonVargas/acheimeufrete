import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { OpcaoEnvio } from "@/entities/OpcaoEnvio";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Settings, Edit, Trash2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function OpcoesEnvio() {
  const [user, setUser] = useState(null);
  const [opcoes, setOpcoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingOpcao, setEditingOpcao] = useState(null);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    nome: "",
    descricao: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      
      const opcoesData = await OpcaoEnvio.filter({ transportadoraId: userData.perfilAtivoId });
      setOpcoes(opcoesData);
    } catch (error) {
      console.error("Erro ao carregar opções:", error);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.nome) {
      setError("Selecione o tipo de envio");
      return;
    }

    if (formData.descricao && formData.descricao !== formData.descricao.toUpperCase()) {
      setError("A descrição deve estar em MAIÚSCULAS");
      return;
    }

    try {
      const opcaoData = {
        ...formData,
        descricao: formData.descricao.toUpperCase(),
        transportadoraId: user.perfilAtivoId
      };

      if (editingOpcao) {
        await OpcaoEnvio.update(editingOpcao.id, opcaoData);
      } else {
        await OpcaoEnvio.create(opcaoData);
      }

      setShowDialog(false);
      setEditingOpcao(null);
      setFormData({ nome: "", descricao: "" });
      loadData();
      await checkAndUpdateProfileComplete();
    } catch (error) {
      setError("Erro ao salvar opção de envio. Tente novamente.");
    }
  };

  const checkAndUpdateProfileComplete = async () => {
    const opcoesData = await OpcaoEnvio.filter({ transportadoraId: user.perfilAtivoId });
    if (opcoesData.length > 0 && !user.perfilCompleto) {
      await User.updateMyUserData({ perfilCompleto: true });
    }
  };

  const handleEdit = (opcao) => {
    setEditingOpcao(opcao);
    setFormData({
      nome: opcao.nome,
      descricao: opcao.descricao || ""
    });
    setShowDialog(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Tem certeza que deseja excluir esta opção de envio?")) {
      await OpcaoEnvio.delete(id);
      loadData();
    }
  };

  if (loading) {
    return <LoadingSpinner message="Carregando opções de envio..." />;
  }

  const tiposEnvio = [
    { value: "Aéreo", icon: "✈️", color: "from-blue-400 to-blue-500" },
    { value: "Marítimo", icon: "🚢", color: "from-cyan-400 to-cyan-500" },
    { value: "Terrestre", icon: "🚛", color: "from-green-400 to-green-500" },
    { value: "Dedicado", icon: "🎯", color: "from-purple-400 to-purple-500" },
    { value: "Outro", icon: "📦", color: "from-orange-400 to-orange-500" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <PageHeader
        title="Opções de Envio"
        description="Configure os tipos de envio que sua transportadora oferece"
        action={
          <Button 
            onClick={() => {
              setEditingOpcao(null);
              setFormData({ nome: "", descricao: "" });
              setShowDialog(true);
            }}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Opção de Envio
          </Button>
        }
      />

      <div className="p-6 max-w-7xl mx-auto">
        {opcoes.length === 0 ? (
          <EmptyState
            icon={Settings}
            title="Nenhuma opção de envio cadastrada"
            description="Cadastre as opções de envio que sua transportadora oferece para começar a receber cotações"
            actionLabel="Cadastrar Primeira Opção"
            actionUrl="#"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {opcoes.map((opcao) => {
              const tipoConfig = tiposEnvio.find(t => t.value === opcao.nome);
              return (
                <Card key={opcao.id} className="hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 bg-gradient-to-br ${tipoConfig?.color || 'from-gray-400 to-gray-500'} rounded-lg flex items-center justify-center text-2xl`}>
                          {tipoConfig?.icon || "📦"}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{opcao.nome}</h3>
                        </div>
                      </div>
                    </div>

                    {opcao.descricao && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">{opcao.descricao}</p>
                      </div>
                    )}

                    <div className="flex gap-2 mt-4 pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(opcao)}
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(opcao.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingOpcao ? "Editar Opção de Envio" : "Nova Opção de Envio"}
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
              <Label htmlFor="nome">Tipo de Envio *</Label>
              <Select value={formData.nome} onValueChange={(value) => setFormData({ ...formData, nome: value })} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tiposEnvio.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.icon} {tipo.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="descricao">Descrição (EM MAIÚSCULAS)</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value.toUpperCase() })}
                placeholder="DIGITE A DESCRIÇÃO EM MAIÚSCULAS"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-blue-600 to-blue-700">
                {editingOpcao ? "Atualizar" : "Cadastrar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
