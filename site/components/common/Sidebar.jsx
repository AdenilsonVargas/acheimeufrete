import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  MessageCircle,
  Settings,
  LogOut,
  ChevronDown,
  Zap,
  Users,
  TrendingUp,
  FileText,
  CreditCard,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedMenu, setExpandedMenu] = useState(null);
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard',
      badge: null,
    },
    {
      label: 'Cotações',
      icon: TrendingUp,
      submenu: [
        { label: 'Minhas Cotações', path: '/cotacoes', icon: Package },
        { label: 'Criar Cotação', path: '/criar-cotacao', icon: Zap },
        { label: 'Cotações Disponíveis', path: '/cotacoes-disponiveis', icon: FileText },
      ],
    },
    {
      label: 'Fretes',
      icon: Package,
      submenu: [
        { label: 'Meus Fretes', path: '/meus-fretes', icon: Package },
        { label: 'Fretes Aceitos', path: '/fretes-aceitos', icon: Clock },
        { label: 'Histórico', path: '/historico-fretes', icon: FileText },
      ],
    },
    {
      label: 'Mensagens',
      icon: MessageCircle,
      path: '/chats',
      badge: 2,
    },
    {
      label: 'Endereços',
      icon: Users,
      path: '/enderecos',
    },
    {
      label: 'Pagamentos',
      icon: CreditCard,
      path: '/pagamentos',
    },
  ];

  // Filter menu based on user type
  const getMenuForUserType = () => {
    if (user?.userType === 'embarcador') {
      return menuItems.filter(item => item.label !== 'Fretes');
    }
    if (user?.userType === 'transportador') {
      return menuItems.filter(item => item.label !== 'Cotações');
    }
    return menuItems;
  };

  const filteredMenu = getMenuForUserType();

  return (
    <aside
      className={`fixed left-0 top-20 h-[calc(100vh-80px)] bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700/50 transition-all duration-300 z-40 overflow-y-auto ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Sidebar Content */}
      <nav className="pt-6 px-3 space-y-2">
        {filteredMenu.map((item, index) => (
          <div key={index}>
            {/* Main Menu Item */}
            {item.submenu ? (
              <button
                onClick={() =>
                  setExpandedMenu(expandedMenu === item.label ? null : item.label)
                }
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 group ${
                  expandedMenu === item.label
                    ? 'bg-gradient-to-r from-orange-500/20 to-orange-400/10 text-orange-400 border border-orange-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon
                    size={20}
                    className="transition-transform group-hover:scale-110"
                  />
                  {!collapsed && <span className="font-medium">{item.label}</span>}
                </div>
                {!collapsed && (
                  <ChevronDown
                    size={16}
                    className={`transition-transform ${
                      expandedMenu === item.label ? 'rotate-180' : ''
                    }`}
                  />
                )}
              </button>
            ) : (
              <Link
                to={item.path}
                className={`flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 group ${
                  isActive(item.path)
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon
                    size={20}
                    className="transition-transform group-hover:scale-110"
                  />
                  {!collapsed && <span className="font-medium">{item.label}</span>}
                </div>
                {!collapsed && item.badge && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            )}

            {/* Submenu */}
            {item.submenu && expandedMenu === item.label && !collapsed && (
              <div className="mt-2 ml-4 space-y-1 border-l-2 border-slate-700/50 pl-2">
                {item.submenu.map((subitem, subindex) => (
                  <Link
                    key={subindex}
                    to={subitem.path}
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 text-sm ${
                      isActive(subitem.path)
                        ? 'bg-orange-500/20 text-orange-400 border-l-2 border-orange-500'
                        : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/50'
                    }`}
                  >
                    <subitem.icon size={16} />
                    <span>{subitem.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Divider */}
      <div className="my-6 mx-3 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>

      {/* Settings and Logout */}
      <nav className="px-3 space-y-2 pb-6">
        <Link
          to="/configuracoes"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
            isActive('/configuracoes')
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
              : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          <Settings size={20} className="transition-transform group-hover:rotate-90" />
          {!collapsed && <span className="font-medium">Configurações</span>}
        </Link>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 group"
        >
          <LogOut size={20} className="transition-transform group-hover:scale-110" />
          {!collapsed && <span className="font-medium">Sair</span>}
        </button>
      </nav>

      {/* Collapse Button */}
      <div className="absolute -right-3 bottom-24 bg-slate-800 border border-slate-700 rounded-full p-1 cursor-pointer hover:bg-slate-700 transition-all">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-slate-400 hover:text-white transition-colors"
        >
          <ChevronRight size={16} className={`transition-transform ${collapsed ? '' : 'rotate-180'}`} />
        </button>
      </div>
    </aside>
  );
}
