import { motion, useSpring, useTransform, useInView } from 'framer-motion';
import { useRef, useEffect } from 'react';

interface CountUpProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export function CountUp({ 
  value, 
  duration = 1.5, 
  className = '',
  prefix = '',
  suffix = '',
  decimals = 0,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  
  const spring = useSpring(0, {
    duration: duration * 1000,
    bounce: 0,
  });
  
  const display = useTransform(spring, (current) => {
    return `${prefix}${current.toFixed(decimals)}${suffix}`;
  });

  useEffect(() => {
    if (isInView) {
      spring.set(value);
    }
  }, [isInView, spring, value]);

  return (
    <motion.span ref={ref} className={className}>
      {display}
    </motion.span>
  );
}

export function AnimatedNumber({ 
  value, 
  className = '' 
}: { 
  value: number; 
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  
  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0, y: 10 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={className}
    >
      {value.toLocaleString()}
    </motion.span>
  );
}
