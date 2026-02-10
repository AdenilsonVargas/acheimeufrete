import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Mail, Lock, Sparkles, TrendingUp, ChevronLeft } from 'lucide-react';
import Footer from '@/components/Footer';
import Alert from '@/components/Alert';
import UserTypeSelector from '@/components/UserTypeSelector';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import useAuthStore from '@/hooks/useAuthStore';
import { getRandomLoginMessage } from '@/utils/motivationalMessages';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState(null);
  const [selectedUserType, setSelectedUserType] = useState(null);
  const [showTypeSelector, setShowTypeSelector] = useState(true);
  
  const { login } = useAuth();
  const { isDark } = useTheme();
  const { setSelectedUserType: storeSetSelectedUserType } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setMessage(getRandomLoginMessage());
    // 🔧 SEMPRE mostrar seletor de tipo ao acessar /login
    // Esta função roda sempre que o pathname muda para /login
    // Garante que usuário sempre vê cards de Transportador/Embarcador
    setShowTypeSelector(true);
    setSelectedUserType(null);
    setEmail('');
    setPassword('');
    setError('');
    localStorage.removeItem('selected_user_type');
  }, [location.pathname]); // ← Roda SEMPRE que a URL muda para /login

  const handleUserTypeSelect = (type) => {
    console.log('👤 Tipo de usuário selecionado:', type);
    setSelectedUserType(type);
    storeSetSelectedUserType(type);
    setShowTypeSelector(false);
    setError('');
  };

  const handleBackToTypeSelector = () => {
    console.log('◄ Voltando para seletor de tipo');
    setSelectedUserType(null);
    setShowTypeSelector(true);
    setEmail('');
    setPassword('');
    setError('');
    localStorage.removeItem('selected_user_type');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('🔍 Tentando login com:', { email, password: '***', selectedUserType });
      const response = await login(email, password, selectedUserType);
      console.log('✅ Login sucesso! Resposta:', response);
      const userType = response.user?.tipo || response.user?.userType;

      console.log('👤 Tipo de usuário:', userType);
      console.log('👤 Tipo selecionado:', selectedUserType);
      
      if (selectedUserType === 'transportador' && (userType === 'transportador' || userType === 'transportadora')) {
        console.log('🚚 Redirecionando para dashboard transportadora');
        navigate('/dashboard-transportadora');
      } else if (selectedUserType === 'embarcador' && userType === 'embarcador') {
        console.log('📦 Redirecionando para dashboard embarcador');
        navigate('/dashboard');
      } else if (userType === 'admin') {
        console.log('⚙️ Redirecionando para dashboard admin');
        navigate('/dashboard-admin');
      } else {
        setError(`Tipo de usuário selecionado (${selectedUserType}) não corresponde à sua conta (${userType}).`);
      }
    } catch (err) {
      console.error('❌ Erro ao fazer login:', err);
      setError(err.message || 'Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (showTypeSelector) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <UserTypeSelector onSelect={handleUserTypeSelect} isLoading={loading} />
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {message && (
              <div className="hidden lg:flex flex-col justify-center space-y-6">
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 shadow-xl">
                  <div className="flex items-start gap-3 mb-6">
                    <Sparkles className="w-6 h-6 text-blue-100 flex-shrink-0 mt-1" />
                    <TrendingUp className="w-6 h-6 text-blue-100 flex-shrink-0 mt-1" />
                  </div>
                  
                  <p className="text-lg lg:text-xl font-semibold text-white mb-6 leading-relaxed italic">
                    "{message.texto}"
                  </p>
                  
                  <p className="text-right text-blue-100 font-medium text-base">
                    — {message.autor}
                  </p>

                  <div className="mt-8 pt-6 border-t border-blue-400 border-opacity-40">
                    <p className="text-blue-100 text-sm font-medium">
                      💡 {message.tip}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-xl p-4 text-center border border-green-200 dark:border-green-700/50">
                    <p className="text-2xl font-bold text-green-700 dark:text-green-400">500+</p>
                    <p className="text-green-700 dark:text-green-300 text-xs mt-2 font-medium">Transportadores</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl p-4 text-center border border-blue-200 dark:border-blue-700/50">
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">2K+</p>
                    <p className="text-blue-700 dark:text-blue-300 text-xs mt-2 font-medium">Fretes Mensais</p>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 rounded-xl p-4 text-center border border-amber-200 dark:border-amber-700/50">
                    <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">⭐4.9</p>
                    <p className="text-amber-700 dark:text-amber-300 text-xs mt-2 font-medium">Avaliação</p>
                  </div>
                </div>
              </div>
            )}

            <div className="lg:max-w-md mx-auto w-full">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-slate-800">
                <button
                  onClick={handleBackToTypeSelector}
                  className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold text-sm mb-4 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Mudar tipo de acesso
                </button>

                {/* Logo */}
                <div className="flex flex-col items-center gap-3 mb-6">
                  <img 
                    src="/images/logoatualizada.png" 
                    alt="ACHEI MEU FRETE" 
                    className="h-16 w-auto object-contain"
                  />
                  {/* Texto da logo - Dinâmico por tema */}
                  <img 
                    src={isDark 
                      ? "/images/acheimeufretefontebranca.png" 
                      : "/images/acheimeufretefontepreta.png"
                    }
                    alt="ACHEI MEU FRETE" 
                    className="h-6 w-auto object-contain"
                  />
                </div>

                <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-2">
                  Bem-vindo de volta!
                </h1>
                <p className="text-center text-gray-600 dark:text-gray-400 mb-6 text-sm">
                  Acesse como{' '}
                  <span className={`font-semibold ${
                    selectedUserType === 'transportador' ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-400'
                  }`}>
                    {selectedUserType === 'transportador' ? 'Transportador' : 'Embarcador'}
                  </span>
                </p>

                {error && (
                  <Alert
                    type="error"
                    title="Erro no login"
                    message={error}
                    onClose={() => setError('')}
                  />
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-gray-700 dark:text-gray-200 font-semibold mb-2 text-sm">E-mail</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        placeholder="seu@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 dark:text-gray-200 font-semibold mb-2 text-sm">Senha</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        placeholder="Sua senha"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded bg-gray-50 dark:bg-slate-800 border-gray-300 dark:border-slate-700 accent-blue-600" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Lembrar-me</span>
                    </label>
                    <a href="#" className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition">
                      Esqueci a senha
                    </a>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-7 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-md"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                        Entrando...
                      </span>
                    ) : (
                      '🔓 Entrar'
                    )}
                  </button>
                </form>

                <p className="text-center text-gray-600 dark:text-gray-400 mt-6 text-sm">
                  Não possui conta?{' '}
                  <Link to="/cadastro" className="text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-700 dark:hover:text-blue-300 transition">
                    Cadastre-se aqui
                  </Link>
                </p>

                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-slate-800">
                  <p className="text-gray-500 dark:text-gray-400 text-xs text-center">
                    🔒 Plataforma segura com criptografia de ponta a ponta
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
