import { motion, AnimatePresence } from 'framer-motion';
import { 
  Recycle, Leaf, Globe, Heart, Users, Sparkles,
  Truck, MapPin, Route, Clock, Package, Navigation,
  Factory, Cpu, CircuitBoard, Settings, BarChart3, Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RoleIllustrationProps {
  role: 'USER' | 'COLLECTOR' | 'RECYCLER' | 'ADMIN';
}

export function RoleIllustration({ role }: RoleIllustrationProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={role}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative h-80 w-80"
      >
        {role === 'USER' && <CitizenIllustration />}
        {role === 'COLLECTOR' && <CollectorIllustration />}
        {role === 'RECYCLER' && <RecyclerIllustration />}
        {role === 'ADMIN' && <AdminIllustration />}
      </motion.div>
    </AnimatePresence>
  );
}

function CitizenIllustration() {
  const floatingIcons = [
    { Icon: Leaf, x: -60, y: -80, delay: 0 },
    { Icon: Heart, x: 80, y: -60, delay: 0.3 },
    { Icon: Users, x: -80, y: 40, delay: 0.6 },
    { Icon: Sparkles, x: 100, y: 60, delay: 0.9 },
    { Icon: Globe, x: -40, y: 100, delay: 1.2 },
  ];

  return (
    <div className="relative h-full w-full flex items-center justify-center">
      {/* Central element */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 0.8, type: 'spring', stiffness: 100 }}
        className="relative"
      >
        {/* Glow ring */}
        <motion.div
          className="absolute inset-0 -m-12 rounded-full bg-emerald-400/30 blur-2xl"
          animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        
        {/* Main circle */}
        <motion.div
          className="relative flex h-36 w-36 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400/40 to-teal-500/30 backdrop-blur-xl border border-white/30 shadow-2xl"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          >
            <Recycle className="h-16 w-16 text-white" />
          </motion.div>
        </motion.div>

        {/* Orbiting ring */}
        <motion.div
          className="absolute inset-0 -m-8 rounded-full border-2 border-dashed border-white/20"
          animate={{ rotate: 360 }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
        />
      </motion.div>

      {/* Floating icons */}
      {floatingIcons.map(({ Icon, x, y, delay }, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: '50%', top: '50%' }}
          initial={{ opacity: 0, scale: 0, x, y }}
          animate={{
            opacity: [0.5, 1, 0.5],
            scale: [0.9, 1.1, 0.9],
            x: [x, x + 10, x],
            y: [y, y - 15, y],
          }}
          transition={{ duration: 4, delay, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 shadow-lg">
            <Icon className="h-5 w-5 text-white" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function CollectorIllustration() {
  const routePoints = [
    { x: 40, y: 60 },
    { x: 120, y: 100 },
    { x: 200, y: 80 },
    { x: 260, y: 140 },
  ];

  return (
    <div className="relative h-full w-full flex items-center justify-center">
      {/* Route lines */}
      <svg className="absolute inset-0 w-full h-full">
        <motion.path
          d={`M ${routePoints.map(p => `${p.x},${p.y}`).join(' L ')}`}
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="3"
          strokeDasharray="8,8"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </svg>

      {/* Route points */}
      {routePoints.map((point, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: point.x, top: point.y }}
          initial={{ scale: 0 }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-400/40 backdrop-blur-sm border border-white/30">
            <MapPin className="h-4 w-4 text-white" />
          </div>
        </motion.div>
      ))}

      {/* Central truck */}
      <motion.div
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="relative"
      >
        <motion.div
          className="absolute inset-0 -m-8 rounded-full bg-blue-400/40 blur-2xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        
        <motion.div
          className="relative flex h-32 w-32 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/50 to-indigo-600/40 backdrop-blur-xl border border-white/30 shadow-2xl"
          animate={{ y: [0, -5, 0], rotate: [0, 2, -2, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Truck className="h-14 w-14 text-white" />
        </motion.div>
      </motion.div>

      {/* Floating elements */}
      <motion.div
        className="absolute top-8 left-8"
        animate={{ y: [0, -10, 0], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm border border-white/30">
          <Package className="h-6 w-6 text-white" />
        </div>
      </motion.div>

      <motion.div
        className="absolute bottom-12 right-12"
        animate={{ y: [0, -8, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 2.5, delay: 0.5, repeat: Infinity }}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm border border-white/30">
          <Clock className="h-6 w-6 text-white" />
        </div>
      </motion.div>

      <motion.div
        className="absolute top-20 right-8"
        animate={{ x: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm border border-white/20">
          <Navigation className="h-5 w-5 text-white" />
        </div>
      </motion.div>
    </div>
  );
}

function RecyclerIllustration() {
  return (
    <div className="relative h-full w-full flex items-center justify-center">
      {/* Technical diagram circles */}
      <motion.div
        className="absolute h-72 w-72 rounded-full border border-white/10"
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute h-56 w-56 rounded-full border border-white/15"
        animate={{ rotate: -360 }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      />

      {/* Central factory */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="relative"
      >
        <motion.div
          className="absolute inset-0 -m-6 rounded-full bg-violet-400/30 blur-2xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 5, repeat: Infinity }}
        />
        
        <motion.div
          className="relative flex h-28 w-28 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/40 to-purple-600/30 backdrop-blur-xl border border-white/30 shadow-2xl"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Factory className="h-12 w-12 text-white" />
        </motion.div>
      </motion.div>

      {/* Orbiting tech icons */}
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      >
        <div className="absolute top-4 left-1/2 -translate-x-1/2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm border border-white/30">
            <Cpu className="h-5 w-5 text-white" />
          </div>
        </div>
      </motion.div>

      <motion.div
        className="absolute inset-0"
        animate={{ rotate: -360 }}
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
      >
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm border border-white/30">
            <CircuitBoard className="h-5 w-5 text-white" />
          </div>
        </div>
      </motion.div>

      {/* Corner elements */}
      <motion.div
        className="absolute top-8 left-8"
        animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.1, 1] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm border border-white/25">
          <BarChart3 className="h-6 w-6 text-white" />
        </div>
      </motion.div>

      <motion.div
        className="absolute bottom-8 right-8"
        animate={{ opacity: [0.6, 1, 0.6], y: [0, -5, 0] }}
        transition={{ duration: 4, delay: 0.5, repeat: Infinity }}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm border border-white/25">
          <Shield className="h-6 w-6 text-white" />
        </div>
      </motion.div>

      <motion.div
        className="absolute top-16 right-4"
        animate={{ rotate: [0, 180, 360] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
          <Settings className="h-4 w-4 text-white" />
        </div>
      </motion.div>
    </div>
  );
}

function AdminIllustration() {
  return (
    <div className="relative h-full w-full flex items-center justify-center">
      {/* Technical diagram circles */}
      <motion.div
        className="absolute h-72 w-72 rounded-full border border-white/10"
        animate={{ rotate: 360 }}
        transition={{ duration: 50, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute h-56 w-56 rounded-full border border-white/15"
        animate={{ rotate: -360 }}
        transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
      />

      {/* Central shield */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="relative"
      >
        <motion.div
          className="absolute inset-0 -m-6 rounded-full bg-slate-400/30 blur-2xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 5, repeat: Infinity }}
        />
        
        <motion.div
          className="relative flex h-28 w-28 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-500/40 to-zinc-600/30 backdrop-blur-xl border border-white/30 shadow-2xl"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Shield className="h-12 w-12 text-white" />
        </motion.div>
      </motion.div>

      {/* Orbiting icons */}
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
      >
        <div className="absolute top-4 left-1/2 -translate-x-1/2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm border border-white/30">
            <Settings className="h-5 w-5 text-white" />
          </div>
        </div>
      </motion.div>

      <motion.div
        className="absolute inset-0"
        animate={{ rotate: -360 }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      >
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm border border-white/30">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
        </div>
      </motion.div>

      {/* Corner elements */}
      <motion.div
        className="absolute top-8 left-8"
        animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.1, 1] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm border border-white/25">
          <Users className="h-6 w-6 text-white" />
        </div>
      </motion.div>

      <motion.div
        className="absolute bottom-8 right-8"
        animate={{ opacity: [0.6, 1, 0.6], y: [0, -5, 0] }}
        transition={{ duration: 4, delay: 0.5, repeat: Infinity }}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm border border-white/25">
          <Cpu className="h-6 w-6 text-white" />
        </div>
      </motion.div>
    </div>
  );
}
