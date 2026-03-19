import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { DockItem } from './FloatingDock';

interface MobileNavProps {
  items: DockItem[];
  className?: string;
}

export function MobileNav({ items, className }: MobileNavProps) {
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === location.pathname) return true;
    const basePath = href.split('/').slice(0, 3).join('/');
    return location.pathname.startsWith(basePath) && href === basePath;
  };

  // Limit to 5 items for mobile
  const mobileItems = items.slice(0, 5);

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 lg:hidden',
        'bg-background/80 backdrop-blur-2xl',
        'border-t border-border/50',
        'pb-safe',
        'shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.15)]',
        className
      )}
    >
      <div className="flex h-16 items-center justify-around px-2">
        {mobileItems.map((item, index) => {
          const active = isActive(item.href);
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className="relative flex flex-1 flex-col items-center justify-center py-2"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                whileTap={{ scale: 0.9 }}
                className="relative"
              >
                {/* Active background */}
                {active && (
                  <motion.div
                    layoutId="mobile-nav-active"
                    className="absolute inset-0 -m-2 rounded-xl bg-primary/10"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                
                <motion.div
                  className={cn(
                    'relative flex h-10 w-10 items-center justify-center rounded-xl transition-colors',
                    active
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  )}
                  animate={{
                    scale: active ? 1.1 : 1,
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  {item.icon}
                  
                  {/* Badge */}
                  {item.badge && item.badge > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground"
                    >
                      {item.badge > 9 ? '9+' : item.badge}
                    </motion.span>
                  )}
                </motion.div>
              </motion.div>
              
              {/* Label */}
              <motion.span
                className={cn(
                  'mt-1 text-[10px] font-medium transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground'
                )}
                animate={{
                  opacity: active ? 1 : 0.7,
                }}
              >
                {item.title}
              </motion.span>

              {/* Active indicator */}
              {active && (
                <motion.div
                  layoutId="mobile-nav-indicator"
                  className="absolute -top-0.5 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-primary"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
}
