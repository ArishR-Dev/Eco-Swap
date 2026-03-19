import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
}

export function GlassCard({ children, className }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={{
        y: -4,
        transition: { duration: 0.2 },
      }}
      className={cn(
        'relative overflow-hidden rounded-2xl',
        'bg-background/80 backdrop-blur-xl',
        'border border-border/50',
        'shadow-xl shadow-black/5',
        className
      )}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-primary/[0.02] pointer-events-none" />
      
      {/* Content */}
      <div className="relative">
        {children}
      </div>
    </motion.div>
  );
}
