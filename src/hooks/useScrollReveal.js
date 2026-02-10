import { useEffect, useState } from 'react';

/**
 * Hook para animar elementos quando ficam visíveis na viewport
 * @param {Object} options - Opções do Intersection Observer
 * @returns {Array} [ref, isVisible]
 */
export function useScrollReveal(options = {}) {
  const [isVisible, setIsVisible] = useState(false);
  const [element, setElement] = useState(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        // Parar de observar após aparecer
        observer.unobserve(entry.target);
      }
    }, {
      threshold: 0.1,
      margin: '0px 0px -100px 0px', // Começa animação 100px antes de aparecer
      ...options,
    });

    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [element, options]);

  return [setElement, isVisible];
}

export default useScrollReveal;

/**
 * Hook para aplicar reveal em múltiplos elementos (classe "reveal") sem precisar de refs individuais.
 * Chame useScrollRevealBatch() no componente e adicione className="reveal" nos blocos.
 */
export function useScrollRevealBatch(options = {}) {
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined;

    const elements = Array.from(document.querySelectorAll('.reveal'));
    if (!elements.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.2,
        rootMargin: '0px 0px -10% 0px',
        ...options,
      }
    );

    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [options]);
}
