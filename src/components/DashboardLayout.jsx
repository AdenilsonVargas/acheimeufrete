import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  MapPin,
  FileText,
  UserCircle,
  BarChart3,
  CreditCard,
  MessageSquare,
  CheckSquare,
  Wallet,
  Star,
  LogOut,
  MapPinned,
  Shield,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotifications } from '@/hooks/useNotifications';

const clientMenuItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard, notifKey: null },
  { title: 'Produtos', url: '/produtos', icon: Package, notifKey: null },
  { title: 'Destinatários', url: '/destinatarios', icon: MapPin, notifKey: null },
  { title: 'Endereços Coleta', url: '/enderecos-coleta', icon: MapPinned, notifKey: null },
  { title: 'Cotações', url: '/cotacoes', icon: FileText, notifKey: 'cotacoes' },
  { title: 'Cotações Aceitas', url: '/cotacoes-aceitas', icon: CheckSquare, notifKey: null },
  { title: 'Confirmar Coleta', url: '/confirmar-coleta', icon: Shield, notifKey: null },
  { title: 'Cotações Coletadas', url: '/cotacoes-coletadas', icon: CheckSquare, notifKey: null },
  { title: 'Cotações Finalizadas', url: '/cotacoes-finalizadas', icon: CheckSquare, notifKey: null },
  { title: 'Chats', url: '/chats', icon: MessageSquare, notifKey: 'chats' },
  { title: 'Créditos', url: '/creditos', icon: Wallet, notifKey: null },
  { title: 'Pacotes Premium', url: '/pacotes-premium', icon: Star, notifKey: null },
  { title: 'Perfil', url: '/perfil', icon: UserCircle, notifKey: null },
  { title: 'Relatórios', url: '/relatorios', icon: BarChart3, notifKey: null },
  { title: 'Pagamentos', url: '/pagamentos', icon: CreditCard, notifKey: null },
];

const transportadorMenuItems = [
  { title: 'Dashboard', url: '/dashboard-transportadora', icon: LayoutDashboard, notifKey: null },
  { title: 'Perfil', url: '/perfil-transportadora', icon: UserCircle, notifKey: null },
  { title: 'Opções de Envio', url: '/opcoes-envio', icon: Shield, notifKey: null },
  { title: 'NCMs Atendidos', url: '/ncms-atendidos', icon: FileText, notifKey: null },
  { title: 'Regiões Atendidas', url: '/regioes-atendidas', icon: MapPinned, notifKey: null },
  { title: 'Cotações Disponíveis', url: '/cotacoes-disponiveis', icon: FileText, notifKey: 'cotacoesDisponiveis' },
  { title: 'Cotações Aceitas', url: '/cotacoes-aceitas-transportadora', icon: CheckSquare, notifKey: 'cotacoesAceitas' },
  { title: 'Em Entrega', url: '/em-entrega-transportadora', icon: Shield, notifKey: null },
  { title: 'Cotações Finalizadas', url: '/cotacoes-finalizadas-transportadora', icon: CheckSquare, notifKey: null },
  { title: 'Chats', url: '/chats-transportadora', icon: MessageSquare, notifKey: 'chats' },
  { title: 'Financeiro', url: '/financeiro-transportadora', icon: Wallet, notifKey: null },
  { title: 'Pacotes Premium', url: '/pacotes-premium', icon: Star, notifKey: null },
  { title: 'Relatórios', url: '/relatorios-transportadora', icon: BarChart3, notifKey: null },
];

export default function DashboardLayout({ children, userType = 'embarcador' }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { isDark } = useTheme();
  const { notifications } = useNotifications() || {};

  const baseMenuItems = userType === 'transportador' ? transportadorMenuItems : clientMenuItems;
  
  const menuItems = baseMenuItems.map(item => ({
    ...item,
    notif: item.notifKey ? (notifications[item.notifKey] || 0) : 0
  }));

  const handleLogout = () => {
    if (confirm('Deseja sair?')) {
      logout();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col pt-20">
      {/* Sidebar fixo no lado esquerdo, abaixo do header global */}
      <aside className={`fixed left-0 top-20 h-[calc(100vh-80px)] w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-lg overflow-y-auto z-40 transition-transform duration-300 md:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Logo/Branding */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 text-center">
          <button
            onClick={() => {
              const dashboardUrl = userType === 'transportador' ? '/dashboard-transportadora' : '/dashboard';
              navigate(dashboardUrl);
              setSidebarOpen(false);
            }}
            className="inline-flex items-center justify-center gap-3 w-full hover:opacity-80 transition-opacity"
            aria-label="Ir para Dashboard"
          >
            <img 
              src="/images/logoatualizada.png" 
              alt="ACHEI MEU FRETE" 
              className="h-14 w-auto object-contain"
            />
            <img 
              src={isDark 
                ? "/images/acheimeufretefontebranca.png" 
                : "/images/acheimeufretefontepreta.png"
              }
              alt="ACHEI MEU FRETE" 
              className="h-8 w-auto object-contain"
            />
          </button>
        </div>

        {/* Menu */}
        <nav className="p-3 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.url;
            const hasNotif = item.notif > 0;
            return (
              <Link
                key={item.url}
                to={item.url}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                  ${
                    isActive
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }
                `}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium text-sm flex-1">{item.title}</span>
                {hasNotif && (
                  <span className="ml-auto w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold bg-red-500 text-white">
                    {item.notif > 9 ? '9+' : item.notif}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout button */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/30 transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 md:ml-64 overflow-auto">
        {/* Mobile hamburger button */}
        <div className="md:hidden sticky top-20 left-0 right-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-3 z-30">
          <button
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Content */}
        <main className="p-4 md:p-8 bg-white dark:bg-slate-950 min-h-full">
          {children}
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-30 top-20"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
