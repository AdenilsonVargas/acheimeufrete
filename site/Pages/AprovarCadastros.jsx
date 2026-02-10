import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  CheckCircle, 
  XCircle, 
  Eye,
  FileText,
  Building2,
  User as UserIcon,
  AlertCircle
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import PageHeader from "../components/common/PageHeader";
import LoadingSpinner from "../components/common/LoadingSpinner";
import StatusBadge from "../components/common/StatusBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AprovarCadastros() {
  const [user, setUser] = useState(null);
  const [cadastros, setCadastros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedCadastro, setSelectedCadastro] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [motivoRejeicao, setMotivoRejeicao] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      if (userData.emailAcesso !== "evoluindoumtrader@gmail.com") {
        setError("Acesso negado. Apenas administradores podem acessar esta página.");
        setLoading(false);
        return;
      }

      // Buscar todas as credenciais
      const todasCredenciais = await base44.entities.Credencial.list();
      
      // Para cada credencial, buscar o perfil correspondente
      const cadastrosCompletos = await Promise.all(
        todasCredenciais.map(async (cred) => {
          try {
            let perfil;
            if (cred.tipo === "cliente") {
              const perfis = await base44.entities.PerfilCliente.filter({ id: cred.perfilId });
              perfil = perfis[0];
            } else {
              const perfis = await base44.entities.PerfilTransportadora.filter({ id: cred.perfilId });
              perfil = perfis[0];
            }
            
            if (perfil) {
              return {
                ...cred,
                perfil: perfil
              };
            }
          } catch (e) {
            console.error("Erro ao buscar perfil:", e);
          }
          return null;
        })
      );

      // Filtrar nulls e ordenar por data
      const cadastrosFiltrados = cadastrosCompletos
        .filter(c => c !== null)
        .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

      setCadastros(cadastrosFiltrados);
    } catch (error) {
      console.error("Erro ao carregar cadastros:", error);
      setError("Erro ao carregar dados");
    }
    setLoading(false);
  };

  const handleAprovar = async (cadastro) => {
    if (!confirm(`Tem certeza que deseja aprovar o cadastro de ${cadastro.perfil.nomeCompleto || cadastro.perfil.razaoSocial}?`)) {
      return;
    }

    try {
      // Atualizar perfil
      if (cadastro.tipo === "cliente") {
        await base44.entities.PerfilCliente.update(cadastro.perfilId, { 
          status: "approved",
          motivoRejeicao: null
        });
      } else {
        await base44.entities.PerfilTransportadora.update(cadastro.perfilId, { 
          status: "approved",
          motivoRejeicao: null
        });
      }
      
      setSuccess("Cadastro aprovado com sucesso!");
      loadData();
      setShowDialog(false);
    } catch (error) {
      console.error("Erro ao aprovar:", error);
      setError("Erro ao aprovar cadastro");
    }
  };

  const handleRejeitar = async () => {
    if (!motivoRejeicao || motivoRejeicao.trim() === "") {
      setError("Por favor, informe o motivo da rejeição");
      return;
    }

    if (!confirm(`Tem certeza que deseja rejeitar o cadastro de ${selectedCadastro.perfil.nomeCompleto || selectedCadastro.perfil.razaoSocial}?`)) {
      return;
    }

    try {
      // Atualizar perfil
      if (selectedCadastro.tipo === "cliente") {
        await base44.entities.PerfilCliente.update(selectedCadastro.perfilId, { 
          status: "rejected",
          motivoRejeicao: motivoRejeicao.toUpperCase()
        });
      } else {
        await base44.entities.PerfilTransportadora.update(selectedCadastro.perfilId, { 
          status: "rejected",
          motivoRejeicao: motivoRejeicao.toUpperCase()
        });
      }
      
      setSuccess("Cadastro rejeitado");
      setMotivoRejeicao("");
      setShowRejectDialog(false);
      loadData();
      setShowDialog(false);
    } catch (error) {
      console.error("Erro ao rejeitar:", error);
      setError("Erro ao rejeitar cadastro");
    }
  };

  const handleVerDetalhes = (cadastro) => {
    setSelectedCadastro(cadastro);
    setShowDialog(true);
  };

  const openRejectDialog = (cadastro) => {
    setSelectedCadastro(cadastro);
    setMotivoRejeicao("");
    setShowRejectDialog(true);
  };

  if (loading) {
    return <LoadingSpinner message="Carregando cadastros..." />;
  }

  if (user?.emailAcesso !== "evoluindoumtrader@gmail.com") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
        <PageHeader title="Acesso Negado" />
        <div className="p-6 max-w-4xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Você não tem permissão para acessar esta página.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const cadastrosPendentes = cadastros.filter(c => c.perfil.status === "pending");
  const cadastrosAprovados = cadastros.filter(c => c.perfil.status === "approved");
  const cadastrosRejeitados = cadastros.filter(c => c.perfil.status === "rejected");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <PageHeader
        title="Aprovar Cadastros"
        description="Analise e aprove cadastros de clientes e transportadoras"
      />

      <div className="p-6 max-w-7xl mx-auto">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="pendentes" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="pendentes">
              Pendentes ({cadastrosPendentes.length})
            </TabsTrigger>
            <TabsTrigger value="aprovados">
              Aprovados ({cadastrosAprovados.length})
            </TabsTrigger>
            <TabsTrigger value="rejeitados">
              Rejeitados ({cadastrosRejeitados.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pendentes">
            {cadastrosPendentes.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Nenhum cadastro pendente
                  </h3>
                  <p className="text-gray-500">
                    Todos os cadastros foram analisados
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {cadastrosPendentes.map((cadastro) => (
                  <CadastroCard
                    key={cadastro.id}
                    cadastro={cadastro}
                    onVerDetalhes={handleVerDetalhes}
                    onAprovar={handleAprovar}
                    onRejeitar={openRejectDialog}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="aprovados">
            <div className="grid gap-4">
              {cadastrosAprovados.map((cadastro) => (
                <CadastroCard
                  key={cadastro.id}
                  cadastro={cadastro}
                  onVerDetalhes={handleVerDetalhes}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="rejeitados">
            <div className="grid gap-4">
              {cadastrosRejeitados.map((cadastro) => (
                <CadastroCard
                  key={cadastro.id}
                  cadastro={cadastro}
                  onVerDetalhes={handleVerDetalhes}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog de detalhes */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Cadastro</DialogTitle>
          </DialogHeader>

          {selectedCadastro && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {selectedCadastro.tipo === "transportadora" ? (
                    <Building2 className="w-8 h-8 text-blue-600" />
                  ) : (
                    <UserIcon className="w-8 h-8 text-green-600" />
                  )}
                  <div>
                    <h3 className="font-bold text-lg">
                      {selectedCadastro.perfil.nomeCompleto || selectedCadastro.perfil.razaoSocial}
                    </h3>
                    <p className="text-sm text-gray-500">{selectedCadastro.emailAcesso}</p>
                  </div>
                </div>
                <StatusBadge status={selectedCadastro.perfil.status} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-600">Tipo</p>
                  <p className="text-gray-900">
                    {selectedCadastro.tipo === "transportadora" ? "Transportadora" : "Cliente"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600">CPF/CNPJ</p>
                  <p className="text-gray-900">{selectedCadastro.perfil.cpfOuCnpj || selectedCadastro.perfil.cnpj}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600">Telefone Comercial</p>
                  <p className="text-gray-900">{selectedCadastro.perfil.telefoneComercial}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600">Telefone Pessoal</p>
                  <p className="text-gray-900">{selectedCadastro.perfil.telefonePessoal}</p>
                </div>
              </div>

              {selectedCadastro.perfil.status === "rejected" && selectedCadastro.perfil.motivoRejeicao && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-semibold text-red-800 mb-1">Motivo da Rejeição:</p>
                  <p className="text-red-900">{selectedCadastro.perfil.motivoRejeicao}</p>
                </div>
              )}

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-4">Documentos</h4>
                <div className="space-y-3">
                  {selectedCadastro.tipo === "cliente" ? (
                    <>
                      <DocumentoItem
                        label="CPF Digitalizado"
                        url={selectedCadastro.perfil.documentoCpfScan}
                      />
                      <DocumentoItem
                        label="Comprovante de Endereço"
                        url={selectedCadastro.perfil.documentoComprovanteEndereco}
                      />
                    </>
                  ) : (
                    <>
                      <DocumentoItem
                        label="CNPJ Digitalizado"
                        url={selectedCadastro.perfil.documentoCnpjScan}
                      />
                      <DocumentoItem
                        label="Alvará de Funcionamento"
                        url={selectedCadastro.perfil.documentoAlvara}
                      />
                    </>
                  )}
                </div>
              </div>

              {selectedCadastro.perfil.status === "pending" && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => {
                      setShowDialog(false);
                      openRejectDialog(selectedCadastro);
                    }}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Rejeitar
                  </Button>
                  <Button
                    className="flex-1 bg-gradient-to-r from-green-600 to-green-700"
                    onClick={() => handleAprovar(selectedCadastro)}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Aprovar
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de rejeição */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rejeitar Cadastro</DialogTitle>
          </DialogHeader>

          {selectedCadastro && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Você está rejeitando o cadastro de <strong>{selectedCadastro.perfil.nomeCompleto || selectedCadastro.perfil.razaoSocial}</strong>
              </p>

              <div>
                <Label htmlFor="motivo">Motivo da Rejeição (EM MAIÚSCULAS) *</Label>
                <Textarea
                  id="motivo"
                  value={motivoRejeicao}
                  onChange={(e) => setMotivoRejeicao(e.target.value.toUpperCase())}
                  placeholder="INFORME O MOTIVO DA REJEIÇÃO EM MAIÚSCULAS"
                  rows={4}
                  className="mt-2"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowRejectDialog(false);
                    setMotivoRejeicao("");
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  onClick={handleRejeitar}
                >
                  Confirmar Rejeição
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CadastroCard({ cadastro, onVerDetalhes, onAprovar, onRejeitar }) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              cadastro.tipo === "transportadora" ? "bg-blue-100" : "bg-green-100"
            }`}>
              {cadastro.tipo === "transportadora" ? (
                <Building2 className="w-6 h-6 text-blue-600" />
              ) : (
                <UserIcon className="w-6 h-6 text-green-600" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-bold text-gray-900">
                  {cadastro.perfil.nomeCompleto || cadastro.perfil.razaoSocial}
                </h3>
                <StatusBadge status={cadastro.perfil.status} />
              </div>
              <p className="text-sm text-gray-600 mb-1">{cadastro.emailAcesso}</p>
              <p className="text-sm text-gray-500">
                {cadastro.tipo === "transportadora" ? "Transportadora" : "Cliente"} • {cadastro.perfil.cpfOuCnpj || cadastro.perfil.cnpj}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Cadastrado em: {new Date(cadastro.created_date).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onVerDetalhes(cadastro)}
            >
              <Eye className="w-4 h-4 mr-2" />
              Ver Detalhes
            </Button>
            {cadastro.perfil.status === "pending" && onAprovar && onRejeitar && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => onRejeitar(cadastro)}
                >
                  <XCircle className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => onAprovar(cadastro)}
                >
                  <CheckCircle className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DocumentoItem({ label, url }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </div>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:underline"
        >
          Ver documento
        </a>
      ) : (
        <span className="text-sm text-gray-400">Não enviado</span>
      )}
    </div>
  );
}
