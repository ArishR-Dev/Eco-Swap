import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  Trash2,
  CheckCheck,
  Package,
  Recycle,
  MessageSquare,
  FileText,
  Truck,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import recyclerService from '@/services/recyclerService';
import { formatRelativeTime } from '@/lib/time';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'delivery' | 'batch' | 'admin' | 'report';
  isRead: boolean;
  createdAt: string;
}

export default function RecyclerNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const data = await recyclerService.getNotifications();
      const mapped = (data || []).map((item: any) => {
        const message = item.message || '';
        let type: 'delivery' | 'batch' | 'admin' | 'report' = 'admin';
        let title = 'Notification';

        if (message.toLowerCase().includes('upcoming') || (message.toLowerCase().includes('handed') && message.toLowerCase().includes('processing'))) {
          type = 'batch';
          title = 'Upcoming / Incoming';
        } else if (message.toLowerCase().includes('pickup') && message.toLowerCase().includes('status')) {
          type = 'delivery';
          title = 'Pickup Status Update';
        } else if (message.toLowerCase().includes('certificate')) {
          type = 'report';
          title = 'Certificate Issued';
        } else if (message.toLowerCase().includes('batch') || message.toLowerCase().includes('processing')) {
          type = 'batch';
          title = 'Processing Update';
        } else if (message.toLowerCase().includes('handed')) {
          type = 'delivery';
          title = 'Pickup Handed Over';
        }

        return {
          id: item.id || '',
          title,
          message,
          type,
          isRead: Boolean(item.isRead),
          createdAt: item.createdAt || item.timestamp || item.created_at || new Date().toISOString(),
        };
      });
      setNotifications(mapped);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (cancelled) return;
      await loadNotifications();
    };

    run();
    const id = window.setInterval(run, 15_000);

    const onRefresh = () => run();
    window.addEventListener('notifications-refresh', onRefresh);

    return () => {
      cancelled = true;
      window.clearInterval(id);
      window.removeEventListener('notifications-refresh', onRefresh);
    };
  }, [loadNotifications]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'delivery':
        return <Truck className="h-5 w-5 text-primary" />;
      case 'batch':
        return <Recycle className="h-5 w-5 text-blue-500" />;
      case 'admin':
        return <MessageSquare className="h-5 w-5 text-amber-500" />;
      case 'report':
        return <FileText className="h-5 w-5 text-muted-foreground" />;
      default:
        return <Package className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'delivery':
        return <Badge>Delivery</Badge>;
      case 'batch':
        return <Badge variant="secondary">Batch Ready</Badge>;
      case 'admin':
        return <Badge variant="outline" className="border-amber-200 bg-amber-500/10 text-amber-600">Admin</Badge>;
      case 'report':
        return <Badge variant="outline">Report</Badge>;
      default:
        return null;
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await recyclerService.markNotificationRead(id);
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
      await Promise.all(unreadIds.map(id => recyclerService.markNotificationRead(id)));
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
      await recyclerService.deleteNotification(id);
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
      await Promise.all(notifications.map(n => recyclerService.deleteNotification(n.id)));
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground">Stay updated on deliveries and processing status</p>
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
      <div className="grid gap-4 md:grid-cols-4">
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Deliveries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notifications.filter(n => n.type === 'delivery').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Batches Ready</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notifications.filter(n => n.type === 'batch').length}
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
              <p className="text-muted-foreground">You're all caught up! Check back later for updates.</p>
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
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`font-medium ${notification.isRead ? '' : 'text-foreground'}`}>
                            {notification.title}
                          </p>
                          {getTypeBadge(notification.type)}
                          {!notification.isRead && (
                            <Badge variant="default" className="text-xs">New</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                      </div>
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
