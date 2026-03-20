"use client"

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  ShieldAlert, 
  ShieldCheck, 
  MoreVertical
} from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';

const BOOTSTRAP_ADMINS = [
  'venicemarizene.linga@neu.edu.ph',
  'jcesperanza@neu.edu.ph'
];

export default function UserManagementPage() {
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [mounted, setMounted] = useState(false);
  const db = useFirestore();

  // Guard: Verify user role
  const adminRoleRef = useMemoFirebase(() => {
    if (!user?.uid || !db) return null;
    return doc(db, 'admin_roles', user.uid);
  }, [user?.uid, db]);
  const { data: adminRole, isLoading: isAdminRoleLoading } = useDoc(adminRoleRef);

  const profileRef = useMemoFirebase(() => {
    if (!user?.uid || !db) return null;
    return doc(db, 'user_profiles', user.uid);
  }, [user?.uid, db]);
  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef);

  const isAuthorizedAdmin = useMemo(() => {
    if (isAdminRoleLoading || isProfileLoading) return false;
    return (
      !!adminRole || 
      profile?.role === 'Admin' || 
      BOOTSTRAP_ADMINS.includes(user?.email || '')
    );
  }, [adminRole, profile, user, isAdminRoleLoading, isProfileLoading]);

  const usersQuery = useMemoFirebase(() => {
    if (!db || !user || !isAuthorizedAdmin) return null;
    return collection(db, 'user_profiles');
  }, [db, user, isAuthorizedAdmin]);
  const { data: users, isLoading } = useCollection(usersQuery as any);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredUsers = users?.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const toggleBlockStatus = async (uid: string, currentStatus: boolean) => {
    const userRef = doc(db, 'user_profiles', uid);
    updateDocumentNonBlocking(userRef, { isBlocked: !currentStatus });
  };

  if (!mounted || !user || isAdminRoleLoading || isProfileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 bg-primary/20 rounded-full" />
          <div className="h-4 w-24 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!isAuthorizedAdmin) return null;

  const cardStyle = "border border-[#C5D3E8] shadow-[0_2px_8px_rgba(45,58,107,0.08)] hover:shadow-[0_4px_16px_rgba(45,58,107,0.14)] hover:-translate-y-[1px] transition-all duration-200 bg-[#F4F7FC] dark:bg-[#3D4966] rounded-[32px] overflow-hidden";

  return (
    <div className="px-8 pt-6 pb-8 space-y-8 max-w-[1400px] mx-auto">
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="h-9 w-9 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors" />
          <div className="flex flex-col">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Professor Directory</h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
              Institutional account management and laboratory access control
            </p>
          </div>
        </div>
        <ThemeToggle />
      </div>

      <Card className={cardStyle}>
        <CardHeader className="p-8 border-b border-[#C5D3E8] dark:border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
              <Input 
                placeholder="Search faculty by name or email..." 
                className="pl-10 h-11 rounded-xl bg-background border-[#C5D3E8] dark:border-slate-700 text-sm font-bold placeholder:text-slate-300 shadow-sm focus-visible:ring-primary w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
              <TableRow className="border-b border-[#C5D3E8] dark:border-slate-800 hover:bg-transparent">
                <TableHead className="px-8 h-12 text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Professor</TableHead>
                <TableHead className="h-12 text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white text-center">Role</TableHead>
                <TableHead className="h-12 text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white text-center">Status</TableHead>
                <TableHead className="px-8 h-12 text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} className="border-b border-[#C5D3E8] dark:border-slate-800 hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-colors h-20">
                  <TableCell className="px-8 text-left">
                    <div className="flex flex-col items-start">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{user.name}</span>
                      <span className="text-[11px] text-slate-400 font-medium">{user.email}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="rounded-full bg-slate-50 dark:bg-slate-900 border-none text-[9px] font-black uppercase tracking-widest px-3 py-0.5 text-slate-400">
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {user.isBlocked ? (
                      <Badge className="bg-red-50 text-red-600 rounded-full px-3 py-0.5 text-[9px] font-black uppercase tracking-widest border-none">
                        Blocked
                      </Badge>
                    ) : (
                      <Badge className="bg-green-50 text-green-600 rounded-full px-3 py-0.5 text-[9px] font-black uppercase tracking-widest border-none">
                        Active
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="px-8 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-300">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border border-[#C5D3E8] shadow-2xl">
                        <DropdownMenuItem 
                          onClick={() => toggleBlockStatus(user.id, user.isBlocked)}
                          className="rounded-xl h-10 font-bold text-sm cursor-pointer"
                        >
                          {user.isBlocked ? (
                            <><ShieldCheck className="mr-3 h-4 w-4 text-green-500" /> Restore Access</>
                          ) : (
                            <><ShieldAlert className="mr-3 h-4 w-4 text-destructive" /> Revoke Access</>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-slate-300 font-bold italic">
                    No faculty records found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
