import { Award, Users, Zap, Globe } from 'lucide-react';
// Header é globalizado em App.jsx
import Footer from '@/components/Footer';
import { useScrollRevealBatch } from '@/hooks/useScrollReveal';

export default function About() {
  useScrollRevealBatch();
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-transparent text-slate-900 dark:text-white relative z-10">
      {/* Header globalizado em App.jsx */}

      {/* Hero */}
      <section className="container-responsive py-responsive text-center reveal">
          <h1 className="text-responsive-2xl font-bold text-slate-900 dark:text-white mb-4 sm:mb-6">Sobre ACHEI MEU FRETE</h1>
          <p className="text-responsive-base text-slate-700 dark:text-slate-200 max-w-2xl mx-auto px-4 sm:px-0">
          Uma plataforma inovadora que conecta embarcadores e transportadores,
          transformando a forma como o transporte de cargas acontece no Brasil.
        </p>
      </section>

      {/* Mission, Vision, Values */}
      <section className="bg-slate-100 dark:bg-slate-900 py-responsive reveal">
        <div className="container-responsive">
          <div className="grid-responsive-cards">
            {/* Missão */}
            <div className="card text-center hover:shadow-xl hover:-translate-y-1 transition-all duration-300 reveal">
              <Zap className="w-10 h-10 sm:w-12 sm:h-12 text-orange-600 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-responsive-lg font-bold text-slate-900 dark:text-white mb-3 sm:mb-4">Nossa Missão</h3>
              <p className="text-responsive-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                Revolucionar o mercado de transporte de cargas através de tecnologia,
                eficiência e transparência, conectando os melhores profissionais.
              </p>
            </div>

            {/* Visão */}
            <div className="card text-center hover:shadow-xl hover:-translate-y-1 transition-all duration-300 reveal">
              <Globe className="w-10 h-10 sm:w-12 sm:h-12 text-cyan-400 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-responsive-lg font-bold text-slate-900 dark:text-white mb-3 sm:mb-4">Nossa Visão</h3>
              <p className="text-responsive-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                Ser a plataforma número 1 de logística e transporte na América Latina,
                referência em inovação e segurança.
              </p>
            </div>

            {/* Valores */}
            <div className="card text-center hover:shadow-xl hover:-translate-y-1 transition-all duration-300 reveal">
              <Award className="w-10 h-10 sm:w-12 sm:h-12 text-teal-400 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-responsive-lg font-bold text-slate-900 dark:text-white mb-3 sm:mb-4">Nossos Valores</h3>
              <p className="text-responsive-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                Transparência, confiabilidade, segurança e compromisso com a
                excelência em cada transação.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* History */}
      <section className="container-responsive py-responsive reveal">
        <h2 className="text-responsive-xl font-bold text-slate-900 dark:text-white text-center mb-8 sm:mb-12">Nossa História</h2>

        <div className="max-w-4xl mx-auto">
          <div className="space-y-6 sm:space-y-8">
            <div className="card hover:shadow-xl transition-all duration-300 reveal">
              <h3 className="text-responsive-lg font-bold text-orange-600 mb-2 sm:mb-3">2024 - Fundação</h3>
                <p className="text-responsive-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                  ACHEI MEU FRETE nasceu com a visão de transformar o mercado de logística brasileiro.
                Identificamos que faltava uma plataforma moderna que conectasse embarcadores e
                transportadores de forma eficiente, segura e transparente.
              </p>
            </div>

            <div className="card hover:shadow-xl transition-all duration-300 reveal">
              <h3 className="text-responsive-lg font-bold text-cyan-400 mb-2 sm:mb-3">2024 - Crescimento Inicial</h3>
                <p className="text-responsive-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                Com o lançamento beta, rapidamente conquistamos milhares de usuários em diferentes
                estados. A resposta do mercado foi tão positiva que expandimos nosso time em 300%.
              </p>
            </div>

            <div className="card hover:shadow-xl transition-all duration-300 reveal">
              <h3 className="text-responsive-lg font-bold text-teal-400 mb-2 sm:mb-3">2024 - Presente e Futuro</h3>
              <p className="text-responsive-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                Continuamos inovando com novas funcionalidades, integrações e expandindo para novos
                mercados. Nossa meta é revolucionar o transporte de cargas em toda a América Latina.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="bg-slate-100 dark:bg-slate-900 py-responsive reveal">
        <div className="container-responsive">
          <h2 className="text-responsive-xl font-bold text-slate-900 dark:text-white text-center mb-8 sm:mb-12">Nosso Time</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {['Adenilson Vargas', 'Equipe de Dev', 'Suporte 24/7', 'Especialistas'].map(
              (member, idx) => (
                <div key={idx} className="card text-center hover:shadow-xl hover:-translate-y-1 transition-all duration-300 reveal">
                  <Users className="w-10 h-10 sm:w-12 sm:h-12 text-orange-600 mx-auto mb-3 sm:mb-4" />
                  <h4 className="text-responsive-base font-bold text-slate-900 dark:text-white">{member}</h4>
                  <p className="text-responsive-xs text-slate-600 dark:text-slate-400">Dedicado à excelência</p>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
