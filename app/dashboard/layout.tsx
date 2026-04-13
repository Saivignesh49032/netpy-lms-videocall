import { ReactNode } from 'react';
import Navbar from '@/components/Navbar';
import { Sidebar } from '@/components/dashboard/Sidebar';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <section className="flex min-h-screen flex-1 flex-col px-6 pb-6 pt-28 max-md:pb-14 sm:px-14">
          <div className="w-full h-full max-w-7xl mx-auto">
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
