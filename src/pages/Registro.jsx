import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Phone, MapPin, Sparkles, TrendingUp, Eye, EyeOff } from 'lucide-react';
// Header é globalizado em App.jsx
import Footer from '@/components/Footer';
import Alert from '@/components/Alert';
import { useAuth } from '@/hooks/useAuth';
import { getRandomRegistroMessage } from '@/utils/motivationalMessages';

export default function Registro() {
  const [form, setForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    senha: '',
    confirmSenha: '',
    cidade: '',
    estado: '',
    cep: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState(null);
  const { register } = useAuth();
  const navigate = useNavigate();

  // Carregar mensagem motivacional aleatória
  useEffect(() => {
    setMessage(getRandomRegistroMessage());
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validações
    if (!form.nome || !form.email || !form.senha) {
      setError('Nome, email e senha são obrigatórios');
      setLoading(false);
      return;
    }

    if (form.senha !== form.confirmSenha) {
      setError('As senhas não conferem');
      setLoading(false);
      return;
    }

    if (form.senha.length < 6) {
      setError('Senha deve ter no mínimo 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      await register({
        nomeCompleto: form.nome,
        email: form.email,
        password: form.senha,
        telefone: form.telefone,
        cidade: form.cidade,
        estado: form.estado,
        cep: form.cep
      });

      // Redirecionar para login com sucesso
      navigate('/login?success=true');
    } catch (err) {
      setError(err.message || 'Erro ao criar cadastro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
      {/* Header globalizado em App.jsx */}

      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            {/* Seção Esquerda - Mensagem Motivacional */}
            {message && (
              <div className="hidden lg:flex flex-col justify-center space-y-6">
                {/* Card Motivacional Principal */}
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

                {/* Cards de Estatísticas */}
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

            {/* Seção Direita - Formulário */}
            <div className="lg:max-w-md mx-auto w-full">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-slate-800 max-h-[calc(100vh-200px)] overflow-y-auto">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-2">
                  Comece agora!
                </h1>
                <p className="text-center text-gray-600 dark:text-gray-400 mb-8 text-sm">
                  Crie sua conta e entre para a comunidade
                </p>

                {error && (
                  <Alert
                    type="error"
                    title="Erro no cadastro"
                    message={error}
                    onClose={() => setError('')}
                  />
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Nome */}
                  <div>
                    <label className="block text-gray-700 dark:text-gray-200 font-semibold mb-2 text-sm">Nome Completo</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
                      <input
                        type="text"
                        name="nome"
                        value={form.nome}
                        onChange={handleChange}
                        required
                        className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        placeholder="João Silva"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-gray-700 dark:text-gray-200 font-semibold mb-2 text-sm">E-mail</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        placeholder="seu@email.com"
                      />
                    </div>
                  </div>

                  {/* Telefone */}
                  <div>
                    <label className="block text-gray-700 dark:text-gray-200 font-semibold mb-2 text-sm">Telefone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
                      <input
                        type="tel"
                        name="telefone"
                        value={form.telefone}
                        onChange={handleChange}
                        className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                  </div>

                  {/* Localização */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-700 dark:text-gray-200 font-semibold mb-2 text-sm">Cidade</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
                        <input
                          type="text"
                          name="cidade"
                          value={form.cidade}
                          onChange={handleChange}
                          className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                          placeholder="São Paulo"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-700 dark:text-gray-200 font-semibold mb-2 text-sm">Estado</label>
                      <input
                        type="text"
                        name="estado"
                        value={form.estado}
                        onChange={handleChange}
                        className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg py-2.5 px-4 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        placeholder="SP"
                        maxLength="2"
                      />
                    </div>
                  </div>

                  {/* CEP */}
                  <div>
                    <label className="block text-gray-700 dark:text-gray-200 font-semibold mb-2 text-sm">CEP</label>
                    <input
                      type="text"
                      name="cep"
                      value={form.cep}
                      onChange={handleChange}
                      className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg py-2.5 px-4 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      placeholder="01234-567"
                    />
                  </div>

                  {/* Senha */}
                  <div>
                    <label className="block text-gray-700 dark:text-gray-200 font-semibold mb-2 text-sm">Senha</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="senha"
                        value={form.senha}
                        onChange={handleChange}
                        required
                        className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg py-2.5 pl-10 pr-12 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        placeholder="Mínimo 6 caracteres"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirmar Senha */}
                  <div>
                    <label className="block text-gray-700 dark:text-gray-200 font-semibold mb-2 text-sm">Confirmar Senha</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmSenha"
                        value={form.confirmSenha}
                        onChange={handleChange}
                        required
                        className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg py-2.5 pl-10 pr-12 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        placeholder="Confirme sua senha"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-7 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-md"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                        Criando conta...
                      </span>
                    ) : (
                      '✨ Cadastrar-se'
                    )}
                  </button>
                </form>

                {/* Login Link */}
                <p className="text-center text-gray-600 dark:text-gray-400 mt-6 text-sm">
                  Já possui conta?{' '}
                  <Link to="/login" className="text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-700 dark:hover:text-blue-300 transition">
                    Faça login
                  </Link>
                </p>

                {/* Security Footer */}
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
