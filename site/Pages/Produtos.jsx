import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Package, Search, Edit, Trash2, AlertCircle } from "lucide-react";
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

const UNIDADES_MEDIDA = [
  { value: 'kg', label: 'Quilogramas (kg)' },
  { value: 'ton', label: 'Toneladas (ton)' },
  { value: 'litro', label: 'Litros (L)' },
  { value: 'm3', label: 'Metros Cúbicos (m³)' },
  { value: 'unidade', label: 'Unidade' },
  { value: 'saca', label: 'Sacaria' },
  { value: 'palete', label: 'Palete' },
  { value: 'container', label: 'Container' },
  { value: 'granel', label: 'Granel' }
];

const FLAGS_PRODUTO = [
  { value: 'fragil', label: 'Frágil' },
  { value: 'quimico', label: 'Químico' },
  { value: 'liquido', label: 'Líquido' },
  { value: 'granel', label: 'A Granel' },
  { value: 'delicado', label: 'Delicado' },
  { value: 'perecivel', label: 'Perecível' },
  { value: 'refrigerado', label: 'Refrigerado' },
  { value: 'congelado', label: 'Congelado' },
  { value: 'inflamavel', label: 'Inflamável' },
  { value: 'corrosivo', label: 'Corrosivo' },
  { value: 'toxico', label: 'Tóxico' },
  { value: 'explosivo', label: 'Explosivo' },
  { value: 'radioativo', label: 'Radioativo' },
  { value: 'biologico', label: 'Biológico' },
  { value: 'volumoso', label: 'Volumoso' },
  { value: 'pesado', label: 'Pesado' },
  { value: 'empilhavel', label: 'Empilhável' },
  { value: 'nao_empilhavel', label: 'Não Empilhável' },
  { value: 'requer_cuidado', label: 'Requer Cuidado Especial' },
  { value: 'alto_valor', label: 'Alto Valor' }
];

export default function Produtos() {
  const [user, setUser] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const [ncms, setNcms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingProduto, setEditingProduto] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    nome: "",
    ncmCode: "",
    ncmClassificacao: "",
    unidadeMedida: "kg",
    pesoKg: "",
    larguraM: "",
    alturaM: "",
    comprimentoM: "",
    valorUnitario: "",
    flags: [],
    observacoes: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      
      const [produtosData, ncmsData] = await Promise.all([
        base44.entities.Produto.filter({ clienteId: userData.perfilAtivoId }, "-created_date"),
        base44.entities.NCM.list()
      ]);
      
      setProdutos(produtosData);
      setNcms(ncmsData);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.nome !== formData.nome.toUpperCase()) {
      setError("O nome do produto deve estar em MAIÚSCULAS");
      return;
    }

    if (!formData.pesoKg || !formData.larguraM || !formData.alturaM || !formData.comprimentoM) {
      setError("Todos os campos de peso e medidas são obrigatórios");
      return;
    }

    try {
      const produtoData = {
        ...formData,
        pesoKg: parseFloat(formData.pesoKg),
        larguraM: parseFloat(formData.larguraM),
        alturaM: parseFloat(formData.alturaM),
        comprimentoM: parseFloat(formData.comprimentoM),
        valorUnitario: parseFloat(formData.valorUnitario) || 0,
        clienteId: user.perfilAtivoId
      };

      if (editingProduto) {
        // Unidade não pode ser alterada após criação
        delete produtoData.unidadeMedida;
        await base44.entities.Produto.update(editingProduto.id, produtoData);
      } else {
        await base44.entities.Produto.create(produtoData);
      }

      setShowDialog(false);
      setEditingProduto(null);
      setFormData({
        nome: "",
        ncmCode: "",
        ncmClassificacao: "",
        unidadeMedida: "kg",
        pesoKg: "",
        larguraM: "",
        alturaM: "",
        comprimentoM: "",
        valorUnitario: "",
        flags: [],
        observacoes: ""
      });
      loadData();
    } catch (error) {
      setError("Erro ao salvar produto. Tente novamente.");
    }
  };

  const handleEdit = (produto) => {
    setEditingProduto(produto);
    setFormData({
      nome: produto.nome,
      ncmCode: produto.ncmCode,
      ncmClassificacao: produto.ncmClassificacao || "",
      unidadeMedida: produto.unidadeMedida || "kg",
      pesoKg: produto.pesoKg.toString(),
      larguraM: produto.larguraM.toString(),
      alturaM: produto.alturaM.toString(),
      comprimentoM: produto.comprimentoM.toString(),
      valorUnitario: (produto.valorUnitario || 0).toString(),
      flags: produto.flags || [],
      observacoes: produto.observacoes || ""
    });
    setShowDialog(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
      await base44.entities.Produto.delete(id);
      loadData();
    }
  };

  const toggleFlag = (flag) => {
    const newFlags = formData.flags.includes(flag)
      ? formData.flags.filter(f => f !== flag)
      : [...formData.flags, flag];
    setFormData({ ...formData, flags: newFlags });
  };

  const handleNCMSelect = (code) => {
    const selectedNCM = ncms.find(n => n.code === code);
    if (selectedNCM) {
      setFormData({
        ...formData,
        ncmCode: code,
        ncmClassificacao: selectedNCM.classification
      });
    }
  };

  const filteredProdutos = produtos.filter(p => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.ncmCode.includes(searchTerm)
  );

  if (loading) {
    return <LoadingSpinner message="Carregando produtos..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <PageHeader
        title="Produtos"
        description="Gerencie seus produtos cadastrados"
        action={
          <Button 
            onClick={() => {
              setEditingProduto(null);
              setFormData({
                nome: "",
                ncmCode: "",
                ncmClassificacao: "",
                unidadeMedida: "kg",
                pesoKg: "",
                larguraM: "",
                alturaM: "",
                comprimentoM: "",
                valorUnitario: "",
                flags: [],
                observacoes: ""
              });
              setShowDialog(true);
            }}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Produto
          </Button>
        }
      />

      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Buscar produtos por nome ou NCM..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {filteredProdutos.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Nenhum produto cadastrado"
            description="Cadastre produtos para utilizá-los nas cotações de frete"
            actionLabel="Cadastrar Primeiro Produto"
            actionUrl="#"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProdutos.map((produto) => (
              <Card key={produto.id} className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                        <Package className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{produto.nome}</h3>
                        <p className="text-xs text-gray-500">NCM: {produto.ncmCode}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Unidade:</span>
                      <Badge variant="outline">{produto.unidadeMedida || 'kg'}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Peso:</span>
                      <span className="font-medium text-gray-900">{produto.pesoKg} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Dimensões (m):</span>
                      <span className="font-medium text-gray-900">
                        {produto.larguraM} x {produto.alturaM} x {produto.comprimentoM}
                      </span>
                    </div>
                    {produto.valorUnitario > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Valor Unit.:</span>
                        <span className="font-medium text-green-600">
                          R$ {produto.valorUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                    {produto.flags && produto.flags.length > 0 && (
                      <div className="pt-2 border-t flex flex-wrap gap-1">
                        {produto.flags.map(flag => (
                          <Badge key={flag} className="text-xs bg-orange-100 text-orange-800">
                            {FLAGS_PRODUTO.find(f => f.value === flag)?.label || flag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {produto.observacoes && (
                      <div className="pt-2 border-t">
                        <p className="text-gray-600 text-xs">{produto.observacoes}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 mt-4 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(produto)}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(produto.id)}
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
              {editingProduto ? "Editar Produto" : "Novo Produto"}
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
              <Label htmlFor="nome">Nome do Produto (EM MAIÚSCULAS) *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value.toUpperCase() })}
                placeholder="DIGITE O NOME EM MAIÚSCULAS"
                required
              />
            </div>

            <div>
              <Label htmlFor="ncm">NCM *</Label>
              <Select value={formData.ncmCode} onValueChange={handleNCMSelect} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o NCM" />
                </SelectTrigger>
                <SelectContent>
                  {ncms.map((ncm) => (
                    <SelectItem key={ncm.code} value={ncm.code}>
                      {ncm.code} - {ncm.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.ncmClassificacao && (
                <p className="text-xs text-gray-500 mt-1">
                  Classificação: {formData.ncmClassificacao}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="unidade">Unidade de Medida *</Label>
              <Select 
                value={formData.unidadeMedida} 
                onValueChange={(v) => setFormData({ ...formData, unidadeMedida: v })}
                disabled={!!editingProduto}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIDADES_MEDIDA.map((un) => (
                    <SelectItem key={un.value} value={un.value}>
                      {un.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editingProduto && (
                <p className="text-xs text-orange-600 mt-1">
                  ⚠️ A unidade não pode ser alterada após a criação
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="peso">Peso (kg) *</Label>
                <Input
                  id="peso"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.pesoKg}
                  onChange={(e) => setFormData({ ...formData, pesoKg: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="valorUnitario">Valor Unitário (R$)</Label>
                <Input
                  id="valorUnitario"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.valorUnitario}
                  onChange={(e) => setFormData({ ...formData, valorUnitario: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <Label className="text-base font-semibold mb-3 block">Dimensões (metros) *</Label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="largura">Largura</Label>
                  <Input
                    id="largura"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.larguraM}
                    onChange={(e) => setFormData({ ...formData, larguraM: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="altura">Altura</Label>
                  <Input
                    id="altura"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.alturaM}
                    onChange={(e) => setFormData({ ...formData, alturaM: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="comprimento">Comprimento</Label>
                  <Input
                    id="comprimento"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.comprimentoM}
                    onChange={(e) => setFormData({ ...formData, comprimentoM: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <Label className="text-base font-semibold mb-3 block">Características do Produto</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 border rounded-lg">
                {FLAGS_PRODUTO.map((flag) => (
                  <div key={flag.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={flag.value}
                      checked={formData.flags.includes(flag.value)}
                      onCheckedChange={() => toggleFlag(flag.value)}
                    />
                    <Label htmlFor={flag.value} className="text-sm cursor-pointer">
                      {flag.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Informações adicionais sobre o produto"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-blue-600 to-blue-700">
                {editingProduto ? "Atualizar" : "Cadastrar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
