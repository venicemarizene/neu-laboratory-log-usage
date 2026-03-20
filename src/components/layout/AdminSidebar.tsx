
"use client"

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  LogOut, 
  ShieldCheck,
  QrCode,
  LayoutList
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
import { useAuth, useUser } from '@/firebase';

export function AdminSidebar() {
  const pathname = usePathname();
  const auth = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const handleSignOut = async () => {
    await auth.signOut();
    router.push('/login');
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard },
    { name: 'Professor Directory', href: '/dashboard/admin/users', icon: Users },
    { name: 'Lab QR Registry', href: '/dashboard/admin/rooms', icon: QrCode },
    { name: 'Room Management', href: '/dashboard/admin/management', icon: LayoutList },
  ];

  return (
    <Sidebar className="border-none bg-primary text-white">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-full p-1 shadow-sm border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
            <img
              src="/NEU_LOGO.png"
              alt="New Era University Logo"
              className="rounded-full"
              style={{ width: '48px', height: '48px', objectFit: 'contain' }}
            />
          </div>
          <span className="font-black text-xl tracking-tight text-white leading-tight">New Era University</span>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarMenu className="gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton 
                  asChild 
                  isActive={isActive}
                  className={cn(
                    "h-12 rounded-lg font-bold transition-all px-6 border-l-[5px]",
                    isActive 
                      ? "bg-white/20 text-white border-white shadow-sm" 
                      : "text-white/60 hover:bg-white/10 hover:text-white border-transparent"
                  )}
                >
                  <Link href={item.href}>
                    <item.icon className={cn("h-5 w-5 mr-3", isActive ? "text-white" : "text-white/60")} />
                    {item.name}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-6 space-y-4 mt-auto">
        {/* Administrator Profile Information */}
        {user && (
          <div className="px-4 py-2 border-b border-white/10 mb-2">
            <p className="text-sm font-black text-white leading-none truncate">
              {user.displayName || 'Administrator'}
            </p>
            <p className="text-[10px] text-white/60 font-bold mt-1 truncate">
              {user.email}
            </p>
          </div>
        )}

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
