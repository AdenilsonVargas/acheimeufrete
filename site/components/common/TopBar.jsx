import React, { useState, useEffect } from 'react';
import { Bell, MessageCircle, LogOut, Settings, Menu, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function TopBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(2);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const getUserBadgeColor = () => {
    if (user?.userType === 'embarcador') return 'bg-blue-500';
    if (user?.userType === 'transportador') return 'bg-orange-500';
    if (user?.userType === 'administrador') return 'bg-red-500';
    return 'bg-gray-500';
  };

  const getUserTypeLabel = () => {
    const types = {
      embarcador: 'Embarcador',
      transportador: 'Transportador',
      administrador: 'Administrador'
    };
    return types[user?.userType] || 'Usuário';
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = () => {
    if (!user?.nomeCompleto) return 'U';
    return user.nomeCompleto
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 shadow-2xl border-b border-slate-700/50">
      {/* Background animated gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

      <div className="relative max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Left section - Logo and User Info */}
          <div className="flex items-center gap-4 flex-1">
            {/* Logo/Brand */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">🚚</span>
              </div>
              <span className="text-white font-bold text-lg hidden sm:inline">AcheimeuFrete</span>
            </div>

            {/* Divider */}
            <div className="hidden sm:block h-8 w-px bg-gradient-to-b from-transparent via-slate-600 to-transparent"></div>

            {/* User Type Badge - Center */}
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-700/50 rounded-lg border border-slate-600/50">
              <div className={`w-3 h-3 rounded-full ${getUserBadgeColor()} animate-pulse`}></div>
              <span className="text-sm font-semibold text-slate-200">{getUserTypeLabel()}</span>
            </div>
          </div>

          {/* Center section - Welcome message (hidden on mobile) */}
          <div className="hidden lg:flex items-center gap-2 flex-1 justify-center">
            <div className="text-center">
              <h2 className="text-white text-lg font-semibold">
                Bem-vindo, <span className="text-orange-400">{user?.nomeCompleto?.split(' ')[0]}</span>!
              </h2>
            </div>
          </div>

          {/* Right section - Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Messages - Hidden on mobile */}
            <button
              onClick={() => navigate('/chats')}
              className="hidden sm:p-2.5 text-slate-300 hover:text-white bg-slate-700/50 hover:bg-slate-600 rounded-lg transition-all duration-200 relative group"
            >
              <MessageCircle size={20} />
              <div className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <div className="absolute -bottom-10 right-0 bg-slate-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Mensagens
              </div>
            </button>

            {/* Notifications */}
            <button
              onClick={() => navigate('/notificacoes')}
              className="p-2.5 text-slate-300 hover:text-white bg-slate-700/50 hover:bg-slate-600 rounded-lg transition-all duration-200 relative group"
            >
              <Bell size={20} />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {notifications}
                </span>
              )}
              <div className="absolute -bottom-10 right-0 bg-slate-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Notificações
              </div>
            </button>

            {/* User Menu - Desktop */}
            <div className="hidden sm:flex relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 rounded-lg transition-all duration-200 group border border-slate-600/50"
              >
                <div className={`w-8 h-8 ${getUserBadgeColor()} rounded-lg flex items-center justify-center text-white font-bold text-sm`}>
                  {getInitials()}
                </div>
                <div className="hidden lg:flex flex-col items-start text-xs">
                  <span className="text-white font-semibold">{user?.nomeCompleto?.split(' ')[0]}</span>
                  <span className="text-slate-400 text-xs">{getUserTypeLabel()}</span>
                </div>
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-50">
                  {/* User Info Header */}
                  <div className="p-4 border-b border-slate-700 bg-gradient-to-r from-slate-700/50 to-slate-800">
                    <p className="text-white font-semibold">{user?.nomeCompleto}</p>
                    <p className="text-slate-400 text-sm">{user?.email}</p>
                    <p className="text-orange-400 text-xs mt-1">{getUserTypeLabel()}</p>
                  </div>

                  {/* Menu Items */}
                  <button
                    onClick={() => {
                      navigate('/perfil');
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors flex items-center gap-2"
                  >
                    <Settings size={16} />
                    Meu Perfil
                  </button>

                  <button
                    onClick={() => {
                      navigate('/configuracoes');
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors flex items-center gap-2"
                  >
                    <Settings size={16} />
                    Configurações
                  </button>

                  <div className="border-t border-slate-700"></div>

                  <button
                    onClick={() => {
                      handleLogout();
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors flex items-center gap-2 font-semibold"
                  >
                    <LogOut size={16} />
                    Sair
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="sm:hidden p-2.5 text-slate-300 hover:text-white bg-slate-700/50 hover:bg-slate-600 rounded-lg transition-all"
            >
              {showMobileMenu ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="sm:hidden absolute top-full left-0 right-0 bg-slate-800 border-b border-slate-700 px-4 py-4 space-y-3">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-700">
            <div className={`w-10 h-10 ${getUserBadgeColor()} rounded-lg flex items-center justify-center text-white font-bold`}>
              {getInitials()}
            </div>
            <div>
              <p className="text-white font-semibold">{user?.nomeCompleto}</p>
              <p className="text-slate-400 text-xs">{getUserTypeLabel()}</p>
            </div>
          </div>

          <button
            onClick={() => navigate('/perfil')}
            className="w-full text-left px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
          >
            Meu Perfil
          </button>

          <button
            onClick={() => navigate('/chats')}
            className="w-full text-left px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
          >
            Mensagens
          </button>

          <button
            onClick={() => handleLogout()}
            className="w-full text-left px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded font-semibold"
          >
            Sair
          </button>
        </div>
      )}
    </div>
  );
}
