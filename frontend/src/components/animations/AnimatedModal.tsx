import { motion, AnimatePresence, Variants } from 'framer-motion';
import { ReactNode } from 'react';

interface AnimatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

const overlayVariants: Variants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: { duration: 0.2 }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.15, delay: 0.1 }
  },
};

const modalVariants: Variants = {
  initial: { 
    opacity: 0, 
    scale: 0.95,
    y: 10,
  },
  animate: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    y: 10,
    transition: { duration: 0.15 },
  },
};

export function AnimatedModal({ isOpen, onClose, children, className = '' }: AnimatedModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            variants={overlayVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
          />
          <motion.div
            variants={modalVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={`fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 ${className}`}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export const dialogContentVariants: Variants = {
  initial: { 
    opacity: 0, 
    scale: 0.95,
    y: 10,
  },
  animate: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    transition: { duration: 0.15 },
  },
};
