import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  AlertCircle, Package, MapPin, Clock, Send, CheckCircle2, Zap, 
  AlertTriangle, Truck, Calendar, Box, Weight, DollarSign, FileText 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PageHeader from "../components/common/PageHeader";
import LoadingSpinner from "../components/common/LoadingSpinner";

export default function ResponderCotacao() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const cotacaoId = urlParams.get('id');

  const [user, setUser] = useState(null);
  const [cotacao, setCotacao] = useState(null);
  const [opcoesEnvio, setOpcoesEnvio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [servicosAdicionais, setServicosAdicionais] = useState({
    valorPalete: "",
    valorUrgente: "",
    valorFragil: "",
    valorCargaDedicada: ""
  });

  const [propostas, setPropostas] = useState({
    Terrestre: { valorBase: "", tempoEntregaDias: "", ativa: false },
    Aéreo: { valorBase: "", tempoEntregaDias: "", ativa: false },
    Marítimo: { valorBase: "", tempoEntregaDias: "", ativa: false },
    Dedicado: { valorBase: "", tempoEntregaDias: "", ativa: false }
  });

  const [observacoes, setObservacoes] = useState("");
  const [seguroSelecionado, setSeguroSelecionado] = useState(null);
  const [segurosCarga, setSegurosCarga] = useState([]);
  const [transportadora, setTransportadora] = useState(null);

  // Extrair produtos da observação
  const extractProdutos = (observacoes) => {
    if (!observacoes) return [];
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

  const extractObservacoesCliente = (obs) => {
    if (!obs) return null;
    const parts = obs.split('|');
    const lastPart = parts[parts.length - 1];
    if (lastPart && !lastPart.includes('NCM:') && !lastPart.includes('QTD:') && !lastPart.includes('PRODUTOS:')) {
      return lastPart.trim();
    }
    return null;
  };

  const loadData = useCallback(async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      // Verificar bloqueio da transportadora
      const perfisTransp = await base44.entities.PerfilTransportadora.filter({
        userIdGoogle: userData.perfilAtivoId
      });
      
      let perfilTransp = perfisTransp[0];
      if (!perfilTransp) {
        const perfisPorId = await base44.entities.PerfilTransportadora.filter({
          id: userData.perfilAtivoId
        });
        perfilTransp = perfisPorId[0];
      }

      if (perfilTransp?.bloqueadaCotacoes) {
        setError(`BLOQUEADO: ${perfilTransp.motivoBloqueio || "Finalize suas entregas pendentes para desbloquear."}`);
        setLoading(false);
        return;
      }

      const [cotacaoData, opcoesData, segurosData] = await Promise.all([
        base44.entities.Cotacao.filter({ id: cotacaoId }),
        base44.entities.OpcaoEnvio.filter({ transportadoraId: userData.perfilAtivoId }),
        base44.entities.SeguroCarga.filter({ ativo: true })
      ]);

      setTransportadora(perfilTransp);
      setSegurosCarga(segurosData);

      if (cotacaoData.length === 0) {
        setError("Cotação não encontrada");
        setLoading(false);
        return;
      }

      const cotacaoAtual = cotacaoData[0];
      const agora = new Date();
      const dataFim = new Date(cotacaoAtual.dataHoraFim);

      if (agora >= dataFim) {
        setError("Esta cotação já foi encerrada");
      }

      if (cotacaoAtual.status !== "aberta" && cotacaoAtual.status !== "em_andamento") {
        setError("Esta cotação não está mais disponível para propostas");
      }

      setCotacao(cotacaoAtual);
      setOpcoesEnvio(opcoesData);

      const novasPropostas = { ...propostas };
      opcoesData.forEach(opcao => {
        if (novasPropostas[opcao.nome]) {
          novasPropostas[opcao.nome].ativa = true;
        }
      });
      setPropostas(novasPropostas);
    } catch (error) {
      console.error("Erro ao carregar cotação:", error);
      setError("Erro ao carregar dados");
    }
    setLoading(false);
  }, [cotacaoId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const calcularValorTotal = (valorBase) => {
    let total = parseFloat(valorBase) || 0;
    if (cotacao?.servicosAdicionais?.precisaPalete && servicosAdicionais.valorPalete) {
      total += parseFloat(servicosAdicionais.valorPalete);
    }
    if (cotacao?.servicosAdicionais?.ehUrgente && servicosAdicionais.valorUrgente) {
      total += parseFloat(servicosAdicionais.valorUrgente);
    }
    if (cotacao?.servicosAdicionais?.ehFragil && servicosAdicionais.valorFragil) {
      total += parseFloat(servicosAdicionais.valorFragil);
    }
    if (cotacao?.servicosAdicionais?.precisaCargaDedicada && servicosAdicionais.valorCargaDedicada) {
      total += parseFloat(servicosAdicionais.valorCargaDedicada);
    }
    if (seguroSelecionado) {
      total += parseFloat(seguroSelecionado.valorSeguro || 0);
    }
    return total;
  };

  const handlePropostaChange = (tipo, campo, valor) => {
    setPropostas(prev => ({
      ...prev,
      [tipo]: { ...prev[tipo], [campo]: valor }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (cotacao?.servicosAdicionais?.precisaPalete && !servicosAdicionais.valorPalete) {
      setError("Informe o valor para Paletização");
      return;
    }
    if (cotacao?.servicosAdicionais?.ehUrgente && !servicosAdicionais.valorUrgente) {
      setError("Informe o valor para Entrega Urgente");
      return;
    }
    if (cotacao?.servicosAdicionais?.ehFragil && !servicosAdicionais.valorFragil) {
      setError("Informe o valor para Carga Frágil");
      return;
    }
    if (cotacao?.servicosAdicionais?.precisaCargaDedicada && !servicosAdicionais.valorCargaDedicada) {
      setError("Informe o valor para Carga Dedicada");
      return;
    }

    // VALIDAÇÃO OBRIGATÓRIA DE SEGURO PARA AUTÔNOMOS
    if (transportadora?.tipoTransportador === "autonomo" && !seguroSelecionado) {
      setError("AUTÔNOMOS SÃO OBRIGADOS A INCLUIR SEGURO DE CARGA! Você receberá o valor antecipado e precisa garantir a segurança da entrega.");
      return;
    }

    const propostasPreenchidas = Object.entries(propostas).filter(([tipo, dados]) => 
      dados.ativa && dados.valorBase && dados.tempoEntregaDias
    );

    if (propostasPreenchidas.length === 0) {
      setError("Preencha pelo menos uma proposta de envio");
      return;
    }

    setSubmitting(true);

    try {
      const respostasPromises = propostasPreenchidas.map(([tipo, dados]) => {
        const opcaoEnvio = opcoesEnvio.find(o => o.nome === tipo);
        
        return base44.entities.RespostaCotacao.create({
          cotacaoId: cotacao.id,
          transportadoraId: user.perfilAtivoId,
          transportadoraNome: user.razaoSocial,
          transportadoraLogo: user.logoUrl || "",
          isPremium: user.isPremium || false,
          opcaoEnvioId: opcaoEnvio?.id || "",
          opcaoEnvioNome: tipo,
          valorBase: parseFloat(dados.valorBase),
          valorPalete: cotacao?.servicosAdicionais?.precisaPalete ? parseFloat(servicosAdicionais.valorPalete || 0) : 0,
          valorUrgente: cotacao?.servicosAdicionais?.ehUrgente ? parseFloat(servicosAdicionais.valorUrgente || 0) : 0,
          valorFragil: cotacao?.servicosAdicionais?.ehFragil ? parseFloat(servicosAdicionais.valorFragil || 0) : 0,
          valorCargaDedicada: cotacao?.servicosAdicionais?.precisaCargaDedicada ? parseFloat(servicosAdicionais.valorCargaDedicada || 0) : 0,
          seguroCargaId: seguroSelecionado?.id || null,
          seguradora: seguroSelecionado?.seguradora || null,
          tipoCobertura: seguroSelecionado?.tipoCobertura || null,
          valorSeguro: seguroSelecionado ? parseFloat(seguroSelecionado.valorSeguro) : 0,
          valorTotal: calcularValorTotal(dados.valorBase),
          tempoEntregaDias: parseInt(dados.tempoEntregaDias),
          observacoes: observacoes.toUpperCase(),
          dataHoraResposta: new Date().toISOString()
        });
      });

      await Promise.all(respostasPromises);
      await base44.entities.Cotacao.update(cotacao.id, { status: "em_andamento" });

      setSuccess(`${propostasPreenchidas.length} proposta(s) enviada(s) com sucesso!`);
      setTimeout(() => {
        navigate(createPageUrl("CotacoesDisponiveis"));
      }, 2000);
    } catch (error) {
      setError("Erro ao enviar propostas. Tente novamente.");
      console.error(error);
    }
    setSubmitting(false);
  };

  if (loading) {
    return <LoadingSpinner message="Carregando cotação..." />;
  }

  if (error && !cotacao) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
        <PageHeader title="Erro" showBack={true} />
        <div className="p-6 max-w-4xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const tempoRestante = cotacao ? new Date(cotacao.dataHoraFim) - new Date() : 0;
  const minutosRestantes = Math.floor(tempoRestante / (1000 * 60));
  const produtos = extractProdutos(cotacao?.observacoes);
  const observacoesCliente = extractObservacoesCliente(cotacao?.observacoes);
  const valorTotalProdutos = produtos.reduce((sum, p) => sum + (p.quantidade * p.valorUnitario), 0);
  const pesoTotalProdutos = produtos.reduce((sum, p) => sum + (p.quantidade * p.pesoUnitario), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <PageHeader
        title="Responder Cotação"
        description="Envie suas propostas para todas as suas opções de envio"
        showBack={true}
      />

      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {minutosRestantes > 0 && (
          <Alert className="bg-orange-50 border-orange-200">
            <Clock className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              Tempo restante: <strong>{minutosRestantes} minutos</strong>
            </AlertDescription>
          </Alert>
        )}

        {/* Card Principal de Informações */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4">
            <CardTitle className="flex items-center justify-between text-lg">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Cotação #{cotacao?.id?.slice(0, 8)}
              </div>
              <Badge className="bg-white/20 text-white border-0">{cotacao?.tipoFrete}</Badge>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            {/* Alerta de Privacidade */}
            <Alert className="m-4 bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-sm">
                <strong>Por segurança:</strong> Você visualiza CEP, cidade, estado, valor NF e horário de coleta. Endereço e nome do embarcador são revelados apenas após aceitar sua proposta.
              </AlertDescription>
            </Alert>

            {/* Rotas */}
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
                <p className="text-sm text-red-700 font-mono">CEP: {cotacao?.destinatarioCep}</p>
              </div>
            </div>

            <Separator />

            {/* Data e Hora */}
            <div className="p-4 bg-amber-50 border-b">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-600" />
                  <div>
                    <p className="text-xs text-amber-700 font-semibold">DATA COLETA</p>
                    <p className="font-bold text-gray-900">
                      {new Date(cotacao?.dataHoraColeta).toLocaleDateString('pt-BR', { 
                        weekday: 'short', day: '2-digit', month: 'long', year: 'numeric'
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
                      {new Date(cotacao?.dataHoraColeta).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
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

            {/* Produto Principal (fallback) */}
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
                  {cotacao.servicosAdicionais.precisaPalete && (
                    <Badge className="bg-blue-100 text-blue-800"><Package className="w-3 h-3 mr-1" />Paletização</Badge>
                  )}
                  {cotacao.servicosAdicionais.ehUrgente && (
                    <Badge className="bg-orange-100 text-orange-800"><Zap className="w-3 h-3 mr-1" />Urgente</Badge>
                  )}
                  {cotacao.servicosAdicionais.ehFragil && (
                    <Badge className="bg-yellow-100 text-yellow-800"><AlertTriangle className="w-3 h-3 mr-1" />Frágil</Badge>
                  )}
                  {cotacao.servicosAdicionais.precisaCargaDedicada && (
                    <Badge className="bg-purple-100 text-purple-800"><Truck className="w-3 h-3 mr-1" />Carga Dedicada</Badge>
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
          </CardContent>
        </Card>

        {/* Formulário */}
        <form onSubmit={handleSubmit}>
          {/* Seguro de Carga */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                Seguro de Carga {transportadora?.tipoTransportador === "autonomo" && "(OBRIGATÓRIO)"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transportadora?.tipoTransportador === "autonomo" ? (
                <Alert className="mb-4 bg-red-50 border-red-300">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <strong>ATENÇÃO TRANSPORTADOR AUTÔNOMO:</strong> Você receberá o valor do frete ANTECIPADAMENTE, 
                    por isso é OBRIGATÓRIO contratar seguro para garantir a segurança da carga e do cliente.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="mb-4 bg-blue-50 border-blue-200">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    {transportadora?.tipoTransportador === "pj" && (
                      <>Se for emitir CT-e pela plataforma, <strong>recomendamos incluir seguro</strong>. 
                      O valor do seguro será somado ao valor da cotação.</>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                <div
                  onClick={() => setSeguroSelecionado(null)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    !seguroSelecionado ? "border-blue-600 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">Sem Seguro</p>
                      <p className="text-sm text-gray-600">
                        {transportadora?.tipoTransportador === "autonomo" 
                          ? "Não disponível para autônomos" 
                          : "Carga sem cobertura de seguro"}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-gray-900">R$ 0,00</p>
                  </div>
                </div>

                {segurosCarga.map((seguro) => (
                  <div
                    key={seguro.id}
                    onClick={() => setSeguroSelecionado(seguro)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      seguroSelecionado?.id === seguro.id ? "border-green-600 bg-green-50" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-gray-900">{seguro.seguradora}</p>
                          <Badge className="bg-green-100 text-green-800">{seguro.tipoCobertura}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{seguro.descricao}</p>
                        <p className="text-xs text-gray-500">
                          Cobertura até: <strong>R$ {seguro.valorCobertura?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Valor do Seguro:</p>
                        <p className="text-xl font-bold text-green-700">
                          R$ {seguro.valorSeguro?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {(cotacao?.servicosAdicionais?.precisaPalete || cotacao?.servicosAdicionais?.ehUrgente || 
            cotacao?.servicosAdicionais?.ehFragil || cotacao?.servicosAdicionais?.precisaCargaDedicada) && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Valores dos Serviços Adicionais</CardTitle>
              </CardHeader>
              <CardContent>
                <Alert className="mb-4 bg-blue-50 border-blue-200">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    Estes valores serão somados a TODAS as suas propostas de envio.
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cotacao.servicosAdicionais.precisaPalete && (
                    <div>
                      <Label className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-blue-600" />Valor Paletização (R$) *
                      </Label>
                      <Input type="number" step="0.01" min="0" value={servicosAdicionais.valorPalete}
                        onChange={(e) => setServicosAdicionais({ ...servicosAdicionais, valorPalete: e.target.value })}
                        placeholder="0.00" required />
                    </div>
                  )}
                  {cotacao.servicosAdicionais.ehUrgente && (
                    <div>
                      <Label className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-orange-600" />Valor Urgente (R$) *
                      </Label>
                      <Input type="number" step="0.01" min="0" value={servicosAdicionais.valorUrgente}
                        onChange={(e) => setServicosAdicionais({ ...servicosAdicionais, valorUrgente: e.target.value })}
                        placeholder="0.00" required />
                    </div>
                  )}
                  {cotacao.servicosAdicionais.ehFragil && (
                    <div>
                      <Label className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />Valor Frágil (R$) *
                      </Label>
                      <Input type="number" step="0.01" min="0" value={servicosAdicionais.valorFragil}
                        onChange={(e) => setServicosAdicionais({ ...servicosAdicionais, valorFragil: e.target.value })}
                        placeholder="0.00" required />
                    </div>
                  )}
                  {cotacao.servicosAdicionais.precisaCargaDedicada && (
                    <div>
                      <Label className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-purple-600" />Valor Dedicada (R$) *
                      </Label>
                      <Input type="number" step="0.01" min="0" value={servicosAdicionais.valorCargaDedicada}
                        onChange={(e) => setServicosAdicionais({ ...servicosAdicionais, valorCargaDedicada: e.target.value })}
                        placeholder="0.00" required />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Suas Propostas de Envio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(propostas).map(([tipo, dados]) => {
                  const tipoConfig = {
                    Terrestre: { icon: "🚛", color: "from-green-500 to-green-600" },
                    Aéreo: { icon: "✈️", color: "from-blue-500 to-blue-600" },
                    Marítimo: { icon: "🚢", color: "from-cyan-500 to-cyan-600" },
                    Dedicado: { icon: "🎯", color: "from-purple-500 to-purple-600" }
                  };

                  if (!dados.ativa) return null;
                  const valorTotal = calcularValorTotal(dados.valorBase);

                  return (
                    <div key={tipo} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-10 h-10 bg-gradient-to-br ${tipoConfig[tipo].color} rounded-lg flex items-center justify-center text-xl`}>
                          {tipoConfig[tipo].icon}
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">{tipo}</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Valor Base (R$)</Label>
                          <Input type="number" step="0.01" min="0" value={dados.valorBase}
                            onChange={(e) => handlePropostaChange(tipo, 'valorBase', e.target.value)} placeholder="0.00" />
                        </div>
                        <div>
                          <Label>Prazo (dias)</Label>
                          <Input type="number" min="1" value={dados.tempoEntregaDias}
                            onChange={(e) => handlePropostaChange(tipo, 'tempoEntregaDias', e.target.value)} placeholder="0" />
                        </div>
                      </div>

                      {dados.valorBase && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-sm text-blue-700 mb-1">Valor Total:</p>
                          <p className="text-2xl font-bold text-blue-900">
                            R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Observações (EM MAIÚSCULAS)</Label>
                <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value.toUpperCase())}
                  placeholder="INFORMAÇÕES ADICIONAIS" rows={3} />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => navigate(createPageUrl("CotacoesDisponiveis"))}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting || minutosRestantes <= 0 || success}
                  className="bg-gradient-to-r from-blue-600 to-blue-700">
                  <Send className="w-4 h-4 mr-2" />
                  {submitting ? "Enviando..." : "Enviar Propostas"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
