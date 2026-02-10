import { useState } from 'react';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';
// Header é globalizado em App.jsx
import Footer from '@/components/Footer';
import Alert from '@/components/Alert';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Aqui você faria a chamada à API
      // await apiClient.contact.send(formData);
      
      setAlert({
        type: 'success',
        title: 'Mensagem enviada!',
        message: 'Obrigado por entrar em contato. Nossa equipe responderá em breve.',
      });
      
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      });

      setTimeout(() => setAlert(null), 5000);
    } catch (error) {
      setAlert({
        type: 'error',
        title: 'Erro',
        message: 'Não foi possível enviar a mensagem. Tente novamente.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-transparent text-slate-900 dark:text-white relative z-10">
      {/* Header globalizado em App.jsx */}

      {/* Hero */}
      <section className="container-responsive py-responsive text-center">
        <h1 className="text-responsive-2xl font-bold text-slate-900 dark:text-white mb-4 sm:mb-6">Entre em Contato</h1>
          <p className="text-responsive-base text-slate-700 dark:text-slate-200 max-w-2xl mx-auto px-4 sm:px-0">
          Tem dúvidas ou quer conhecer melhor a plataforma? Nossa equipe está pronta para ajudar!
        </p>
      </section>

      {/* Content */}
      <section className="container-responsive py-responsive">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-12">
          {/* Form */}
          <div className="card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <h2 className="text-responsive-lg font-bold text-slate-900 dark:text-white mb-4 sm:mb-6">Envie uma mensagem</h2>

            {alert && (
              <Alert
                type={alert.type}
                title={alert.title}
                message={alert.message}
                onClose={() => setAlert(null)}
              />
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 mt-4 sm:mt-6">
              <div>
                <label className="block text-slate-900 dark:text-white font-medium mb-2">Nome</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-orange-600 transition"
                  placeholder="Seu nome"
                />
              </div>

              <div>
                <label className="block text-slate-900 dark:text-white font-medium mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-orange-600 transition"
                  placeholder="seu@email.com"
                />
              </div>

              <div>
                <label className="block text-slate-900 dark:text-white font-medium mb-2">Telefone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-orange-600 transition"
                  placeholder="(XX) XXXXX-XXXX"
                />
              </div>

              <div>
                <label className="block text-slate-900 dark:text-white font-medium mb-2">Assunto</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-orange-600 transition"
                  placeholder="Qual é o assunto?"
                />
              </div>

              <div>
                <label className="block text-slate-900 dark:text-white font-medium mb-2">Mensagem</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows="5"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-orange-600 transition resize-none"
                  placeholder="Digite sua mensagem aqui..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full text-sm sm:text-base py-3 sm:py-3.5"
              >
                {loading ? 'Enviando...' : 'Enviar Mensagem'}
              </button>
            </form>
          </div>

          {/* Contact Info */}
          <div className="space-y-4 sm:space-y-6">
            {/* Email */}
            <div className="card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <div className="flex items-start gap-3 sm:gap-4">
                <Mail className="w-7 h-7 sm:w-8 sm:h-8 text-orange-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-responsive-base font-bold text-slate-900 dark:text-white mb-1">Email</h3>
                  <a
                      href="mailto:contato@acheimeufrete.com.br"
                      className="text-slate-700 dark:text-slate-200 hover:text-orange-600 transition"
                  >
                      contato@acheimeufrete.com.br
                  </a>
                </div>
              </div>
            </div>

            {/* Phone */}
            <div className="card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <div className="flex items-start gap-3 sm:gap-4">
                <Phone className="w-7 h-7 sm:w-8 sm:h-8 text-cyan-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-responsive-base font-bold text-slate-900 dark:text-white mb-1">Telefone</h3>
                  <a
                    href="tel:+5511999999999"
                      className="text-slate-700 dark:text-slate-200 hover:text-cyan-400 transition"
                  >
                    +55 (11) 99999-9999
                  </a>
                    <p className="text-slate-600 dark:text-slate-300 text-sm mt-1">Seg-Sex: 08h às 18h</p>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <div className="flex items-start gap-3 sm:gap-4">
                <MapPin className="w-7 h-7 sm:w-8 sm:h-8 text-teal-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-responsive-base font-bold text-slate-900 dark:text-white mb-1">Localização</h3>
                    <p className="text-slate-700 dark:text-slate-200">São Paulo, SP - Brasil</p>
                    <p className="text-slate-600 dark:text-slate-300 text-sm">Atendemos todo o Brasil</p>
                </div>
              </div>
            </div>

            {/* Hours */}
            <div className="card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <div className="flex items-start gap-3 sm:gap-4">
                <Clock className="w-7 h-7 sm:w-8 sm:h-8 text-orange-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-responsive-base font-bold text-slate-900 dark:text-white mb-1">Horário de Atendimento</h3>
                    <p className="text-slate-700 dark:text-slate-200">Segunda a Sexta: 08h às 18h</p>
                    <p className="text-slate-700 dark:text-slate-200">Sábado: 09h às 13h</p>
                    <p className="text-slate-600 dark:text-slate-300 text-sm mt-2">Suporte emergencial 24h disponível</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
