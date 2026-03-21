"use client"

import { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  Search,
  Calendar as CalendarIcon,
  Waves,
  ChevronDown,
  Check,
  Download
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
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, orderBy, limit, where, doc } from 'firebase/firestore';
import { LAB_ROOMS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { startOfDay, endOfDay, subWeeks, subMonths, isBefore, format } from 'date-fns';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Badge } from '@/components/ui/badge';

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAYS = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
const YEARS = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - 2 + i).toString());

const BOOTSTRAP_ADMINS = [
  'venicemarizene.linga@neu.edu.ph',
  'jcesperanza@neu.edu.ph'
];

interface CustomDate {
  month: string;
  day: string;
  year: string;
}

export default function AdminDashboard() {
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLabel, setFilterLabel] = useState('All Logs');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  
  const now = new Date();
  const [customFrom, setCustomFrom] = useState<CustomDate>({
    month: now.getMonth().toString(),
    day: now.getDate().toString(),
    year: now.getFullYear().toString()
  });
  const [customTo, setCustomTo] = useState<CustomDate>({
    month: now.getMonth().toString(),
    day: now.getDate().toString(),
    year: now.getFullYear().toString()
  });

  const db = useFirestore();

  const adminRoleRef = useMemoFirebase(() => {
    if (!user?.uid || !db) return null;
    return doc(db, 'admin_roles', user.uid);
  }, [user?.uid, db]);
  const { data: adminRole, isLoading: isAdminRoleLoading } = useDoc(adminRoleRef);

  const isAuthorizedAdmin = useMemo(() => {
    if (isAdminRoleLoading) return false;
    return !!adminRole || BOOTSTRAP_ADMINS.includes(user?.email || '');
  }, [adminRole, user, isAdminRoleLoading]);

  const usersQuery = useMemoFirebase(() => {
    if (!db || !user || !isAuthorizedAdmin) return null;
    return collection(db, 'user_profiles');
  }, [db, user, isAuthorizedAdmin]);
  const { data: users } = useCollection(usersQuery as any);

  const userNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    users?.forEach(u => {
      if (u.id) map[u.id] = u.name || u.email;
    });
    return map;
  }, [users]);

  const logsQuery = useMemoFirebase(() => {
    if (!db || !user || !isAuthorizedAdmin) return null;
    
    let q = query(collection(db, 'room_logs'), orderBy('createdAt', 'desc'));

    const today = new Date();
    if (filterLabel === 'Daily Logs') {
      const start = startOfDay(today).toISOString();
      q = query(collection(db, 'room_logs'), where('createdAt', '>=', start), orderBy('createdAt', 'desc'));
    } else if (filterLabel === 'Weekly Logs') {
      const start = subWeeks(today, 1).toISOString();
      q = query(collection(db, 'room_logs'), where('createdAt', '>=', start), orderBy('createdAt', 'desc'));
    } else if (filterLabel === 'Monthly Logs') {
      const start = subMonths(today, 1).toISOString();
      q = query(collection(db, 'room_logs'), where('createdAt', '>=', start), orderBy('createdAt', 'desc'));
    } else if (filterLabel === 'Custom Range') {
      const fromDate = new Date(parseInt(customFrom.year), parseInt(customFrom.month), parseInt(customFrom.day));
      const toDate = new Date(parseInt(customTo.year), parseInt(customTo.month), parseInt(customTo.day));
      
      const start = startOfDay(fromDate).toISOString();
      const end = endOfDay(toDate).toISOString();
      q = query(collection(db, 'room_logs'), where('createdAt', '>=', start), where('createdAt', '<=', end), orderBy('createdAt', 'desc'));
    }

    return query(q, limit(100));
  }, [db, user, filterLabel, customFrom, customTo, isAuthorizedAdmin]);
  
  const { data: logs } = useCollection(logsQuery as any);

  useEffect(() => {
    setMounted(true);
  }, []);

  const downloadChart = () => {
    if (!chartRef.current) return;
    const svg = chartRef.current.querySelector('svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    const scale = 2;
    const width = svg.clientWidth;
    const height = svg.clientHeight;
    img.onload = () => {
      canvas.width = width * scale;
      canvas.height = height * scale;
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `NEU_Lab_Usage_Chart_${format(new Date(), 'yyyy-MM-dd')}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  if (!mounted || !user || isAdminRoleLoading) {
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

  const activeLogsCount = logs?.filter(l => l.status === 'Active').length || 0;
  const uniqueFacultyCount = new Set(logs?.map(l => l.professorId)).size || 0;
  const blockedCount = users?.filter(u => u.isBlocked).length || 0;

  const labDistributionData = LAB_ROOMS.map(room => ({
    name: room,
    usage: logs?.filter(l => l.roomId === room).length || 0
  }));

  const filteredLogs = logs?.filter(log => {
    const searchLower = searchTerm.toLowerCase();
    const profNameFromMap = userNameMap[log.professorId] || '';
    const profName = (log.professorName || profNameFromMap || log.professorId || '').toLowerCase();
    const subject = (log.subject || '').toLowerCase();
    const classSection = (log.classSection || '').toLowerCase();
    return (
      profName.includes(searchLower) || 
      log.roomId?.toLowerCase().includes(searchLower) ||
      subject.includes(searchLower) ||
      classSection.includes(searchLower)
    );
  }) || [];

  const formatTime = (dateString: string | null) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return format(date, "MMM d '·' h:mm a");
  };

  const calculateDuration = (start: string, end: string | null) => {
    if (!end) return "Active";
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const diffMs = endTime - startTime;
    if (diffMs <= 0) return "—";
    const totalSeconds = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  const handleApplyRange = () => {
    const fromDate = new Date(parseInt(customFrom.year), parseInt(customFrom.month), parseInt(customFrom.day));
    const toDate = new Date(parseInt(customTo.year), parseInt(customTo.month), parseInt(customTo.day));
    if (isBefore(toDate, fromDate)) return;
    setFilterLabel('Custom Range');
    setIsFilterOpen(false);
  };

  const handleClearRange = () => {
    setFilterLabel('All Logs');
    const resetDate = new Date();
    const resetObj = {
      month: resetDate.getMonth().toString(),
      day: resetDate.getDate().toString(),
      year: resetDate.getFullYear().toString()
    };
    setCustomFrom(resetObj);
    setCustomTo(resetObj);
    setIsFilterOpen(false);
  };

  const cardBaseStyle = "border border-[#B0BED6] dark:border-[#4A5878] shadow-[0_2px_8px_rgba(30,40,80,0.10)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.25)] hover:shadow-[0_4px_16px_rgba(45,58,107,0.14)] hover:-translate-y-[1px] transition-all duration-200 bg-[#F4F7FC] dark:bg-[#3D4966] rounded-[32px] overflow-hidden relative";
  const statCardStyle = "border border-[#B0BED6] dark:border-[#4A5878] shadow-[0_2px_8px_rgba(30,40,80,0.10)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.25)] hover:shadow-[0_4px_16px_rgba(45,58,107,0.14)] hover:-translate-y-[1px] transition-all duration-200 bg-[#D4DFF2] dark:bg-[#3D4966] rounded-[32px] overflow-hidden relative";

  return (
    <div className="px-8 pt-6 pb-8 space-y-8 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="h-9 w-9 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors" />
          <h1 className="text-2xl font-black text-[#3D5C99] dark:text-[#4A90D9] tracking-tight leading-none">Laboratory Analytics</h1>
        </div>
        <ThemeToggle />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className={statCardStyle}>
          <div className="absolute top-6 right-6 opacity-20 text-primary">
            <Waves size={32} />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-[#4A90D9]">
              Active Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-slate-900 dark:text-white mb-1">{activeLogsCount}</div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-300">Current viewing window</p>
          </CardContent>
        </Card>

        <Card className={statCardStyle}>
          <div className="absolute top-6 right-6 opacity-10 text-primary">
            <Users size={24} />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-[#4A90D9]">
              Unique Faculty
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-slate-900 dark:text-white mb-1">{uniqueFacultyCount}</div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-300">Active teaching staff</p>
          </CardContent>
        </Card>

        <Card className={statCardStyle}>
          <div className="absolute top-6 right-6 opacity-20 text-destructive">
            <Waves size={24} />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-[#4A90D9]">
              Blocked Accounts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-destructive mb-1">{blockedCount}</div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-300">Restricted system access</p>
          </CardContent>
        </Card>
      </div>

      <Card className={cn(cardBaseStyle, "p-8")}>
        <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-[#3D5C99] dark:text-[#4A90D9]">Computer Laboratory Distribution</h2>
            <p className="text-xs font-bold text-slate-400">Visual frequency of usage across M101-M111</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={downloadChart}
            className="rounded-xl font-bold gap-2 text-xs border-[#B0BED6] dark:border-[#4A5878]"
          >
            <Download className="h-3.5 w-3.5" />
            Download Chart
          </Button>
        </div>
        <div className="h-[300px] w-full" ref={chartRef}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={labDistributionData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#C5D3E8" />
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
                cursor={{ fill: 'rgba(45, 58, 107, 0.05)' }}
                contentStyle={{ borderRadius: '16px', border: '1px solid #C5D3E8', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
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

      <Card className={cn(cardBaseStyle, "overflow-hidden")}>
        <CardHeader className="p-8 border-b border-[#B0BED6] dark:border-[#4A5878] flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-[#3D5C99] dark:text-[#4A90D9]">Activity Logs</h2>
            <p className="text-xs font-bold text-slate-400">Search and filter institutional usage</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input 
                placeholder="Search faculty, lab, or subject..." 
                className="pl-9 h-11 w-full md:w-64 rounded-xl bg-background border-[#B0BED6] dark:border-[#4A5878] text-xs font-bold shadow-sm focus-visible:ring-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <PopoverTrigger asChild>
                <div className="bg-background border border-[#B0BED6] dark:border-[#4A5878] text-slate-900 dark:text-white h-11 px-4 rounded-xl flex items-center gap-2 font-bold cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
                  <CalendarIcon size={14} className="text-slate-400" />
                  <span className="text-xs">
                    {filterLabel === 'Custom Range' 
                      ? `${MONTHS[parseInt(customFrom.month)]} ${customFrom.day}, ${customFrom.year} - ${MONTHS[parseInt(customTo.month)]} ${customTo.day}, ${customTo.year}`
                      : filterLabel}
                  </span>
                  <ChevronDown size={14} className="text-slate-400 ml-1" />
                </div>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-[320px] sm:w-[500px] p-0 border border-[#B0BED6] dark:border-[#4A5878] shadow-2xl rounded-2xl overflow-hidden flex flex-col bg-card dark:bg-[#3D4966]">
                <div className="flex flex-col md:flex-row">
                  <div className="p-3 border-r border-[#B0BED6] dark:border-[#4A5878] min-w-[160px] bg-slate-50/30 dark:bg-slate-900/30">
                    <div className="space-y-1">
                      {['Daily Logs', 'Weekly Logs', 'Monthly Logs', 'All Logs'].map((option) => (
                        <Button
                          key={option}
                          variant="ghost"
                          className={cn(
                            "w-full justify-start text-xs font-bold h-9 rounded-lg px-3",
                            filterLabel === option ? "bg-background text-primary shadow-sm" : "text-slate-500"
                          )}
                          onClick={() => {
                            setFilterLabel(option);
                            setIsFilterOpen(false);
                          }}
                        >
                          {option}
                          {filterLabel === option && <Check className="ml-auto h-3 w-3" />}
                        </Button>
                      ))}
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start text-xs font-bold h-9 rounded-lg px-3",
                          filterLabel === 'Custom Range' ? "bg-background text-primary shadow-sm" : "text-slate-500"
                        )}
                        onClick={() => setFilterLabel('Custom Range')}
                      >
                        Custom Range
                        {filterLabel === 'Custom Range' && <Check className="ml-auto h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex-1 p-6 space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Start Date</label>
                        <div className="grid grid-cols-3 gap-2">
                          <Select value={customFrom.month} onValueChange={(v) => setCustomFrom(prev => ({...prev, month: v}))}>
                            <SelectTrigger className="h-9 rounded-lg text-[10px] font-bold border-[#B0BED6] dark:border-[#4A5878]">
                              <SelectValue placeholder="Month" />
                            </SelectTrigger>
                            <SelectContent>
                              {MONTHS.map((m, i) => <SelectItem key={m} value={i.toString()} className="text-[10px] font-bold">{m}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <Select value={customFrom.day} onValueChange={(v) => setCustomFrom(prev => ({...prev, day: v}))}>
                            <SelectTrigger className="h-9 rounded-lg text-[10px] font-bold border-[#B0BED6] dark:border-[#4A5878]">
                              <SelectValue placeholder="Day" />
                            </SelectTrigger>
                            <SelectContent>
                              {DAYS.map(d => <SelectItem key={d} value={d} className="text-[10px] font-bold">{d}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <Select value={customFrom.year} onValueChange={(v) => setCustomFrom(prev => ({...prev, year: v}))}>
                            <SelectTrigger className="h-9 rounded-lg text-[10px] font-bold border-[#B0BED6] dark:border-[#4A5878]">
                              <SelectValue placeholder="Year" />
                            </SelectTrigger>
                            <SelectContent>
                              {YEARS.map(y => <SelectItem key={y} value={y} className="text-[10px] font-bold">{y}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">End Date</label>
                        <div className="grid grid-cols-3 gap-2">
                          <Select value={customTo.month} onValueChange={(v) => setCustomTo(prev => ({...prev, month: v}))}>
                            <SelectTrigger className="h-9 rounded-lg text-[10px] font-bold border-[#B0BED6] dark:border-[#4A5878]">
                              <SelectValue placeholder="Month" />
                            </SelectTrigger>
                            <SelectContent>
                              {MONTHS.map((m, i) => <SelectItem key={m} value={i.toString()} className="text-[10px] font-bold">{m}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <Select value={customTo.day} onValueChange={(v) => setCustomTo(prev => ({...prev, day: v}))}>
                            <SelectTrigger className="h-9 rounded-lg text-[10px] font-bold border-[#B0BED6] dark:border-[#4A5878]">
                              <SelectValue placeholder="Day" />
                            </SelectTrigger>
                            <SelectContent>
                              {DAYS.map(d => <SelectItem key={d} value={d} className="text-[10px] font-bold">{d}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <Select value={customTo.year} onValueChange={(v) => setCustomTo(prev => ({...prev, year: v}))}>
                            <SelectTrigger className="h-9 rounded-lg text-[10px] font-bold border-[#B0BED6] dark:border-[#4A5878]">
                              <SelectValue placeholder="Year" />
                            </SelectTrigger>
                            <SelectContent>
                              {YEARS.map(y => <SelectItem key={y} value={y} className="text-[10px] font-bold">{y}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="flex-1 text-[10px] font-black h-9 rounded-xl border-none text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                        onClick={handleClearRange}
                      >
                        Clear Range
                      </Button>
                      <Button 
                        size="sm" 
                        className="flex-2 text-[10px] font-black h-9 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                        onClick={handleApplyRange}
                      >
                        Apply Filters
                      </Button>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
              <TableRow className="border-b border-[#B0BED6] dark:border-[#4A5878] hover:bg-transparent">
                <TableHead className="px-8 h-12 text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Professor</TableHead>
                <TableHead className="hidden md:table-cell h-12 text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Subject</TableHead>
                <TableHead className="hidden md:table-cell h-12 text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Class Section</TableHead>
                <TableHead className="h-12 text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white text-center">Laboratory</TableHead>
                <TableHead className="h-12 text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white text-center">Time In</TableHead>
                <TableHead className="h-12 text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white text-center">Time Out</TableHead>
                <TableHead className="h-12 text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white text-center">Duration</TableHead>
                <TableHead className="px-8 h-12 text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id} className="border-b border-[#B0BED6] dark:border-[#4A5878] hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-colors h-16">
                  <TableCell className="px-8">
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                        {log.professorName || userNameMap[log.professorId] || log.professorId}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      {log.subject || "—"}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      {log.classSection || "—"}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="rounded-full bg-slate-50 dark:bg-slate-900 border-[#B0BED6] dark:border-[#4A5878] text-slate-600 dark:text-slate-400 px-3 py-0.5 text-[9px] font-black uppercase">
                      {log.roomId}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center text-[10px] font-bold text-slate-500">
                    {formatTime(log.startTime)}
                  </TableCell>
                  <TableCell className="text-center text-[10px] font-bold text-slate-500">
                    {formatTime(log.endTime)}
                  </TableCell>
                  <TableCell className="text-center text-[10px] font-bold text-slate-400">
                    {calculateDuration(log.startTime, log.endTime)}
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
                  <TableCell colSpan={8} className="h-32 text-center text-slate-300 font-bold italic">
                    No activity logs found for this criteria.
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
