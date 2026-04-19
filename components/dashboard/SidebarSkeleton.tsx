import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

export function SidebarSkeleton() {
  const pathname = usePathname();
  
  // Try to pre-guess the theme based on URL so the skeleton color matches the final sidebar color
  let baseColor = 'bg-slate-100/50';
  let sideBg = 'bg-slate-50';
  let borderCol = 'border-slate-200';

  if (pathname?.includes('/super-admin')) {
    baseColor = 'bg-slate-800/30';
    sideBg = 'bg-slate-900';
    borderCol = 'border-slate-800';
  } else if (pathname?.includes('/staff')) {
    baseColor = 'bg-emerald-100/50';
    sideBg = 'bg-emerald-50';
    borderCol = 'border-emerald-100';
  } else if (pathname?.includes('/student')) {
    baseColor = 'bg-sky-100/50';
    sideBg = 'bg-sky-50';
    borderCol = 'border-sky-100';
  }

  // 6 skeleton lines for standard navigation
  const NavItem = () => (
    <div className="flex gap-4 items-center p-3 rounded-lg w-full mb-1">
      <div className={cn("w-5 h-5 rounded-md", baseColor)} />
      <div className={cn("h-4 rounded-md w-3/4", baseColor)} />
    </div>
  );

  return (
    <aside className={cn('sticky left-0 top-0 flex h-screen flex-col pt-28 px-4 pb-12 w-64 shrink-0 border-r animate-pulse max-md:hidden', sideBg, borderCol)}>
      <div className="flex flex-col gap-2">
        <div className={cn("h-3 w-16 mb-4 px-2 rounded-sm mx-2", baseColor)} />
        <NavItem />
        <NavItem />
        <NavItem />
        <NavItem />
        <NavItem />
      </div>
    </aside>
  );
}
