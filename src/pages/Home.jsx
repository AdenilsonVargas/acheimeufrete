import { Truck, Package, DollarSign, Shield, Zap, FileText, TrendingUp, TrendingDown, Users, Gauge, Award, Briefcase, Database, Smartphone, Lock, MapPin, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
// Header é globalizado em App.jsx
import Footer from '@/components/Footer';
import AnimatedCard from '@/components/AnimatedCard';
import AnimatedText from '@/components/AnimatedText';
import AnimatedSection from '@/components/AnimatedSection';
import { useScrollRevealBatch } from '@/hooks/useScrollReveal';
import ImageCarousel from '@/components/ImageCarousel';
import AnimatedFeatureCard from '@/components/AnimatedFeatureCard';
import DynamicContentCarousel from '@/components/DynamicContentCarousel';
import AnimatedIcon from '@/components/AnimatedIcon';
import useStats from '@/hooks/useStats';
import { useTheme } from '@/contexts/ThemeContext';

export default function Home() {
  useScrollRevealBatch();
  const { stats, economy, loading } = useStats();
  const { isDark } = useTheme();

  const carouselItems = [
    {
      title: 'Cotações em Tempo Real',
      description: 'Receba propostas de múltiplos transportadores simultaneamente e escolha a melhor opção.',
      tag: 'EMBARCADOR',
      highlights: ['Compare preços em tempo real', 'Chat com transportadores', 'Rastreamento completo'],
      badge: 'Popular',
      gradient: 'from-blue-500 to-blue-600',
      cta: { label: 'Criar Cotação', href: '/cadastro' },
    },
    {
      title: 'Crescimento Exponencial',
      description: 'Pequenas transportadoras recebem dezenas de oportunidades qualificadas diariamente.',
      tag: 'TRANSPORTADOR',
      highlights: ['Acesso a centenas de embarcadores', 'Filtros por NCM', 'Pagamento garantido'],
      badge: 'Novo',
      gradient: 'from-green-500 to-green-600',
      cta: { label: 'Começar', href: '/cadastro' },
    },
    {
      title: 'Inteligência Artificial',
      description: 'Otimizações automáticas de rotas e custos com machine learning.',
      tag: 'INOVAÇÃO',
      highlights: ['Análise preditiva', 'Otimização de rotas', 'Recomendações'],
      badge: 'Beta',
      gradient: 'from-purple-500 to-purple-600',
      cta: { label: 'Explorar', href: '/sobre' },
    },
  ];

  const professionalFeatures = [
    { title: 'Integração Perfeita', description: 'APIs com ERP, CRM e suas ferramentas.', icon: Database, gradient: 'from-blue-500 to-cyan-500', accentColor: 'text-blue-600' },
    { title: 'Mobile First', description: 'App iOS e Android com todos os recursos.', icon: Smartphone, gradient: 'from-green-500 to-emerald-500', accentColor: 'text-green-600' },
    { title: 'Segurança Máxima', description: 'Criptografia, ISO e conformidade LGPD.', icon: Lock, gradient: 'from-orange-500 to-red-500', accentColor: 'text-orange-600' },
    { title: 'Escalabilidade', description: 'Infraestrutura que cresce com você.', icon: Zap, gradient: 'from-purple-500 to-pink-500', accentColor: 'text-purple-600' },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white relative z-10">
      {/* Header globalizado em App.jsx */}

      {/* Hero Section */}
      <section className="container-responsive py-responsive relative z-20">
        <div className="relative overflow-hidden rounded-3xl border border-gray-200/80 dark:border-slate-800/70 bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl shadow-xl px-4 sm:px-10 py-10 sm:py-14">
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          
          {/* Logo Branding Section */}
          <AnimatedSection delay={0.05} className="mb-6 sm:mb-8">
            <div className="flex flex-col items-center gap-3 sm:gap-4 justify-center">
              {/* Logo Nova sem fundo transparente */}
              <img 
                src="/images/logoatualizada.png" 
                alt="ACHEI MEU FRETE" 
                className="h-24 sm:h-28 md:h-32 w-auto object-contain hover:scale-105 transition-transform duration-300"
              />
              {/* Texto da logo - Dinâmico por tema */}
              <img 
                src={isDark 
                  ? "/images/acheimeufretefontebranca.png" 
                  : "/images/acheimeufretefontepreta.png"
                }
                alt="ACHEI MEU FRETE" 
                className="h-8 sm:h-10 w-auto object-contain"
              />
            </div>
          </AnimatedSection>

          <AnimatedText type="normal" delay={0.1}>
            <div className="inline-block bg-blue-600/20 border border-blue-600/40 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 mb-4 sm:mb-6">
              <p className="text-blue-600 dark:text-blue-400 text-xs sm:text-sm font-semibold">🚀 Plataforma de Logística #1 do Brasil</p>
            </div>
          </AnimatedText>
          
          <AnimatedText type="title" delay={0.2} className="mb-4 sm:mb-6 px-2 sm:px-0">
            <h1 className="text-responsive-2xl font-bold text-slate-900 dark:text-white leading-tight" style={{ fontFamily: '"Sora", system-ui, sans-serif' }}>
              Revolucione sua Logística
              <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mt-2">com Inteligência e Economia</span>
            </h1>
          </AnimatedText>
          
          <AnimatedText type="subtitle" delay={0.3} className="mb-6 sm:mb-8 max-w-3xl mx-auto px-4 sm:px-0">
            <p className="text-responsive-base text-gray-700 dark:text-slate-200 leading-relaxed">
              A plataforma #1 de <span className="font-semibold text-blue-600 dark:text-blue-400">e-commerce logístico</span> que conecta embarcadores e transportadores com inteligência. <span className="font-semibold">Economize até 43%</span>, <span className="font-semibold text-green-600">aumentue faturamento</span> e <span className="font-semibold">alcance novos mercados</span>.
            </p>
          </AnimatedText>
          
          <AnimatedSection delay={0.4} className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
            <Link to="/cadastro" className="btn-primary inline-block text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 font-semibold">
              Comece Grátis Agora
            </Link>
            <Link to="/sobre" className="btn-secondary inline-block text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 font-semibold">
              Conheça Nossa Solução
            </Link>
          </AnimatedSection>
        </div>
        </div>

        {/* Carrossel de Benefícios */}
        <AnimatedSection delay={0.5} className="mb-12 sm:mb-16 md:mb-20">
          <ImageCarousel />
        </AnimatedSection>
      </section>

      {/* Carrossel Dinâmico - Soluções Customizadas */}
      <section className="container-responsive py-responsive relative z-20">
        <AnimatedText type="title" delay={0.1} className="text-responsive-xl font-bold text-slate-900 dark:text-white text-center mb-4 sm:mb-6">
          💡 Duas Soluções, Infinitas Oportunidades
        </AnimatedText>
        <AnimatedText type="subtitle" delay={0.2} className="text-center text-responsive-base text-slate-700 dark:text-slate-300 mb-12 max-w-3xl mx-auto">
          Plataforma especializada que atende às necessidades específicas de cada segmento
        </AnimatedText>
        <DynamicContentCarousel items={carouselItems} />
      </section>

      {/* Cards com Animações Profissionais */}
      <section className="bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-900 py-responsive relative z-20">
        <div className="container-responsive">
          <AnimatedText type="title" delay={0.1} className="text-responsive-xl font-bold text-slate-900 dark:text-white text-center mb-4 sm:mb-6">
            Recursos Profissionais
          </AnimatedText>
          <AnimatedText type="subtitle" delay={0.2} className="text-center text-responsive-base text-slate-700 dark:text-slate-300 mb-12 max-w-2xl mx-auto">
            Tecnologia enterprise para escalabilidade e performance
          </AnimatedText>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {professionalFeatures.map((feature, idx) => (
              <AnimatedFeatureCard
                key={idx}
                title={feature.title}
                description={feature.description}
                icon={feature.icon}
                gradient={feature.gradient}
                accentColor={feature.accentColor}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Seção: Por Que Escolher ACHEI MEU FRETE - Reposicionada e Otimizada */}
      <section className="bg-slate-100 dark:bg-slate-900 py-responsive relative z-20 reveal">
        <div className="container-responsive">
          <AnimatedText type="title" delay={0.1} className="text-responsive-xl font-bold text-slate-900 dark:text-white text-center mb-4 sm:mb-6">
            🎯 Por Que Escolher a Plataforma #1 de Logística Digital?
          </AnimatedText>

          <AnimatedText type="subtitle" delay={0.2} className="text-center text-responsive-base text-slate-700 dark:text-slate-300 mb-12 max-w-3xl mx-auto">
            A solução completa que transforma sua operação logística com economia real, oportunidades ilimitadas e alcance nacional
          </AnimatedText>

          <div className="grid-responsive-cards">
            <AnimatedCard delay={0.3} className="card hover:border-blue-600 transition hover:shadow-xl hover:-translate-y-1 reveal">
              <DollarSign className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600 mb-3 sm:mb-4" />
              <h3 className="text-responsive-lg font-bold text-slate-900 dark:text-white mb-2">💰 Economia Garantida para Embarcadores</h3>
              <p className="text-responsive-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
                Compare múltiplas propostas de transportadores e economize até 43% em sua operação logística. Transparência total de preços.
              </p>
              <ul className="text-sm space-y-1 text-slate-600 dark:text-slate-400">
                <li>✓ Cotações em tempo real</li>
                <li>✓ Menores preços garantidos</li>
                <li>✓ Zero intermediários</li>
              </ul>
            </AnimatedCard>

            <AnimatedCard delay={0.4} className="card hover:border-green-600 transition hover:shadow-xl hover:-translate-y-1 reveal">
              <TrendingUp className="w-10 h-10 sm:w-12 sm:h-12 text-green-600 mb-3 sm:mb-4" />
              <h3 className="text-responsive-lg font-bold text-slate-900 dark:text-white mb-2">📈 Crescimento de Faturamento</h3>
              <p className="text-responsive-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
                Transportadores aumentam renda de forma exponencial acessando centenas de oportunidades diárias de frete qualificado.
              </p>
              <ul className="text-sm space-y-1 text-slate-600 dark:text-slate-400">
                <li>✓ Oportunidades ilimitadas</li>
                <li>✓ Sem intermediários comissionistas</li>
                <li>✓ Recebimento garantido</li>
              </ul>
            </AnimatedCard>

            <AnimatedCard delay={0.5} className="card hover:border-cyan-600 transition hover:shadow-xl hover:-translate-y-1 reveal">
              <MapPin className="w-10 h-10 sm:w-12 sm:h-12 text-cyan-600 mb-3 sm:mb-4" />
              <h3 className="text-responsive-lg font-bold text-slate-900 dark:text-white mb-2">🌍 Expansão Geográfica</h3>
              <p className="text-responsive-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
                Transportadores alcançam mercados em todo Brasil. Embarcadores acessam rede nacional de transportes com um clique.
              </p>
              <ul className="text-sm space-y-1 text-slate-600 dark:text-slate-400">
                <li>✓ Cobertura nacional</li>
                <li>✓ Filtros por região NCM</li>
                <li>✓ Acesso ilimitado</li>
              </ul>
            </AnimatedCard>

            <AnimatedCard delay={0.6} className="card hover:border-purple-600 transition hover:shadow-xl hover:-translate-y-1 reveal">
              <Shield className="w-10 h-10 sm:w-12 sm:h-12 text-purple-600 mb-3 sm:mb-4" />
              <h3 className="text-responsive-lg font-bold text-slate-900 dark:text-white mb-2">🔒 Seguro e Confiável</h3>
              <p className="text-responsive-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
                Transportadores verificados, pagamento garantido, rastreamento 24/7 e suporte especializado para sua tranquilidade.
              </p>
              <ul className="text-sm space-y-1 text-slate-600 dark:text-slate-400">
                <li>✓ Perfis verificados</li>
                <li>✓ Rastreamento em tempo real</li>
                <li>✓ Suporte 24/7</li>
              </ul>
            </AnimatedCard>

            <AnimatedCard delay={0.7} className="card hover:border-pink-600 transition hover:shadow-xl hover:-translate-y-1 reveal">
              <Zap className="w-10 h-10 sm:w-12 sm:h-12 text-pink-600 mb-3 sm:mb-4" />
              <h3 className="text-responsive-lg font-bold text-slate-900 dark:text-white mb-2">⚡ Operação Inteligente</h3>
              <p className="text-responsive-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
                Inteligência artificial otimiza rotas, custos e operações. Automação de processos que ganham tempo e reduzem erros.
              </p>
              <ul className="text-sm space-y-1 text-slate-600 dark:text-slate-400">
                <li>✓ IA na otimização</li>
                <li>✓ Processos automáticos</li>
                <li>✓ Análises em tempo real</li>
              </ul>
            </AnimatedCard>

            <AnimatedCard delay={0.8} className="card hover:border-orange-600 transition hover:shadow-xl hover:-translate-y-1 reveal">
              <Users className="w-10 h-10 sm:w-12 sm:h-12 text-orange-600 mb-3 sm:mb-4" />
              <h3 className="text-responsive-lg font-bold text-slate-900 dark:text-white mb-2">🤝 Comunidade Ativa</h3>
              <p className="text-responsive-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
                Rede colaborativa que impulsiona crescimento mútuo. Conexões que geram oportunidades de negócio para todos.
              </p>
              <ul className="text-sm space-y-1 text-slate-600 dark:text-slate-400">
                <li>✓ Networking ativo</li>
                <li>✓ Suporte comunitário</li>
                <li>✓ Parcerias estratégicas</li>
              </ul>
            </AnimatedCard>
          </div>
        </div>
      </section>

      {/* Ícones Animados */}
      <section className="container-responsive py-responsive relative z-20">
        <AnimatedText type="title" delay={0.1} className="text-responsive-xl font-bold text-slate-900 dark:text-white text-center mb-12">
          Características que Definem Excelência
        </AnimatedText>
        <div className="flex flex-wrap justify-center gap-12">
          {[
            { icon: Zap, label: 'Rápido', animationType: 'bounce' },
            { icon: Shield, label: 'Seguro', animationType: 'float' },
            { icon: TrendingUp, label: 'Crescimento', animationType: 'shimmer' },
            { icon: Users, label: 'Colaborativo', animationType: 'wiggle' },
          ].map((feature, idx) => (
            <div key={idx} className="flex flex-col items-center gap-4">
              <AnimatedIcon
                Icon={feature.icon}
                animationType={feature.animationType}
                size="w-16 h-16"
                color="text-blue-600 dark:text-blue-400"
                duration={`${2 + (idx % 3)}s`}
              />
              <p className="font-semibold text-slate-700 dark:text-slate-300">{feature.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section - Embarcadores vs Transportadores */}
      <section className="container-responsive py-responsive relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-12">
          <AnimatedCard delay={0.3} className="card border-l-4 border-blue-600 reveal">
            <Package className="w-12 h-12 sm:w-16 sm:h-16 text-blue-600 mb-6" />
            <h3 className="text-responsive-lg font-bold text-slate-900 dark:text-white mb-4">
              📦 Para Embarcadores: Economia & Eficiência
            </h3>
            <p className="text-slate-700 dark:text-slate-300 mb-6 text-responsive-base">
              Reduza seus custos logísticos de forma imediata. Tenha acesso a uma rede nacional de transportadores verificados e compare preços em tempo real. Sem intermediários, sem surpresas.
            </p>
            <ul className="space-y-3 mb-6">
              <li className="text-slate-700 dark:text-slate-300 text-sm"><span className="text-blue-600 font-bold">✓</span> <span className="font-semibold">Economia de até 43%</span> em custos logísticos</li>
              <li className="text-slate-700 dark:text-slate-300 text-sm"><span className="text-blue-600 font-bold">✓</span> <span className="font-semibold">Cotações automáticas</span> de transportadores verificados</li>
              <li className="text-slate-700 dark:text-slate-300 text-sm"><span className="text-blue-600 font-bold">✓</span> <span className="font-semibold">Rastreamento 24/7</span> de suas operações</li>
              <li className="text-slate-700 dark:text-slate-300 text-sm"><span className="text-blue-600 font-bold">✓</span> <span className="font-semibold">Documentação automática</span> (NF-e, CT-e, CIOT)</li>
              <li className="text-slate-700 dark:text-slate-300 text-sm"><span className="text-blue-600 font-bold">✓</span> <span className="font-semibold">Pagamento seguro</span> com proteção total</li>
            </ul>
            <Link to="/cadastro" className="btn-primary inline-block w-full text-center py-3 sm:py-4 font-semibold text-sm sm:text-base">
              🚀 Começar a Economizar Agora
            </Link>
          </AnimatedCard>

          <AnimatedCard delay={0.4} className="card border-l-4 border-green-600 reveal">
            <Truck className="w-12 h-12 sm:w-16 sm:h-16 text-green-600 mb-6" />
            <h3 className="text-responsive-lg font-bold text-slate-900 dark:text-white mb-4">
              🚚 Para Transportadores: Crescimento & Faturamento
            </h3>
            <p className="text-slate-700 dark:text-slate-300 mb-6 text-responsive-base">
              Multiplique suas oportunidades de frete. Acesse centenas de embarcadores qualificados diariamente e aumente seu faturamento sem investimentos adicionais. Crescimento garantido.
            </p>
            <ul className="space-y-3 mb-6">
              <li className="text-slate-700 dark:text-slate-300 text-sm"><span className="text-green-600 font-bold">✓</span> <span className="font-semibold">Oportunidades ilimitadas</span> de frete todos os dias</li>
              <li className="text-slate-700 dark:text-slate-300 text-sm"><span className="text-green-600 font-bold">✓</span> <span className="font-semibold">Aumento de faturamento</span> exponencial em 90 dias</li>
              <li className="text-slate-700 dark:text-slate-300 text-sm"><span className="text-green-600 font-bold">✓</span> <span className="font-semibold">Expansão geográfica</span> para novos mercados</li>
              <li className="text-slate-700 dark:text-slate-300 text-sm"><span className="text-green-600 font-bold">✓</span> <span className="font-semibold">Pagamento garantido</span> em até 48 horas</li>
              <li className="text-slate-700 dark:text-slate-300 text-sm"><span className="text-green-600 font-bold">✓</span> <span className="font-semibold">Sem taxas ou comissões</span> abusivas</li>
            </ul>
            <Link to="/cadastro" className="btn-primary inline-block w-full text-center py-3 sm:py-4 font-semibold text-sm sm:text-base">
              📈 Aumentar Meu Faturamento Agora
            </Link>
          </AnimatedCard>
        </div>
      </section>

      {/* Plataforma em Crescimento - Contadores Dinâmicos */}
      <section className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 py-20 relative z-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              🚀 Plataforma em Crescimento Exponencial
            </h2>
            <p className="text-white/90 text-lg max-w-2xl mx-auto">
              Acompa nhe o crescimento em tempo real da maior rede de logística inteligente do Brasil
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
            {/* Transportadores */}
            <div className="bg-white/10 backdrop-blur rounded-xl p-6 text-center border border-white/20 hover:bg-white/20 transition">
              <Truck className="w-8 h-8 text-white mx-auto mb-3" />
              <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                {loading ? '...' : stats.transportadores.toLocaleString('pt-BR')}+
              </div>
              <p className="text-white/80 text-sm font-semibold">Transportadores</p>
              <p className="text-white/60 text-xs mt-2">Conectados e crescendo</p>
            </div>

            {/* Embarcadores */}
            <div className="bg-white/10 backdrop-blur rounded-xl p-6 text-center border border-white/20 hover:bg-white/20 transition">
              <Package className="w-8 h-8 text-white mx-auto mb-3" />
              <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                {loading ? '...' : stats.embarcadores.toLocaleString('pt-BR')}+
              </div>
              <p className="text-white/80 text-sm font-semibold">Embarcadores</p>
              <p className="text-white/60 text-xs mt-2">Economizando todos os dias</p>
            </div>

            {/* Cotações Criadas */}
            <div className="bg-white/10 backdrop-blur rounded-xl p-6 text-center border border-white/20 hover:bg-white/20 transition">
              <FileText className="w-8 h-8 text-white mx-auto mb-3" />
              <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                {loading ? '...' : stats.cotacoesCriadas.toLocaleString('pt-BR')}+
              </div>
              <p className="text-white/80 text-sm font-semibold">Cotações Criadas</p>
              <p className="text-white/60 text-xs mt-2">Oportunidades de frete</p>
            </div>

            {/* Cotações Finalizadas */}
            <div className="bg-white/10 backdrop-blur rounded-xl p-6 text-center border border-white/20 hover:bg-white/20 transition">
              <TrendingUp className="w-8 h-8 text-white mx-auto mb-3" />
              <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                {loading ? '...' : stats.cotacoesFinalizadas.toLocaleString('pt-BR')}
              </div>
              <p className="text-white/80 text-sm font-semibold">Entregas Realizadas</p>
              <p className="text-white/60 text-xs mt-2">Transações concluídas</p>
            </div>

            {/* Economia Gerada */}
            <div className="bg-white/10 backdrop-blur rounded-xl p-6 text-center border border-white/20 hover:bg-white/20 transition">
              <DollarSign className="w-8 h-8 text-white mx-auto mb-3" />
              <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                {loading ? '...' : `${economy.percentualMedio}%`}
              </div>
              <p className="text-white/80 text-sm font-semibold">Economia Média</p>
              <p className="text-white/60 text-xs mt-2">Em cada cotação</p>
            </div>
          </div>

          {/* Valores Dinâmicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
            <div className="bg-white/10 backdrop-blur rounded-xl p-8 border border-white/20">
              <div className="flex items-center gap-4 mb-4">
                <Activity className="w-6 h-6 text-green-300" />
                <h3 className="text-white font-bold text-lg">Valor em Cotações Aceitas</h3>
              </div>
              <p className="text-white/80">Montante total de negócios fechados com transmutação de valor:</p>
              <div className="text-4xl font-bold text-white mt-4">
                {loading ? 'R$ ...' : `R$ ${parseFloat(stats.valorCotacoesAceitas).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-xl p-8 border border-white/20">
              <div className="flex items-center gap-4 mb-4">
                <TrendingDown className="w-6 h-6 text-green-300" />
                <h3 className="text-white font-bold text-lg">Valor em Entregas Finalizadas</h3>
              </div>
              <p className="text-white/80">Montante de logística realizada com sucesso e conclusão total:</p>
              <div className="text-4xl font-bold text-white mt-4">
                {loading ? 'R$ ...' : `R$ ${parseFloat(stats.valorCotacoesFinalizadas).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </div>
            </div>
          </div>

          <p className="text-white/70 text-center text-sm mt-8">
            ✨ Contadores atualizados em tempo real. Faça parte dessa revolução logística!
          </p>
        </div>
      </section>

      {/* Final CTA - Otimizado para Conversão */}
      <section className="container mx-auto px-4 py-20 relative z-20">
        <AnimatedCard delay={0.2} className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/40 dark:to-purple-950/40 border border-blue-300 dark:border-blue-600/60 rounded-2xl p-12 text-center reveal">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            🚀 Transforme Sua Logística Agora Mesmo!
          </h2>
          <p className="text-lg text-gray-700 dark:text-slate-300 mb-8 max-w-2xl mx-auto">
            Não fique para trás. Veja como embarcadores economizam dezenas de milhares e transportadores aumentam faturamento exponencialmente. <span className="font-semibold">Cadastre-se grátis e sem cartão de crédito</span>.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Link to="/cadastro" className="btn-primary inline-block text-lg px-10 py-4 font-semibold">
              ✨ Cadastre-se Grátis Agora
            </Link>
            <a href="#" className="btn-ghost inline-block text-lg px-10 py-4 font-semibold">
              📞 Agende uma Demonstração
            </a>
          </div>
          <p className="text-gray-600 dark:text-slate-400 text-sm mt-6">
            ⭐ Junte-se a milhares economizando, crescendo e profissionalizando suas operações
          </p>
        </AnimatedCard>
      </section>

      <Footer />
    </div>
  );
}
