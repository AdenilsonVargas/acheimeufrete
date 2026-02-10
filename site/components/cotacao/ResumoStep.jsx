import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, MapPin, Box, Truck } from "lucide-react";

export default function ResumoStep({ 
  selectedProducts, 
  selectedDestinatario, 
  formData,
  showCarga = false,
  showServicos = false 
}) {
  const calcularValorTotal = () => {
    return selectedProducts.reduce((sum, p) => {
      return sum + (parseFloat(p.quantidade || 0) * parseFloat(p.valorUnitario || 0));
    }, 0);
  };

  const calcularPesoTotal = () => {
    return selectedProducts.reduce((sum, p) => {
      return sum + (parseFloat(p.quantidade || 0) * parseFloat(p.pesoUnitario || 0));
    }, 0);
  };

  return (
    <Card className="mb-6 border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardContent className="p-4">
        <h3 className="text-sm font-bold text-blue-900 mb-3 uppercase tracking-wide">
          📋 Resumo da Cotação
        </h3>

        <div className="space-y-3">
          {/* Produtos */}
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-semibold text-gray-700">PRODUTOS</span>
            </div>
            <div className="space-y-1">
              {selectedProducts.map((item, idx) => (
                <div key={idx} className="flex justify-between text-xs">
                  <span className="text-gray-900 font-medium">
                    {item.produto.nome} <span className="text-gray-500">x{item.quantidade}</span>
                  </span>
                  <span className="text-gray-600">{item.produto.ncmCode}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 pt-2 border-t flex justify-between text-xs font-semibold">
              <span>Total NF:</span>
              <span className="text-blue-700">R$ {calcularValorTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* Destinatário */}
          {selectedDestinatario && (
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-4 h-4 text-green-600" />
                <span className="text-xs font-semibold text-gray-700">DESTINO</span>
              </div>
              <p className="text-xs text-gray-900 font-medium">{selectedDestinatario.nomeCompleto}</p>
              <p className="text-xs text-gray-600">
                {selectedDestinatario.cidade} - {selectedDestinatario.estado}
              </p>
            </div>
          )}

          {/* Informações de Carga */}
          {showCarga && formData.quantidadeVolumes && (
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Box className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-semibold text-gray-700">CARGA</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-600">Volumes:</span>
                  <span className="ml-1 font-semibold">{formData.quantidadeVolumes}</span>
                </div>
                <div>
                  <span className="text-gray-600">Peso Total:</span>
                  <span className="ml-1 font-semibold">{calcularPesoTotal().toFixed(2)} kg</span>
                </div>
              </div>
            </div>
          )}

          {/* Serviços Adicionais */}
          {showServicos && (
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Truck className="w-4 h-4 text-orange-600" />
                <span className="text-xs font-semibold text-gray-700">SERVIÇOS</span>
              </div>
              {(formData.servicosAdicionais?.precisaPalete || 
                formData.servicosAdicionais?.ehUrgente || 
                formData.servicosAdicionais?.ehFragil || 
                formData.servicosAdicionais?.precisaCargaDedicada) ? (
                <div className="flex flex-wrap gap-1">
                  {formData.servicosAdicionais.precisaPalete && (
                    <Badge className="bg-blue-100 text-blue-800 text-xs">Palete</Badge>
                  )}
                  {formData.servicosAdicionais.ehUrgente && (
                    <Badge className="bg-orange-100 text-orange-800 text-xs">Urgente</Badge>
                  )}
                  {formData.servicosAdicionais.ehFragil && (
                    <Badge className="bg-yellow-100 text-yellow-800 text-xs">Frágil</Badge>
                  )}
                  {formData.servicosAdicionais.precisaCargaDedicada && (
                    <Badge className="bg-purple-100 text-purple-800 text-xs">Dedicada</Badge>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic">Nenhum serviço adicional</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
