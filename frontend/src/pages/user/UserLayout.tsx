import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DockItem } from '@/components/navigation';
import {
  LayoutDashboard,
  Plus,
  ClipboardList,
  History,
  Star,
} from 'lucide-react';

const userNavItems: DockItem[] = [
  {
    title: 'Dashboard',
    href: '/user',
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    title: 'New Pickup',
    href: '/user/new-pickup',
    icon: <Plus className="h-5 w-5" />,
  },
  {
    title: 'Track',
    href: '/user/track',
    icon: <ClipboardList className="h-5 w-5" />,
  },
  {
    title: 'History',
    href: '/user/history',
    icon: <History className="h-5 w-5" />,
  },
  {
    title: 'Feedback',
    href: '/user/feedback',
    icon: <Star className="h-5 w-5" />,
  },
];

export default function UserLayout() {
  return <DashboardLayout navItems={userNavItems} title="My Dashboard" />;
}
