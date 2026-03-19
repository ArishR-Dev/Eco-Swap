import { motion } from 'framer-motion';
import { Recycle, Leaf, Zap, Globe, Cpu, Battery, Smartphone, Monitor, CircuitBoard } from 'lucide-react';

export function EcoIllustration() {
  const floatingIcons = [
    { Icon: Smartphone, delay: 0, x: 60, y: 80, size: 24 },
    { Icon: Monitor, delay: 0.5, x: 280, y: 60, size: 28 },
    { Icon: Battery, delay: 1, x: 320, y: 200, size: 22 },
    { Icon: Cpu, delay: 1.5, x: 80, y: 240, size: 26 },
    { Icon: CircuitBoard, delay: 2, x: 240, y: 320, size: 24 },
    { Icon: Zap, delay: 0.3, x: 180, y: 380, size: 20 },
  ];

  return (
    <div className="relative h-full w-full flex items-center justify-center">
      {/* Central recycling symbol */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ 
          duration: 1,
          ease: [0.25, 0.46, 0.45, 0.94],
          delay: 0.2 
        }}
        className="relative"
      >
        {/* Outer glow ring */}
        <motion.div
          className="absolute inset-0 -m-8 rounded-full bg-primary-foreground/10 blur-xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        
        {/* Main circle */}
        <motion.div
          className="relative flex h-40 w-40 items-center justify-center rounded-full bg-primary-foreground/20 backdrop-blur-xl border border-primary-foreground/30"
          whileHover={{ scale: 1.05 }}
          animate={{
            boxShadow: [
              '0 0 30px rgba(255,255,255,0.1)',
              '0 0 60px rgba(255,255,255,0.2)',
              '0 0 30px rgba(255,255,255,0.1)',
            ],
          }}
          transition={{
            boxShadow: {
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            },
          }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            <Recycle className="h-20 w-20 text-primary-foreground" />
          </motion.div>
        </motion.div>

        {/* Orbiting elements */}
        <motion.div
          className="absolute inset-0 -m-16"
          animate={{ rotate: 360 }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <motion.div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground/20 backdrop-blur-sm border border-primary-foreground/20">
              <Leaf className="h-5 w-5 text-primary-foreground" />
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          className="absolute inset-0 -m-24"
          animate={{ rotate: -360 }}
          transition={{
            duration: 40,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <motion.div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/15 backdrop-blur-sm border border-primary-foreground/15">
              <Globe className="h-4 w-4 text-primary-foreground" />
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Floating e-waste icons */}
      {floatingIcons.map(({ Icon, delay, x, y, size }, index) => (
        <motion.div
          key={index}
          className="absolute"
          style={{ left: x, top: y }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: [0.2, 0.5, 0.2],
            scale: [0.9, 1.1, 0.9],
            y: [0, -10, 0],
          }}
          transition={{
            delay,
            duration: 3 + index * 0.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <div className="flex items-center justify-center rounded-xl bg-primary-foreground/10 p-3 backdrop-blur-sm border border-primary-foreground/10">
            <Icon size={size} className="text-primary-foreground/60" />
          </div>
        </motion.div>
      ))}

      {/* Connecting lines / network effect */}
      <svg className="absolute inset-0 h-full w-full pointer-events-none opacity-20">
        <motion.path
          d="M 100 150 Q 200 100 300 200"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
          className="text-primary-foreground"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, delay: 1 }}
        />
        <motion.path
          d="M 150 300 Q 250 250 350 280"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
          className="text-primary-foreground"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, delay: 1.5 }}
        />
      </svg>
    </div>
  );
}
