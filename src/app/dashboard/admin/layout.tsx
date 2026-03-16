
"use client"

import { ReactNode, useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

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
      <div className="flex min-h-screen w-full bg-[#F8FAFC]">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          {/* Top Header */}
          <header className="h-16 border-b bg-white flex items-center justify-between px-8 sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Admin Portal</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900 leading-none">{fullName}</p>
                <p className="text-[10px] text-slate-400 font-medium">{user.email}</p>
              </div>
              <Avatar className="h-9 w-9 bg-primary/10 border-none">
                <AvatarFallback className="text-primary font-bold text-sm">
                  {initial}
                </AvatarFallback>
              </Avatar>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
