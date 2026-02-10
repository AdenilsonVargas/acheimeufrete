import { useState } from 'react';

/**
 * Ícone Animado Continuamente
 * Usa CSS keyframes para animação suave e contínua
 */
export default function AnimatedIcon({ 
  Icon, 
  animationType = 'bounce',
  className = '',
  size = 'w-12 h-12',
  color = 'text-blue-600',
  duration = '3s'
}) {
  const animations = {
    bounce: 'animate-bounce-slow',
    float: 'animate-float',
    pulse: 'animate-pulse',
    spin: 'animate-spin-slow',
    wiggle: 'animate-wiggle',
    shimmer: 'animate-shimmer',
  };

  return (
    <>
      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0px); opacity: 1; }
          50% { transform: translateY(-12px); opacity: 0.9; }
        }
        .animate-bounce-slow {
          animation: bounce-slow ${duration} ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-8px) rotate(2deg); }
          50% { transform: translateY(-16px) rotate(0deg); }
          75% { transform: translateY(-8px) rotate(-2deg); }
        }
        .animate-float {
          animation: float ${duration} ease-in-out infinite;
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow ${duration} linear infinite;
        }

        @keyframes wiggle {
          0%, 100% { transform: skewX(0deg); }
          25% { transform: skewX(-8deg); }
          75% { transform: skewX(8deg); }
        }
        .animate-wiggle {
          animation: wiggle ${duration} ease-in-out infinite;
        }

        @keyframes shimmer {
          0%, 100% { opacity: 1; filter: brightness(1); }
          50% { opacity: 0.7; filter: brightness(1.2); }
        }
        .animate-shimmer {
          animation: shimmer ${duration} ease-in-out infinite;
        }
      `}</style>

      <div className={`inline-flex items-center justify-center ${animations[animationType]} ${className}`}>
        <Icon className={`${size} ${color}`} />
      </div>
    </>
  );
}

/**
 * Container de múltiplos ícones animados em padrão
 */
export function AnimatedIconGrid({ icons = [], columns = 4 }) {
  return (
    <div className={`grid grid-cols-${columns} gap-8 py-12`}>
      {icons.map((icon, idx) => (
        <div key={idx} className="flex flex-col items-center gap-4">
          <AnimatedIcon
            Icon={icon.icon}
            animationType={icon.animationType || 'float'}
            size={icon.size || 'w-16 h-16'}
            color={icon.color || 'text-blue-600'}
            duration={`${2 + (idx % 3)}s`}
          />
          {icon.label && (
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 text-center">
              {icon.label}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
