import { motion } from 'framer-motion';
import useScrollReveal from '@/hooks/useScrollReveal';

/**
 * Componente Text com animação ao scroll
 * Textos aparecem com fade elegante
 */
export default function AnimatedText({ 
  children, 
  delay = 0, 
  type = 'normal', // 'normal', 'title', 'subtitle'
  stagger = false,
  className = '' 
}) {
  const [ref, isVisible] = useScrollReveal();

  const variants = {
    title: {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 },
      transition: {
        duration: 0.8,
        delay,
        ease: [0.34, 1.56, 0.64, 1],
      },
    },
    subtitle: {
      hidden: { opacity: 0, y: 15 },
      visible: { opacity: 1, y: 0 },
      transition: {
        duration: 0.7,
        delay,
        ease: 'easeOut',
      },
    },
    normal: {
      hidden: { opacity: 0, y: 10 },
      visible: { opacity: 1, y: 0 },
      transition: {
        duration: 0.6,
        delay,
        ease: 'easeOut',
      },
    },
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: delay,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
  };

  // Se o children for um array (palavras/linhas), fazer stagger
  if (stagger && Array.isArray(children)) {
    return (
      <motion.div
        ref={ref}
        variants={containerVariants}
        initial="hidden"
        animate={isVisible ? 'visible' : 'hidden'}
        className={className}
      >
        {children.map((child, idx) => (
          <motion.span key={idx} variants={itemVariants}>
            {child}{' '}
          </motion.span>
        ))}
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={ref}
      variants={variants[type]}
      initial="hidden"
      animate={isVisible ? 'visible' : 'hidden'}
      className={className}
    >
      {children}
    </motion.div>
  );
}
