import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FileText, Search, Eye, Star, AlertCircle, MapPin, Package, Calendar, Clock, Weight, DollarSign, Box, ArrowRight, User } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import PageHeader from "../components/common/PageHeader";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";
import StatusBadge from "../components/common/StatusBadge";
import AvaliacaoModal from "../components/cotacao/AvaliacaoModal";
import CountdownTimer from "../components/common/CountdownTimer";
import { Badge } from "@/components/ui/badge";

export default function Cotacoes() {
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("todas");
  const [modalAberto, setModalAberto] = useState(false);
  const [cotacaoAvaliar, setCotacaoAvaliar] = useState(null);
  const [transportadoraAvaliar, setTransportadoraAvaliar] = useState(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userData = await base44.auth.me();
    setUser(userData);
  };

  const { data: cotacoes = [], isLoading } = useQuery({
    queryKey: ['cotacoes', user?.perfilAtivoId],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.Cotacao.filter(
        { clienteId: user.perfilAtivoId }, 
        "-created_date"
      );
    },
    enabled: !!user
  });

  // Buscar destinatários para exibir nomes
  const { data: destinatarios = {} } = useQuery({
    queryKey: ['destinatarios-cotacoes', cotacoes.map(c => c.destinatarioId).join(',')],
    queryFn: async () => {
      const destIds = [...new Set(cotacoes.map(c => c.destinatarioId).filter(Boolean))];
      const destMap = {};
      await Promise.all(
        destIds.map(async (id) => {
          const dests = await base44.entities.Destinatario.filter({ id });
          if (dests.length > 0) destMap[id] = dests[0];
        })
      );
      return destMap;
    },
    enabled: cotacoes.length > 0
  });

  // Buscar propostas para cotações abertas
  const { data: cotacoesComPropostas = [] } = useQuery({
    queryKey: ['propostas-cotacoes', cotacoes.map(c => c.id).join(',')],
    queryFn: async () => {
      const cotacoesAbertas = cotacoes.filter(c => 
        c.status === "aberta" || c.status === "em_andamento" || c.status === "visualizada"
      );
      
      if (cotacoesAbertas.length === 0) return [];

      const idsComPropostas = [];
      await Promise.all(
        cotacoesAbertas.map(async (cotacao) => {
          const propostas = await base44.entities.RespostaCotacao.filter({ 
            cotacaoId: cotacao.id 
          });
          if (propostas.length > 0) {
            idsComPropostas.push(cotacao.id);
          }
        })
      );

      return idsComPropostas;
    },
    enabled: cotacoes.length > 0
  });

  // Buscar transportadoras das cotações finalizadas
  const { data: transportadoras = {} } = useQuery({
    queryKey: ['transportadoras-cotacoes', cotacoes.map(c => c.id).join(',')],
    queryFn: async () => {
      const cotacoesFinalizadas = cotacoes.filter(c => c.status === "finalizada" && c.respostaSelecionadaId);
      const transportadorasMap = {};

      await Promise.all(
        cotacoesFinalizadas.map(async (cotacao) => {
          const respostas = await base44.entities.RespostaCotacao.filter({ 
            id: cotacao.respostaSelecionadaId 
          });
          if (respostas.length > 0) {
            transportadorasMap[cotacao.id] = {
              id: respostas[0].transportadoraId,
              nome: respostas[0].transportadoraNome
            };
          }
        })
      );

      return transportadorasMap;
    },
    enabled: cotacoes.length > 0
  });

  const handleAvaliar = (cotacao) => {
    const transportadora = transportadoras[cotacao.id];
    if (!transportadora) return;

    setCotacaoAvaliar(cotacao);
    setTransportadoraAvaliar(transportadora);
    setModalAberto(true);
  };

  const handleAvaliacaoSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['cotacoes'] });
  };

  const filteredCotacoes = cotacoes.filter(c => {
    const dest = destinatarios[c.destinatarioId];
    const nomeDestinatario = dest?.nomeCompleto || "";
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = c.produtoNome.toLowerCase().includes(searchLower) ||
                         c.destinatarioCidade.toLowerCase().includes(searchLower) ||
                         nomeDestinatario.toLowerCase().includes(searchLower) ||
                         c.id.toLowerCase().includes(searchLower);
    const matchesStatus = filterStatus === "todas" || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Verificar se há cotações abertas com propostas
  const cotacaoAbertaComPropostas = cotacoes.find(c => 
    (c.status === "aberta" || c.status === "em_andamento" || c.status === "visualizada") &&
    cotacoesComPropostas.includes(c.id)
  );

  // Verificar se há cotações finalizadas sem avaliação
  const cotacoesSemAvaliacao = cotacoes.filter(c => 
    c.status === "finalizada" && !c.avaliada
  );

  if (!user || isLoading) {
    return <LoadingSpinner message="Carregando cotações..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <PageHeader
        title="Cotações"
        description="Gerencie todas as suas cotações"
        action={
          <Button 
            disabled={!!cotacaoAbertaComPropostas}
            className={`${!cotacaoAbertaComPropostas ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800' : 'bg-gray-400 cursor-not-allowed'}`}
            onClick={() => {
              if (!cotacaoAbertaComPropostas) {
                window.location.href = createPageUrl("NovaCotacao");
              }
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Cotação
          </Button>
        }
      />

      <div className="p-6 max-w-7xl mx-auto">
        {cotacaoAbertaComPropostas && (
          <Alert className="mb-6 bg-orange-50 border-orange-300">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>⏸️ Nova Cotação Bloqueada!</strong> Você tem uma cotação aberta com propostas recebidas. 
              Finalize esta cotação (selecione uma transportadora ou cancele) antes de criar uma nova.
            </AlertDescription>
          </Alert>
        )}

        {cotacoesSemAvaliacao.length > 0 && (
          <Alert className="mb-6 bg-yellow-50 border-yellow-300">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Atenção!</strong> Você tem {cotacoesSemAvaliacao.length} cotação(ões) finalizada(s) 
              aguardando avaliação. Por favor, avalie antes de criar uma nova cotação.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Buscar por produto, destinatário, cidade ou número..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {["todas", "aberta", "em_andamento", "visualizada", "aceita", "finalizada", "cancelada"].map((status) => (
              <Button
                key={status}
                variant={filterStatus === status ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus(status)}
                className={filterStatus === status ? "bg-blue-600" : ""}
              >
                {status === "todas" ? "Todas" : status.replace("_", " ").replace(/^\w/, c => c.toUpperCase())}
              </Button>
            ))}
          </div>
        </div>

        {filteredCotacoes.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Nenhuma cotação encontrada"
            description="Crie uma nova cotação para começar a receber propostas de transportadoras"
            actionLabel="Criar Nova Cotação"
            actionUrl={createPageUrl("NovaCotacao")}
          />
        ) : (
          <div className="space-y-4">
            {filteredCotacoes.map((cotacao) => {
              const precisaAvaliar = cotacao.status === "finalizada" && !cotacao.avaliada;
              const dest = destinatarios[cotacao.destinatarioId];
              
              return (
                <Card 
                  key={cotacao.id} 
                  className={`overflow-hidden hover:shadow-lg transition-shadow ${
                    precisaAvaliar ? 'border-2 border-yellow-400' : ''
                  }`}
                >
                  {/* Header */}
                  <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Cotação #{cotacao.id.slice(0, 8)}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-white/20 text-white border-0">
                          {cotacao.tipoFrete}
                        </Badge>
                        <StatusBadge status={cotacao.status} />
                        {(cotacao.status === "aberta" || cotacao.status === "em_andamento") && (
                          <CountdownTimer 
                            dataHoraFim={cotacao.dataHoraFim}
                            onExpire={() => {
                              queryClient.invalidateQueries(['cotacoes']);
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-0">
                    {/* Destinatário */}
                    <div className="p-3 bg-purple-50 border-b flex items-center gap-2">
                      <User className="w-4 h-4 text-purple-600" />
                      <span className="text-xs font-bold text-purple-700">DESTINATÁRIO:</span>
                      <span className="font-semibold text-sm text-gray-900">
                        {dest?.nomeCompleto || "Carregando..."}
                      </span>
                    </div>

                    {/* Rotas */}
                    <div className="grid grid-cols-2 divide-x border-b">
                      <div className="p-3 bg-green-50">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                            <MapPin className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-xs font-bold text-green-700">ORIGEM</span>
                        </div>
                        <p className="font-semibold text-sm text-gray-900">
                          {cotacao.enderecoColetaCidade || "N/I"} - {cotacao.enderecoColetaEstado || ""}
                        </p>
                        <p className="text-xs text-green-700 font-mono">
                          CEP: {cotacao.enderecoColetaCep || "Não informado"}
                        </p>
                      </div>
                      
                      <div className="p-3 bg-red-50">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
                            <MapPin className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-xs font-bold text-red-700">DESTINO</span>
                        </div>
                        <p className="font-semibold text-sm text-gray-900">
                          {cotacao.destinatarioCidade} - {cotacao.destinatarioEstado}
                        </p>
                        <p className="text-xs text-red-700 font-mono">
                          CEP: {cotacao.destinatarioCep}
                        </p>
                      </div>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-4 divide-x border-b">
                      <div className="p-3 text-center">
                        <Package className="w-4 h-4 text-blue-600 mx-auto" />
                        <p className="text-xs text-gray-500 mt-1">Produto</p>
                        <p className="font-bold text-xs text-gray-900 truncate">{cotacao.produtoNome}</p>
                      </div>
                      <div className="p-3 text-center">
                        <Weight className="w-4 h-4 text-purple-600 mx-auto" />
                        <p className="text-xs text-gray-500 mt-1">Peso</p>
                        <p className="font-bold text-gray-900">{cotacao.pesoTotal} kg</p>
                      </div>
                      <div className="p-3 text-center">
                        <Box className="w-4 h-4 text-orange-600 mx-auto" />
                        <p className="text-xs text-gray-500 mt-1">Volumes</p>
                        <p className="font-bold text-gray-900">{cotacao.quantidadeVolumes}</p>
                      </div>
                      <div className="p-3 text-center bg-amber-50">
                        <Calendar className="w-4 h-4 text-amber-600 mx-auto" />
                        <p className="text-xs text-gray-500 mt-1">Coleta</p>
                        <p className="font-bold text-gray-900">
                          {new Date(cotacao.dataHoraColeta).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    {/* Valor NF e Data Criação */}
                    <div className="p-3 flex items-center justify-between border-b bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="text-xs text-gray-500">Valor NF:</span>
                          <span className="font-bold text-sm text-gray-900">
                            R$ {(cotacao.valorNotaFiscal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Criada: {new Date(cotacao.created_date).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </div>

                    {/* Botão */}
                    <div className="p-3 flex justify-end bg-gray-50">
                      {precisaAvaliar ? (
                        <Button 
                          onClick={() => handleAvaliar(cotacao)}
                          className="bg-yellow-500 hover:bg-yellow-600 animate-pulse"
                        >
                          <Star className="w-4 h-4 mr-2" />
                          Avaliar Transportadora
                        </Button>
                      ) : (
                        <Link to={createPageUrl(`DetalheCotacao?id=${cotacao.id}`)}>
                          <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                            <Eye className="w-4 h-4 mr-2" />
                            Ver Detalhes
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {modalAberto && cotacaoAvaliar && transportadoraAvaliar && (
        <AvaliacaoModal
          isOpen={modalAberto}
          onClose={() => {
            setModalAberto(false);
            setCotacaoAvaliar(null);
            setTransportadoraAvaliar(null);
          }}
          cotacao={cotacaoAvaliar}
          transportadora={transportadoraAvaliar}
          onSuccess={handleAvaliacaoSuccess}
        />
      )}
    </div>
  );
}
