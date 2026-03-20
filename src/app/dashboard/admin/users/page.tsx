"use client"

import { useState, useEffect } from 'react';
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
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function UserManagementPage() {
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [mounted, setMounted] = useState(false);
  const db = useFirestore();

  const usersQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, 'user_profiles');
  }, [db, user]);
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

  if (!mounted || !user) return null;

  return (
    <div className="p-8 space-y-8 max-w-[1400px] mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Professor Directory</h1>
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">
            Institutional account management and laboratory access control
          </p>
        </div>
      </header>

      <Card className="border-none shadow-sm bg-card dark:bg-[#3D4966] rounded-[32px] overflow-hidden">
        <CardHeader className="p-8 border-b border-slate-50 dark:border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
              <Input 
                placeholder="Search faculty by name or email..." 
                className="pl-10 h-11 rounded-xl bg-background border-slate-300 dark:border-slate-700 text-sm font-bold placeholder:text-slate-300 shadow-sm focus-visible:ring-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="px-8 h-12 text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Professor</TableHead>
                <TableHead className="h-12 text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Role</TableHead>
                <TableHead className="h-12 text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Status</TableHead>
                <TableHead className="px-8 h-12 text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} className="border-slate-50 dark:border-slate-800 hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-colors h-20">
                  <TableCell className="px-8">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{user.name}</span>
                      <span className="text-[11px] text-slate-400 font-medium">{user.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="rounded-full bg-slate-50 dark:bg-slate-900 border-none text-[9px] font-black uppercase tracking-widest px-3 py-0.5 text-slate-400">
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
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
                      <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-none shadow-2xl">
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