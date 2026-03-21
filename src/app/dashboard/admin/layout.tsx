
"use client"

import { ReactNode, useEffect, useState } from 'react';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { useUser, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { useRouter } from 'next/navigation';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { PanelLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

function FloatingSidebarToggle() {
  const { toggleSidebar } = useSidebar();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShow(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleSidebar}
      className={cn(
        "fixed top-4 left-4 z-[60] h-10 w-10 rounded-full md:hidden transition-opacity duration-200 shadow-lg border-none",
        "bg-[#2B3D6B] dark:bg-[#0F172A] text-white hover:bg-[#2B3D6B]/90 dark:hover:bg-[#0F172A]/90",
        show ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      <PanelLeft className="h-5 w-5" />
    </Button>
  );
}

function AdminDashboardLayoutContent({ children }: { children: ReactNode }) {
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
    <div className="flex min-h-screen w-full bg-[#F8FAFC] dark:bg-[#2A3245] transition-colors">
      <FloatingSidebarToggle />
      <AdminSidebar />
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <main className="flex-1 overflow-auto bg-transparent">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <AdminDashboardLayoutContent>
        {children}
      </AdminDashboardLayoutContent>
    </SidebarProvider>
  );
}
