
"use client"

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Monitor, 
  Search, 
  ChevronRight, 
  Activity,
  Users,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { LAB_ROOMS } from '@/lib/constants';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';

type FilterType = 'All' | 'Occupied' | 'Vacant';

export default function RoomManagementPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [selectedRoomId, setSelectedRoomId] = useState<string>(LAB_ROOMS[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<FilterType>('All');

  const adminRoleRef = useMemoFirebase(() => {
    if (!user?.uid || !db) return null;
    return doc(db, 'admin_roles', user.uid);
  }, [user?.uid, db]);
  const { isLoading: isAdminRoleLoading } = useDoc(adminRoleRef);

  const activeLogsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'room_logs'), where('status', '==', 'Active'));
  }, [db]);
  const { data: activeLogs, isLoading: isLogsLoading } = useCollection(activeLogsQuery as any);

  const roomOccupancy = useMemo(() => {
    const map: Record<string, { occupied: boolean; professorName?: string }> = {};
    LAB_ROOMS.forEach(roomId => {
      const activeLog = activeLogs?.find(log => log.roomId === roomId);
      map[roomId] = {
        occupied: !!activeLog,
        professorName: activeLog?.professorName || activeLog?.professorId
      };
    });
    return map;
  }, [activeLogs]);

  const stats = useMemo(() => {
    const total = LAB_ROOMS.length;
    const occupied = Object.values(roomOccupancy).filter(r => r.occupied).length;
    const vacant = total - occupied;
    return { total, occupied, vacant };
  }, [roomOccupancy]);

  const filteredRooms = useMemo(() => {
    return LAB_ROOMS.filter(roomId => {
      const occupancy = roomOccupancy[roomId];
      const matchesSearch = 
        roomId.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (occupancy.professorName || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = 
        filter === 'All' || 
        (filter === 'Occupied' && occupancy.occupied) || 
        (filter === 'Vacant' && !occupancy.occupied);

      return matchesSearch && matchesFilter;
    });
  }, [searchTerm, filter, roomOccupancy]);

  const selectedRoomData = roomOccupancy[selectedRoomId];

  if (isAdminRoleLoading || isLogsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 bg-primary/20 rounded-full" />
          <div className="h-4 w-24 bg-muted rounded" />
        </div>
      </div>
    );
  }

  const cardBaseStyle = "border border-[#B0BED6] dark:border-[#4A5878] shadow-[0_2px_8px_rgba(30,40,80,0.10)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.25)] hover:shadow-[0_4px_16px_rgba(45,58,107,0.14)] hover:-translate-y-[1px] transition-all duration-200 bg-[#F4F7FC] dark:bg-[#3D4966] rounded-[32px] overflow-hidden relative";

  return (
    <div className="px-8 pt-6 pb-8 space-y-8 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="h-9 w-9 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors" />
          <div className="flex flex-col">
            <h1 className="text-2xl font-black text-[#3D5C99] dark:text-[#4A90D9] tracking-tight leading-none">Room Management</h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
              Real-time laboratory occupancy and session monitoring
            </p>
          </div>
        </div>
        <ThemeToggle />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className={cardBaseStyle}>
          <CardContent className="p-8 flex items-center gap-6">
            <div className="h-14 w-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <Monitor size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-[#4A90D9] mb-1">Total Rooms</p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white leading-none">{stats.total}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className={cardBaseStyle}>
          <CardContent className="p-8 flex items-center gap-6">
            <div className="h-14 w-14 rounded-2xl bg-red-50 dark:bg-red-950/20 flex items-center justify-center text-red-500">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-[#4A90D9] mb-1">Occupied</p>
              <h3 className="text-3xl font-black text-red-500 leading-none">{stats.occupied}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className={cardBaseStyle}>
          <CardContent className="p-8 flex items-center gap-6">
            <div className="h-14 w-14 rounded-2xl bg-green-50 dark:bg-green-950/20 flex items-center justify-center text-green-500">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-[#4A90D9] mb-1">Vacant</p>
              <h3 className="text-3xl font-black text-green-500 leading-none">{stats.vacant}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl w-full md:w-auto border border-[#B0BED6] dark:border-[#4A5878]">
          {(['All', 'Occupied', 'Vacant'] as FilterType[]).map((f) => (
            <Button
              key={f}
              variant="ghost"
              size="sm"
              onClick={() => setFilter(f)}
              className={cn(
                "flex-1 md:flex-none h-9 px-6 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                filter === f ? "bg-white dark:bg-slate-800 text-primary shadow-sm" : "text-slate-400"
              )}
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 h-[600px]">
        <Card className="md:col-span-5 flex flex-col bg-[#F4F7FC] dark:bg-[#3D4966] border border-[#B0BED6] dark:border-[#4A5878] rounded-[12px] overflow-hidden p-4 shadow-[0_2px_8px_rgba(30,40,80,0.10)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.25)] transition-all">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search room or faculty..." 
              className="pl-10 h-11 rounded-xl bg-background border-[#B0BED6] dark:border-[#4A5878] text-xs font-bold shadow-sm focus-visible:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <ScrollArea className="flex-1">
            <div className="space-y-1 pr-2">
              {filteredRooms.map((roomId) => {
                const occupancy = roomOccupancy[roomId];
                const isActive = selectedRoomId === roomId;
                return (
                  <button
                    key={roomId}
                    onClick={() => setSelectedRoomId(roomId)}
                    className={cn(
                      "w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-200 group",
                      isActive 
                        ? "bg-primary text-white shadow-lg shadow-primary/20" 
                        : "text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
                        isActive ? "bg-white/20" : "bg-slate-100 dark:bg-slate-800"
                      )}>
                        <Monitor className={cn("h-4 w-4", isActive ? "text-white" : "text-slate-400")} />
                      </div>
                      <div className="text-left">
                        <p className="font-black text-sm tracking-tight">{roomId}</p>
                        {occupancy.occupied && !isActive && (
                          <p className="text-[9px] font-bold text-slate-400 truncate max-w-[120px]">
                            {occupancy.professorName}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "rounded-full border-none px-3 py-0.5 text-[9px] font-black uppercase",
                          occupancy.occupied 
                            ? (isActive ? "bg-white/20 text-white" : "bg-red-50 text-red-500 dark:bg-red-950/20")
                            : (isActive ? "bg-white/20 text-white" : "bg-green-50 text-green-500 dark:bg-green-950/20")
                        )}
                      >
                        {occupancy.occupied ? 'Occupied' : 'Vacant'}
                      </Badge>
                      <ChevronRight className={cn("h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity", isActive && "opacity-100")} />
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </Card>

        <Card className={cn(cardBaseStyle, "md:col-span-7 flex items-center justify-center p-12 hover:translate-y-0")}>
          <div className="w-full max-w-md flex flex-col items-center gap-10">
            <div className="text-center space-y-2">
              <h3 className="text-6xl font-black text-slate-900 dark:text-[#4A90D9] tracking-tighter">
                {selectedRoomId}
              </h3>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                Institutional Laboratory Unit
              </p>
            </div>

            <div className="w-full space-y-6">
              <div className={cn(
                "p-8 rounded-[40px] flex flex-col items-center justify-center text-center gap-4 border-2 transition-all duration-500",
                selectedRoomData.occupied 
                  ? "bg-red-50/50 dark:bg-red-950/10 border-red-100 dark:border-red-900/30" 
                  : "bg-green-50/50 dark:bg-green-950/10 border-green-100 dark:border-green-900/30"
              )}>
                <div className={cn(
                  "h-16 w-16 rounded-3xl flex items-center justify-center shadow-sm",
                  selectedRoomData.occupied ? "bg-red-500 text-white" : "bg-green-500 text-white"
                )}>
                  {selectedRoomData.occupied ? <Activity size={32} /> : <CheckCircle2 size={32} />}
                </div>
                
                <div>
                  <Badge className={cn(
                    "rounded-full px-4 py-1 text-[11px] font-black uppercase tracking-[0.1em] border-none mb-2",
                    selectedRoomData.occupied ? "bg-red-500 text-white" : "bg-green-500 text-white"
                  )}>
                    {selectedRoomData.occupied ? 'Active Session' : 'Ready for Usage'}
                  </Badge>
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                    Status: {selectedRoomData.occupied ? 'Laboratory currently in use' : 'Laboratory is vacant'}
                  </p>
                </div>
              </div>

              {selectedRoomData.occupied && (
                <Card className="border border-[#B0BED6] dark:border-[#4A5878] shadow-sm bg-white dark:bg-slate-800 rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                      <Users size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-[#4A90D9] mb-1">Current Faculty</p>
                      <p className="text-base font-black text-slate-900 dark:text-white leading-tight">
                        {selectedRoomData.professorName}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
