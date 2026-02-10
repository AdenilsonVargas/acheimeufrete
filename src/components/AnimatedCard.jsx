import { motion } from 'framer-motion';
import useScrollReveal from '@/hooks/useScrollReveal';

/**
 * Componente Card com animação ao scroll
 * Aparece com fade + slide quando fica visível
 */
export default function AnimatedCard({ children, delay = 0, className = '' }) {
  const [ref, isVisible] = useScrollReveal();

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{
        duration: 0.8,
        delay,
        ease: [0.34, 1.56, 0.64, 1], // Cubic-bezier elegante
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
