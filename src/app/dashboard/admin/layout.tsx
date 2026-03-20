
"use client"

import { ReactNode, useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { useUser, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/ThemeToggle';
import { doc } from 'firebase/firestore';

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const pathname = usePathname();

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

  const getPageInfo = () => {
    switch (pathname) {
      case '/dashboard/admin':
        return {
          title: "Laboratory Analytics",
          subtitle: "NEU COMPUTER LABORATORY MANAGEMENT"
        };
      case '/dashboard/admin/users':
        return {
          title: "Professor Directory",
          subtitle: "Institutional account management and laboratory access control"
        };
      case '/dashboard/admin/rooms':
        return {
          title: "Laboratory QR Registry",
          subtitle: "Generate and manage institutional QR identification for physical lab rooms"
        };
      case '/dashboard/admin/management':
        return {
          title: "Room Management",
          subtitle: "Real-time laboratory occupancy and session monitoring"
        };
      default:
        return {
          title: "Admin's Portal",
          subtitle: ""
        };
    }
  };

  const { title, subtitle } = getPageInfo();

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
            <div className="flex items-center gap-4">
              <SidebarTrigger className="h-9 w-9 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors" />
              <div className="flex flex-col">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{title}</h1>
                {subtitle && (
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
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
