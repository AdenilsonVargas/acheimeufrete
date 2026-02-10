/*
  ╔════════════════════════════════════════════════════════════╗
  ║  🚨 IMPORTANT: AGENT OPERATIONAL GUIDEBOOK               ║
  ║  Read BEFORE making ANY changes: AGENT_OPERATIONAL_GUIDEBOOK.md
  ║  Sections 1-3 are MANDATORY (FORBIDDEN, MANDATORY, GUARANTEES)
  ║                                                            ║
  ║  KEY RULES:                                               ║
  ║  • Render Header ONCE in this file (App.jsx) ONLY        ║
  ║  • Never import Header in pages/                         ║
  ║  • DashboardLayout sidebar starts at top-20 (not top-0) ║
  ║  • Never clear localStorage on error (kills F5 session)  ║
  ║  • Always use user?.userType (database field name)      ║
  ║  • Never hardcode userType (use dynamic user?.userType) ║
  ║  • F5 refresh MUST maintain session                      ║
  ║                                                            ║
  ║  Commands:                                                ║
  ║  npm run agent:init     → Initialize agent + checklist   ║
  ║  npm run agent:validate → Validate code rules           ║
  ║  npm run agent:check    → Full check (build + validate + test)
  ╚════════════════════════════════════════════════════════════╝
*/

import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import { useEffect } from 'react';
import { ThemeProvider } from '@/contexts/ThemeContext';

// Pages
import Home from '@/pages/Home';
import About from '@/pages/About';
import FAQ from '@/pages/FAQ';
import Contact from '@/pages/Contact';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Registro from '@/pages/Registro';
import NotFound from '@/pages/NotFound';
import Dashboard from '@/pages/Dashboard';
import DashboardTransportadora from '@/pages/DashboardTransportadora';
import NovaCotacao from '@/pages/NovaCotacao';
import Cotacoes from '@/pages/Cotacoes';
import DetalheCotacao from '@/pages/DetalheCotacao';
import ResponderCotacao from '@/pages/ResponderCotacao';
import CotacoesDisponiveis from '@/pages/CotacoesDisponiveis';
import CotacoesAceitas from '@/pages/CotacoesAceitas';
import CotacoesAceitasTransportadora from '@/pages/CotacoesAceitasTransportadora';
import Perfil from '@/pages/Perfil';
import Pagamentos from '@/pages/Pagamentos';
import Chats from '@/pages/Chats';
import ChatConversa from '@/pages/ChatConversa';
import Chat from '@/pages/Chat';
import FinanceiroTransportadora from '@/pages/FinanceiroTransportadora';
import Produtos from '@/pages/Produtos';
import Destinatarios from '@/pages/Destinatarios';
import EnderecosColeta from '@/pages/EnderecosColeta';
import CotacoesColetadas from '@/pages/CotacoesColetadas';
import CotacoesFinalizadasCliente from '@/pages/CotacoesFinalizadasCliente';
import CotacoesFinalizadasTransportadora from '@/pages/CotacoesFinalizadasTransportadora';
import ConfirmarColeta from '@/pages/ConfirmarColeta';
import EmitirCTe from '@/pages/EmitirCTe';
import PerfilTransportadora from '@/pages/PerfilTransportadora';
import PagamentosTransportadora from '@/pages/PagamentosTransportadora';
import DetalheEntregaCliente from '@/pages/DetalheEntregaCliente';
import DetalheEntregaTransportadora from '@/pages/DetalheEntregaTransportadora';
import DashboardAdmin from '@/pages/DashboardAdmin';
import AprovarCadastros from '@/pages/AprovarCadastros';
import FinanceiroAdmin from '@/pages/FinanceiroAdmin';
import BiparCTe from '@/pages/BiparCTe';
import AprovarCTe from '@/pages/AprovarCTe';
import EmitirMDFe from '@/pages/EmitirMDFe';
import EmitirCIOT from '@/pages/EmitirCIOT';
import EmEntregaTransportadora from '@/pages/EmEntregaTransportadora';
import ContraPropostaCTe from '@/pages/ContraPropostaCTe';
import ChatSuporte from '@/pages/ChatSuporte';
import ChatConversaTransportadora from '@/pages/ChatConversaTransportadora';
import ChatsTransportadora from '@/pages/ChatsTransportadora';
import CodigoDiarioTransportadora from '@/pages/CodigoDiarioTransportadora';
import RelatoriosTransportadora from '@/pages/RelatoriosTransportadora';
import AnexarDocumentos from '@/pages/AnexarDocumentos';
import Relatorios from '@/pages/Relatorios';
import Creditos from '@/pages/Creditos';
import RegioesAtendidas from '@/pages/RegioesAtendidas';
import OpcoesEnvio from '@/pages/OpcoesEnvio';
import PacotesPremium from '@/pages/PacotesPremium';
import NCMsAtendidos from '@/pages/NCMsAtendidos';
import NegociacaoCTe from '@/pages/NegociacaoCTe';
import CompletarCadastro from '@/pages/CompletarCadastro';
import PerfilEditavel from '@/pages/PerfilEditavel';
import Avaliacoes from '@/pages/Avaliacoes';

// Criar Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000,
      cacheTime: 300000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Protected Route Component
function ProtectedRoute({ children, allowedTypes = null }) {
  const { isAuthenticated, isLoading, user, selectedUserType } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 🔐 Se allowedTypes foi fornecido, validar selectedUserType
  if (allowedTypes) {
    const allowed = Array.isArray(allowedTypes) ? allowedTypes : [allowedTypes];
    const activeUserType = selectedUserType || user?.userType;
    
    if (!allowed.includes(activeUserType)) {
      console.warn(
        `🚫 Acesso negado: rota requer ${allowed.join(' ou ')} mas usuário é ${activeUserType}`,
        { user, selectedUserType, activeUserType }
      );
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="text-red-500 text-6xl">🚫</div>
            <h1 className="text-3xl font-bold text-white">Acesso Negado</h1>
            <p className="text-slate-300">
              Você não tem permissão para acessar esta página como <span className="font-semibold">{activeUserType}</span>.
            </p>
            <a
              href={activeUserType === 'transportador' ? '/dashboard-transportadora' : '/dashboard'}
              className="inline-block mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
            >
              Voltar ao Dashboard
            </a>
          </div>
        </div>
      );
    }
  }

  return children;
}


export default function App() {
  function InnerApp() {
    const { checkAuth } = useAuth();

    useEffect(() => {
      checkAuth();
    }, [checkAuth]);

    return (
      <>
        <Header />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/sobre" element={<About />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contato" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Register />} />
          <Route path="/registro" element={<Registro />} />

          {/* Protected Routes - Dashboard de Métricas (Embarcador e Transportador) */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/nova-cotacao" element={<ProtectedRoute allowedTypes="embarcador"><NovaCotacao /></ProtectedRoute>} />
          <Route path="/cotacoes" element={<ProtectedRoute allowedTypes="embarcador"><Cotacoes /></ProtectedRoute>} />
          <Route path="/cotacoes/:id" element={<ProtectedRoute allowedTypes="embarcador"><DetalheCotacao /></ProtectedRoute>} />
          <Route path="/cotacoes-aceitas" element={<ProtectedRoute allowedTypes="embarcador"><CotacoesAceitas /></ProtectedRoute>} />
          <Route path="/produtos" element={<ProtectedRoute allowedTypes="embarcador"><Produtos /></ProtectedRoute>} />
          <Route path="/destinatarios" element={<ProtectedRoute allowedTypes="embarcador"><Destinatarios /></ProtectedRoute>} />
          <Route path="/cotacoes-finalizadas" element={<ProtectedRoute allowedTypes="embarcador"><CotacoesFinalizadasCliente /></ProtectedRoute>} />
          <Route path="/detalhe-entrega-cliente/:id" element={<ProtectedRoute allowedTypes="embarcador"><DetalheEntregaCliente /></ProtectedRoute>} />
          <Route path="/relatorios" element={<ProtectedRoute allowedTypes="embarcador"><Relatorios /></ProtectedRoute>} />
          <Route path="/creditos" element={<ProtectedRoute allowedTypes="embarcador"><Creditos /></ProtectedRoute>} />
          <Route path="/opcoes-envio" element={<ProtectedRoute allowedTypes="embarcador"><OpcoesEnvio /></ProtectedRoute>} />
          <Route path="/pacotes-premium" element={<ProtectedRoute allowedTypes="embarcador"><PacotesPremium /></ProtectedRoute>} />

          {/* Protected Routes - Transportador */}
          <Route path="/dashboard-transportadora" element={<ProtectedRoute allowedTypes="transportador"><DashboardTransportadora /></ProtectedRoute>} />
          <Route path="/responder-cotacao/:id" element={<ProtectedRoute allowedTypes="transportador"><ResponderCotacao /></ProtectedRoute>} />
          <Route path="/cotacoes-disponiveis" element={<ProtectedRoute allowedTypes="transportador"><CotacoesDisponiveis /></ProtectedRoute>} />
          <Route path="/cotacoes-aceitas-transportadora" element={<ProtectedRoute allowedTypes="transportador"><CotacoesAceitasTransportadora /></ProtectedRoute>} />
          <Route path="/financeiro-transportadora" element={<ProtectedRoute allowedTypes="transportador"><FinanceiroTransportadora /></ProtectedRoute>} />
          <Route path="/enderecos-coleta" element={<ProtectedRoute allowedTypes="transportador"><EnderecosColeta /></ProtectedRoute>} />
          <Route path="/cotacoes-coletadas" element={<ProtectedRoute allowedTypes="transportador"><CotacoesColetadas /></ProtectedRoute>} />
          <Route path="/cotacoes-finalizadas-transportadora" element={<ProtectedRoute allowedTypes="transportador"><CotacoesFinalizadasTransportadora /></ProtectedRoute>} />
          <Route path="/confirmar-coleta" element={<ProtectedRoute allowedTypes="transportador"><ConfirmarColeta /></ProtectedRoute>} />
          <Route path="/emitir-cte" element={<ProtectedRoute allowedTypes="transportador"><EmitirCTe /></ProtectedRoute>} />
          <Route path="/perfil-transportadora" element={<ProtectedRoute allowedTypes="transportador"><PerfilTransportadora /></ProtectedRoute>} />
          <Route path="/pagamentos-transportadora" element={<ProtectedRoute allowedTypes="transportador"><PagamentosTransportadora /></ProtectedRoute>} />
          <Route path="/detalhe-entrega-transportadora/:id" element={<ProtectedRoute allowedTypes="transportador"><DetalheEntregaTransportadora /></ProtectedRoute>} />
          <Route path="/em-entrega-transportadora" element={<ProtectedRoute allowedTypes="transportador"><EmEntregaTransportadora /></ProtectedRoute>} />
          <Route path="/contraproposta-cte" element={<ProtectedRoute allowedTypes="transportador"><ContraPropostaCTe /></ProtectedRoute>} />
          <Route path="/chat-transportadora/:id" element={<ProtectedRoute allowedTypes="transportador"><ChatConversaTransportadora /></ProtectedRoute>} />
          <Route path="/chats-transportadora" element={<ProtectedRoute allowedTypes="transportador"><ChatsTransportadora /></ProtectedRoute>} />
          <Route path="/codigo-diario-transportadora" element={<ProtectedRoute allowedTypes="transportador"><CodigoDiarioTransportadora /></ProtectedRoute>} />
          <Route path="/relatorios-transportadora" element={<ProtectedRoute allowedTypes="transportador"><RelatoriosTransportadora /></ProtectedRoute>} />
          <Route path="/ncms-atendidos" element={<ProtectedRoute allowedTypes="transportador"><NCMsAtendidos /></ProtectedRoute>} />
          <Route path="/negociacao-cte" element={<ProtectedRoute allowedTypes="transportador"><NegociacaoCTe /></ProtectedRoute>} />
          <Route path="/regioes-atendidas" element={<ProtectedRoute allowedTypes="transportador"><RegioesAtendidas /></ProtectedRoute>} />
          <Route path="/emitir-mdfe" element={<ProtectedRoute allowedTypes="transportador"><EmitirMDFe /></ProtectedRoute>} />
          <Route path="/emitir-ciot" element={<ProtectedRoute allowedTypes="transportador"><EmitirCIOT /></ProtectedRoute>} />

          {/* Protected Routes - Admin */}
          <Route path="/dashboard-admin" element={<ProtectedRoute allowedTypes="admin"><DashboardAdmin /></ProtectedRoute>} />
          <Route path="/aprovar-cadastros" element={<ProtectedRoute allowedTypes="admin"><AprovarCadastros /></ProtectedRoute>} />
          <Route path="/financeiro-admin" element={<ProtectedRoute allowedTypes="admin"><FinanceiroAdmin /></ProtectedRoute>} />
          <Route path="/bipar-cte" element={<ProtectedRoute allowedTypes="admin"><BiparCTe /></ProtectedRoute>} />
          <Route path="/aprovar-cte" element={<ProtectedRoute allowedTypes="admin"><AprovarCTe /></ProtectedRoute>} />
          <Route path="/relatorios-admin" element={<ProtectedRoute allowedTypes="admin"><Relatorios /></ProtectedRoute>} />

          {/* Protected Routes - Shared (Todos) */}
          <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
          <Route path="/pagamentos" element={<ProtectedRoute><Pagamentos /></ProtectedRoute>} />
          <Route path="/avaliacoes" element={<ProtectedRoute><Avaliacoes /></ProtectedRoute>} />
          <Route path="/chats" element={<ProtectedRoute><Chats /></ProtectedRoute>} />
          <Route path="/chat/:id" element={<ProtectedRoute><ChatConversa /></ProtectedRoute>} />
          <Route path="/chat-cotacao/:cotacaoId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/chat-suporte" element={<ProtectedRoute><ChatSuporte /></ProtectedRoute>} />
          <Route path="/anexar-documentos" element={<ProtectedRoute><AnexarDocumentos /></ProtectedRoute>} />
          <Route path="/completar-cadastro" element={<ProtectedRoute><CompletarCadastro /></ProtectedRoute>} />

          {/* Perfil Editável */}
          <Route path="/perfil-editavel" element={<ProtectedRoute><PerfilEditavel /></ProtectedRoute>} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <InnerApp />
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
