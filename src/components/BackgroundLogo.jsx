import { useEffect, useState } from 'react';

/**
 * Background Logo com Parallax
 */
export default function BackgroundLogo() {
  useEffect(() => {
    console.log('✓ BackgroundLogo component mounted');
  }, []);

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 1,
        pointerEvents: 'none',
        overflow: 'hidden',
        background: 'transparent',
      }}
    >
      {/* Logo Image - FIXA no fundo */}
      <img
        src="/images/LogoModerno.png"
        alt="Background Logo"
        onLoad={() => console.log('✓ Logo carregou com sucesso!')}
        onError={(e) => {
          console.error('✗ Falha ao carregar logo:', e.target.src);
          setTimeout(() => {
            e.target.src = '/images/Logo%20Moderno.png';
          }, 100);
        }}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          width: '1200px',
          height: '1200px',
          transform: `translate(-50%, -50%)`,
          opacity: 0.08,
          filter: 'brightness(1.3) contrast(1.2) saturate(0.5)',
          objectFit: 'contain',
          pointerEvents: 'none',
          willChange: 'transform',
          zIndex: 1,
        }}
      />

      {/* Overlay de segurança para conteúdo ficar legível */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, rgba(15,23,42,0.82) 0%, rgba(30,27,75,0.82) 50%, rgba(15,23,42,0.82) 100%)',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
