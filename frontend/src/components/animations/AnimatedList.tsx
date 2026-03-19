import { motion, AnimatePresence, Variants } from 'framer-motion';
import { ReactNode } from 'react';

interface AnimatedListProps {
  children: ReactNode[];
  className?: string;
}

export function AnimatedList({ children, className = '' }: AnimatedListProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={{
        initial: {},
        animate: {
          transition: {
            staggerChildren: 0.05,
          },
        },
      }}
      className={className}
    >
      <AnimatePresence mode="popLayout">
        {children}
      </AnimatePresence>
    </motion.div>
  );
}

export const listItemVariants: Variants = {
  initial: { opacity: 0, x: -10 },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    x: 10,
    transition: {
      duration: 0.2,
    },
  },
};

export function AnimatedListItem({ 
  children, 
  className = '',
  layoutId,
}: { 
  children: ReactNode; 
  className?: string;
  layoutId?: string;
}) {
  return (
    <motion.div
      variants={listItemVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      layout
      layoutId={layoutId}
      whileHover={{ 
        backgroundColor: 'hsl(var(--muted) / 0.5)',
        transition: { duration: 0.15 }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
