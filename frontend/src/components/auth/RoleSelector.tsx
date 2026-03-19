import { motion } from 'framer-motion';
import { User, Truck, Factory, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserRole } from '@/types';

interface RoleSelectorProps {
  value: string;
  onChange: (value: string) => void;
  showAdmin?: boolean;
}

const roleOptions = [
  {
    value: 'USER',
    label: 'Citizen',
    description: 'Request pickups',
    icon: User,
    color: 'from-blue-500/20 to-blue-600/20',
  },
  {
    value: 'COLLECTOR',
    label: 'Collector',
    description: 'Collect e-waste',
    icon: Truck,
    color: 'from-amber-500/20 to-amber-600/20',
  },
  {
    value: 'RECYCLER',
    label: 'Recycler',
    description: 'Process waste',
    icon: Factory,
    color: 'from-emerald-500/20 to-emerald-600/20',
  },
  {
    value: 'ADMIN',
    label: 'Admin',
    description: 'Manage system',
    icon: Shield,
    color: 'from-purple-500/20 to-purple-600/20',
  },
];

export function RoleSelector({ value, onChange, showAdmin = false }: RoleSelectorProps) {
  const filteredRoles = showAdmin 
    ? roleOptions 
    : roleOptions.filter(r => r.value !== 'ADMIN');

  return (
    <div className="grid grid-cols-3 gap-2">
      {filteredRoles.map((option, index) => {
        const Icon = option.icon;
        const isSelected = value === option.value;
        
        return (
          <motion.button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              'relative flex flex-col items-center gap-2 rounded-xl p-4 transition-all duration-300',
              'border-2 overflow-hidden',
              isSelected
                ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                : 'border-border/50 hover:border-primary/30 hover:bg-muted/50'
            )}
          >
            {/* Background gradient */}
            <motion.div
              className={cn(
                'absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity',
                option.color
              )}
              animate={{ opacity: isSelected ? 1 : 0 }}
            />
            
            {/* Icon container */}
            <motion.div
              className={cn(
                'relative z-10 flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300',
                isSelected
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                  : 'bg-muted text-muted-foreground'
              )}
              animate={{
                scale: isSelected ? 1.05 : 1,
                rotate: isSelected ? [0, -5, 5, 0] : 0,
              }}
              transition={{ duration: 0.3 }}
            >
              <Icon className="h-6 w-6" />
            </motion.div>
            
            {/* Label */}
            <div className="relative z-10 text-center">
              <motion.span 
                className="block text-sm font-semibold"
                animate={{ 
                  color: isSelected ? 'hsl(var(--primary))' : 'hsl(var(--foreground))' 
                }}
              >
                {option.label}
              </motion.span>
              <span className="text-xs text-muted-foreground">
                {option.description}
              </span>
            </div>

            {/* Selection indicator */}
            {isSelected && (
              <motion.div
                layoutId="role-indicator"
                className="absolute -bottom-1 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-primary"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
