import { Outlet } from 'react-router-dom';
import { FloatingDock, DockItem } from '@/components/navigation/FloatingDock';
import { TopBar } from '@/components/navigation/TopBar';
import { MobileNav } from '@/components/navigation/MobileNav';
import { useIsMobile } from '@/hooks/use-mobile';
import { AnimatedPage } from '@/components/animations';

interface DashboardLayoutProps {
  navItems: DockItem[];
  title: string;
}

export function DashboardLayout({ navItems, title }: DashboardLayoutProps) {
  const isMobile = useIsMobile();

  return (
    <div className="flex min-h-screen w-full flex-col bg-gradient-to-br from-background via-background to-muted/20">
      {/* Top Bar */}
      <TopBar title={title} />

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 pb-32 lg:p-8 lg:pb-32">
        <AnimatedPage>
          <Outlet />
        </AnimatedPage>
      </main>

      {/* Navigation */}
      {isMobile ? (
        <MobileNav items={navItems} />
      ) : (
        <FloatingDock items={navItems} />
      )}
    </div>
  );
}
