"use client"

import { ReactNode, useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 bg-primary/20 rounded-full" />
          <div className="h-4 w-24 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const fullName = user.displayName || 'Administrator';
  const initial = fullName.charAt(0).toUpperCase();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#F8FAFC] dark:bg-slate-950 transition-colors">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          {/* Top Header */}
          <header className="h-16 border-b bg-white dark:bg-slate-900 flex items-center justify-between px-8 sticky top-0 z-40 transition-colors">
            <div className="flex items-center gap-3">
              <div className="bg-white rounded-full p-1 shadow-sm border border-slate-100">
                <img
                  src="/NEU_LOGO.png"
                  alt="New Era University Logo"
                  style={{ width: '40px', height: '40px', objectFit: 'contain' }}
                />
              </div>
              <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Admin Portal</span>
            </div>
            <div className="flex items-center gap-6">
              <ThemeToggle />
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-black text-slate-900 dark:text-white leading-none">{fullName}</p>
                  <p className="text-[10px] text-slate-400 font-bold mt-1">{user.email}</p>
                </div>
                <Avatar className="h-10 w-10 bg-primary/10 border-none">
                  <AvatarFallback className="text-primary font-black text-sm">
                    {initial}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto bg-slate-50/50 dark:bg-slate-950/50">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
