
"use client"

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  LogOut, 
  Monitor,
  ShieldCheck,
  QrCode
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  SidebarFooter
} from '@/components/ui/sidebar';
import { useAuth } from '@/firebase';

export function AdminSidebar() {
  const pathname = usePathname();
  const auth = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await auth.signOut();
    router.push('/login');
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard },
    { name: 'Professor Directory', href: '/dashboard/admin/users', icon: Users },
    { name: 'Lab QR Registry', href: '/dashboard/admin/rooms', icon: QrCode },
  ];

  return (
    <Sidebar className="border-none bg-primary text-white">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 p-2 rounded-xl">
            <Monitor className="text-white h-6 w-6" />
          </div>
          <span className="font-black text-xl tracking-tight text-white">NEU LabTrack</span>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-0 py-4">
        <SidebarMenu className="gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton 
                  asChild 
                  isActive={isActive}
                  className={cn(
                    "h-12 rounded-none font-bold transition-all px-6 border-l-[6px]",
                    isActive 
                      ? "bg-white text-primary border-white shadow-lg" 
                      : "text-white/60 hover:bg-white/5 hover:text-white border-transparent"
                  )}
                >
                  <Link href={item.href}>
                    <item.icon className={cn("h-5 w-5 mr-3", isActive ? "text-primary" : "text-white/60")} />
                    {item.name}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-6 space-y-4">
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
          <ShieldCheck className="h-4 w-4 text-white/60" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white/60">
            Admin Mode
          </span>
        </div>
        <button 
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-2 w-full text-white/60 hover:text-white transition-colors text-sm font-bold"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
