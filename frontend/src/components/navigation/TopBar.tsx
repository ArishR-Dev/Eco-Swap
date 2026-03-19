import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Recycle, Bell, LogOut, User, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import recyclerService from '@/services/recyclerService';
import collectorService from '@/services/collectorService';
import adminService from '@/services/adminService';
import { userService } from '@/services/userService';

interface TopBarProps {
  title: string;
  className?: string;
}

export function TopBar({ title, className }: TopBarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notificationCount, setNotificationCount] = useState(0);

  // Load notifications function - unread count for real-time badge
  const loadNotifications = useCallback(async () => {
    if (!user) {
      setNotificationCount(0);
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
      setNotificationCount(0);
      return;
    }

    try {
      let notifications: { read?: boolean; isRead?: boolean }[] = [];
      if (user?.role === 'ADMIN') {
        notifications = await adminService.getNotifications();
      } else if (user?.role === 'RECYCLER') {
        notifications = await recyclerService.getNotifications();
      } else if (user?.role === 'COLLECTOR') {
        notifications = await collectorService.getNotifications();
      } else if (user?.role === 'USER') {
        notifications = await userService.getUserNotifications();
      }
      const unread = Array.isArray(notifications)
        ? notifications.filter((n) => !(n.read ?? n.isRead ?? false)).length
        : 0;
      setNotificationCount(unread);
    } catch (err) {
      console.error('Notification fetch failed', err);
      setNotificationCount(0);
    }
  }, [user?.role]);

  // Initial load and on role change
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Listen for badge refresh when user marks read/delete on notifications page
  useEffect(() => {
    const onRefresh = () => loadNotifications();
    window.addEventListener('admin-badges-refresh', onRefresh);
    window.addEventListener('notifications-refresh', onRefresh);
    return () => {
      window.removeEventListener('admin-badges-refresh', onRefresh);
      window.removeEventListener('notifications-refresh', onRefresh);
    };
  }, [loadNotifications]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Get role-based paths for profile and settings
  const getRolePath = (path: string) => {
    const role = user?.role?.toLowerCase() || 'user';
    return `/${role}/${path}`;
  };

  // Get notifications path
  const getNotificationsPath = () => {
    const role = user?.role?.toLowerCase() || 'user';
    return `/${role}/notifications`;
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'sticky top-0 z-40 flex h-16 items-center justify-between gap-4 px-4 lg:px-6',
        'bg-background/90 backdrop-blur-2xl border-b border-border/60 shadow-sm',
        className
      )}
    >
      {/* Left: Logo + Title */}
      <div className="flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2.5 group">
          <motion.div 
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.5 }}
            className="rounded-xl bg-primary p-2 shadow-lg shadow-primary/20"
          >
            <Recycle className="h-5 w-5 text-primary-foreground" />
          </motion.div>
          <span className="hidden font-semibold text-foreground sm:block">
            EcoWaste
          </span>
        </Link>
        
        <div className="hidden h-6 w-px bg-border md:block" />
        
        <motion.h1 
          key={title}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden text-lg font-medium text-foreground md:block"
        >
          {title}
        </motion.h1>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Notifications - navigates to notifications page */}
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative"
            onClick={() => navigate(getNotificationsPath())}
          >
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground"
              >
                {notificationCount > 9 ? '9+' : notificationCount}
              </motion.span>
            )}
          </Button>
        </motion.div>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative h-9 w-9 rounded-full ring-2 ring-transparent transition-all hover:ring-primary/20 focus-visible:outline-none focus-visible:ring-primary/50"
            >
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {user?.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </motion.button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
                <p className="text-xs text-primary font-medium capitalize">{user?.role?.toLowerCase()}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="cursor-pointer"
              onClick={() => navigate(getRolePath('profile'))}
            >
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="cursor-pointer"
              onClick={() => navigate(getRolePath('settings'))}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleLogout} 
              className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.header>
  );
}
