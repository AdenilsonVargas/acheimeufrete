import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Truck, UserCircle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import LoadingSpinner from "../components/common/LoadingSpinner";
import LoginForm from "../components/auth/LoginForm";
import CadastroClienteForm from "../components/auth/CadastroClienteForm";
import CadastroTransportadoraForm from "../components/auth/CadastroTransportadoraForm";

export default function CompletarCadastro() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1); // 1: escolher tipo, 2: login, 3: cadastro
  const [tipoSelecionado, setTipoSelecionado] = useState(null);
  const [showCadastro, setShowCadastro] = useState(false);

  const loadUser = useCallback(async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      // Se já tem tipo definido, redirecionar para dashboard
      if (userData.tipo) {
        if (userData.tipo === "cliente") {
          navigate(createPageUrl("Dashboard"));
        } else {
          navigate(createPageUrl("DashboardTransportadora"));
        }
        return;
      }
    } catch (error) {
      console.error("Erro ao carregar usuário:", error);
      setError("Erro ao carregar dados do usuário");
    }
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const handleTipoSelect = (tipo) => {
    setTipoSelecionado(tipo);
    setStep(2);
    setShowCadastro(false);
  };

  const handleLoginSuccess = (perfilId) => {
    // Redirecionar para dashboard apropriado baseado no tipo selecionado
    if (tipoSelecionado === "cliente") {
      navigate(createPageUrl("Dashboard"));
    } else {
      navigate(createPageUrl("DashboardTransportadora"));
    }
  };

  const handleCadastroSuccess = () => {
    // Após cadastro, voltar para login
    setShowCadastro(false);
    setStep(2);
  };

  const handleVoltar = () => {
    if (step === 3 || (step === 2 && showCadastro)) {
      setShowCadastro(false);
      setStep(2);
    } else if (step === 2) {
      setStep(1);
      setTipoSelecionado(null);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Carregando..." />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-orange-50 p-6">
      <Card className="w-full max-w-3xl shadow-2xl">
        <CardHeader className="space-y-4 text-center pb-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg">
              <Truck className="w-12 h-12 text-white" />
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Achei Meu Frete
            </CardTitle>
            {user && (
              <p className="text-xs text-gray-400 mt-2">
                Conta Base44: {user.email}
              </p>
            )}
            <p className="text-gray-500 mt-2">
              {step === 1 && "Selecione o tipo de perfil interno para acessar"}
              {step === 2 && !showCadastro && `Faça login como ${tipoSelecionado === "cliente" ? "Cliente" : "Transportadora"}`}
              {step === 2 && showCadastro && `Cadastre-se como ${tipoSelecionado === "cliente" ? "Cliente" : "Transportadora"}`}
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Step 1: Escolher tipo de perfil interno */}
          {step === 1 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 text-center text-lg">
                Selecione o tipo de perfil interno:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card
                  className="cursor-pointer transition-all duration-200 hover:border-blue-600 hover:shadow-lg border-2"
                  onClick={() => handleTipoSelect("cliente")}
                >
                  <CardContent className="p-8 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <UserCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h4 className="font-bold text-xl text-gray-900 mb-3">Sou Cliente</h4>
                    <p className="text-sm text-gray-600">
                      Preciso contratar serviços de transporte e desejo solicitar cotações de frete
                    </p>
                  </CardContent>
                </Card>

                <Card
                  className="cursor-pointer transition-all duration-200 hover:border-blue-600 hover:shadow-lg border-2"
                  onClick={() => handleTipoSelect("transportadora")}
                >
                  <CardContent className="p-8 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Truck className="w-10 h-10 text-blue-600" />
                    </div>
                    <h4 className="font-bold text-xl text-gray-900 mb-3">Sou Transportadora</h4>
                    <p className="text-sm text-gray-600">
                      Ofereço serviços de transporte e desejo receber cotações para oferecer meus serviços
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Alert className="mt-6 bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 text-sm">
                  <strong>Perfis Internos:</strong> Estes são perfis de teste criados dentro da plataforma. 
                  Você está logado no Base44 como {user?.email}. 
                  Cliente pode ser CPF ou CNPJ, mas Transportadora deve sempre ser CNPJ.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Step 2: Login ou Cadastro */}
          {step === 2 && (
            <div>
              {step > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleVoltar}
                  className="mb-4"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              )}

              {!showCadastro ? (
                <LoginForm
                  user={user}
                  tipo={tipoSelecionado}
                  onSuccess={handleLoginSuccess}
                  onCriarConta={() => setShowCadastro(true)}
                />
              ) : (
                <>
                  {tipoSelecionado === "cliente" ? (
                    <CadastroClienteForm
                      user={user}
                      onSuccess={handleCadastroSuccess}
                      onVoltar={() => setShowCadastro(false)}
                    />
                  ) : (
                    <CadastroTransportadoraForm
                      user={user}
                      onSuccess={handleCadastroSuccess}
                      onVoltar={() => setShowCadastro(false)}
                    />
                  )}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
