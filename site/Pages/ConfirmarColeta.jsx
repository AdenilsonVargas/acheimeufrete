import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Truck,
  Package,
  MapPin,
  Clock,
  Key
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PageHeader from "../components/common/PageHeader";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";

export default function ConfirmarColeta() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [codigoDigitado, setCodigoDigitado] = useState("");
  const [cotacaoSelecionada, setCotacaoSelecionada] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [confirmando, setConfirmando] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userData = await base44.auth.me();
    setUser(userData);
  };

  // Buscar cotações aceitas aguardando coleta
  const { data: cotacoesAguardando = [], isLoading } = useQuery({
    queryKey: ['cotacoes-aguardando-coleta', user?.perfilAtivoId],
    queryFn: async () => {
      if (!user) return [];
      const todasCotacoes = await base44.entities.Cotacao.filter({
        clienteId: user.perfilAtivoId
      });
      // Filtrar cotações aceitas que ainda não foram coletadas
      return todasCotacoes.filter(c => 
        (c.status === "aceita" || c.status === "aguardando_coleta") && 
        !c.coletaConfirmada
      );
    },
    enabled: !!user
  });

  // Buscar destinatários
  const { data: destinatarios = {} } = useQuery({
    queryKey: ['destinatarios-confirmar', cotacoesAguardando.map(c => c.destinatarioId).join(',')],
    queryFn: async () => {
      const destIds = [...new Set(cotacoesAguardando.map(c => c.destinatarioId).filter(Boolean))];
      const destMap = {};
      await Promise.all(
        destIds.map(async (id) => {
          const dests = await base44.entities.Destinatario.filter({ id });
          if (dests.length > 0) destMap[id] = dests[0];
        })
      );
      return destMap;
    },
    enabled: cotacoesAguardando.length > 0
  });

  const handleConfirmarColeta = async () => {
    if (!cotacaoSelecionada) {
      setError("Selecione uma cotação para confirmar");
      return;
    }

    if (!codigoDigitado || codigoDigitado.length !== 5) {
      setError("Digite o código de 5 dígitos fornecido pela transportadora");
      return;
    }

    setConfirmando(true);
    setError("");

    try {
      // Buscar a resposta selecionada para obter a transportadora
      const respostas = await base44.entities.RespostaCotacao.filter({
        id: cotacaoSelecionada.respostaSelecionadaId
      });
      
      if (respostas.length === 0) {
        setError("Erro: Não foi possível identificar a transportadora desta cotação.");
        setConfirmando(false);
        return;
      }

      const transportadoraId = respostas[0].transportadoraId;

      // Buscar o perfil da transportadora para verificar o código diário
      const perfisTransportadora = await base44.entities.PerfilTransportadora.filter({
        userIdGoogle: transportadoraId
      });

      if (perfisTransportadora.length === 0) {
        setError("Erro: Transportadora não encontrada.");
        setConfirmando(false);
        return;
      }

      const perfilTransportadora = perfisTransportadora[0];
      const hoje = new Date().toISOString().split('T')[0];

      // Verificar se o código é válido para hoje
      if (perfilTransportadora.dataCodigoDiario !== hoje) {
        setError("A transportadora ainda não gerou o código do dia. Solicite ao motorista.");
        setConfirmando(false);
        return;
      }

      // Verificar se o código digitado corresponde ao código da transportadora
      if (perfilTransportadora.codigoDiario !== codigoDigitado) {
        setError("Código incorreto. Este não é o código desta transportadora. Verifique com o motorista.");
        setConfirmando(false);
        return;
      }

      // Buscar prazo de entrega da resposta selecionada
      const prazoEntregaDias = respostas[0].tempoEntregaDias || 0;
      
      // Calcular data prevista de entrega (começa a contar no dia seguinte às 19h)
      const dataColetaConfirmada = new Date();
      const inicioPrazo = new Date(dataColetaConfirmada);
      inicioPrazo.setDate(inicioPrazo.getDate() + 1);
      inicioPrazo.setHours(19, 0, 0, 0);
      
      const dataPrevistaEntrega = new Date(inicioPrazo);
      dataPrevistaEntrega.setDate(dataPrevistaEntrega.getDate() + prazoEntregaDias - 1);

      // Atualizar cotação como coletada
      await base44.entities.Cotacao.update(cotacaoSelecionada.id, {
        coletaConfirmada: true,
        dataHoraColetaConfirmada: dataColetaConfirmada.toISOString(),
        status: "em_transito",
        prazoEntregaDias: prazoEntregaDias,
        dataPrevistaEntrega: dataPrevistaEntrega.toISOString(),
        atrasada: false,
        atrasoInformadoCliente: false
      });

      setSuccess("Coleta confirmada com sucesso! A carga está em trânsito.");
      queryClient.invalidateQueries({ queryKey: ['cotacoes-aguardando-coleta'] });
      queryClient.invalidateQueries({ queryKey: ['cotacoes-aceitas-cliente'] });
      
      setTimeout(() => {
        navigate(createPageUrl("CotacoesColetadas"));
      }, 2000);

    } catch (err) {
      setError("Erro ao confirmar coleta. Tente novamente.");
      console.error(err);
    }

    setConfirmando(false);
  };

  if (!user || isLoading) {
    return <LoadingSpinner message="Carregando..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <PageHeader
        title="Confirmar Coleta"
        description="Digite o código da transportadora para confirmar a coleta"
        showBack={true}
      />

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <Alert className="bg-blue-50 border-blue-300">
          <ShieldCheck className="h-5 w-5 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <strong>Como funciona:</strong><br />
            1. A transportadora gera um código diário de 5 dígitos<br />
            2. No momento da coleta, peça o código ao motorista<br />
            3. Digite o código aqui para confirmar que a carga foi coletada<br />
            <span className="text-sm text-blue-700 mt-2 block">
              ⚠️ Isso garante segurança e rastreabilidade no processo de entrega.
            </span>
          </AlertDescription>
        </Alert>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 border-green-300">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-900">{success}</AlertDescription>
          </Alert>
        )}

        {cotacoesAguardando.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Nenhuma coleta pendente"
            description="Você não tem cotações aguardando confirmação de coleta"
          />
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-blue-600" />
                  Selecione a Cotação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {cotacoesAguardando.map((cotacao) => {
                  const dest = destinatarios[cotacao.destinatarioId];
                  const isSelected = cotacaoSelecionada?.id === cotacao.id;

                  return (
                    <div
                      key={cotacao.id}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        isSelected 
                          ? "border-blue-600 bg-blue-50" 
                          : "border-gray-200 hover:border-blue-300"
                      }`}
                      onClick={() => setCotacaoSelecionada(cotacao)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Package className="w-5 h-5 text-blue-600" />
                          <span className="font-bold">#{cotacao.id.slice(0, 8)}</span>
                          <Badge variant="outline">{cotacao.tipoFrete}</Badge>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="w-5 h-5 text-blue-600" />
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Produto:</p>
                          <p className="font-medium">{cotacao.produtoNome}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Destinatário:</p>
                          <p className="font-medium">{dest?.nomeCompleto || "Carregando..."}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-green-600" />
                          <span className="text-gray-600">
                            {cotacao.enderecoColetaCidade}/{cotacao.enderecoColetaEstado}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-red-600" />
                          <span className="text-gray-600">
                            {cotacao.destinatarioCidade}/{cotacao.destinatarioEstado}
                          </span>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center gap-1 text-xs text-amber-600">
                        <Clock className="w-3 h-3" />
                        Coleta prevista: {new Date(cotacao.dataHoraColeta).toLocaleString('pt-BR')}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {cotacaoSelecionada && (
              <Card className="border-2 border-blue-200">
                <CardHeader className="bg-blue-50">
                  <CardTitle className="flex items-center gap-2">
                    <Key className="w-5 h-5 text-blue-600" />
                    Digite o Código de Confirmação
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <p className="text-gray-600">
                      Peça o código de 5 dígitos ao motorista da transportadora
                    </p>

                    <div className="max-w-xs mx-auto">
                      <Input
                        type="text"
                        maxLength={5}
                        value={codigoDigitado}
                        onChange={(e) => setCodigoDigitado(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                        placeholder="XXXXX"
                        className="text-center text-3xl font-mono tracking-[0.5em] h-16"
                      />
                    </div>

                    <Button
                      onClick={handleConfirmarColeta}
                      disabled={confirmando || codigoDigitado.length !== 5}
                      className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 px-8"
                    >
                      {confirmando ? (
                        "Confirmando..."
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5 mr-2" />
                          Confirmar Coleta
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
