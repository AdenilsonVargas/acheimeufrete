import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Carrossel Dinâmico com Conteúdo no Lado Direito
 * Inspirado no Stripe - texto muda com as imagens
 */
export default function DynamicContentCarousel({ items = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  useEffect(() => {
    if (!isAutoPlay || items.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 5000); // Muda a cada 5 segundos

    return () => clearInterval(interval);
  }, [isAutoPlay, items.length]);

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
    setIsAutoPlay(false);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
    setIsAutoPlay(false);
  };

  if (!items || items.length === 0) return null;

  const currentItem = items[currentIndex];

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
        {/* Esquerda - Imagem com transição suave */}
        <div className="relative aspect-square lg:aspect-auto lg:h-96 rounded-2xl overflow-hidden">
          {/* Container para transições */}
          <div className="relative w-full h-full">
            {items.map((item, idx) => (
              <div
                key={idx}
                className={`absolute inset-0 transition-all duration-700 ${
                  idx === currentIndex
                    ? 'opacity-100 scale-100'
                    : 'opacity-0 scale-95'
                }`}
              >
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${item.gradient}`} />
                )}
              </div>
            ))}
          </div>

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

          {/* Badge */}
          {currentItem.badge && (
            <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-4 py-2 rounded-full text-sm font-semibold text-slate-900 dark:text-white">
              {currentItem.badge}
            </div>
          )}
        </div>

        {/* Direita - Conteúdo Dinâmico */}
        <div className="flex flex-col justify-center">
          {/* Conteúdo com transição */}
          <div className="relative min-h-64">
            {items.map((item, idx) => (
              <div
                key={idx}
                className={`absolute inset-0 transition-all duration-700 ${
                  idx === currentIndex
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-4'
                }`}
              >
                {/* Tag/Badge */}
                {item.tag && (
                  <div className="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-xs md:text-sm font-semibold mb-4">
                    {item.tag}
                  </div>
                )}

                {/* Título */}
                <h3 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4 leading-tight">
                  {item.title}
                </h3>

                {/* Descrição */}
                <p className="text-base md:text-lg text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
                  {item.description}
                </p>

                {/* Highlights */}
                {item.highlights && item.highlights.length > 0 && (
                  <div className="space-y-3 mb-8">
                    {item.highlights.map((highlight, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 mt-2 flex-shrink-0" />
                        <span className="text-slate-700 dark:text-slate-300">{highlight}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* CTA */}
                {item.cta && (
                  <a
                    href={item.cta.href || '#'}
                    className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold hover:gap-3 transition-all duration-300"
                  >
                    {item.cta.label}
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                )}
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-4 mt-12">
            <button
              onClick={goToPrev}
              className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors duration-300"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-5 h-5 text-slate-900 dark:text-white" />
            </button>

            <button
              onClick={goToNext}
              className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors duration-300"
              aria-label="Próximo"
            >
              <ChevronRight className="w-5 h-5 text-slate-900 dark:text-white" />
            </button>

            {/* Indicadores */}
            <div className="flex gap-2 ml-4">
              {items.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentIndex(idx);
                    setIsAutoPlay(false);
                  }}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === currentIndex
                      ? 'bg-blue-600 dark:bg-blue-400 w-8'
                      : 'bg-slate-300 dark:bg-slate-600 w-2'
                  }`}
                  aria-label={`Ir para item ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Resume autoplay on hover leave */}
          <button
            onMouseEnter={() => setIsAutoPlay(false)}
            onMouseLeave={() => setIsAutoPlay(true)}
            className="text-xs text-slate-500 dark:text-slate-400 mt-4"
          >
            {isAutoPlay ? 'Autoplay ativado' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
