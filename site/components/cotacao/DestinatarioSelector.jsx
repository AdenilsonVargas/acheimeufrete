import React, { useState, useEffect, useCallback } from "react";
import { Destinatario } from "@/entities/Destinatario";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, MapPin } from "lucide-react";
import { Label } from "@/components/ui/label";

export default function DestinatarioSelector({ clienteId, onSelect, selectedDestinatario }) {
  const [destinatarios, setDestinatarios] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const loadDestinatarios = useCallback(async () => {
    const data = await Destinatario.filter({ clienteId });
    setDestinatarios(data);
    setLoading(false);
  }, [clienteId]);

  useEffect(() => {
    loadDestinatarios();
  }, [loadDestinatarios]);

  const filteredDestinatarios = destinatarios.filter(d => 
    d.nomeCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.cidade.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div>
        <Label>Selecione o Destinatário *</Label>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Buscar destinatário por nome ou cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
        {loading ? (
          <p className="text-gray-500 col-span-2 text-center py-4">Carregando destinatários...</p>
        ) : filteredDestinatarios.length === 0 ? (
          <p className="text-gray-500 col-span-2 text-center py-4">
            Nenhum destinatário encontrado. Cadastre destinatários antes de criar uma cotação.
          </p>
        ) : (
          filteredDestinatarios.map((destinatario) => (
            <Card
              key={destinatario.id}
              className={`p-4 cursor-pointer transition-all duration-200 ${
                selectedDestinatario?.id === destinatario.id
                  ? "border-2 border-green-600 bg-green-50"
                  : "hover:border-green-300 hover:shadow-md"
              }`}
              onClick={() => onSelect(destinatario)}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 truncate">{destinatario.nomeCompleto}</h4>
                  <p className="text-xs text-gray-600 truncate">
                    {destinatario.cidade} - {destinatario.estado}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">CEP: {destinatario.cep}</p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
