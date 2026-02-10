import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Package, Search, Check } from "lucide-react";

export default function ProdutoSelectorMulti({ clienteId, onProductsChange, selectedProducts }) {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: produtos = [], isLoading } = useQuery({
    queryKey: ['produtos-selector', clienteId],
    queryFn: async () => {
      if (!clienteId) return [];
      return await base44.entities.Produto.filter({ clienteId });
    },
    enabled: !!clienteId
  });

  const filteredProdutos = produtos.filter(p =>
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.ncmCode.includes(searchTerm)
  );

  const toggleProduct = (produto) => {
    const exists = selectedProducts.find(p => p.produto.id === produto.id);
    
    if (exists) {
      onProductsChange(selectedProducts.filter(p => p.produto.id !== produto.id));
    } else {
      onProductsChange([
        ...selectedProducts,
        {
          produto,
          quantidade: 1,
          valorUnitario: 0,
          pesoUnitario: produto.pesoKg
        }
      ]);
    }
  };

  const isSelected = (produtoId) => {
    return selectedProducts.some(p => p.produto.id === produtoId);
  };

  if (isLoading) {
    return <div className="text-center py-4 text-gray-500">Carregando produtos...</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Selecione os Produtos *</Label>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Buscar produto por nome ou NCM..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {selectedProducts.length > 0 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm font-semibold text-blue-900">
            {selectedProducts.length} produto(s) selecionado(s)
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
        {filteredProdutos.map((produto) => {
          const selected = isSelected(produto.id);
          
          return (
            <Card
              key={produto.id}
              className={`cursor-pointer transition-all ${
                selected
                  ? 'border-2 border-blue-500 bg-blue-50'
                  : 'border hover:border-blue-300 hover:shadow-md'
              }`}
              onClick={() => toggleProduct(produto)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    selected ? 'bg-blue-600' : 'bg-blue-100'
                  }`}>
                    {selected ? (
                      <Check className="w-6 h-6 text-white" />
                    ) : (
                      <Package className={`w-6 h-6 ${selected ? 'text-white' : 'text-blue-600'}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold truncate ${selected ? 'text-blue-900' : 'text-gray-900'}`}>
                      {produto.nome}
                    </h3>
                    <p className="text-xs text-gray-600 mt-1">NCM: {produto.ncmCode}</p>
                    <p className="text-xs text-gray-500">{produto.pesoKg} kg</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredProdutos.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>Nenhum produto encontrado</p>
        </div>
      )}
    </div>
  );
}
