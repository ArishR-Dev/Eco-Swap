import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DockItem } from '@/components/navigation';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Bell,
  BarChart3,
  Route,
  UserCheck,
} from 'lucide-react';
import adminService from '@/services/adminService';

export default function AdminLayout() {
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadBadges = useCallback(async () => {
    try {
      const [approvals, notifications] = await Promise.all([
        adminService.getPendingApprovals(),
        adminService.getNotifications(),
      ]);
      const pending = (approvals.collectors?.length || 0) + (approvals.recyclers?.length || 0);
      const unread = Array.isArray(notifications)
        ? notifications.filter((n: { read?: boolean }) => !n.read).length
        : 0;
      setPendingCount(pending);
      setUnreadCount(unread);
    } catch {
      setPendingCount(0);
      setUnreadCount(0);
    }
  }, []);

  useEffect(() => {
    loadBadges();
  }, [loadBadges]);

  // Refetch on navigation (updates after mark-read/delete/approve on child pages)
  useEffect(() => {
    loadBadges();
  }, [location.pathname, loadBadges]);

  // Listen for badge refresh (AdminNotifications marks read/delete, Approvals approves)
  useEffect(() => {
    const onRefresh = () => loadBadges();
    window.addEventListener('admin-badges-refresh', onRefresh);
    return () => window.removeEventListener('admin-badges-refresh', onRefresh);
  }, [loadBadges]);

  // Poll every 30s for real-time updates
  useEffect(() => {
    const interval = setInterval(loadBadges, 30000);
    return () => clearInterval(interval);
  }, [loadBadges]);

  const adminNavItems: DockItem[] = [
    { title: 'Dashboard', href: '/admin', icon: <LayoutDashboard className="h-5 w-5" /> },
    { title: 'Users', href: '/admin/users', icon: <Users className="h-5 w-5" /> },
    { title: 'Pickups', href: '/admin/pickups', icon: <ClipboardList className="h-5 w-5" /> },
    {
      title: 'Notifications',
      href: '/admin/notifications',
      icon: <Bell className="h-5 w-5" />,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      title: 'Approvals',
      href: '/admin/approvals',
      icon: <UserCheck className="h-5 w-5" />,
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    { title: 'Routes', href: '/admin/routes', icon: <Route className="h-5 w-5" /> },
    { title: 'Reports', href: '/admin/reports', icon: <BarChart3 className="h-5 w-5" /> },
  ];

  return <DashboardLayout navItems={adminNavItems} title="Admin Dashboard" />;
}
