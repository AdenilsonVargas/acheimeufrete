import { motion } from 'framer-motion';
import useScrollReveal from '@/hooks/useScrollReveal';

/**
 * Componente de seção com animação estilo Squarespace
 * Toda a seção aparece com fade + stagger
 */
export default function AnimatedSection({ 
  children, 
  delay = 0, 
  className = '',
  variant = 'default' // 'default', 'stagger'
}) {
  const [ref, isVisible] = useScrollReveal();

  const variants = {
    default: {
      hidden: { opacity: 0, y: 30 },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.8,
          delay,
          ease: [0.34, 1.56, 0.64, 1],
        },
      },
    },
    stagger: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.1,
          delayChildren: delay,
        },
      },
    },
  };

  const childVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.7,
        ease: 'easeOut',
      },
    },
  };

  // Wrapper para stagger effect em child components
  if (variant === 'stagger') {
    return (
      <motion.div
        ref={ref}
        variants={variants.stagger}
        initial="hidden"
        animate={isVisible ? 'visible' : 'hidden'}
        className={className}
      >
        {Array.isArray(children)
          ? children.map((child, idx) => (
              <motion.div key={idx} variants={childVariants}>
                {child}
              </motion.div>
            ))
          : children}
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={ref}
      variants={variants.default}
      initial="hidden"
      animate={isVisible ? 'visible' : 'hidden'}
      className={className}
    >
      {children}
    </motion.div>
  );
}
