import { ReactNode } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  hover?: boolean;
  enableTilt?: boolean;
}

export function AnimatedCard({ 
  children, 
  className = '', 
  delay = 0,
  hover = true,
  enableTilt = false
}: AnimatedCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['2deg', '-2deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-2deg', '2deg']);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!enableTilt) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      style={enableTilt ? {
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      } : undefined}
      whileHover={hover ? { 
        y: -4, 
        boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.15)',
        transition: { duration: 0.2 }
      } : undefined}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'rounded-xl border bg-card text-card-foreground shadow-sm transition-shadow',
        className
      )}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedCardGrid({ 
  children, 
  className = '' 
}: { 
  children: ReactNode; 
  className?: string;
}) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={{
        initial: {},
        animate: {
          transition: {
            staggerChildren: 0.08,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export const cardVariants = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};
