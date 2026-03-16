
"use client"

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, LayoutDashboard, Users, QrCode, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/firebase';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const isAdmin = pathname.includes('/admin');
  const isProfessor = pathname.includes('/professor');

  const handleSignOut = async () => {
    await auth.signOut();
    router.push('/login');
  };

  return (
    <nav className="border-b bg-white sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-1.5 rounded-lg">
            <Monitor className="text-white h-6 w-6" />
          </div>
          <span className="font-headline font-bold text-xl tracking-tight text-primary">NEU LabTrack</span>
        </div>

        <div className="flex items-center gap-4">
          {isAdmin && (
            <div className="hidden md:flex items-center gap-1 mr-4">
              <NavLink href="/dashboard/admin" icon={<LayoutDashboard size={18} />} active={pathname === '/dashboard/admin'}>Overview</NavLink>
              <NavLink href="/dashboard/admin/users" icon={<Users size={18} />} active={pathname === '/dashboard/admin/users'}>Users</NavLink>
              <NavLink href="/dashboard/admin/rooms" icon={<QrCode size={18} />} active={pathname === '/dashboard/admin/rooms'}>Lab QR Registry</NavLink>
            </div>
          )}
          
          {isProfessor && (
            <div className="hidden md:flex items-center gap-1 mr-4">
              <NavLink href="/dashboard/professor" icon={<LayoutDashboard size={18} />} active={pathname === '/dashboard/professor'}>Dashboard</NavLink>
            </div>
          )}

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleSignOut}
            className="text-muted-foreground hover:text-destructive transition-colors"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, icon, children, active }: { href: string, icon: React.ReactNode, children: React.ReactNode, active: boolean }) {
  return (
    <Link 
      href={href}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
        active 
          ? "bg-primary/10 text-primary" 
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {icon}
      {children}
    </Link>
  );
}
