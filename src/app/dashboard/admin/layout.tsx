
"use client"

import { ReactNode, useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { useUser, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/ThemeToggle';
import { doc } from 'firebase/firestore';

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();

  // Fetch the user's profile to verify their role
  const profileRef = useMemoFirebase(() => {
    if (!user || !db) return null;
    return doc(db, 'user_profiles', user.uid);
  }, [user, db]);
  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  // Role-based protection: redirect non-admins back to the professor dashboard
  useEffect(() => {
    if (!isUserLoading && !isProfileLoading && profile && profile.role !== 'Admin') {
      router.push('/dashboard/professor');
    }
  }, [profile, isProfileLoading, isUserLoading, router]);

  if (isUserLoading || isProfileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 bg-primary/20 rounded-full" />
          <div className="h-4 w-24 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!user || !profile || profile.role !== 'Admin') {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#F8FAFC] dark:bg-slate-950 transition-colors">
        <AdminSidebar />
        <div className="flex-1 flex flex-col relative overflow-hidden">
          {/* Dashboard Controls: Repositioned Toggle and Theme Toggle */}
          <div className="flex items-center justify-between px-6 py-4 bg-transparent shrink-0">
            <SidebarTrigger className="h-9 w-9 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors" />
            <ThemeToggle />
          </div>
          
          <main className="flex-1 overflow-auto bg-slate-50/50 dark:bg-slate-950/50">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
