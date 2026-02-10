import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import ThemeToggle from './ThemeToggle';
import BrazilClock from './BrazilClock';
import NotificationBell from './NotificationBell';

export default function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    if (confirm('Deseja sair?')) {
      logout();
      navigate('/login', { replace: true });
    }
  };

  // Páginas públicas (não-dashboard)
  const publicPages = ['/', '/sobre', '/faq', '/contato', '/login', '/cadastro', '/registro'];
  const isPublicPage = publicPages.includes(location.pathname);
  
  // Verificar se está em páginas do dashboard
  const isDashboard = location.pathname.startsWith('/dashboard');
  
  // Verificar se está em página protegida (autenticado e NÃO é página pública)
  const isProtectedPage = isAuthenticated && !isPublicPage;

  return (
    <header className="fixed top-0 left-0 right-0 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between gap-4">
        
        {/* Logo - Esquerda (sempre aparece) */}
        <Link to="/" className="flex-shrink-0 hover:opacity-80 transition-opacity">
          <div className="flex items-center gap-2.5">
            {/* Logo Nova sem fundo transparente */}
            <img 
              src="/images/logoatualizada.png" 
              alt="ACHEI MEU FRETE Logo" 
              className="h-12 w-auto object-contain"
            />
            {/* Texto da logo - Dinâmico por tema */}
            <img 
              src={isDark 
                ? "/images/acheimeufretefontebranca.png" 
                : "/images/acheimeufretefontepreta.png"
              }
              alt="ACHEI MEU FRETE" 
              className="h-8 w-auto object-contain hidden sm:block"
            />
          </div>
        </Link>

        {/* Menu Centro - Aparecer em páginas públicas E em páginas protegidas (qualquer página quando autenticado) */}
        {(isPublicPage || isProtectedPage) && (
          <nav className="hidden md:flex items-center gap-6 flex-1 justify-center">
            <Link to="/" className="text-slate-700 dark:text-slate-300 hover:text-orange-500 dark:hover:text-orange-400 text-sm font-medium transition-colors">
              Home
            </Link>
            <Link to="/sobre" className="text-slate-700 dark:text-slate-300 hover:text-orange-500 dark:hover:text-orange-400 text-sm font-medium transition-colors">
              Sobre
            </Link>
            <Link to="/faq" className="text-slate-700 dark:text-slate-300 hover:text-orange-500 dark:hover:text-orange-400 text-sm font-medium transition-colors">
              FAQ
            </Link>
            <Link to="/contato" className="text-slate-700 dark:text-slate-300 hover:text-orange-500 dark:hover:text-orange-400 text-sm font-medium transition-colors">
              Contato
            </Link>
          </nav>
        )}

        {/* Direita - Controles */}
        <div className="flex items-center gap-4 md:gap-6">
          
          {/* ===== CENÁRIO 1: NÃO AUTENTICADO (apenas em páginas públicas) ===== */}
          {!isAuthenticated && isPublicPage && (
            <>
              {/* Relógio */}
              <div className="hidden sm:block">
                <BrazilClock />
              </div>

              {/* Toggle Tema */}
              <ThemeToggle />

              {/* Botão Login */}
              <Link
                to="/login"
                className="px-3 md:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Login
              </Link>

              {/* Botão Cadastro */}
              <Link
                to="/cadastro"
                className="px-3 md:px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Cadastrar
              </Link>
            </>
          )}

          {/* ===== CENÁRIO 2: AUTENTICADO EM PÁGINA PÚBLICA ===== */}
          {isAuthenticated && isPublicPage && (
            <>
              {/* Relógio */}
              <div className="hidden sm:block">
                <BrazilClock />
              </div>

              {/* Sino de notificações */}
              <NotificationBell />

              {/* Bem-vindo e tipo de usuário */}
              {user?.nomeCompleto && (
                <div className="hidden md:flex flex-col text-right text-xs md:text-sm">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    Bem-vindo, {user.nomeCompleto}!
                  </span>
                  <span className="text-slate-600 dark:text-slate-400 capitalize">
                    {user?.userType === 'transportador' ? 'Transportadora' : 'Embarcador'}
                  </span>
                </div>
              )}

              {/* Botão Painel - Vai para dashboard correto baseado no userType */}
              <Link
                to={user?.userType === 'transportador' ? '/dashboard-transportadora' : '/dashboard'}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors text-sm font-medium"
              >
                📊 Painel
              </Link>

              {/* Toggle Tema */}
              <ThemeToggle />

              {/* Botão Sair */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">Sair</span>
              </button>
            </>
          )}

          {/* ===== CENÁRIO 3: AUTENTICADO EM QUALQUER PÁGINA PROTEGIDA ===== */}
          {isAuthenticated && isProtectedPage && (
            <>
              {/* Relógio */}
              <div className="hidden sm:block">
                <BrazilClock />
              </div>

              {/* Sino de notificações */}
              <NotificationBell />

              {/* Bem-vindo e tipo de usuário */}
              {user?.nomeCompleto && (
                <div className="hidden md:flex flex-col text-right text-xs md:text-sm">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    Bem-vindo, {user.nomeCompleto}!
                  </span>
                  <span className="text-slate-600 dark:text-slate-400 capitalize">
                    {user?.userType === 'transportador' ? 'Transportadora' : 'Embarcador'}
                  </span>
                </div>
              )}

              {/* Toggle Tema */}
              <ThemeToggle />

              {/* Botão Sair */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">Sair</span>
              </button>
            </>
          )}

        </div>
      </div>
    </header>
  );
}
