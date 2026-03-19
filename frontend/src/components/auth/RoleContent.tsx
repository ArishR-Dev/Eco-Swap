import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, Recycle, Truck, Shield, Factory, Zap } from 'lucide-react';

interface RoleContentProps {
  role: 'USER' | 'COLLECTOR' | 'RECYCLER' | 'ADMIN';
  type: 'login' | 'register';
}

const roleContent = {
  USER: {
    title: 'Join the Eco Movement',
    subtitle: 'Be part of a community making a real difference for our planet.',
    loginTitle: 'Welcome Back, Eco Warrior',
    loginSubtitle: 'Continue your journey towards a sustainable future.',
    badges: [
      { icon: Leaf, text: 'Eco-Friendly' },
      { icon: Recycle, text: 'Sustainable' },
    ],
    accentGradient: 'from-emerald-400 to-teal-500',
    cardBorder: 'border-emerald-500/20',
    cardBg: 'bg-emerald-500/5',
  },
  COLLECTOR: {
    title: 'Drive the Change',
    subtitle: 'Join our fleet of dedicated collectors making pickups happen.',
    loginTitle: 'Ready for Your Route',
    loginSubtitle: 'Check your tasks and start collecting.',
    badges: [
      { icon: Truck, text: 'On the Road' },
      { icon: Zap, text: 'Fast Pickups' },
    ],
    accentGradient: 'from-blue-400 to-indigo-500',
    cardBorder: 'border-blue-500/20',
    cardBg: 'bg-blue-500/5',
  },
  RECYCLER: {
    title: 'Process with Precision',
    subtitle: 'Certified facilities transforming waste into resources.',
    loginTitle: 'Industrial Dashboard',
    loginSubtitle: 'Manage incoming shipments and processing.',
    badges: [
      { icon: Factory, text: 'Certified' },
      { icon: Shield, text: 'ISO Compliant' },
    ],
    accentGradient: 'from-violet-400 to-purple-500',
    cardBorder: 'border-violet-500/20',
    cardBg: 'bg-violet-500/5',
  },
  ADMIN: {
    title: 'System Administration',
    subtitle: 'Manage users, monitor operations, and oversee the platform.',
    loginTitle: 'Admin Control Center',
    loginSubtitle: 'Access full system management and analytics.',
    badges: [
      { icon: Shield, text: 'Secure Access' },
      { icon: Factory, text: 'Full Control' },
    ],
    accentGradient: 'from-slate-400 to-zinc-500',
    cardBorder: 'border-slate-500/20',
    cardBg: 'bg-slate-500/5',
  },
};

export function RoleContent({ role, type }: RoleContentProps) {
  const content = roleContent[role];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${role}-${type}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="text-center"
      >
        <motion.h1
          className="text-4xl font-bold text-white mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {type === 'login' ? content.loginTitle : content.title}
        </motion.h1>
        
        <motion.p
          className="text-lg text-white/80 max-w-md mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {type === 'login' ? content.loginSubtitle : content.subtitle}
        </motion.p>

        <motion.div
          className="mt-8 flex justify-center gap-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {content.badges.map(({ icon: Icon, text }, i) => (
            <motion.div
              key={text}
              whileHover={{ scale: 1.05, y: -2 }}
              className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 backdrop-blur-sm border border-white/30"
            >
              <Icon className="h-4 w-4 text-white" />
              <span className="text-sm font-medium text-white">{text}</span>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function getRoleStyles(role: 'USER' | 'COLLECTOR' | 'RECYCLER' | 'ADMIN') {
  return roleContent[role];
}
