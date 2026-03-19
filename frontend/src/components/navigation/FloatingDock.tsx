import { useState, useEffect, ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface DockItem {
  title: string;
  href: string;
  icon: ReactNode;
  badge?: number;
}

interface FloatingDockProps {
  items: DockItem[];
  className?: string;
}

export function FloatingDock({ items, className }: FloatingDockProps) {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < 100) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const isActive = (href: string) => {
    if (href === location.pathname) return true;
    const basePath = href.split('/').slice(0, 3).join('/');
    return location.pathname.startsWith(basePath) && href === basePath;
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 100, opacity: 0, scale: 0.8 }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 30,
          }}
          className={cn(
            'fixed bottom-6 left-1/2 z-50 -translate-x-1/2',
            className
          )}
        >
          <TooltipProvider delayDuration={0}>
            <motion.nav
              className={cn(
                'flex items-center gap-1.5 rounded-2xl px-4 py-3',
                'bg-background/70 backdrop-blur-2xl',
                'border border-border/40',
                'shadow-2xl shadow-black/20',
                'ring-1 ring-white/10'
              )}
              style={{
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
              }}
            >
              {items.map((item, index) => {
                const active = isActive(item.href);
                const isHovered = hoveredIndex === index;
                
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      <Link
                        to={item.href}
                        className="relative"
                        onMouseEnter={() => setHoveredIndex(index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      >
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ 
                            scale: 1, 
                            opacity: 1,
                            y: isHovered ? -6 : 0,
                          }}
                          transition={{ 
                            delay: index * 0.05,
                            y: { type: 'spring', stiffness: 400, damping: 25 }
                          }}
                          whileTap={{ scale: 0.9 }}
                          className={cn(
                            'relative flex h-12 w-12 items-center justify-center rounded-xl transition-colors duration-200',
                            active
                              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                              : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                          )}
                        >
                          {/* Hover glow effect */}
                          <AnimatePresence>
                            {(isHovered || active) && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className={cn(
                                  'absolute inset-0 rounded-xl',
                                  active 
                                    ? 'bg-primary/20' 
                                    : 'bg-foreground/5'
                                )}
                                style={{ filter: 'blur(8px)' }}
                              />
                            )}
                          </AnimatePresence>
                          
                          {/* Icon with spring animation */}
                          <motion.span 
                            className="relative z-10"
                            animate={{
                              scale: isHovered ? 1.15 : 1,
                              rotate: isHovered ? [0, -10, 10, 0] : 0,
                            }}
                            transition={{
                              scale: { type: 'spring', stiffness: 400, damping: 20 },
                              rotate: { duration: 0.3 },
                            }}
                          >
                            {item.icon}
                          </motion.span>
                          
                          {/* Badge */}
                          {item.badge && item.badge > 0 && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                              className={cn(
                                'absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center',
                                'rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground',
                                'shadow-lg shadow-destructive/30'
                              )}
                            >
                              {item.badge > 9 ? '9+' : item.badge}
                            </motion.span>
                          )}
                        </motion.div>

                        {/* Active indicator dot */}
                        <AnimatePresence>
                          {active && (
                            <motion.div
                              layoutId="dock-active-dot"
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0 }}
                              className="absolute -bottom-1.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-primary"
                              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            />
                          )}
                        </AnimatePresence>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent 
                      side="top" 
                      sideOffset={16}
                      className="bg-foreground text-background font-medium px-3 py-1.5 text-sm"
                    >
                      <motion.span
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        {item.title}
                      </motion.span>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </motion.nav>
          </TooltipProvider>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
