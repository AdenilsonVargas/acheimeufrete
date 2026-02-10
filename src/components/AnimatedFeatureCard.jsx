import { useState } from 'react';

/**
 * Card com animação profissional ao hover
 * Inspirado no design do Stripe
 */
export default function AnimatedFeatureCard({ 
  title, 
  description, 
  icon: IconComponent, 
  gradient = 'from-blue-500 to-blue-600',
  accentColor = 'text-blue-500'
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative group"
    >
      {/* Background blur effect */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} rounded-2xl blur-xl transition-all duration-500 ${
          isHovered ? 'opacity-30 scale-105' : 'opacity-10 scale-100'
        }`}
        style={{ zIndex: -1 }}
      />

      {/* Card principal */}
      <div
        className={`relative h-full bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 rounded-2xl p-8 transition-all duration-500 overflow-hidden ${
          isHovered
            ? 'shadow-2xl scale-105 dark:border-slate-600/60 border-white/40'
            : 'shadow-lg dark:border-slate-700/20 border-white/10'
        }`}
      >
        {/* Border gradient animation */}
        <div
          className={`absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-500 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            background: `linear-gradient(135deg, rgba(59, 130, 246, 0.4), rgba(139, 92, 246, 0.2))`,
            borderRadius: 'inherit',
          }}
        />

        {/* Content */}
        <div className="relative z-10">
          {/* Icon Container */}
          <div
            className={`inline-flex items-center justify-center w-14 h-14 rounded-xl mb-6 transition-all duration-500 ${
              isHovered
                ? `bg-gradient-to-br ${gradient} shadow-lg scale-110`
                : 'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700'
            }`}
          >
            <IconComponent
              className={`w-7 h-7 transition-all duration-500 ${
                isHovered
                  ? 'text-white scale-110'
                  : `${accentColor}`
              }`}
            />
          </div>

          {/* Title */}
          <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-3 transition-colors duration-500 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text">
            {title}
          </h3>

          {/* Description */}
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm md:text-base transition-colors duration-500 group-hover:text-slate-800 dark:group-hover:text-slate-200">
            {description}
          </p>

          {/* Link indicator */}
          <div
            className={`inline-flex items-center gap-2 mt-6 text-blue-600 dark:text-blue-400 font-semibold text-sm transition-all duration-500 ${
              isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
            }`}
          >
            Saiba mais
            <svg
              className={`w-4 h-4 transition-transform duration-500 ${isHovered ? 'translate-x-1' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>

        {/* Glow effect on hover */}
        <div
          className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-br ${gradient} rounded-full blur-3xl transition-all duration-500 pointer-events-none ${
            isHovered ? 'opacity-20 scale-150' : 'opacity-0 scale-100'
          }`}
          style={{ zIndex: -1 }}
        />
      </div>
    </div>
  );
}
