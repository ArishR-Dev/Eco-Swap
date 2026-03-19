import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DockItem } from '@/components/navigation';
import {
  LayoutDashboard,
  ClipboardList,
  CheckCircle,
  BarChart3,
} from 'lucide-react';

const collectorNavItems: DockItem[] = [
  {
    title: 'Dashboard',
    href: '/collector',
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    title: 'Tasks',
    href: '/collector/tasks',
    icon: <ClipboardList className="h-5 w-5" />,
  },
  {
    title: 'Completed',
    href: '/collector/completed',
    icon: <CheckCircle className="h-5 w-5" />,
  },
  {
    title: 'Performance',
    href: '/collector/performance',
    icon: <BarChart3 className="h-5 w-5" />,
  },
];

export default function CollectorLayout() {
  return <DashboardLayout navItems={collectorNavItems} title="Collector Dashboard" />;
}
