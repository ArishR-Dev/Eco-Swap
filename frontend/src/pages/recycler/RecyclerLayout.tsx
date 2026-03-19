import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DockItem } from '@/components/navigation';
import {
  LayoutDashboard,
  Package,
  Recycle,
  FileCheck,
  BarChart3,
} from 'lucide-react';

const recyclerNavItems: DockItem[] = [
  {
    title: 'Dashboard',
    href: '/recycler',
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    title: 'Incoming',
    href: '/recycler/incoming',
    icon: <Package className="h-5 w-5" />,
  },
  {
    title: 'Log',
    href: '/recycler/log',
    icon: <Recycle className="h-5 w-5" />,
  },
  {
    title: 'Certificates',
    href: '/recycler/certificates',
    icon: <FileCheck className="h-5 w-5" />,
  },
  {
    title: 'Reports',
    href: '/recycler/reports',
    icon: <BarChart3 className="h-5 w-5" />,
  },
];

export default function RecyclerLayout() {
  return <DashboardLayout navItems={recyclerNavItems} title="Recycler Dashboard" />;
}
