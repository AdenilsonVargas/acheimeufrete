import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex items-center justify-center p-2 rounded-lg
        bg-slate-100 dark:bg-slate-700
        hover:bg-slate-200 dark:hover:bg-slate-600
        transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-orange-500"
      aria-label={`Alternar tema para ${theme === 'light' ? 'escuro' : 'claro'}`}
      title={`Alternar tema para ${theme === 'light' ? 'escuro' : 'claro'}`}
    >
      {theme === 'light' ? (
        <Sun className="w-5 h-5 text-yellow-500" />
      ) : (
        <Moon className="w-5 h-5 text-slate-200" />
      )}
    </button>
  );
}
