import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Package, Zap, AlertTriangle, Truck, XCircle, CheckCircle2 } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PageHeader from "../components/common/PageHeader";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ProdutoSelectorMulti from "../components/cotacao/ProdutoSelectorMulti";
import ProdutosDetalhesEditor from "../components/cotacao/ProdutosDetalhesEditor";
import DestinatarioSelector from "../components/cotacao/DestinatarioSelector";
import ResumoStep from "../components/cotacao/ResumoStep";
import EnderecoColetaSelector from "../components/cotacao/EnderecoColetaSelector";

export default function NovaCotacao() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);
  
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedDestinatario, setSelectedDestinatario] = useState(null);
  const [selectedEnderecoColeta, setSelectedEnderecoColeta] = useState(null);
  
  const [formData, setFormData] = useState({
    quantidadeVolumes: "1",
    volumes: [{ largura: "", altura: "", comprimento: "", peso: "" }],
    tipoFrete: "",
    tempoCotacaoMinutos: "",
    dataHoraColeta: "",
    observacoes: "",
    aceitaMotoCarAte100km: false,
    aceitaTransportadorSemCNPJ: false,
    servicosAdicionais: {
      precisaPalete: false,
      ehUrgente: false,
      ehFragil: false,
      precisaCargaDedicada: false
    }
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      
      if (userData.status !== "approved") {
        setError("Seu cadastro precisa ser aprovado antes de criar cotações");
      }
    } catch (error) {
      console.error("Erro ao carregar usuário:", error);
    }
    setLoading(false);
  };

  const { data: cotacoesSemAvaliacao = [] } = useQuery({
    queryKey: ['cotacoes-sem-avaliacao', user?.perfilAtivoId],
    queryFn: async () => {
      if (!user) return [];
      const todasCotacoes = await base44.entities.Cotacao.filter({
        clienteId: user.perfilAtivoId,
        status: "finalizada"
      });
      return todasCotacoes.filter(c => !c.avaliada);
    },
    enabled: !!user
  });

  // Verificar cotações vencidas (mais de 24h sem avaliar)
  const cotacoesVencidas = cotacoesSemAvaliacao.filter(c => {
    if (!c.dataHoraFinalizacao) return false;
    const finalizacao = new Date(c.dataHoraFinalizacao);
    const agora = new Date();
    const horasPassadas = (agora - finalizacao) / (1000 * 60 * 60);
    return horasPassadas > 24;
  });

  const { data: perfilCliente } = useQuery({
    queryKey: ['perfil-cliente-nova-cotacao', user?.perfilAtivoId],
    queryFn: async () => {
      if (!user) return null;
      
      // Buscar pelo ID direto
      try {
        const perfilDireto = await base44.entities.PerfilCliente.filter({ id: user.perfilAtivoId });
        if (perfilDireto.length > 0) return perfilDireto[0];
      } catch (e) {}
      
      // Fallback
      const perfis = await base44.entities.PerfilCliente.filter({
        userIdGoogle: user.perfilAtivoId
      });
      if (perfis.length > 0) return perfis[0];
      
      const perfisPorUserId = await base44.entities.PerfilCliente.filter({
        userIdGoogle: user.id
      });
      return perfisPorUserId[0] || null;
    },
    enabled: !!user
  });

  // Verificar se tem endereços de coleta cadastrados
  const { data: enderecosColeta = [] } = useQuery({
    queryKey: ['enderecos-coleta-check', user?.perfilAtivoId],
    queryFn: () => base44.entities.EnderecoColeta.filter({ clienteId: user.perfilAtivoId, ativo: true }),
    enabled: !!user
  });

  const handleQuantidadeVolumesChange = (value) => {
    const qtd = parseInt(value) || 1;
    if (qtd < 1 || qtd > 999) return;
    
    // Pegar medidas do primeiro produto selecionado
    const primeiroProduto = selectedProducts[0]?.produto;
    const larguraPadrao = primeiroProduto?.larguraM || "";
    const alturaPadrao = primeiroProduto?.alturaM || "";
    const comprimentoPadrao = primeiroProduto?.comprimentoM || "";
    
    // Calcular peso dividido entre os volumes
    const pesoTotal = calcularPesoTotal();
    const pesoPorVolume = qtd > 0 ? (pesoTotal / qtd).toFixed(2) : "";
    
    const newVolumes = Array(qtd).fill(null).map((_, index) => ({
      largura: larguraPadrao.toString(),
      altura: alturaPadrao.toString(),
      comprimento: comprimentoPadrao.toString(),
      peso: pesoPorVolume.toString()
    }));
    
    setFormData({ ...formData, quantidadeVolumes: value, volumes: newVolumes });
  };

  const handleVolumeChange = (index, field, value) => {
    const newVolumes = [...formData.volumes];
    newVolumes[index] = { ...newVolumes[index], [field]: value };
    setFormData({ ...formData, volumes: newVolumes });
  };

  const handleServicoChange = (servico, checked) => {
    setFormData({
      ...formData,
      servicosAdicionais: {
        ...formData.servicosAdicionais,
        [servico]: checked
      }
    });
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (bloqueadoPorVencimento) {
      setError(`Você tem ${cotacoesVencidas.length} cotação(ões) com avaliação vencida (mais de 24h). Por favor, avalie antes de criar uma nova cotação.`);
      return;
    }

    if (selectedProducts.length === 0) {
      setError("Selecione pelo menos um produto");
      return;
    }

    if (!selectedDestinatario) {
      setError("Selecione um destinatário");
      return;
    }

    if (!selectedEnderecoColeta) {
      setError("Selecione um endereço de coleta");
      return;
    }

    const allProductsValid = selectedProducts.every(p => 
      p.quantidade > 0 && p.valorUnitario >= 0 && p.pesoUnitario > 0
    );

    if (!allProductsValid) {
      setError("Preencha todos os detalhes dos produtos (quantidade, valor e peso)");
      return;
    }

    if (!formData.tipoFrete || !formData.tempoCotacaoMinutos || !formData.dataHoraColeta) {
      setError("Preencha todos os campos obrigatórios");
      return;
    }

    const allVolumesValid = formData.volumes.every(v => 
      v.largura && v.altura && v.comprimento && v.peso
    );

    if (!allVolumesValid) {
      setError("Preencha as medidas de todos os volumes");
      return;
    }

    setSubmitting(true);

    try {
      const dataHoraInicio = new Date();
      const dataHoraFim = new Date(dataHoraInicio.getTime() + parseInt(formData.tempoCotacaoMinutos) * 60000);

      // Pegar o primeiro produto como principal (para compatibilidade)
      const produtoPrincipal = selectedProducts[0];
      const valorNotaFiscal = calcularValorTotal();
      const pesoTotal = calcularPesoTotal();

      // Criar lista de produtos para observações
      const listaProdutos = selectedProducts.map(p => 
        `${p.produto.nome} (NCM: ${p.produto.ncmCode}) - Qtd: ${p.quantidade} - Valor Unit: R$ ${parseFloat(p.valorUnitario).toFixed(2)} - Peso Unit: ${p.pesoUnitario}kg`
      ).join(' | ');

      const cotacaoData = {
        clienteId: user.perfilAtivoId,
        produtoId: produtoPrincipal.produto.id,
        produtoNome: selectedProducts.length > 1 
          ? `MÚLTIPLOS PRODUTOS (${selectedProducts.length})`
          : produtoPrincipal.produto.nome,
        produtoNCM: produtoPrincipal.produto.ncmCode,
        produtoPeso: pesoTotal,
        destinatarioId: selectedDestinatario.id,
        destinatarioCep: selectedDestinatario.cep,
        destinatarioCidade: selectedDestinatario.cidade,
        destinatarioEstado: selectedDestinatario.estado,
        enderecoColetaId: selectedEnderecoColeta.id,
        enderecoColetaCep: selectedEnderecoColeta.cep,
        enderecoColetaCidade: selectedEnderecoColeta.cidade,
        enderecoColetaEstado: selectedEnderecoColeta.estado,
        aceitaMotoCarAte100km: formData.aceitaMotoCarAte100km,
        aceitaTransportadorSemCNPJ: formData.aceitaTransportadorSemCNPJ,
        valorNotaFiscal: valorNotaFiscal,
        quantidadeVolumes: parseInt(formData.quantidadeVolumes),
        pesoTotal: pesoTotal,
        volumes: formData.volumes.map(v => ({
          largura: parseFloat(v.largura),
          altura: parseFloat(v.altura),
          comprimento: parseFloat(v.comprimento),
          peso: parseFloat(v.peso)
        })),
        tipoFrete: formData.tipoFrete,
        servicosAdicionais: formData.servicosAdicionais,
        tempoCotacaoMinutos: parseInt(formData.tempoCotacaoMinutos),
        dataHoraColeta: formData.dataHoraColeta,
        dataHoraInicio: dataHoraInicio.toISOString(),
        dataHoraFim: dataHoraFim.toISOString(),
        status: "aberta",
        avaliada: false,
        statusPagamento: "nao_requerido",
        observacoes: `PRODUTOS: ${listaProdutos} | ${formData.observacoes}`.toUpperCase()
      };

      await base44.entities.Cotacao.create(cotacaoData);
      navigate(createPageUrl("Cotacoes"));
    } catch (error) {
      setError("Erro ao criar cotação. Tente novamente.");
      console.error(error);
    }
    setSubmitting(false);
  };

  if (loading) {
    return <LoadingSpinner message="Carregando..." />;
  }

  const getMinDataHoraColeta = () => {
    const agora = new Date();
    agora.setHours(agora.getHours() + 1);
    return agora.toISOString().slice(0, 16);
  };

  const temAvaliacoesPendentes = cotacoesSemAvaliacao.length > 0;
  const bloqueadoPorVencimento = cotacoesVencidas.length > 0;
  const ehCPF = perfilCliente?.cpfOuCnpj?.length === 11 || perfilCliente?.cpfOuCnpj?.length === 14;
  const semEnderecoColeta = enderecosColeta.length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <PageHeader
        title="Nova Cotação"
        description="Crie uma nova cotação e receba propostas de transportadoras"
        showBack={true}
      />

      <div className="p-6 max-w-5xl mx-auto">
        {user?.status !== "approved" && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Seu cadastro precisa ser aprovado antes de criar cotações
            </AlertDescription>
          </Alert>
        )}

        {ehCPF && (
          <Alert className="mb-6 bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-400">
            <AlertTriangle className="h-6 w-6 text-orange-600" />
            <AlertDescription>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-orange-900">
                  ⚠️ ATENÇÃO - PAGAMENTO ANTECIPADO OBRIGATÓRIO
                </h3>
                <p className="text-orange-900 font-medium">
                  Como cliente <strong>CPF</strong>, você precisa fazer o <strong>pagamento antecipado</strong> ao aceitar uma cotação.
                </p>
                <p className="text-orange-800 text-sm">
                  Após escolher a transportadora, você será direcionado para pagar via:
                </p>
                <ul className="list-disc list-inside text-orange-800 text-sm ml-4">
                  <li>Seus créditos ou cashback disponível</li>
                  <li>PIX, Cartão de Crédito/Débito ou Boleto</li>
                </ul>
                <p className="text-orange-900 font-semibold text-sm mt-2">
                  💡 O chat com a transportadora só abrirá após o pagamento ser confirmado.
                </p>
                <Link to={createPageUrl("Creditos")}>
                  <Button variant="outline" size="sm" className="mt-2 border-orange-600 text-orange-700 hover:bg-orange-50">
                    Ver Meus Créditos
                  </Button>
                </Link>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {temAvaliacoesPendentes && (
          <Alert variant="destructive" className="mb-6">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Avaliações Pendentes!</strong><br />
              Você tem {cotacoesSemAvaliacao.length} cotação(ões) finalizada(s) aguardando avaliação.
              {cotacoesVencidas.length > 0 && (
                <span className="block mt-1 text-red-700 font-bold">
                  ⚠️ {cotacoesVencidas.length} cotação(ões) passaram do prazo de 24 horas! A criação de novas cotações está BLOQUEADA.
                </span>
              )}
              <br />
              <Link to={createPageUrl("CotacoesFinalizadasCliente")} className="underline font-semibold mt-2 inline-block">
                Ir para Cotações Finalizadas e Avaliar
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {semEnderecoColeta && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Endereço de Coleta Obrigatório!</strong><br />
              Você precisa cadastrar pelo menos um endereço de coleta antes de criar cotações.
              <br />
              <Link to={createPageUrl("EnderecosColeta")} className="underline font-semibold mt-2 inline-block">
                Cadastrar Endereço de Coleta
              </Link>
            </AlertDescription>
          </Alert>
        )}

        <div className="mb-6">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((stepNum) => (
              <div key={stepNum} className="flex items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  step >= stepNum 
                    ? "bg-blue-600 text-white" 
                    : "bg-gray-200 text-gray-500"
                }`}>
                  {stepNum}
                </div>
                {stepNum < 4 && (
                  <div className={`flex-1 h-1 mx-2 ${
                    step > stepNum ? "bg-blue-600" : "bg-gray-200"
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm">
            <span className={step >= 1 ? "text-blue-600 font-medium" : "text-gray-500"}>
              Produto/Destino
            </span>
            <span className={step >= 2 ? "text-blue-600 font-medium" : "text-gray-500"}>
              Carga
            </span>
            <span className={step >= 3 ? "text-blue-600 font-medium" : "text-gray-500"}>
              Serviços
            </span>
            <span className={step >= 4 ? "text-blue-600 font-medium" : "text-gray-500"}>
              Finalizar
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Selecione Produtos e Destinatário</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <ProdutoSelectorMulti
                  clienteId={user?.perfilAtivoId}
                  onProductsChange={setSelectedProducts}
                  selectedProducts={selectedProducts}
                />

                {selectedProducts.length > 0 && (
                  <ProdutosDetalhesEditor
                    selectedProducts={selectedProducts}
                    onProductsChange={setSelectedProducts}
                  />
                )}

                <div className="border-t pt-6">
                  <EnderecoColetaSelector
                    clienteId={user?.perfilAtivoId}
                    onSelect={setSelectedEnderecoColeta}
                    selectedEndereco={selectedEnderecoColeta}
                  />
                </div>

                <div className="border-t pt-6">
                  <DestinatarioSelector
                    clienteId={user?.perfilAtivoId}
                    onSelect={setSelectedDestinatario}
                    selectedDestinatario={selectedDestinatario}
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    type="button"
                    onClick={() => {
                      const allValid = selectedProducts.every(p => 
                        p.quantidade > 0 && p.valorUnitario >= 0 && p.pesoUnitario > 0
                      );
                      if (!allValid) {
                        setError("Preencha todos os detalhes dos produtos antes de continuar");
                        return;
                      }
                      setError("");
                      setStep(2);
                    }}
                    disabled={selectedProducts.length === 0 || !selectedDestinatario || !selectedEnderecoColeta}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Próximo
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <>
              <ResumoStep
                selectedProducts={selectedProducts}
                selectedDestinatario={selectedDestinatario}
                formData={formData}
              />

              <Card>
                <CardHeader>
                  <CardTitle>Informações da Carga</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="qtdVolumes">Quantidade de Volumes *</Label>
                    <Input
                      type="number"
                      min="1"
                      max="999"
                      value={formData.quantidadeVolumes}
                      onChange={(e) => handleQuantidadeVolumesChange(e.target.value)}
                      placeholder="Digite a quantidade"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      As medidas serão preenchidas com base no primeiro produto e o peso será dividido entre os volumes.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold">Medidas dos Volumes</h4>
                    {formData.volumes.map((volume, index) => (
                      <div key={index} className="p-4 border rounded-lg space-y-3">
                        <h5 className="font-medium text-sm text-gray-700">
                          Volume {index + 1}
                        </h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <Label className="text-xs">Largura (m) *</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={volume.largura}
                              onChange={(e) => handleVolumeChange(index, 'largura', e.target.value)}
                              placeholder="0.00"
                              required
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Altura (m) *</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={volume.altura}
                              onChange={(e) => handleVolumeChange(index, 'altura', e.target.value)}
                              placeholder="0.00"
                              required
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Comprimento (m) *</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={volume.comprimento}
                              onChange={(e) => handleVolumeChange(index, 'comprimento', e.target.value)}
                              placeholder="0.00"
                              required
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Peso (kg) *</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={volume.peso}
                              onChange={(e) => handleVolumeChange(index, 'peso', e.target.value)}
                              placeholder="0.00"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(1)}
                    >
                      Voltar
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setStep(3)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Próximo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {step === 3 && (
            <>
              <ResumoStep
                selectedProducts={selectedProducts}
                selectedDestinatario={selectedDestinatario}
                formData={formData}
                showCarga={true}
              />

              <Card>
                <CardHeader>
                  <CardTitle>Preferências de Transportadora</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert className="bg-blue-50 border-blue-200">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800 text-sm">
                      <strong>Selecione suas preferências</strong> para ampliar ou restringir as opções de transportadoras disponíveis. Leia atentamente as características de cada tipo.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    {/* Opção PADRÃO - Sempre incluída */}
                    <div className="p-4 border-2 border-green-300 rounded-lg bg-green-50">
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Truck className="w-5 h-5 text-green-700" />
                            <span className="font-bold text-green-900">Transportadoras PJ e Autônomos Registrados</span>
                            <Badge className="bg-green-600 text-white text-xs">PADRÃO - SEMPRE INCLUÍDO</Badge>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm text-green-800 font-semibold">
                              ✅ <strong>EMITEM DOCUMENTOS FISCAIS COMPLETOS:</strong>
                            </p>
                            <ul className="text-xs text-green-700 space-y-1 ml-4">
                              <li>• <strong>Transportadoras PJ:</strong> Emitem CT-e (Conhecimento de Transporte Eletrônico) e MDF-e</li>
                              <li>• <strong>Autônomos Registrados:</strong> Emitem CIOT (Código Identificador da Operação de Transporte)</li>
                              <li>• Todos os documentos são válidos para uso fiscal e contábil</li>
                              <li>• <strong>Entregas interestaduais e de longa distância permitidas</strong></li>
                              <li>• Seguro de carga conforme necessidade</li>
                            </ul>
                            <div className="mt-2 p-2 bg-green-100 rounded border border-green-300">
                              <p className="text-xs font-semibold text-green-900">
                                💼 Opção recomendada para operações que necessitam documentação fiscal completa
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Opção ADICIONAL 1 - Motoboy/Veículo Leve */}
                    <div className="p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="motocar"
                          checked={formData.aceitaMotoCarAte100km}
                          onCheckedChange={(checked) => setFormData({ ...formData, aceitaMotoCarAte100km: checked })}
                        />
                        <div className="flex-1">
                          <Label htmlFor="motocar" className="cursor-pointer">
                            <div className="flex items-center gap-2 mb-2">
                              <Truck className="w-5 h-5 text-blue-600" />
                              <span className="font-bold text-blue-900">Aceitar Motoboy/Veículo Leve até 100km</span>
                              <Badge className="bg-blue-600 text-white text-xs">OPCIONAL</Badge>
                            </div>
                            <div className="space-y-2">
                              <p className="text-sm text-blue-800">
                                📦 <strong>Entregas rápidas em curta distância:</strong>
                              </p>
                              <ul className="text-xs text-blue-700 space-y-1 ml-4">
                                <li>• Ideal para entregas urbanas e urgentes</li>
                                <li>• Raio de atuação: <strong>até 100km</strong></li>
                                <li>• <strong>NÃO emitem documentos fiscais</strong> (CT-e, CIOT, MDF-e, etc.)</li>
                                <li>• <strong>Seguro obrigatório incluído no frete</strong> (sem exceção)</li>
                                <li>• Mais opções de valores competitivos</li>
                              </ul>
                              <div className="mt-2 p-2 bg-blue-100 rounded border border-blue-300">
                                <p className="text-xs font-semibold text-blue-900">
                                  ⚡ Mais opções de preços | ⚠️ Sem documentos fiscais | 🛡️ Seguro obrigatório
                                </p>
                              </div>
                            </div>
                          </Label>
                        </div>
                      </div>
                    </div>

                    {/* Opção ADICIONAL 2 - Transportadores PF sem CNPJ */}
                    <div className="p-4 border-2 border-orange-300 rounded-lg bg-orange-50">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="semcnpj"
                          checked={formData.aceitaTransportadorSemCNPJ}
                          onCheckedChange={(checked) => setFormData({ ...formData, aceitaTransportadorSemCNPJ: checked })}
                        />
                        <div className="flex-1">
                          <Label htmlFor="semcnpj" className="cursor-pointer">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle className="w-5 h-5 text-orange-600" />
                              <span className="font-bold text-orange-900">Aceitar Transportadores Pessoa Física (CPF)</span>
                              <Badge className="bg-orange-600 text-white text-xs">OPCIONAL</Badge>
                            </div>
                            <div className="space-y-2">
                              <Alert className="bg-orange-100 border-orange-400 py-2">
                                <AlertTriangle className="h-4 w-4 text-orange-700" />
                                <AlertDescription className="text-xs text-orange-900 font-semibold">
                                  ⚠️ ATENÇÃO - Responsabilidade do Embarcador
                                </AlertDescription>
                              </Alert>
                              <ul className="text-xs text-orange-800 space-y-1 ml-4">
                                <li>• <strong>NÃO emitem documentos fiscais</strong> (CT-e, CIOT, MDF-e, etc.)</li>
                                <li>• <strong>Seguro obrigatório incluído no frete</strong> (sem exceção)</li>
                                <li>• <strong>Restrição geográfica:</strong> Apenas entregas na mesma região metropolitana</li>
                                <li>• <strong>Proibido entregas interestaduais</strong> (apenas mesmo estado)</li>
                                <li>• Você assume total responsabilidade pela escolha do transportador</li>
                                <li>• Ideal para reduzir custos em entregas locais sem necessidade fiscal</li>
                              </ul>
                              <div className="mt-2 p-2 bg-orange-100 rounded border border-orange-400">
                                <p className="text-xs font-semibold text-orange-900">
                                  💰 Mais opções de preços | ⚠️ Sem documentos fiscais | 🛡️ Seguro obrigatório | 📍 Apenas regional
                                </p>
                              </div>
                            </div>
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Alert className="bg-gray-50 border-gray-300">
                    <AlertCircle className="h-4 w-4 text-gray-600" />
                    <AlertDescription className="text-xs text-gray-700">
                      <strong>Transparência:</strong> Todas as informações sobre emissão de documentos fiscais são apresentadas claramente para cada tipo de transportador. Escolha de acordo com suas necessidades operacionais e fiscais.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Serviços Adicionais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                      <Checkbox
                        id="palete"
                        checked={formData.servicosAdicionais.precisaPalete}
                        onCheckedChange={(checked) => handleServicoChange('precisaPalete', checked)}
                      />
                      <div className="flex-1">
                        <Label htmlFor="palete" className="cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Package className="w-5 h-5 text-blue-600" />
                            <span className="font-semibold">Paletização</span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            Carga precisa ser paletizada
                          </p>
                        </Label>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                      <Checkbox
                        id="urgente"
                        checked={formData.servicosAdicionais.ehUrgente}
                        onCheckedChange={(checked) => handleServicoChange('ehUrgente', checked)}
                      />
                      <div className="flex-1">
                        <Label htmlFor="urgente" className="cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Zap className="w-5 h-5 text-orange-600" />
                            <span className="font-semibold">Urgente</span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            Entrega prioritária
                          </p>
                        </Label>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                      <Checkbox
                        id="fragil"
                        checked={formData.servicosAdicionais.ehFragil}
                        onCheckedChange={(checked) => handleServicoChange('ehFragil', checked)}
                      />
                      <div className="flex-1">
                        <Label htmlFor="fragil" className="cursor-pointer">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-yellow-600" />
                            <span className="font-semibold">Frágil</span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            Carga requer cuidados especiais
                          </p>
                        </Label>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                      <Checkbox
                        id="dedicada"
                        checked={formData.servicosAdicionais.precisaCargaDedicada}
                        onCheckedChange={(checked) => handleServicoChange('precisaCargaDedicada', checked)}
                      />
                      <div className="flex-1">
                        <Label htmlFor="dedicada" className="cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Truck className="w-5 h-5 text-purple-600" />
                            <span className="font-semibold">Carga Dedicada</span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            Veículo exclusivo para esta carga
                          </p>
                        </Label>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(2)}
                    >
                      Voltar
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setStep(4)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Próximo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {step === 4 && (
            <>
              <ResumoStep
                selectedProducts={selectedProducts}
                selectedDestinatario={selectedDestinatario}
                formData={formData}
                showCarga={true}
                showServicos={true}
              />

              <Card>
                <CardHeader>
                  <CardTitle>Informações Finais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="tipoFrete">Tipo de Frete *</Label>
                      <Select 
                        value={formData.tipoFrete} 
                        onValueChange={(value) => setFormData({ ...formData, tipoFrete: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CIF">CIF - Vendedor paga frete</SelectItem>
                          <SelectItem value="FOB">FOB - Comprador paga frete</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="tempoCotacao">Tempo de Cotação *</Label>
                      <Select 
                        value={formData.tempoCotacaoMinutos} 
                        onValueChange={(value) => setFormData({ ...formData, tempoCotacaoMinutos: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 minutos</SelectItem>
                          <SelectItem value="30">30 minutos</SelectItem>
                          <SelectItem value="60">1 hora</SelectItem>
                          <SelectItem value="120">2 horas</SelectItem>
                          <SelectItem value="240">4 horas</SelectItem>
                          <SelectItem value="480">8 horas</SelectItem>
                          <SelectItem value="1440">24 horas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="dataColeta">Data e Hora da Coleta *</Label>
                    <Input
                      id="dataColeta"
                      type="datetime-local"
                      value={formData.dataHoraColeta}
                      onChange={(e) => setFormData({ ...formData, dataHoraColeta: e.target.value })}
                      min={getMinDataHoraColeta()}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      * Coleta deve ser agendada com no mínimo 1 hora de antecedência
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="observacoes">Observações Adicionais (EM MAIÚSCULAS)</Label>
                    <Textarea
                      id="observacoes"
                      value={formData.observacoes}
                      onChange={(e) => setFormData({ ...formData, observacoes: e.target.value.toUpperCase() })}
                      placeholder="INFORMAÇÕES ADICIONAIS EM MAIÚSCULAS"
                      rows={3}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      * Lista de produtos será incluída automaticamente
                    </p>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(3)}
                    >
                      Voltar
                    </Button>
                    <Button
                      type="submit"
                      disabled={submitting || user?.status !== "approved" || bloqueadoPorVencimento || semEnderecoColeta}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                    >
                      {submitting ? "Criando..." : "Criar Cotação"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
