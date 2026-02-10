import React, { useState, useEffect, useCallback } from "react";
import { Produto } from "@/entities/Produto";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, Package } from "lucide-react";
import { Label } from "@/components/ui/label";

export default function ProdutoSelector({ clienteId, onSelect, selectedProduto }) {
  const [produtos, setProdutos] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const loadProdutos = useCallback(async () => {
    const data = await Produto.filter({ clienteId });
    setProdutos(data);
    setLoading(false);
  }, [clienteId]);

  useEffect(() => {
    loadProdutos();
  }, [loadProdutos]);

  const filteredProdutos = produtos.filter(p => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.ncmCode.includes(searchTerm)
  );

  return (
    <div className="space-y-4">
      <div>
        <Label>Selecione o Produto *</Label>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
        {loading ? (
          <p className="text-gray-500 col-span-2 text-center py-4">Carregando produtos...</p>
        ) : filteredProdutos.length === 0 ? (
          <p className="text-gray-500 col-span-2 text-center py-4">
            Nenhum produto encontrado. Cadastre produtos antes de criar uma cotação.
          </p>
        ) : (
          filteredProdutos.map((produto) => (
            <Card
              key={produto.id}
              className={`p-4 cursor-pointer transition-all duration-200 ${
                selectedProduto?.id === produto.id
                  ? "border-2 border-blue-600 bg-blue-50"
                  : "hover:border-blue-300 hover:shadow-md"
              }`}
              onClick={() => onSelect(produto)}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 truncate">{produto.nome}</h4>
                  <p className="text-xs text-gray-500">NCM: {produto.ncmCode}</p>
                  <p className="text-xs text-gray-600 mt-1">{produto.pesoKg} kg</p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
