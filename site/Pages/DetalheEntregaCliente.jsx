import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { createPageUrl } from "@/utils";
import { 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Package,
  MapPin,
  DollarSign,
  Star,
  Download,
  XCircle,
  Truck,
  Weight,
  Box,
  Calendar,
  ExternalLink,
  Copy,
  FileCheck,
  Clock
} from "lucide-react";
import { calcularDiasRestantes, formatarDiasRestantes, getClasseDiasRestantes } from "../components/atraso/CalculadoraDiasEntrega";
import PageHeader from "../components/common/PageHeader";
import LoadingSpinner from "../components/common/LoadingSpinner";
import AvaliacaoModal from "../components/cotacao/AvaliacaoModal";

export default function DetalheEntregaCliente() {
  const urlParams = new URLSearchParams(window.location.search);
  const cotacaoId = urlParams.get('id');

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [user, setUser] = useState(null);
  const [valorFinal, setValorFinal] = useState("");
  const [produtosMais, setProdutosMais] = useState("nao");
  const [observacoes, setObservacoes] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [modalAvaliacaoAberto, setModalAvaliacaoAberto] = useState(false);
  const [transportadoraParaAvaliar, setTransportadoraParaAvaliar] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userData = await base44.auth.me();
    setUser(userData);
  };

  const { data: cotacao, isLoading } = useQuery({
    queryKey: ['cotacao-detalhe-cliente', cotacaoId],
    queryFn: async () => {
      const result = await base44.entities.Cotacao.filter({ id: cotacaoId });
      if (result.length === 0) return null;
      return result[0];
    },
    enabled: !!cotacaoId
  });

  const { data: resposta } = useQuery({
    queryKey: ['resposta-selecionada-cliente', cotacao?.respostaSelecionadaId],
    queryFn: async () => {
      if (!cotacao?.respostaSelecionadaId) return null;
      const result = await base44.entities.RespostaCotacao.filter({ 
        id: cotacao.respostaSelecionadaId 
      });
      return result[0] || null;
    },
    enabled: !!cotacao?.respostaSelecionadaId
  });

  const { data: transportadora } = useQuery({
    queryKey: ['transportadora-perfil', resposta?.transportadoraId],
    queryFn: async () => {
      if (!resposta?.transportadoraId) return null;
      const result = await base44.entities.PerfilTransportadora.filter({ 
        userIdGoogle: resposta.transportadoraId 
      });
      return result[0] || null;
    },
    enabled: !!resposta?.transportadoraId
  });

  // Buscar destinatário
  const { data: destinatario } = useQuery({
    queryKey: ['destinatario-detalhe', cotacao?.destinatarioId],
    queryFn: async () => {
      if (!cotacao?.destinatarioId) return null;
      const result = await base44.entities.Destinatario.filter({ id: cotacao.destinatarioId });
      return result[0] || null;
    },
    enabled: !!cotacao?.destinatarioId
  });

  const handleAbrirAvaliacaoTransportadora = () => {
    if (!transportadora) {
      setError("Erro ao carregar dados da transportadora");
      return;
    }
    setTransportadoraParaAvaliar({
      id: resposta.transportadoraId,
      nome: transportadora.razaoSocial
    });
    setModalAvaliacaoAberto(true);
  };

  const handleContestarEntrega = async () => {
    const motivo = prompt("Por favor, informe o motivo da contestação:");
    if (!motivo || motivo.trim() === "") {
      return;
    }

    if (!confirm("Tem certeza que deseja contestar esta entrega? A equipe será notificada.")) {
      return;
    }

    try {
      await base44.entities.Cotacao.update(cotacao.id, {
        status: "contestada",
        contestacao: {
          contestada: true,
          motivo: motivo.trim(),
          dataHora: new Date().toISOString()
        }
      });

      alert("Entrega contestada com sucesso! Nossa equipe entrará em contato.");
      navigate(createPageUrl("Cotacoes"));
    } catch (err) {
      console.error("Erro ao contestar entrega:", err);
      setError("Erro ao contestar entrega. Tente novamente.");
    }
  };

  const calcularFinanceiro = (valorOriginal, valorFinalCliente, valorFinalTransportadora) => {
    // Determina o maior valor entre os três
    const valorFinalApurado = Math.max(
      valorOriginal,
      valorFinalCliente || 0,
      valorFinalTransportadora || 0
    );

    // Calcula diferenças
    const diferencaCliente = (valorFinalCliente || valorOriginal) - valorOriginal;
    const diferencaTransportadora = (valorFinalTransportadora || valorOriginal) - valorOriginal;

    // Comissão de 15% sobre o valor final apurado
    const valorComissao = valorFinalApurado * 0.15;

    return {
      valorFinalApurado,
      diferencaCliente,
      diferencaTransportadora,
      valorComissao,
      cashbackCliente: diferencaCliente > 0 ? diferencaCliente * 0.15 : 0,
      creditoTransportadora: diferencaTransportadora > 0 ? diferencaTransportadora * 0.15 : 0
    };
  };

  const handleFinalizarEntrega = async () => {
    setError("");
    setSuccess("");

    // Validações
    if (!valorFinal || parseFloat(valorFinal) <= 0) {
      setError("Informe o valor final que você pagou");
      return;
    }

    if (!cotacao.avaliacaoTransportadoraId) {
      setError("Você precisa avaliar a transportadora antes de finalizar");
      return;
    }

    const valorFinalNum = parseFloat(valorFinal);
    const valorOriginal = resposta?.valorTotal || 0;

    const confirmMessage = valorFinalNum !== valorOriginal
      ? `Confirme os valores:\n\nValor Original: R$ ${valorOriginal.toFixed(2)}\nValor que Você Pagou: R$ ${valorFinalNum.toFixed(2)}\n\nDeseja finalizar a entrega?`
      : `Confirme que o valor pago foi R$ ${valorFinalNum.toFixed(2)}\n\nDeseja finalizar a entrega?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      // Calcular valores
      const financeiro = calcularFinanceiro(
        valorOriginal,
        valorFinalNum,
        cotacao.valorFinalTransportadora
      );

      // Atualizar cotação
      await base44.entities.Cotacao.update(cotacao.id, {
        valorFinalCliente: valorFinalNum,
        valorOriginalCotacao: valorOriginal,
        entregaProdutosMaisCliente: produtosMais === "sim",
        observacoesCliente: observacoes.trim() || null,
        valorFinalApurado: financeiro.valorFinalApurado,
        valorComissao: financeiro.valorComissao,
        diferencaValor: financeiro.diferencaCliente,
        dataHoraFinalizacao: new Date().toISOString(),
        status: "finalizada",
        avaliada: true
      });

      // Atualizar saldo de cashback do cliente se houver diferença positiva
      if (financeiro.cashbackCliente > 0 && user?.perfilAtivoId) {
        const perfilCliente = await base44.entities.PerfilCliente.filter({
          userIdGoogle: user.perfilAtivoId
        });

        if (perfilCliente.length > 0) {
          const perfil = perfilCliente[0];
          const novoSaldo = (perfil.saldoCashback || 0) + financeiro.cashbackCliente;
          const historicoAtualizado = [
            ...(perfil.historicoValoresAMais || []),
            {
              cotacaoId: cotacao.id,
              valorOriginal: valorOriginal,
              valorFinal: valorFinalNum,
              diferenca: financeiro.diferencaCliente,
              cashback: financeiro.cashbackCliente,
              data: new Date().toISOString()
            }
          ];

          await base44.entities.PerfilCliente.update(perfil.id, {
            saldoCashback: novoSaldo,
            historicoValoresAMais: historicoAtualizado
          });
        }
      }

      // Registrar valores a menos para o cliente (apenas histórico)
      if (financeiro.diferencaCliente < 0 && user?.perfilAtivoId) {
        const perfilCliente = await base44.entities.PerfilCliente.filter({
          userIdGoogle: user.perfilAtivoId
        });

        if (perfilCliente.length > 0) {
          const perfil = perfilCliente[0];
          const historicoMenos = [
            ...(perfil.historicoValoresAMenos || []),
            {
              cotacaoId: cotacao.id,
              valorOriginal: valorOriginal,
              valorFinal: valorFinalNum,
              diferenca: Math.abs(financeiro.diferencaCliente),
              data: new Date().toISOString()
            }
          ];

          await base44.entities.PerfilCliente.update(perfil.id, {
            historicoValoresAMenos: historicoMenos
          });
        }
      }

      // Atualizar saldo da transportadora
      if (transportadora) {
        if (financeiro.creditoTransportadora > 0) {
          const novoSaldo = (transportadora.saldoDescontoPremium || 0) + financeiro.creditoTransportadora;
          const historicoAtualizado = [
            ...(transportadora.historicoValoresAMais || []),
            {
              cotacaoId: cotacao.id,
              valorOriginal: valorOriginal,
              valorFinal: cotacao.valorFinalTransportadora,
              diferenca: financeiro.diferencaTransportadora,
              credito: financeiro.creditoTransportadora,
              data: new Date().toISOString()
            }
          ];

          await base44.entities.PerfilTransportadora.update(transportadora.id, {
            saldoDescontoPremium: novoSaldo,
            historicoValoresAMais: historicoAtualizado
          });
        } else if (financeiro.diferencaTransportadora < 0) {
          const historicoMenos = [
            ...(transportadora.historicoValoresAMenos || []),
            {
              cotacaoId: cotacao.id,
              valorOriginal: valorOriginal,
              valorFinal: cotacao.valorFinalTransportadora,
              diferenca: Math.abs(financeiro.diferencaTransportadora),
              data: new Date().toISOString()
            }
          ];

          await base44.entities.PerfilTransportadora.update(transportadora.id, {
            historicoValoresAMenos: historicoMenos
          });
        }
      }

      // Criar/Atualizar registro financeiro
      const mesReferencia = new Date().toISOString().slice(0, 7);
      const financeiros = await base44.entities.Financeiro.filter({
        transportadoraId: resposta.transportadoraId,
        mesReferencia
      });

      if (financeiros.length > 0) {
        const financeiro = financeiros[0];
        const cotacoesAtualizadas = [
          ...(financeiro.cotacoes || []),
          {
            cotacaoId: cotacao.id,
            numeroCotacao: cotacao.id.slice(0, 8),
            valorCotacao: financeiro.valorFinalApurado,
            valorComissao: financeiro.valorComissao,
            dataFinalizacao: new Date().toISOString()
          }
        ];

        await base44.entities.Financeiro.update(financeiro.id, {
          cotacoes: cotacoesAtualizadas,
          valorTotalCotacoes: (financeiro.valorTotalCotacoes || 0) + financeiro.valorFinalApurado,
          valorTotalComissao: (financeiro.valorTotalComissao || 0) + financeiro.valorComissao
        });
      } else {
        await base44.entities.Financeiro.create({
          transportadoraId: resposta.transportadoraId,
          transportadoraNome: transportadora?.razaoSocial || resposta.transportadoraNome,
          mesReferencia,
          cotacoes: [{
            cotacaoId: cotacao.id,
            numeroCotacao: cotacao.id.slice(0, 8),
            valorCotacao: financeiro.valorFinalApurado,
            valorComissao: financeiro.valorComissao,
            dataFinalizacao: new Date().toISOString()
          }],
          valorTotalCotacoes: financeiro.valorFinalApurado,
          valorTotalComissao: financeiro.valorComissao
        });
      }

      alert("Entrega finalizada com sucesso!");
      navigate(createPageUrl("Cotacoes"));
    } catch (err) {
      console.error("Erro ao finalizar entrega:", err);
      setError("Erro ao finalizar entrega. Tente novamente.");
    }
  };

  const podeVisualizar = cotacao?.status === "aguardando_confirmacao" || 
                         cotacao?.status === "finalizada";

  if (!user || isLoading) {
    return <LoadingSpinner message="Carregando detalhes..." />;
  }

  if (!cotacao) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
        <PageHeader title="Erro" showBack={true} />
        <div className="p-6 max-w-4xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Cotação não encontrada</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!podeVisualizar) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
        <PageHeader title="Detalhes da Cotação" showBack={true} />
        <div className="p-6 max-w-4xl mx-auto space-y-4">
          
          {/* Alerta de status */}
          <Alert className="bg-blue-50 border-blue-200">
            <Truck className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Em Trânsito!</strong> Sua entrega está a caminho. Acompanhe abaixo os detalhes da cotação.
            </AlertDescription>
          </Alert>

          {/* Transportadora */}
          {resposta && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <Truck className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Transportadora</p>
                    <p className="font-bold text-gray-900">{resposta.transportadoraNome}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Valor do Frete</p>
                    <p className="font-bold text-green-600 text-lg">
                      R$ {resposta.valorTotal?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Prazo de Entrega */}
          {(cotacao?.dataPrevistaEntrega || cotacao?.dataNovaPrevisaoEntrega) && (
            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="p-4">
                <h3 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Prazo de Entrega
                </h3>
                {(() => {
                  const dataParaCalculo = cotacao.dataNovaPrevisaoEntrega || cotacao.dataPrevistaEntrega;
                  const diasRestantes = calcularDiasRestantes(dataParaCalculo);
                  const textoRestantes = formatarDiasRestantes(diasRestantes);
                  const classeRestantes = getClasseDiasRestantes(diasRestantes);
                  const atrasado = diasRestantes !== null && diasRestantes < 0;

                  return (
                    <div>
                      <p className={`text-2xl font-bold ${classeRestantes}`}>
                        {textoRestantes}
                      </p>
                      <p className="text-sm text-gray-600 mt-2">
                        Previsão: {new Date(dataParaCalculo).toLocaleDateString('pt-BR')}
                      </p>
                      {cotacao.dataNovaPrevisaoEntrega && cotacao.dataPrevistaEntrega && (
                        <p className="text-xs text-gray-500 mt-1">
                          Data original: <span className="line-through">{new Date(cotacao.dataPrevistaEntrega).toLocaleDateString('pt-BR')}</span>
                        </p>
                      )}
                      {cotacao.motivoAtraso && (
                        <div className="mt-3 p-2 bg-orange-100 rounded">
                          <p className="text-xs font-semibold text-orange-800">Motivo do Atraso:</p>
                          <p className="text-xs text-orange-700 mt-1">{cotacao.motivoAtraso}</p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          {/* Rastreamento */}
          {(cotacao?.urlRastreamento || cotacao?.codigoRastreio) && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Rastreamento
                </h3>
                <div className="flex flex-wrap items-center gap-4">
                  {cotacao.urlRastreamento && (
                    <div className="flex items-center gap-2">
                      <a 
                        href={cotacao.urlRastreamento.startsWith('http') ? cotacao.urlRastreamento : `https://${cotacao.urlRastreamento}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline font-medium flex items-center gap-1"
                      >
                        Acessar Rastreamento
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <button 
                        onClick={() => navigator.clipboard.writeText(cotacao.urlRastreamento)}
                        className="p-1.5 hover:bg-blue-100 rounded"
                        title="Copiar link"
                      >
                        <Copy className="w-4 h-4 text-blue-600" />
                      </button>
                    </div>
                  )}
                  {cotacao.codigoRastreio && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Código:</span>
                      <span className="font-mono font-bold text-blue-700 bg-white px-2 py-1 rounded">{cotacao.codigoRastreio}</span>
                      <button 
                        onClick={() => navigator.clipboard.writeText(cotacao.codigoRastreio)}
                        className="p-1.5 hover:bg-blue-100 rounded"
                        title="Copiar código"
                      >
                        <Copy className="w-4 h-4 text-blue-600" />
                      </button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* CT-e e Documentos */}
          {cotacao?.cteRegistrado && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-4">
                <h3 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
                  <FileCheck className="w-4 h-4" />
                  Conhecimento de Transporte (CT-e)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Código CT-e</p>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-800">{cotacao.codigoCTe}</span>
                      <button 
                        onClick={() => navigator.clipboard.writeText(cotacao.codigoCTe)}
                        className="p-1 hover:bg-amber-100 rounded"
                        title="Copiar código"
                      >
                        <Copy className="w-3 h-3 text-amber-600" />
                      </button>
                    </div>
                  </div>
                  {cotacao.valorFinalTransportadora && (
                    <div>
                      <p className="text-xs text-gray-500">Valor Informado</p>
                      <p className="font-bold text-amber-800">
                        R$ {cotacao.valorFinalTransportadora.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        {cotacao.valorOriginalCotacao && cotacao.valorFinalTransportadora > cotacao.valorOriginalCotacao && (
                          <span className="text-sm text-gray-500 line-through ml-2">
                            R$ {cotacao.valorOriginalCotacao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Documentos para download */}
                {(cotacao.documentosEntrega?.length > 0 || cotacao.documentoCte) && (
                  <div className="mt-4 pt-4 border-t border-amber-200">
                    <p className="text-sm font-medium text-amber-800 mb-2">Documentos Anexados:</p>
                    <div className="flex flex-wrap gap-2">
                      {cotacao.documentoCte && (
                        <a href={cotacao.documentoCte} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline" className="bg-white">
                            <Download className="w-4 h-4 mr-1" />
                            XML/PDF Principal
                          </Button>
                        </a>
                      )}
                      {cotacao.documentosEntrega?.map((doc, idx) => (
                        <a key={idx} href={doc} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline" className="bg-white">
                            <Download className="w-4 h-4 mr-1" />
                            Documento {idx + 1}
                          </Button>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Detalhes da Cotação */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Detalhes da Cotação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Grid de informações */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <Package className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                  <p className="text-xs text-gray-500">Produto</p>
                  <p className="font-semibold text-sm truncate" title={cotacao?.produtoNome}>{cotacao?.produtoNome}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <Weight className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                  <p className="text-xs text-gray-500">Peso Total</p>
                  <p className="font-semibold text-sm">{cotacao?.pesoTotal} kg</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <Box className="w-5 h-5 text-orange-600 mx-auto mb-1" />
                  <p className="text-xs text-gray-500">Volumes</p>
                  <p className="font-semibold text-sm">{cotacao?.quantidadeVolumes}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <DollarSign className="w-5 h-5 text-green-600 mx-auto mb-1" />
                  <p className="text-xs text-gray-500">Valor NF</p>
                  <p className="font-semibold text-sm">R$ {cotacao?.valorNotaFiscal?.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</p>
                </div>
              </div>

              {/* Origem e Destino */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                      <MapPin className="w-3 h-3 text-white" />
                    </div>
                    <span className="font-semibold text-green-800">Origem (Coleta)</span>
                  </div>
                  <p className="font-medium">{cotacao?.enderecoColetaCidade} - {cotacao?.enderecoColetaEstado}</p>
                  <p className="text-sm text-gray-600 font-mono">CEP: {cotacao?.enderecoColetaCep}</p>
                </div>

                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
                      <MapPin className="w-3 h-3 text-white" />
                    </div>
                    <span className="font-semibold text-red-800">Destino</span>
                  </div>
                  <p className="font-medium">{cotacao?.destinatarioCidade} - {cotacao?.destinatarioEstado}</p>
                  <p className="text-sm text-gray-600 font-mono">CEP: {cotacao?.destinatarioCep}</p>
                  {destinatario && (
                    <p className="text-sm text-gray-700 mt-1">
                      <strong>Destinatário:</strong> {destinatario.nomeCompleto}
                    </p>
                  )}
                </div>
              </div>

              {/* Data de Coleta */}
              <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <Calendar className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="text-xs text-gray-500">Data da Coleta</p>
                  <p className="font-semibold">
                    {cotacao?.dataHoraColetaConfirmada 
                      ? new Date(cotacao.dataHoraColetaConfirmada).toLocaleDateString('pt-BR') + ' às ' + new Date(cotacao.dataHoraColetaConfirmada).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                      : cotacao?.dataHoraColeta 
                        ? new Date(cotacao.dataHoraColeta).toLocaleDateString('pt-BR') + ' às ' + new Date(cotacao.dataHoraColeta).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                        : 'N/I'
                    }
                  </p>
                </div>
              </div>

              {/* Serviços Adicionais */}
              {cotacao?.servicosAdicionais && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-semibold text-gray-600 mb-2">Serviços Adicionais:</p>
                  <div className="flex flex-wrap gap-2">
                    {cotacao.servicosAdicionais.precisaPalete && <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">Palete</span>}
                    {cotacao.servicosAdicionais.ehUrgente && <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">Urgente</span>}
                    {cotacao.servicosAdicionais.ehFragil && <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">Frágil</span>}
                    {cotacao.servicosAdicionais.precisaCargaDedicada && <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">Carga Dedicada</span>}
                    {cotacao.servicosAdicionais.precisaMontagem && <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Montagem</span>}
                    {cotacao.servicosAdicionais.precisaInstalacao && <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs">Instalação</span>}
                    {cotacao.servicosAdicionais.precisaEscoltaArmada && <span className="px-2 py-1 bg-gray-800 text-white rounded text-xs">Escolta Armada</span>}
                    {!cotacao.servicosAdicionais.precisaPalete && !cotacao.servicosAdicionais.ehUrgente && !cotacao.servicosAdicionais.ehFragil && !cotacao.servicosAdicionais.precisaCargaDedicada && !cotacao.servicosAdicionais.precisaMontagem && !cotacao.servicosAdicionais.precisaInstalacao && !cotacao.servicosAdicionais.precisaEscoltaArmada && (
                      <span className="text-gray-500 text-sm">Nenhum serviço adicional</span>
                    )}
                  </div>
                </div>
              )}

              {/* Tipo de Frete */}
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">Tipo de Frete:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${cotacao?.tipoFrete === 'CIF' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                  {cotacao?.tipoFrete}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Aguardando Comprovantes */}
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Aguardando finalização:</strong> A transportadora precisa enviar os comprovantes de entrega para você poder confirmar o recebimento.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const jaFinalizada = cotacao.status === "finalizada";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <PageHeader
        title="Confirmar Entrega"
        description="Analise os documentos e finalize a entrega"
        showBack={true}
      />

      <div className="p-6 max-w-4xl mx-auto space-y-6">
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

        {/* Informações da Cotação */}
        <Card>
          <CardHeader>
            <CardTitle>Informações da Cotação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="w-4 h-4 text-gray-400" />
                  <p className="text-xs font-semibold text-gray-600">PRODUTO</p>
                </div>
                <p className="font-medium text-gray-900">{cotacao.produtoNome}</p>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <p className="text-xs font-semibold text-gray-600">DESTINO</p>
                </div>
                <p className="font-medium text-gray-900">
                  {cotacao.destinatarioCidade} - {cotacao.destinatarioEstado}
                </p>
              </div>

              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <p className="text-xs font-semibold text-green-700">VALOR COTAÇÃO</p>
                </div>
                <p className="text-xl font-bold text-green-700">
                  R$ {resposta?.valorTotal?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documentos Enviados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Documentos de Entrega
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cotacao.documentosEntrega && cotacao.documentosEntrega.length > 0 ? (
              cotacao.documentosEntrega.map((doc, index) => (
                <a
                  key={index}
                  href={doc}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Documento {index + 1}</span>
                  </div>
                  <Download className="w-4 h-4 text-blue-600" />
                </a>
              ))
            ) : (
              <p className="text-gray-500 text-sm">Nenhum documento anexado</p>
            )}

            <div className="pt-3 border-t space-y-2">
              <p className="text-sm">
                <strong>Valor informado pela transportadora:</strong>{" "}
                R$ {cotacao.valorFinalTransportadora?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              {cotacao.observacoesTransportadora && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Observações da transportadora:</p>
                  <p className="text-sm text-gray-700">{cotacao.observacoesTransportadora}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {!jaFinalizada && (
          <>
            {/* Avaliação da Transportadora */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  Avaliação da Transportadora
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cotacao.avaliacaoTransportadoraId ? (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <strong>Transportadora avaliada com sucesso!</strong>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-3">
                    <Alert className="bg-yellow-50 border-yellow-200">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800">
                        <strong>Ação obrigatória:</strong> Você precisa avaliar a transportadora antes de finalizar a entrega.
                      </AlertDescription>
                    </Alert>
                    <Button
                      onClick={handleAbrirAvaliacaoTransportadora}
                      className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700"
                    >
                      <Star className="w-4 h-4 mr-2" />
                      Avaliar Transportadora Agora
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Confirmação de Valor */}
            {cotacao.avaliacaoTransportadoraId && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Confirmar Valor Pago
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert className="bg-yellow-50 border-yellow-200">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800 text-sm">
                        <strong>Importante:</strong> Se você pagou <strong>MAIS</strong> que o valor da cotação, 
                        15% da diferença será creditado como cashback para próximas cotações (cumulativo).
                        Se pagou menos, apenas será registrado (não cumulativo).
                      </AlertDescription>
                    </Alert>

                    <div>
                      <Label htmlFor="valorFinalCliente">Quanto você pagou no total? *</Label>
                      <Input
                        id="valorFinalCliente"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Ex: 280.00"
                        value={valorFinal}
                        onChange={(e) => setValorFinal(e.target.value)}
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Valor original: R$ {resposta?.valorTotal?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        <span>Transportadora informou: R$ {cotacao.valorFinalTransportadora?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>

                    <div>
                      <Label className="mb-3 block">Você recebeu produtos a mais?</Label>
                      <RadioGroup value={produtosMais} onValueChange={setProdutosMais}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="sim" id="sim-cliente" />
                          <Label htmlFor="sim-cliente" className="cursor-pointer">Sim, recebi produtos a mais</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="nao" id="nao-cliente" />
                          <Label htmlFor="nao-cliente" className="cursor-pointer">Não, entrega conforme solicitado</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div>
                      <Label htmlFor="observacoesCliente">Observações (opcional)</Label>
                      <Textarea
                        id="observacoesCliente"
                        placeholder="Adicione observações sobre a entrega..."
                        value={observacoes}
                        onChange={(e) => setObservacoes(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Botões de Ação */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    onClick={handleContestarEntrega}
                    variant="outline"
                    className="h-14 text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <XCircle className="w-5 h-5 mr-2" />
                    Contestar Entrega
                  </Button>

                  <Button
                    onClick={handleFinalizarEntrega}
                    disabled={!valorFinal || !cotacao.avaliacaoTransportadoraId}
                    className="h-14 text-lg bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                  >
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Finalizar Entrega
                  </Button>
                </div>
              </>
            )}
          </>
        )}

        {/* Entrega Finalizada */}
        {jaFinalizada && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
                <div>
                  <h3 className="font-bold text-green-900 text-lg">Entrega Finalizada!</h3>
                  <p className="text-sm text-green-700">
                    Obrigado por utilizar nossos serviços
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {modalAvaliacaoAberto && transportadoraParaAvaliar && (
        <AvaliacaoModal
          isOpen={modalAvaliacaoAberto}
          onClose={() => {
            setModalAvaliacaoAberto(false);
            setTransportadoraParaAvaliar(null);
          }}
          cotacao={cotacao}
          transportadora={transportadoraParaAvaliar}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['cotacao-detalhe-cliente'] });
            setSuccess("Transportadora avaliada com sucesso!");
          }}
        />
      )}
    </div>
  );
}
