import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";

export default function EnderecoColetaSelector({ clienteId, onSelect, selectedEndereco }) {
  const { data: enderecos = [], isLoading } = useQuery({
    queryKey: ['enderecos-coleta-selector', clienteId],
    queryFn: () => base44.entities.EnderecoColeta.filter({ clienteId, ativo: true }),
    enabled: !!clienteId
  });

  // Selecionar automaticamente o endereço principal se não houver seleção
  React.useEffect(() => {
    if (enderecos.length > 0 && !selectedEndereco) {
      const principal = enderecos.find(e => e.principal) || enderecos[0];
      onSelect(principal);
    }
  }, [enderecos, selectedEndereco, onSelect]);

  if (isLoading) {
    return <div className="text-center py-4 text-gray-500">Carregando endereços...</div>;
  }

  if (enderecos.length === 0) {
    return (
      <div className="text-center py-6 bg-yellow-50 rounded-lg border border-yellow-200">
        <MapPin className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
        <h3 className="font-semibold text-gray-700 mb-2">Nenhum endereço de coleta cadastrado</h3>
        <p className="text-sm text-gray-500 mb-4">Cadastre um endereço de coleta para continuar</p>
        <Link to={createPageUrl("EnderecosColeta")}>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Cadastrar Endereço
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-green-600" />
          Endereço de Coleta (Origem)
        </h3>
        <Link to={createPageUrl("EnderecosColeta")}>
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Gerenciar
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {enderecos.map((endereco) => (
          <Card
            key={endereco.id}
            className={`cursor-pointer transition-all duration-200 ${
              selectedEndereco?.id === endereco.id
                ? "ring-2 ring-green-500 bg-green-50"
                : "hover:border-green-300"
            }`}
            onClick={() => onSelect(endereco)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    selectedEndereco?.id === endereco.id
                      ? "bg-green-600 text-white"
                      : "bg-green-100 text-green-600"
                  }`}>
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{endereco.apelido}</p>
                    {endereco.principal && (
                      <Badge className="bg-blue-100 text-blue-700 text-xs">
                        <Star className="w-3 h-3 mr-1" />
                        Principal
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-600 space-y-0.5">
                <p>{endereco.logradouro}, {endereco.numero}</p>
                <p>{endereco.bairro} - {endereco.cidade}/{endereco.estado}</p>
                <p className="font-mono text-green-700 font-semibold">CEP: {endereco.cep}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
