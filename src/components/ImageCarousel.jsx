import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const slides = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=1200&q=80',
    title: 'Economia Inteligente',
    description: 'Reduza seus custos de frete em até 43% com cotações competitivas em tempo real',
    textColor: 'text-white',
    titleColor: 'text-orange-400'
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&q=80',
    title: 'Rastreamento em Tempo Real',
    description: 'Acompanhe suas cargas do início ao fim com tecnologia de ponta e segurança total',
    textColor: 'text-white',
    titleColor: 'text-cyan-400'
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=1200&q=80',
    title: 'Rede Nacional de Transportadores',
    description: 'Conecte-se com milhares de transportadores qualificados em todo o Brasil',
    textColor: 'text-white',
    titleColor: 'text-green-400'
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1200&q=80',
    title: 'Gestão Simplificada',
    description: 'Dashboard intuitivo para controlar todas as suas operações logísticas em um só lugar',
    textColor: 'text-white',
    titleColor: 'text-purple-400'
  },
  {
    id: 5,
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80',
    title: 'Crescimento Garantido',
    description: 'Pequenas transportadoras crescem 300% em média no primeiro ano na plataforma',
    textColor: 'text-white',
    titleColor: 'text-pink-400'
  }
];

export default function ImageCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const nextSlide = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [isTransitioning]);

  const prevSlide = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [isTransitioning]);

  const goToSlide = useCallback((index) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide(index);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [isTransitioning]);

  // Auto-play
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide]);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'ArrowRight') nextSlide();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide]);

  return (
    <div 
      className="relative w-full h-[400px] sm:h-[500px] md:h-[600px] lg:h-[650px] overflow-hidden rounded-2xl shadow-2xl group"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      role="region"
      aria-label="Carrossel de benefícios da plataforma"
    >
      {/* Slides */}
      <div className="relative w-full h-full">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-all duration-500 ease-in-out ${
              index === currentSlide
                ? 'opacity-100 scale-100 z-10'
                : 'opacity-0 scale-95 z-0'
            }`}
            aria-hidden={index !== currentSlide}
          >
            {/* Background Image with Overlay */}
            <div className="absolute inset-0">
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover"
                loading={index === 0 ? 'eager' : 'lazy'}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
            </div>

            {/* Content */}
            <div className="relative h-full flex flex-col justify-end p-6 sm:p-8 md:p-12 lg:p-16">
              <div className="max-w-3xl space-y-3 sm:space-y-4 animate-fade-in-up">
                <h3 
                  className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold ${slide.titleColor} drop-shadow-lg`}
                  style={{ fontFamily: '"Sora", system-ui, sans-serif' }}
                >
                  {slide.title}
                </h3>
                <p 
                  className={`text-base sm:text-lg md:text-xl lg:text-2xl ${slide.textColor} drop-shadow-md leading-relaxed`}
                  style={{ fontFamily: '"Sora", system-ui, sans-serif' }}
                >
                  {slide.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows - Hidden on mobile, visible on tablet+ */}
      <button
        onClick={prevSlide}
        disabled={isTransitioning}
        className="hidden md:flex absolute left-4 lg:left-6 top-1/2 -translate-y-1/2 z-20
          bg-white/10 hover:bg-white/20 backdrop-blur-sm
          text-white p-3 lg:p-4 rounded-full
          transition-all duration-300 opacity-0 group-hover:opacity-100
          focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-orange-500
          disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Slide anterior"
      >
        <ChevronLeft className="w-6 h-6 lg:w-8 lg:h-8" />
      </button>

      <button
        onClick={nextSlide}
        disabled={isTransitioning}
        className="hidden md:flex absolute right-4 lg:right-6 top-1/2 -translate-y-1/2 z-20
          bg-white/10 hover:bg-white/20 backdrop-blur-sm
          text-white p-3 lg:p-4 rounded-full
          transition-all duration-300 opacity-0 group-hover:opacity-100
          focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-orange-500
          disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Próximo slide"
      >
        <ChevronRight className="w-6 h-6 lg:w-8 lg:h-8" />
      </button>

      {/* Dots Navigation */}
      <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2 sm:gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            disabled={isTransitioning}
            className={`transition-all duration-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500
              ${index === currentSlide 
                ? 'w-8 sm:w-10 md:w-12 h-2 sm:h-2.5 bg-orange-500' 
                : 'w-2 sm:w-2.5 h-2 sm:h-2.5 bg-white/50 hover:bg-white/80'
              }`}
            aria-label={`Ir para slide ${index + 1}`}
            aria-current={index === currentSlide}
          />
        ))}
      </div>

      {/* Progress Bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-white/20 z-20">
        <div 
          className="h-full bg-gradient-to-r from-orange-500 to-pink-500 transition-all duration-100 ease-linear"
          style={{ 
            width: isAutoPlaying ? `${((currentSlide + 1) / slides.length) * 100}%` : '0%' 
          }}
        />
      </div>
    </div>
  );
}
