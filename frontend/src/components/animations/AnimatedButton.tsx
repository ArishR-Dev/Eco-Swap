import { motion } from 'framer-motion';
import { ReactNode, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'default' | 'glow';
}

export const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ children, className = '', onClick, disabled, type = 'button', variant = 'default' }, ref) => {
    return (
      <motion.button
        ref={ref}
        type={type}
        onClick={onClick}
        disabled={disabled}
        whileHover={{ 
          scale: 1.02,
          boxShadow: variant === 'glow' 
            ? '0 0 20px hsl(var(--primary) / 0.4)' 
            : '0 4px 12px rgba(0, 0, 0, 0.1)',
        }}
        whileTap={{ scale: 0.98 }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 17,
        }}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'disabled:pointer-events-none disabled:opacity-50',
          className
        )}
      >
        {children}
      </motion.button>
    );
  }
);

AnimatedButton.displayName = 'AnimatedButton';

export const buttonHover = {
  scale: 1.02,
  transition: {
    type: 'spring',
    stiffness: 400,
    damping: 17,
  },
};

export const buttonTap = {
  scale: 0.98,
};
