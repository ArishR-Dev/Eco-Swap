import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { userService } from '@/services/userService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Bell,
  CheckCircle,
  Info,
  AlertTriangle,
  Trash2,
  CheckCheck,
  Package,
  Truck,
  Calendar,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { formatRelativeTime } from '@/lib/time';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'SUCCESS' | 'INFO' | 'WARNING' | 'ERROR';
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export default function Notifications() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await userService.getUserNotifications();
      // Map backend format to UI format
      const mapped = data.map((n: any) => ({
        id: n.id || '',
        title: 'Notification', // Backend only provides message, not title
        message: n.message || '',
        type: (n.type || 'INFO') as 'SUCCESS' | 'INFO' | 'WARNING' | 'ERROR',
        isRead: Boolean(n.isRead),
        createdAt: n.createdAt || n.timestamp || n.created_at || new Date().toISOString(),
      }));
      setNotifications(mapped);
    } catch (error: any) {
      console.error('[NOTIFICATIONS] Failed to load:', error);
      const msg = String(error?.message || error);
      if (msg.includes('401') || msg.toLowerCase().includes('unauthorized')) {
        logout();
        navigate('/login');
        return;
      }
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return <CheckCircle className="h-5 w-5 text-primary" />;
      case 'WARNING':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'ERROR':
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await userService.markNotificationRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      );
      window.dispatchEvent(new Event('notifications-refresh'));
    } catch (e) {
      console.error('Failed to mark as read:', e);
      toast({ title: 'Failed to mark as read', variant: 'destructive' });
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
      await Promise.all(unreadIds.map(id => userService.markNotificationRead(id)));
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      window.dispatchEvent(new Event('notifications-refresh'));
      toast({ title: "All notifications marked as read" });
    } catch (e) {
      console.error('Failed to mark all as read:', e);
      toast({ title: 'Failed to mark all as read', variant: 'destructive' });
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await userService.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      window.dispatchEvent(new Event('notifications-refresh'));
      toast({ title: "Notification deleted" });
    } catch (e) {
      console.error('Failed to delete:', e);
      toast({ title: 'Failed to delete notification', variant: 'destructive' });
    }
  };

  const clearAll = async () => {
    try {
      await Promise.all(notifications.map(n => userService.deleteNotification(n.id)));
      setNotifications([]);
      window.dispatchEvent(new Event('notifications-refresh'));
      toast({ title: "All notifications cleared" });
    } catch (e) {
      console.error('Failed to clear:', e);
      toast({ title: 'Failed to clear notifications', variant: 'destructive' });
    }
  };

  const now = new Date(nowMs);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground">Stay updated on your pickup requests</p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead} className="gap-2">
              <CheckCheck className="h-4 w-4" />
              Mark all as read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button variant="outline" onClick={clearAll} className="gap-2 text-destructive">
              <Trash2 className="h-4 w-4" />
              Clear all
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notifications.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unread</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{unreadCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Read</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">
              {notifications.length - unreadCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            All Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Bell className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-1">No Notifications</h3>
              <p className="text-muted-foreground">No notifications yet. Check back later for updates.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-4 p-4 rounded-lg border transition-colors cursor-pointer ${
                    notification.isRead 
                      ? 'bg-background' 
                      : 'bg-primary/5 border-primary/20'
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex-shrink-0 mt-1">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={`font-medium ${notification.isRead ? '' : 'text-foreground'}`}>
                          {notification.title}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <Badge className="flex-shrink-0">New</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatRelativeTime(notification.createdAt, now)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
