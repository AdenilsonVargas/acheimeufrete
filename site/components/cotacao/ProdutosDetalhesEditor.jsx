import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ProdutosDetalhesEditor({ selectedProducts, onProductsChange }) {
  const updateProduct = (index, field, value) => {
    const updated = [...selectedProducts];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    onProductsChange(updated);
  };

  const removeProduct = (index) => {
    onProductsChange(selectedProducts.filter((_, i) => i !== index));
  };

  const calcularTotal = () => {
    return selectedProducts.reduce((sum, p) => {
      return sum + (parseFloat(p.quantidade || 0) * parseFloat(p.valorUnitario || 0));
    }, 0);
  };

  const calcularPesoTotal = () => {
    return selectedProducts.reduce((sum, p) => {
      return sum + (parseFloat(p.quantidade || 0) * parseFloat(p.pesoUnitario || 0));
    }, 0);
  };

  if (selectedProducts.length === 0) {
    return null;
  }

  return (
    <Card className="border-2 border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-600" />
          Produtos Selecionados - Detalhes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {selectedProducts.map((item, index) => (
          <Card key={index} className="bg-white">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{item.produto.nome}</h4>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      NCM: {item.produto.ncmCode}
                    </Badge>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeProduct(index)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-gray-600">Quantidade *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantidade}
                    onChange={(e) => updateProduct(index, 'quantidade', e.target.value)}
                    className="h-9"
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Valor Unit. (R$) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.valorUnitario}
                    onChange={(e) => updateProduct(index, 'valorUnitario', e.target.value)}
                    className="h-9"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Peso Unit. (kg) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.pesoUnitario}
                    onChange={(e) => updateProduct(index, 'pesoUnitario', e.target.value)}
                    className="h-9"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                <div className="p-2 bg-gray-50 rounded">
                  <span className="text-gray-600">Subtotal: </span>
                  <span className="font-semibold">
                    R$ {(parseFloat(item.quantidade || 0) * parseFloat(item.valorUnitario || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <span className="text-gray-600">Peso Total: </span>
                  <span className="font-semibold">
                    {(parseFloat(item.quantidade || 0) * parseFloat(item.pesoUnitario || 0)).toFixed(2)} kg
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg text-white">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-blue-100">Valor Total da NF</p>
              <p className="text-2xl font-bold">
                R$ {calcularTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-sm text-blue-100">Peso Total</p>
              <p className="text-2xl font-bold">
                {calcularPesoTotal().toFixed(2)} kg
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
