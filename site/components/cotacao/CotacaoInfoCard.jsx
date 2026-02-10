import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Package, 
  MapPin, 
  Calendar, 
  Clock, 
  Truck, 
  Weight,
  DollarSign,
  Box,
  Zap,
  AlertTriangle,
  FileText
} from "lucide-react";

// Função para extrair produtos das observações
const extractProdutosFromObservacoes = (observacoes) => {
  if (!observacoes) return [];
  
  const produtosMatch = observacoes.match(/PRODUTOS:\s*(.*?)(?:\s*\|\s*(?!SHAMPOO|PRODUTO)|\s*$)/i);
  if (!produtosMatch) return [];
  
  const produtosStr = observacoes.split('|').filter(s => s.includes('NCM:') || s.includes('QTD:'));
  
  return produtosStr.map(str => {
    const match = str.match(/([^(]+)\s*\(NCM:\s*(\d+)\)\s*-\s*QTD:\s*(\d+)\s*-\s*VALOR UNIT:\s*R\$\s*([\d.,]+)\s*-\s*PESO UNIT:\s*([\d.,]+)/i);
    if (match) {
      return {
        nome: match[1].replace('PRODUTOS:', '').trim(),
        ncm: match[2],
        quantidade: parseInt(match[3]),
        valorUnitario: parseFloat(match[4].replace(',', '.')),
        pesoUnitario: parseFloat(match[5].replace(',', '.').replace('KG', ''))
      };
    }
    return null;
  }).filter(Boolean);
};

// Extrai observações do cliente (sem a lista de produtos)
const extractObservacoesCliente = (observacoes) => {
  if (!observacoes) return null;
  const parts = observacoes.split('|');
  const lastPart = parts[parts.length - 1];
  if (lastPart && !lastPart.includes('NCM:') && !lastPart.includes('QTD:') && !lastPart.includes('PRODUTOS:')) {
    return lastPart.trim();
  }
  return null;
};

export default function CotacaoInfoCard({ cotacao, showFullDetails = true }) {
  const produtos = extractProdutosFromObservacoes(cotacao?.observacoes);
  const observacoesCliente = extractObservacoesCliente(cotacao?.observacoes);
  
  const valorTotalProdutos = produtos.reduce((sum, p) => sum + (p.quantidade * p.valorUnitario), 0);
  const pesoTotalProdutos = produtos.reduce((sum, p) => sum + (p.quantidade * p.pesoUnitario), 0);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Cotação #{cotacao?.id?.slice(0, 8)}
          </div>
          <Badge className="bg-white/20 text-white border-0">
            {cotacao?.tipoFrete}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        {/* Rotas: Origem e Destino */}
        <div className="grid grid-cols-2 divide-x">
          <div className="p-4 bg-green-50">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                <MapPin className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-bold text-green-800 uppercase">Origem (Coleta)</span>
            </div>
            <p className="font-semibold text-gray-900">
              {cotacao?.enderecoColetaCidade || "Não informado"} - {cotacao?.enderecoColetaEstado || ""}
            </p>
            <p className="text-sm text-green-700 font-mono">
              CEP: {cotacao?.enderecoColetaCep || "Não informado"}
            </p>
          </div>
          
          <div className="p-4 bg-red-50">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                <MapPin className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-bold text-red-800 uppercase">Destino (Entrega)</span>
            </div>
            <p className="font-semibold text-gray-900">
              {cotacao?.destinatarioCidade} - {cotacao?.destinatarioEstado}
            </p>
            <p className="text-sm text-red-700 font-mono">
              CEP: {cotacao?.destinatarioCep}
            </p>
          </div>
        </div>

        <Separator />

        {/* Data e Hora da Coleta */}
        <div className="p-4 bg-amber-50 border-b">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-600" />
              <div>
                <p className="text-xs text-amber-700 font-semibold">DATA COLETA</p>
                <p className="font-bold text-gray-900">
                  {new Date(cotacao?.dataHoraColeta).toLocaleDateString('pt-BR', { 
                    weekday: 'long', 
                    day: '2-digit', 
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
            <Separator orientation="vertical" className="h-10" />
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <div>
                <p className="text-xs text-amber-700 font-semibold">HORÁRIO</p>
                <p className="font-bold text-gray-900 text-lg">
                  {new Date(cotacao?.dataHoraColeta).toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Resumo da Carga */}
        <div className="p-4 bg-gray-50 border-b">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <Box className="w-5 h-5 text-blue-600 mx-auto mb-1" />
              <p className="text-xs text-gray-500">Volumes</p>
              <p className="text-xl font-bold text-gray-900">{cotacao?.quantidadeVolumes}</p>
            </div>
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <Weight className="w-5 h-5 text-purple-600 mx-auto mb-1" />
              <p className="text-xs text-gray-500">Peso Total</p>
              <p className="text-xl font-bold text-gray-900">{cotacao?.pesoTotal} kg</p>
            </div>
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <DollarSign className="w-5 h-5 text-green-600 mx-auto mb-1" />
              <p className="text-xs text-gray-500">Valor NF</p>
              <p className="text-xl font-bold text-gray-900">
                R$ {(cotacao?.valorNotaFiscal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {showFullDetails && (
          <>
            {/* Lista de Produtos */}
            {produtos.length > 0 && (
              <div className="p-4 border-b">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="w-5 h-5 text-blue-600" />
                  <span className="font-bold text-gray-900">PRODUTOS ({produtos.length})</span>
                </div>
                
                <div className="bg-white border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="text-left p-2 font-semibold text-gray-700">Produto</th>
                        <th className="text-center p-2 font-semibold text-gray-700">NCM</th>
                        <th className="text-center p-2 font-semibold text-gray-700">Qtd</th>
                        <th className="text-right p-2 font-semibold text-gray-700">Valor Unit.</th>
                        <th className="text-right p-2 font-semibold text-gray-700">Peso Unit.</th>
                        <th className="text-right p-2 font-semibold text-gray-700">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {produtos.map((produto, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="p-2 font-medium text-gray-900">{produto.nome}</td>
                          <td className="p-2 text-center text-gray-600 font-mono text-xs">{produto.ncm}</td>
                          <td className="p-2 text-center font-semibold">{produto.quantidade}</td>
                          <td className="p-2 text-right text-gray-600">
                            R$ {produto.valorUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-2 text-right text-gray-600">{produto.pesoUnitario} kg</td>
                          <td className="p-2 text-right font-semibold text-green-700">
                            R$ {(produto.quantidade * produto.valorUnitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-blue-50">
                      <tr>
                        <td colSpan="2" className="p-2 font-bold text-gray-900">TOTAIS</td>
                        <td className="p-2 text-center font-bold">{produtos.reduce((s, p) => s + p.quantidade, 0)}</td>
                        <td className="p-2"></td>
                        <td className="p-2 text-right font-bold">{pesoTotalProdutos.toFixed(2)} kg</td>
                        <td className="p-2 text-right font-bold text-green-700">
                          R$ {valorTotalProdutos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Produto Principal (fallback quando não há lista) */}
            {produtos.length === 0 && (
              <div className="p-4 border-b">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="w-5 h-5 text-blue-600" />
                  <span className="font-bold text-gray-900">PRODUTO</span>
                </div>
                <div className="p-3 bg-white border rounded-lg">
                  <p className="font-semibold text-gray-900">{cotacao?.produtoNome}</p>
                  <div className="flex gap-4 mt-2 text-sm text-gray-600">
                    <span>NCM: <span className="font-mono">{cotacao?.produtoNCM}</span></span>
                    <span>Peso: <span className="font-semibold">{cotacao?.pesoTotal} kg</span></span>
                  </div>
                </div>
              </div>
            )}

            {/* Serviços Adicionais */}
            {(cotacao?.servicosAdicionais?.precisaPalete || 
              cotacao?.servicosAdicionais?.ehUrgente || 
              cotacao?.servicosAdicionais?.ehFragil || 
              cotacao?.servicosAdicionais?.precisaCargaDedicada) && (
              <div className="p-4 bg-blue-50 border-b">
                <p className="text-sm font-bold text-blue-800 mb-2">SERVIÇOS ADICIONAIS SOLICITADOS:</p>
                <div className="flex flex-wrap gap-2">
                  {cotacao?.servicosAdicionais?.precisaPalete && (
                    <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      Paletização
                    </Badge>
                  )}
                  {cotacao?.servicosAdicionais?.ehUrgente && (
                    <Badge className="bg-orange-100 text-orange-800 flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      Urgente
                    </Badge>
                  )}
                  {cotacao?.servicosAdicionais?.ehFragil && (
                    <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Frágil
                    </Badge>
                  )}
                  {cotacao?.servicosAdicionais?.precisaCargaDedicada && (
                    <Badge className="bg-purple-100 text-purple-800 flex items-center gap-1">
                      <Truck className="w-3 h-3" />
                      Carga Dedicada
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Observações do Cliente */}
            {observacoesCliente && (
              <div className="p-4 bg-yellow-50">
                <p className="text-sm font-bold text-yellow-800 mb-1">OBSERVAÇÕES DO CLIENTE:</p>
                <p className="text-sm text-yellow-900 bg-yellow-100 p-3 rounded-lg">{observacoesCliente}</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}