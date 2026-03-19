import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface RoleBackgroundProps {
  role: 'USER' | 'COLLECTOR' | 'RECYCLER' | 'ADMIN';
}

export function RoleBackground({ role }: RoleBackgroundProps) {
  const roleStyles = {
    USER: {
      gradient: 'from-emerald-500/20 via-teal-500/10 to-green-600/20',
      accent: 'bg-emerald-500',
      orb1: 'from-emerald-400/40 to-teal-500/20',
      orb2: 'from-green-400/30 to-emerald-600/10',
      orb3: 'from-teal-300/25 to-green-400/15',
      particles: 'bg-emerald-400',
      gridColor: 'hsl(162, 63%, 41%)',
    },
    COLLECTOR: {
      gradient: 'from-blue-600/25 via-slate-700/15 to-indigo-800/25',
      accent: 'bg-blue-500',
      orb1: 'from-blue-500/40 to-indigo-600/20',
      orb2: 'from-slate-500/30 to-blue-700/15',
      orb3: 'from-indigo-400/25 to-slate-600/15',
      particles: 'bg-blue-400',
      gridColor: 'hsl(217, 91%, 60%)',
    },
    RECYCLER: {
      gradient: 'from-violet-500/20 via-slate-400/10 to-purple-600/20',
      accent: 'bg-violet-500',
      orb1: 'from-violet-400/35 to-purple-500/15',
      orb2: 'from-slate-400/25 to-violet-600/10',
      orb3: 'from-purple-300/20 to-slate-500/10',
      particles: 'bg-violet-400',
      gridColor: 'hsl(263, 70%, 50%)',
    },
    ADMIN: {
      gradient: 'from-slate-600/20 via-gray-500/10 to-zinc-700/20',
      accent: 'bg-slate-500',
      orb1: 'from-slate-400/40 to-gray-500/20',
      orb2: 'from-zinc-400/30 to-slate-600/10',
      orb3: 'from-gray-300/25 to-zinc-400/15',
      particles: 'bg-slate-400',
      gridColor: 'hsl(220, 9%, 46%)',
    },
  };

  const style = roleStyles[role];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={role}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
        className="absolute inset-0 overflow-hidden"
      >
        {/* Base gradient */}
        <motion.div
          className={cn('absolute inset-0 bg-gradient-to-br', style.gradient)}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1 }}
        />

        {/* Animated gradient orbs */}
        <motion.div
          className={cn(
            'absolute -top-40 -right-40 h-96 w-96 rounded-full bg-gradient-to-br blur-3xl',
            style.orb1
          )}
          animate={{
            x: [0, 40, 0],
            y: [0, -30, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: role === 'COLLECTOR' ? 6 : 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        <motion.div
          className={cn(
            'absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-gradient-to-tr blur-3xl',
            style.orb2
          )}
          animate={{
            x: [0, -25, 0],
            y: [0, 40, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: role === 'COLLECTOR' ? 5 : 12,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        <motion.div
          className={cn(
            'absolute top-1/3 right-1/4 h-64 w-64 rounded-full bg-gradient-to-r blur-3xl',
            style.orb3
          )}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: role === 'COLLECTOR' ? 4 : 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Floating particles - more for Collector (energetic) */}
        {Array.from({ length: role === 'COLLECTOR' ? 8 : 5 }).map((_, i) => (
          <motion.div
            key={i}
            className={cn('absolute rounded-full', style.particles)}
            style={{
              width: 4 + Math.random() * 6,
              height: 4 + Math.random() * 6,
              left: `${10 + Math.random() * 80}%`,
              top: `${10 + Math.random() * 80}%`,
            }}
            animate={{
              y: [0, -20 - Math.random() * 30, 0],
              x: [0, (Math.random() - 0.5) * 20, 0],
              opacity: [0.2, 0.6, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 4,
              repeat: Infinity,
              delay: i * 0.5,
              ease: 'easeInOut',
            }}
          />
        ))}

        {/* Role-specific patterns */}
        {role === 'COLLECTOR' && (
          <>
            {/* Motion lines for logistics feel */}
            <svg className="absolute inset-0 w-full h-full opacity-10">
              <motion.line
                x1="0" y1="30%" x2="100%" y2="40%"
                stroke={style.gridColor}
                strokeWidth="2"
                strokeDasharray="10,10"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, repeat: Infinity, repeatType: 'loop' }}
              />
              <motion.line
                x1="0" y1="60%" x2="100%" y2="70%"
                stroke={style.gridColor}
                strokeWidth="2"
                strokeDasharray="10,10"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2.5, delay: 0.5, repeat: Infinity, repeatType: 'loop' }}
              />
            </svg>
            {/* Arrow indicators */}
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{ left: `${20 + i * 25}%`, top: `${30 + i * 15}%` }}
                animate={{
                  x: [0, 30, 0],
                  opacity: [0.3, 0.7, 0.3],
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.3,
                  repeat: Infinity,
                }}
              >
                <div className="text-blue-400/40 text-2xl">→</div>
              </motion.div>
            ))}
          </>
        )}

        {role === 'RECYCLER' && (
          <>
            {/* Industrial diagram lines */}
            <svg className="absolute inset-0 w-full h-full opacity-[0.08]">
              <pattern id="recycler-grid" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                <path d="M 80 0 L 0 0 0 80" fill="none" stroke={style.gridColor} strokeWidth="1" />
              </pattern>
              <rect width="100%" height="100%" fill="url(#recycler-grid)" />
            </svg>
            {/* Technical circles */}
            <motion.div
              className="absolute top-1/4 left-1/4 h-32 w-32 rounded-full border border-violet-400/20"
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="absolute bottom-1/3 right-1/3 h-48 w-48 rounded-full border border-purple-400/15"
              animate={{ rotate: -360 }}
              transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
            />
          </>
        )}

        {role === 'USER' && (
          <>
            {/* Organic wave patterns for community feel */}
            <svg className="absolute bottom-0 left-0 w-full h-32 opacity-20">
              <motion.path
                d="M0,50 Q250,0 500,50 T1000,50 L1000,100 L0,100 Z"
                fill={style.gridColor}
                initial={{ d: 'M0,50 Q250,0 500,50 T1000,50 L1000,100 L0,100 Z' }}
                animate={{
                  d: [
                    'M0,50 Q250,0 500,50 T1000,50 L1000,100 L0,100 Z',
                    'M0,50 Q250,100 500,50 T1000,50 L1000,100 L0,100 Z',
                    'M0,50 Q250,0 500,50 T1000,50 L1000,100 L0,100 Z',
                  ],
                }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              />
            </svg>
            {/* Soft leaf shapes */}
            <motion.div
              className="absolute top-20 right-20 w-16 h-16 rounded-full bg-emerald-400/20 blur-xl"
              animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
          </>
        )}

        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(${style.gridColor} 1px, transparent 1px), linear-gradient(90deg, ${style.gridColor} 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </motion.div>
    </AnimatePresence>
  );
}
