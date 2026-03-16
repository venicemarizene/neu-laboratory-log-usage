
"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  DoorOpen, 
  Ban, 
  Search,
  Calendar,
  Waves
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { LAB_ROOMS } from '@/lib/constants';

export default function AdminDashboard() {
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const db = useFirestore();

  // Fetch real-time logs
  const logsQuery = query(collection(db, 'room_logs'), orderBy('createdAt', 'desc'), limit(50));
  const { data: logs, isLoading: isLogsLoading } = useCollection(logsQuery as any);

  // Fetch users for blocked count
  const usersQuery = collection(db, 'user_profiles');
  const { data: users } = useCollection(usersQuery as any);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Process data for charts and stats
  const activeLogsCount = logs?.filter(l => l.status === 'Active').length || 0;
  const uniqueFacultyCount = new Set(logs?.map(l => l.professorId)).size || 0;
  const blockedCount = users?.filter(u => u.isBlocked).length || 0;

  // Lab distribution data
  const labDistributionData = LAB_ROOMS.map(room => ({
    name: room,
    usage: logs?.filter(l => l.roomId === room).length || 0
  }));

  const filteredLogs = logs?.filter(log => 
    log.professorId.toLowerCase().includes(searchTerm.toLowerCase()) || 
    log.roomId.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="p-8 space-y-8 max-w-[1400px] mx-auto">
      <header className="space-y-1">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Laboratory Analytics</h1>
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">
          NEU COMPUTER LABORATORY MANAGEMENT
        </p>
      </header>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-xl bg-primary text-white rounded-[32px] overflow-hidden relative">
          <div className="absolute top-6 right-6 opacity-20">
            <Waves size={32} />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-white/60">
              Active Logs Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-black mb-1">{activeLogsCount}</div>
            <p className="text-[10px] font-bold text-white/60">New sessions since 00:00</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white rounded-[32px] overflow-hidden relative">
          <div className="absolute top-6 right-6 opacity-10 text-primary">
            <Users size={24} />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">
              Unique Faculty
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-slate-900 mb-1">{uniqueFacultyCount}</div>
            <p className="text-[10px] font-bold text-slate-300">Active teaching staff</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white rounded-[32px] overflow-hidden relative">
          <div className="absolute top-6 right-6 opacity-20 text-destructive">
            <Ban size={24} />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">
              Blocked Accounts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-destructive mb-1">{blockedCount}</div>
            <p className="text-[10px] font-bold text-slate-300">Restricted system access</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart Section */}
      <Card className="border-none shadow-sm bg-white rounded-[32px] p-8">
        <div className="mb-8">
          <h2 className="text-lg font-black text-slate-900">Computer Laboratory Distribution</h2>
          <p className="text-xs font-bold text-slate-400">Visual frequency of usage across M101-M111</p>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={labDistributionData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
              />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="usage" radius={[4, 4, 0, 0]} barSize={24}>
                {labDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#1e40af' : '#38bdf8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Activity Logs Table */}
      <Card className="border-none shadow-sm bg-white rounded-[32px] overflow-hidden">
        <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900">Activity Logs</h2>
            <p className="text-xs font-bold text-slate-400">Search and filter institutional usage</p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input 
                placeholder="Search..." 
                className="pl-9 h-9 w-48 rounded-xl bg-slate-50 border-none text-xs font-bold"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Badge variant="secondary" className="bg-slate-50 text-slate-900 h-9 px-4 rounded-xl border-none flex gap-2 font-bold cursor-pointer hover:bg-slate-100">
              <Calendar size={14} className="text-slate-400" />
              All Logs
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="px-8 h-12 text-[10px] font-black uppercase tracking-widest text-slate-400">Faculty</TableHead>
                <TableHead className="h-12 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Laboratory</TableHead>
                <TableHead className="h-12 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Timestamp</TableHead>
                <TableHead className="px-8 h-12 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id} className="border-slate-50 hover:bg-slate-50/30 transition-colors h-16">
                  <TableCell className="px-8 font-bold text-sm text-slate-700">{log.professorId}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="rounded-full bg-slate-50 border-slate-200 text-slate-400 px-3 py-0.5 text-[9px] font-black">
                      {log.roomId}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center text-[10px] font-bold text-slate-400">
                    {formatDateTime(log.startTime)}
                  </TableCell>
                  <TableCell className="px-8 text-right">
                    <Badge 
                      className={cn(
                        "rounded-full px-3 py-0.5 text-[9px] font-black uppercase tracking-wider border-none",
                        log.status === 'Active' ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-500"
                      )}
                    >
                      {log.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {filteredLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-slate-300 font-bold italic">
                    No activity logs found.
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
