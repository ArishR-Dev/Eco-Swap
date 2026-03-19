import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AuthLoader } from '@/components/auth/AuthLoader';
import { motion } from 'framer-motion';
import { Bell, Check, Trash2, Users, UserCheck, AlertTriangle, Info, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import adminService from '@/services/adminService';
import { staggerContainer, fadeInUp } from '@/components/animations';

interface AdminNotification {
  id: string;
  type: 'user_registered' | 'approval_request' | 'system_alert' | 'pickup_issue';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
}

const getTypeIcon = (type: AdminNotification['type']) => {
  switch (type) {
    case 'user_registered':
      return <Users className="h-5 w-5" />;
    case 'approval_request':
      return <UserCheck className="h-5 w-5" />;
    case 'system_alert':
      return <AlertTriangle className="h-5 w-5" />;
    case 'pickup_issue':
      return <Info className="h-5 w-5" />;
    default:
      return <Bell className="h-5 w-5" />;
  }
};

const getTypeColor = (type: AdminNotification['type']) => {
  switch (type) {
    case 'user_registered':
      return 'bg-blue-500/10 text-blue-600';
    case 'approval_request':
      return 'bg-amber-500/10 text-amber-600';
    case 'system_alert':
      return 'bg-purple-500/10 text-purple-600';
    case 'pickup_issue':
      return 'bg-orange-500/10 text-orange-600';
    default:
      return 'bg-gray-500/10 text-gray-600';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'text-red-600 bg-red-100';
    case 'medium':
      return 'text-amber-600 bg-amber-100';
    case 'low':
      return 'text-green-600 bg-green-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

export default function AdminNotifications() {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[Admin] Failed to load notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    loadNotifications();
  }, [isAuthenticated]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await adminService.markNotificationRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      window.dispatchEvent(new Event('admin-badges-refresh'));
      toast({ title: 'Notification marked as read' });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to mark notification as read',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeleting(id);
      await adminService.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      window.dispatchEvent(new Event('admin-badges-refresh'));
      toast({ title: 'Notification deleted' });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to delete notification',
        variant: 'destructive',
      });
    } finally {
      setDeleting(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      await Promise.all(unreadIds.map(id => adminService.markNotificationRead(id)));
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      window.dispatchEvent(new Event('admin-badges-refresh'));
      toast({ title: 'All notifications marked as read' });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to mark notifications as read',
        variant: 'destructive',
      });
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const unreadNotifications = notifications.filter(n => !n.read);
  const readNotifications = notifications.filter(n => n.read);

  if (authLoading) return <AuthLoader />;
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  if (loading) return <AuthLoader />;

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllAsRead}>
            <Check className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </motion.div>

      {/* Error State */}
      {error && (
        <motion.div variants={fadeInUp} className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          <p className="text-sm">{error}</p>
        </motion.div>
      )}

      {/* Loading State */}
      {loading && (
        <motion.div variants={fadeInUp} className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </motion.div>
      )}

      {/* Tabs */}
      {!loading && (
        <motion.div variants={fadeInUp}>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
              <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              {notifications.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200 }}
                      className="rounded-full bg-muted p-4 mb-4"
                    >
                      <Bell className="h-8 w-8 text-muted-foreground" />
                    </motion.div>
                    <p className="text-lg font-medium">No notifications</p>
                    <p className="text-sm text-muted-foreground">You have no notifications yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className={cn(
                        'transition-all hover:shadow-md',
                        !notification.read && 'border-l-4 border-l-primary bg-primary/[0.02]'
                      )}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            {/* Icon */}
                            <div className={cn(
                              'rounded-lg p-2.5 flex-shrink-0',
                              getTypeColor(notification.type)
                            )}>
                              {getTypeIcon(notification.type)}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className={cn(
                                    'font-medium',
                                    !notification.read && 'font-semibold'
                                  )}>
                                    {notification.title}
                                  </h3>
                                  {!notification.read && (
                                    <span className="h-2 w-2 rounded-full bg-primary" />
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {notification.timestamp}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              
                              {/* Actions */}
                              <div className="flex items-center gap-2 mt-3">
                                {!notification.read && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleMarkAsRead(notification.id)}
                                  >
                                    <Check className="h-4 w-4 mr-1" />
                                    Mark as read
                                  </Button>
                                )}
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => handleDelete(notification.id)}
                                  disabled={deleting === notification.id}
                                >
                                  {deleting === notification.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <Trash2 className="h-4 w-4 mr-1" />
                                      Delete
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="unread" className="mt-4">
              {unreadNotifications.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <CheckCircle className="h-8 w-8 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">All caught up!</p>
                    <p className="text-sm text-muted-foreground">All notifications have been read</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {unreadNotifications.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="border-l-4 border-l-primary bg-primary/[0.02]">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            {/* Icon */}
                            <div className={cn(
                              'rounded-lg p-2.5 flex-shrink-0',
                              getTypeColor(notification.type)
                            )}>
                              {getTypeIcon(notification.type)}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-semibold">
                                    {notification.title}
                                  </h3>
                                  <span className="h-2 w-2 rounded-full bg-primary" />
                                </div>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {notification.timestamp}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              
                              {/* Actions */}
                              <div className="flex items-center gap-2 mt-3">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleMarkAsRead(notification.id)}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Mark as read
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => handleDelete(notification.id)}
                                  disabled={deleting === notification.id}
                                >
                                  {deleting === notification.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <Trash2 className="h-4 w-4 mr-1" />
                                      Delete
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      )}
    </motion.div>
  );
}
