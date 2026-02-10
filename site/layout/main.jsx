import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  LayoutDashboard, 
  Package, 
  MapPin, 
  FileText, 
  UserCircle, 
  BarChart3, 
  CreditCard,
  Truck,
  Settings,
  List,
  MapPinned,
  LogOut,
  Shield,
  MessageSquare,
  CheckSquare,
  Wallet,
  Star,
  Upload
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import NotificationBells from "./components/transportadora/NotificationBells";
import NotificationBellsCliente from "./components/cliente/NotificationBellsCliente";
import TransportadoraCodigoGuard from "./components/auth/TransportadoraCodigoGuard";

const clientMenuItems = [
  { title: "Dashboard", url: "Dashboard", icon: LayoutDashboard, notifKey: "cotacoesAprovacaoCTe", notifColor: "bg-red-500" },
  { title: "Produtos", url: "Produtos", icon: Package },
  { title: "Destinatários", url: "Destinatarios", icon: MapPin },
  { title: "Endereços Coleta", url: "EnderecosColeta", icon: MapPinned },
  { title: "Cotações", url: "Cotacoes", icon: FileText },
  { title: "Cotações Aceitas", url: "CotacoesAceitas", icon: CheckSquare },
  { title: "Confirmar Coleta", url: "ConfirmarColeta", icon: Shield },
  { title: "Cotações Coletadas", url: "CotacoesColetadas", icon: Truck },
  { title: "Cotações Finalizadas", url: "CotacoesFinalizadasCliente", icon: CheckSquare, notifKey: "cotacoesFinalizadas", notifColor: "bg-yellow-500" },
  { title: "Chats", url: "Chats", icon: MessageSquare, notifKey: "chatsNaoLidos", notifColor: "bg-red-500" },
  { title: "Créditos", url: "Creditos", icon: Wallet, notifKey: "cotacoesPagamento", notifColor: "bg-orange-500" },
  { title: "Pacotes Premium", url: "PacotesPremium", icon: Star },
  { title: "Perfil", url: "Perfil", icon: UserCircle },
  { title: "Relatórios", url: "Relatorios", icon: BarChart3 },
  { title: "Pagamentos", url: "Pagamentos", icon: CreditCard },
];

const carrierMenuItems = [
  { title: "Dashboard", url: "DashboardTransportadora", icon: LayoutDashboard },
  { title: "Perfil", url: "PerfilTransportadora", icon: UserCircle },
  { title: "Opções de Envio", url: "OpcoesEnvio", icon: Settings },
  { title: "NCMs Atendidos", url: "NCMsAtendidos", icon: List },
  { title: "Regiões Atendidas", url: "RegioesAtendidas", icon: MapPinned },
  { title: "Cotações Disponíveis", url: "CotacoesDisponiveis", icon: FileText, notifKey: "cotacoesDisponiveis" },
  { title: "Cotações Aceitas", url: "CotacoesAceitasTransportadora", icon: CheckSquare, notifKey: "cotacoesAceitas" },
  { title: "Código Diário", url: "CodigoDiarioTransportadora", icon: Shield },
  { title: "Em Entrega", url: "EmEntregaTransportadora", icon: Truck },
  { title: "Cotações Finalizadas", url: "CotacoesFinalizadasTransportadora", icon: CheckSquare },
  { title: "Chats", url: "ChatsTransportadora", icon: MessageSquare, notifKey: "mensagensNaoLidas" },
  { title: "Financeiro", url: "FinanceiroTransportadora", icon: Wallet },
  { title: "Pacotes Premium", url: "PacotesPremium", icon: Star },
  { title: "Relatórios", url: "RelatoriosTransportadora", icon: BarChart3 },
];

const adminMenuItems = [
  { title: "Dashboard Admin", url: "DashboardAdmin", icon: LayoutDashboard },
  { title: "Aprovar Cadastros", url: "AprovarCadastros", icon: Shield },
  { title: "Financeiro", url: "FinanceiroAdmin", icon: CreditCard },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user, isLoading: loading, error, refetch } = useQuery({
    queryKey: ['layout-user'],
    queryFn: async () => {
      const userData = await base44.auth.me();
      
      if (!userData.tipo && currentPageName !== "CompletarCadastro") {
        navigate(createPageUrl("CompletarCadastro"));
        return null;
      }
      
      return userData;
    },
    retry: (failureCount, error) => {
      if (error?.response?.status === 429 || error?.message?.includes("Rate limit")) {
        return failureCount < 5;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(attemptIndex * 1000, 10000),
    staleTime: 30000,
    refetchOnWindowFocus: false
  });

  useEffect(() => {
    const handleUserUpdate = () => {
      queryClient.invalidateQueries(['layout-user']);
      refetch();
    };
    
    window.addEventListener('user-updated', handleUserUpdate);
    return () => window.removeEventListener('user-updated', handleUserUpdate);
  }, [queryClient, refetch]);

  useEffect(() => {
    if (error && !["Registro", "CompletarCadastro"].includes(currentPageName)) {
      base44.auth.redirectToLogin();
    }
  }, [error, currentPageName]);

  const { data: notificacoes } = useQuery({
    queryKey: ['menu-notificacoes', user?.perfilAtivoId, user?.tipo],
    queryFn: async () => {
      if (!user) return {};

      // Notificações para CLIENTE
      if (user.tipo === "cliente") {
        const [chatsNaoLidos, cotacoesAprovacaoCTe, cotacoesPagamento, cotacoesFinalizadas] = await Promise.all([
          base44.entities.Chat.filter({
            clienteId: user.perfilAtivoId,
            lidoPorCliente: false
          }),
          base44.entities.Cotacao.filter({
            clienteId: user.perfilAtivoId,
            status: "aguardando_aprovacao_cte"
          }),
          base44.entities.Cotacao.filter({
            clienteId: user.perfilAtivoId,
            status: "aguardando_pagamento"
          }),
          base44.entities.Cotacao.filter({
            clienteId: user.perfilAtivoId,
            status: "finalizada",
            avaliada: false
          })
        ]);
        
        return {
          chatsNaoLidos: chatsNaoLidos.length,
          cotacoesAprovacaoCTe: cotacoesAprovacaoCTe.length,
          cotacoesPagamento: cotacoesPagamento.length,
          cotacoesFinalizadas: cotacoesFinalizadas.length
        };
      }

      // Notificações para TRANSPORTADORA
      if (user.tipo === "transportadora") {
        // Buscar dados básicos da transportadora em paralelo
        const [opcoesEnvio, ncmsAtendidos, regioesAtendidas, minhasRespostas, meusChats] = await Promise.all([
          base44.entities.OpcaoEnvio.filter({ transportadoraId: user.perfilAtivoId }),
          base44.entities.NCMAtendido.filter({ transportadoraId: user.perfilAtivoId }),
          base44.entities.RegiaoAtendida.filter({ transportadoraId: user.perfilAtivoId }),
          base44.entities.RespostaCotacao.filter({ transportadoraId: user.perfilAtivoId }),
          base44.entities.Chat.filter({ transportadoraId: user.perfilAtivoId })
        ]);

        const temOpcoes = opcoesEnvio.length > 0;
        const ncmCodes = ncmsAtendidos.map(n => n.ncmCode);
        const temRegioes = regioesAtendidas.length > 0;
        const cotacoesRespondidas = minhasRespostas.map(r => r.cotacaoId);
        const idsMinhasRespostas = minhasRespostas.map(r => r.id);

        // Buscar cotações uma vez só
        const todasCotacoes = await base44.entities.Cotacao.filter({});

        // Filtrar cotações abertas/disponíveis
        const agora = new Date();
        const cotacoesAbertas = todasCotacoes.filter(c => {
          const statusValido = (c.status === "aberta" || c.status === "em_andamento" || c.status === "visualizada") &&
            c.status !== "aguardando_pagamento";
          const dataFim = c.dataHoraFim ? new Date(c.dataHoraFim) : null;
          const naoExpirada = dataFim ? dataFim > agora : false;
          return statusValido && naoExpirada;
        });

        // Contar cotações compatíveis
        const cotacoesCompativeis = cotacoesAbertas.filter(cotacao => {
          const ncmMatch = ncmCodes.includes(cotacao.produtoNCM);
          let regiaoMatch = true;
          if (temRegioes) {
            regiaoMatch = regioesAtendidas.some(regiao => {
              if (regiao.estados && regiao.estados.length > 0) {
                return regiao.estados.includes(cotacao.destinatarioEstado);
              }
              if (regiao.cepInicio && regiao.cepFim) {
                const cep = (cotacao.destinatarioCep || '').replace(/\D/g, '');
                return cep >= regiao.cepInicio && cep <= regiao.cepFim;
              }
              return true;
            });
          }
          const jaRespondida = cotacoesRespondidas.includes(cotacao.id);
          return ncmMatch && regiaoMatch && temOpcoes && !jaRespondida;
        });

        // Contar cotações aceitas - excluir as que já estão completas (movidas para "Em Entrega")
        const cotacoesAceitas = todasCotacoes.filter(c => {
          const minhaResposta = c.respostaSelecionadaId && idsMinhasRespostas.includes(c.respostaSelecionadaId);
          const naoFinalizada = c.status !== "finalizada";
          const naoDevolvida = c.status !== "devolvida";

          // Verificar se já está completa (movida para "Em Entrega")
          const temCTeRegistrado = c.cteRegistrado && c.codigoCTe;
          const temDocumentos = c.documentoCte || (c.documentosEntrega && c.documentosEntrega.length > 0);
          const temRastreio = c.urlRastreamento && c.codigoRastreio;
          const completaParaEntrega = temCTeRegistrado && temDocumentos && temRastreio;

          // Se está aguardando aprovação de CT-e, contar
          const aguardandoAprovacao = c.status === "aguardando_aprovacao_cte";

          // Só conta se é minha resposta, não finalizada/devolvida, E (falta algo OU aguardando aprovação)
          return minhaResposta && naoFinalizada && naoDevolvida && (!completaParaEntrega || aguardandoAprovacao);
        });

        // Contar chats com mensagens pendentes (excluir chats de CT-e aprovados)
        const chatsPendentes = meusChats.filter(chat => {
          const expiradoPorStatus = chat.status === "expirado" || chat.status === "bloqueado";
          const expiradoPorData = chat.dataHoraExpiracao ? new Date(chat.dataHoraExpiracao) <= new Date() : false;
          if (expiradoPorStatus || expiradoPorData) return false;

          const naoLido = chat.lidoPorTransportadora === false;
          const temMsgCliente = Array.isArray(chat.mensagens) && chat.mensagens.some(m => m.remetente === "cliente");

          return temMsgCliente && naoLido;
        });

        return {
          cotacoesDisponiveis: cotacoesCompativeis.length,
          cotacoesAceitas: cotacoesAceitas.length,
          mensagensNaoLidas: chatsPendentes.length
        };
      }

      return {};
    },
    enabled: !!user && (user.tipo === "transportadora" || user.tipo === "cliente"),
    staleTime: 60000,
    refetchInterval: 60000
  });

  const handleLogout = async () => {
    if (confirm("Deseja sair do perfil interno? Você voltará à tela de seleção de perfil.")) {
      try {
        await base44.auth.updateMe({ 
          tipo: null,
          perfilAtivoId: null,
          emailAcesso: null
        });
        
        queryClient.invalidateQueries(['layout-user']);
        navigate(createPageUrl("CompletarCadastro"));
      } catch (error) {
        console.error("Erro ao trocar perfil:", error);
        alert("Erro ao trocar perfil. Tente novamente.");
      }
    }
  };

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.auth.updateMe({ fotoPerfil: file_url });
      queryClient.invalidateQueries(['layout-user']);
    } catch (error) {
      console.error("Erro ao fazer upload da foto:", error);
      alert("Erro ao atualizar foto de perfil.");
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-orange-50">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-sm text-gray-600">Carregando...</p>
      </div>
    </div>;
  }

  const publicPages = ["Registro", "CompletarCadastro"];
  if (!user && !publicPages.includes(currentPageName)) {
    return null;
  }

  if (publicPages.includes(currentPageName)) {
    return children;
  }

  const isAdminEmail = user?.emailAcesso === "evoluindoumtrader@gmail.com";

  if (!user?.tipo) {
    return children;
  }

  let menuItems = [];
  let userLabel = "";
  
  if (user?.tipo === "transportadora") {
    menuItems = [...carrierMenuItems];
    if (isAdminEmail) {
      menuItems.push(...adminMenuItems);
    }
    userLabel = isAdminEmail ? "Transportadora (Admin Master)" : "Transportadora";
  } else if (user?.tipo === "cliente") {
    menuItems = [...clientMenuItems];
    if (isAdminEmail) {
      menuItems.push(...adminMenuItems);
    }
    userLabel = isAdminEmail ? "Cliente (Admin Master)" : "Cliente";
  }

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    blocked: "bg-gray-100 text-gray-800"
  };
  const statusLabels = {
    pending: "Pendente",
    approved: "Aprovado",
    rejected: "Rejeitado",
    blocked: "Bloqueado"
  };

  const displayName = user?.nomeCompleto || user?.razaoSocial || "Usuário";
  const displayEmail = user?.emailAcesso || "Sem email";
  const baseEmail = user?.email;
  const fotoPerfil = user?.fotoPerfil;

  return (
    <SidebarProvider>
      <style>{`
        :root {
          --primary: 217 91% 60%;
          --primary-foreground: 0 0% 100%;
          --secondary: 24 95% 53%;
          --secondary-foreground: 0 0% 100%;
          --accent: 217 91% 95%;
          --accent-foreground: 217 91% 20%;
        }
      `}</style>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-blue-50 via-white to-orange-50">
        <Sidebar className="border-r border-gray-200 bg-white/80 backdrop-blur-sm">
          <SidebarHeader className="border-b border-gray-100 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Achei Meu Frete</h2>
                <p className="text-xs text-gray-500">{userLabel}</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-3">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">
                Menu
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => {
                    const notifCount = notificacoes?.[item.notifKey] || 0;
                    const showBadge = notifCount > 0;
                    const badgeColor = item.notifColor || (item.notifKey === "cotacoesDisponiveis" ? "bg-green-500" : "bg-red-500");

                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          asChild 
                          className={`hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 rounded-xl mb-1 ${
                            location.pathname === createPageUrl(item.url) 
                              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-md' 
                              : ''
                          }`}
                        >
                          <Link to={createPageUrl(item.url)} className="flex items-center gap-3 px-4 py-3 relative">
                            <item.icon className="w-5 h-5" />
                            <span className="font-medium">{item.title}</span>
                            {showBadge && (
                              <Badge className={`ml-auto h-5 min-w-[20px] flex items-center justify-center p-1 ${badgeColor} text-white text-xs`}>
                                {notifCount > 9 ? '9+' : notifCount}
                              </Badge>
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-gray-100 p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3 px-2">
                <div className="relative">
                  {fotoPerfil ? (
                    <img 
                      src={fotoPerfil} 
                      alt="Perfil" 
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {displayName[0]?.toUpperCase() || "U"}
                      </span>
                    </div>
                  )}
                  <label className="absolute -bottom-1 -right-1 cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureUpload}
                      className="hidden"
                    />
                    <div className="bg-blue-600 text-white p-1 rounded-full shadow-lg hover:bg-blue-700 transition-colors">
                      <Upload className="w-3 h-3" />
                    </div>
                  </label>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">
                    {displayName}
                  </p>
                  <p className="text-xs text-gray-500 truncate" title="Email do perfil interno">
                    {displayEmail}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {user?.status && (
                      <Badge className={`text-xs ${statusColors[user?.status]}`}>
                        {statusLabels[user?.status]}
                      </Badge>
                    )}
                    {user?.isPremium && (
                      <Badge className="text-xs bg-yellow-100 text-yellow-800">
                        Premium ⭐
                      </Badge>
                    )}
                    {isAdminEmail && (
                      <Badge className="text-xs bg-purple-100 text-purple-800">
                        Admin Master
                      </Badge>
                    )}
                  </div>
                  {baseEmail && baseEmail !== displayEmail && (
                    <p className="text-xs text-gray-400 truncate mt-1" title="Conta Base44">
                      Base44: {baseEmail}
                    </p>
                  )}
                </div>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full flex items-center justify-center gap-2 text-blue-600 hover:bg-blue-50 hover:text-blue-700 border-blue-200"
              >
                <LogOut className="w-4 h-4" />
                Trocar Perfil
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="hover:bg-gray-100 p-2 rounded-lg transition-colors md:hidden" />
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent hidden md:block">
                  Achei Meu Frete
                </h1>
              </div>
              {user?.tipo === "transportadora" && <NotificationBells user={user} />}
              {user?.tipo === "cliente" && <NotificationBellsCliente user={user} />}
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            <TransportadoraCodigoGuard user={user} currentPageName={currentPageName}>
              {children}
            </TransportadoraCodigoGuard>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
