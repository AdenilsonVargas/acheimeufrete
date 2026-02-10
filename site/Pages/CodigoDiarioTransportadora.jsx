import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Key,
  RefreshCw,
  Copy,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Shield,
  Truck
} from "lucide-react";
import PageHeader from "../components/common/PageHeader";
import LoadingSpinner from "../components/common/LoadingSpinner";

export default function CodigoDiarioTransportadora() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [copiado, setCopiado] = useState(false);
  const [gerando, setGerando] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userData = await base44.auth.me();
    setUser(userData);
  };

  const { data: perfil, isLoading } = useQuery({
    queryKey: ['perfil-transportadora-codigo', user?.perfilAtivoId],
    queryFn: async () => {
      if (!user) return null;
      const perfis = await base44.entities.PerfilTransportadora.filter({
        userIdGoogle: user.perfilAtivoId
      });
      return perfis[0] || null;
    },
    enabled: !!user
  });

  // Buscar cotações aceitas que precisam de código
  const { data: cotacoesAceitas = [] } = useQuery({
    queryKey: ['cotacoes-aceitas-codigo', user?.perfilAtivoId],
    queryFn: async () => {
      if (!user) return [];
      
      const minhasRespostas = await base44.entities.RespostaCotacao.filter({
        transportadoraId: user.perfilAtivoId
      });
      
      const cotacoesIds = minhasRespostas.map(r => r.id);
      const todasCotacoes = await base44.entities.Cotacao.filter({});
      
      return todasCotacoes.filter(c => 
        cotacoesIds.includes(c.respostaSelecionadaId) &&
        (c.status === "aceita" || c.status === "aguardando_coleta") &&
        !c.coletaConfirmada
      );
    },
    enabled: !!user
  });

  const gerarCodigo = () => {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let codigo = '';
    for (let i = 0; i < 5; i++) {
      codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return codigo;
  };

  const handleGerarNovoCodigo = async () => {
    setGerando(true);
    try {
      const novoCodigo = gerarCodigo();
      const hoje = new Date().toISOString().split('T')[0];

      // Atualizar perfil da transportadora
      await base44.entities.PerfilTransportadora.update(perfil.id, {
        codigoDiario: novoCodigo,
        dataCodigoDiario: hoje
      });

      // Atualizar todas as cotações aceitas com o novo código
      for (const cotacao of cotacoesAceitas) {
        await base44.entities.Cotacao.update(cotacao.id, {
          codigoConfirmacaoColeta: novoCodigo,
          status: "aguardando_coleta"
        });
      }

      queryClient.invalidateQueries({ queryKey: ['perfil-transportadora-codigo'] });
      queryClient.invalidateQueries({ queryKey: ['cotacoes-aceitas-codigo'] });
    } catch (err) {
      console.error("Erro ao gerar código:", err);
    }
    setGerando(false);
  };

  const copiarCodigo = () => {
    if (perfil?.codigoDiario) {
      navigator.clipboard.writeText(perfil.codigoDiario);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  const hoje = new Date().toISOString().split('T')[0];
  const codigoValido = perfil?.dataCodigoDiario === hoje;

  if (!user || isLoading) {
    return <LoadingSpinner message="Carregando..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <PageHeader
        title="Código Diário de Coleta"
        description="Gere e gerencie o código de confirmação de coleta"
      />

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <Alert className="bg-blue-50 border-blue-300">
          <Shield className="h-5 w-5 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <strong>Sistema de Segurança:</strong><br />
            O código diário é usado para confirmar que a coleta foi realizada. 
            O cliente deve digitar este código para validar que recebeu a carga do motorista.
          </AlertDescription>
        </Alert>

        <Card className="border-2 border-blue-200">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <CardTitle className="flex items-center gap-2">
              <Key className="w-6 h-6" />
              Código do Dia
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 text-center">
            {codigoValido && perfil?.codigoDiario ? (
              <>
                <div className="mb-4">
                  <Badge className="bg-green-100 text-green-800 mb-2">
                    <Calendar className="w-3 h-3 mr-1" />
                    Válido para hoje: {new Date().toLocaleDateString('pt-BR')}
                  </Badge>
                </div>

                <div className="bg-gray-100 rounded-2xl p-8 inline-block mb-6">
                  <p className="text-6xl font-mono font-bold tracking-[0.3em] text-blue-700">
                    {perfil.codigoDiario}
                  </p>
                </div>

                <div className="flex justify-center gap-4">
                  <Button
                    onClick={copiarCodigo}
                    variant="outline"
                    className="border-blue-600 text-blue-600 hover:bg-blue-50"
                  >
                    {copiado ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copiar Código
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleGerarNovoCodigo}
                    disabled={gerando}
                    variant="outline"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${gerando ? 'animate-spin' : ''}`} />
                    Gerar Novo
                  </Button>
                </div>

                <p className="text-sm text-gray-500 mt-6">
                  Forneça este código ao cliente no momento da coleta para confirmar a operação.
                </p>
              </>
            ) : (
              <>
                <div className="mb-6">
                  <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Nenhum código gerado para hoje
                  </h3>
                  <p className="text-gray-500">
                    Clique no botão abaixo para gerar o código do dia
                  </p>
                </div>

                <Button
                  onClick={handleGerarNovoCodigo}
                  disabled={gerando}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-8"
                  size="lg"
                >
                  {gerando ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Key className="w-5 h-5 mr-2" />
                      Gerar Código do Dia
                    </>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Cotações pendentes de coleta */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-600" />
              Cotações Aguardando Coleta ({cotacoesAceitas.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cotacoesAceitas.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                Nenhuma cotação aguardando coleta no momento
              </p>
            ) : (
              <div className="space-y-3">
                {cotacoesAceitas.map((cotacao) => (
                  <div
                    key={cotacao.id}
                    className="p-4 border rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold">#{cotacao.id.slice(0, 8)}</span>
                      <Badge variant="outline">{cotacao.tipoFrete}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Produto:</span>
                        <p className="font-medium">{cotacao.produtoNome}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Destino:</span>
                        <p className="font-medium">{cotacao.destinatarioCidade}/{cotacao.destinatarioEstado}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge className={cotacao.codigoConfirmacaoColeta ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                        {cotacao.codigoConfirmacaoColeta 
                          ? `Código: ${cotacao.codigoConfirmacaoColeta}`
                          : "Sem código atribuído"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
