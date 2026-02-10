import { useState } from 'react';
import { Truck, Package } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export default function UserTypeSelector({ onSelect, isLoading = false }) {
  const [selected, setSelected] = useState(null);
  const { theme } = useTheme();

  const handleSelect = (type) => {
    setSelected(type);
    onSelect(type);
  };

  // Cores dinâmicas baseadas no tema
  const bgGradient = theme === 'light'
    ? 'bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50'
    : 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900';

  const titleColor = theme === 'light' ? 'text-slate-900' : 'text-white';
  const subtitleColor = theme === 'light' ? 'text-slate-600' : 'text-slate-300';
  const descriptionColor = theme === 'light' ? 'text-slate-700' : 'text-slate-400';
  
  const cardBorder = theme === 'light' ? 'border-slate-300' : 'border-slate-700';
  const cardBg = theme === 'light' ? 'bg-white' : 'bg-slate-800/50';
  const cardHoverBg = theme === 'light' ? 'hover:bg-slate-50' : 'hover:bg-slate-800';
  const cardHoverBorder = theme === 'light' ? 'hover:border-slate-400' : 'hover:border-blue-400';
  
  const iconBg = theme === 'light' ? 'bg-slate-200' : 'bg-slate-700';
  const iconColorDefault = theme === 'light' ? 'text-slate-600' : 'text-slate-300';
  
  const badgeBg = theme === 'light' ? 'bg-slate-200 text-slate-700' : 'bg-slate-700 text-slate-300';
  
  const infoBg = theme === 'light' 
    ? 'bg-slate-100 border-slate-300' 
    : 'bg-slate-800/50 border-slate-700';
  const infoText = theme === 'light' ? 'text-slate-700' : 'text-slate-300';
  const infoTextBold = theme === 'light' ? 'text-slate-900' : 'text-white';

  return (
    <div className={`min-h-screen ${bgGradient} flex items-center justify-center p-4`}>
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className={`text-4xl font-bold ${titleColor} mb-3`}>Bem-vindo ao Achei Meu Frete</h1>
          <p className={`${subtitleColor} text-lg`}>Selecione o tipo de conta para continuar</p>
        </div>

        {/* Selector Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Transportador Card */}
          <div
            onClick={() => handleSelect('transportador')}
            className={`p-8 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
              selected === 'transportador'
                ? theme === 'light'
                  ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/20'
                  : 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20'
                : `${cardBorder} ${cardBg} ${cardHoverBorder} ${cardHoverBg}`
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isLoading}
          >
            <div className="flex flex-col items-center space-y-4">
              <div className={`p-4 rounded-full ${
                selected === 'transportador'
                  ? theme === 'light'
                    ? 'bg-blue-200'
                    : 'bg-blue-500/20'
                  : iconBg
              }`}>
                <Truck className={`w-12 h-12 ${
                  selected === 'transportador' ? 'text-blue-600 dark:text-blue-400' : iconColorDefault
                }`} />
              </div>
              <div className="text-center">
                <h3 className={`text-xl font-bold ${titleColor} mb-2`}>Transportador</h3>
                <p className={`${descriptionColor} text-sm`}>
                  Acesse como transportador PJ, Autônomo ou permissionário
                </p>
              </div>
              <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                selected === 'transportador'
                  ? 'bg-blue-500 text-white'
                  : badgeBg
              }`}>
                {selected === 'transportador' ? '✓ Selecionado' : 'Selecionar'}
              </div>
            </div>
          </div>

          {/* Embarcador Card */}
          <div
            onClick={() => handleSelect('embarcador')}
            className={`p-8 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
              selected === 'embarcador'
                ? theme === 'light'
                  ? 'border-green-500 bg-green-50 shadow-lg shadow-green-500/20'
                  : 'border-green-500 bg-green-500/10 shadow-lg shadow-green-500/20'
                : `${cardBorder} ${cardBg} ${cardHoverBorder} ${cardHoverBg}`
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isLoading}
          >
            <div className="flex flex-col items-center space-y-4">
              <div className={`p-4 rounded-full ${
                selected === 'embarcador'
                  ? theme === 'light'
                    ? 'bg-green-200'
                    : 'bg-green-500/20'
                  : iconBg
              }`}>
                <Package className={`w-12 h-12 ${
                  selected === 'embarcador' ? 'text-green-600 dark:text-green-400' : iconColorDefault
                }`} />
              </div>
              <div className="text-center">
                <h3 className={`text-xl font-bold ${titleColor} mb-2`}>Embarcador</h3>
                <p className={`${descriptionColor} text-sm`}>
                  Acesse como embarcador, cargador ou despachante
                </p>
              </div>
              <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                selected === 'embarcador'
                  ? 'bg-green-500 text-white'
                  : badgeBg
              }`}>
                {selected === 'embarcador' ? '✓ Selecionado' : 'Selecionar'}
              </div>
            </div>
          </div>
        </div>

        {/* Info Text */}
        <div className={`${infoBg} border rounded-lg p-4 mb-6`}>
          <p className={`${infoText} text-sm`}>
            <span className={`font-semibold ${infoTextBold}`}>💡 Dica:</span> Você pode ter contas em ambas as categorias usando o mesmo email. Basta fazer login selecionando o tipo desejado.
          </p>
        </div>

        {/* Warning - Only show if needed */}
        {selected && (
          <div className={`${
            theme === 'light'
              ? 'bg-blue-50 border-blue-300 text-blue-800'
              : 'bg-blue-900/20 border-blue-500/50 text-blue-300'
          } border rounded-lg p-4`}>
            <p className="text-sm">
              ℹ️ Lembre-se: Após selecionar <span className="font-semibold">{selected === 'transportador' ? 'Transportador' : 'Embarcador'}</span>, você só conseguirá acessar sua conta de <span className="font-semibold">{selected === 'transportador' ? 'transportador' : 'embarcador'}</span> durante esta sessão.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
