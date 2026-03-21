
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
  Activity,
  Users,
  CheckCircle2,
  X,
  Maximize2,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { LAB_ROOMS } from '@/lib/constants';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { QRCodeSVG } from 'qrcode.react';

type FilterType = 'All' | 'Occupied' | 'Vacant';

export default function RoomManagementPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
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
    const map: Record<string, { occupied: boolean; professorName?: string; session?: any }> = {};
    LAB_ROOMS.forEach(roomId => {
      const activeLog = activeLogs?.find(log => log.roomId === roomId);
      map[roomId] = {
        occupied: !!activeLog,
        professorName: activeLog?.professorName || activeLog?.professorId,
        session: activeLog
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

  const selectedRoomData = selectedRoomId ? roomOccupancy[selectedRoomId] : null;

  const downloadQR = (roomName: string) => {
    const svg = document.getElementById(`qr-${roomName}`);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = 1200;
      canvas.height = 1200;
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const padding = 100;
        const qrSize = canvas.width - (padding * 2);
        ctx.drawImage(img, padding, padding, qrSize, qrSize);
        ctx.fillStyle = "black";
        ctx.font = "bold 80px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`LABORATORY: ${roomName}`, canvas.width / 2, canvas.height - 100);
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `NEU_Lab_${roomName}_QR.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const openView = (roomName: string) => {
    const qrValue = `https://neu-laboratory-log-usage.vercel.app/login?room=${roomName}`;
    window.open(`https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(qrValue)}`, '_blank');
  };

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
  const statCardStyle = "border border-[#B0BED6] dark:border-[#4A5878] shadow-[0_2px_8px_rgba(30,40,80,0.10)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.25)] hover:shadow-[0_4px_16px_rgba(45,58,107,0.14)] hover:-translate-y-[1px] transition-all duration-200 bg-[#D4DFF2] dark:bg-[#3D4966] rounded-[32px] overflow-hidden relative";

  return (
    <div className="px-8 pt-6 pb-20 md:pb-8 space-y-8 max-w-[1400px] mx-auto flex flex-col h-screen overflow-hidden">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="h-9 w-9 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors" />
          <h1 className="text-2xl font-black text-[#3D5C99] dark:text-[#4A90D9] tracking-tight leading-none">Room Management</h1>
        </div>
        <ThemeToggle />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
        <Card className={statCardStyle}>
          <CardContent className="p-8 flex items-center gap-6">
            <div className="h-14 w-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <Monitor size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#3D5C99] dark:text-[#4A90D9] mb-1">Total Rooms</p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white leading-none">{stats.total}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className={statCardStyle}>
          <CardContent className="p-8 flex items-center gap-6">
            <div className="h-14 w-14 rounded-2xl bg-red-50 dark:bg-red-950/20 flex items-center justify-center text-red-500">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#3D5C99] dark:text-[#4A90D9] mb-1">Occupied</p>
              <h3 className="text-3xl font-black text-red-500 leading-none">{stats.occupied}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className={statCardStyle}>
          <CardContent className="p-8 flex items-center gap-6">
            <div className="h-14 w-14 rounded-2xl bg-green-50 dark:bg-green-950/20 flex items-center justify-center text-green-500">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#3D5C99] dark:text-[#4A90D9] mb-1">Vacant</p>
              <h3 className="text-3xl font-black text-green-500 leading-none">{stats.vacant}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 flex gap-8 overflow-hidden relative">
        <div 
          className="flex-1 flex flex-col gap-8 overflow-hidden"
          onClick={() => { if (selectedRoomId) setSelectedRoomId(null); }}
        >
          <div className="flex flex-col md:flex-row items-center gap-4 shrink-0" onClick={(e) => e.stopPropagation()}>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search room or faculty..." 
                className="pl-10 h-12 rounded-2xl bg-white dark:bg-[#3D4966] border-[#B0BED6] dark:border-[#4A5878] text-sm font-bold shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-[#B0BED6] dark:border-[#4A5878]">
              {(['All', 'Occupied', 'Vacant'] as FilterType[]).map((f) => (
                <Button
                  key={f}
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilter(f)}
                  className={cn(
                    "h-9 px-6 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                    filter === f ? "bg-white dark:bg-slate-800 text-[#3D5C99] dark:text-[#4A90D9] shadow-sm" : "text-slate-500"
                  )}
                >
                  {f}
                </Button>
              ))}
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pr-4 pb-12">
              {filteredRooms.map((roomId) => {
                const occupancy = roomOccupancy[roomId];
                const isActive = selectedRoomId === roomId;
                return (
                  <div
                    key={roomId}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRoomId(roomId);
                    }}
                    className={cn(
                      "border border-[#B0BED6] dark:border-[#4A5878] shadow-[0_2px_8px_rgba(30,40,80,0.10)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.25)] hover:shadow-[0_4px_16px_rgba(45,58,107,0.14)] transition-all duration-200 bg-white dark:bg-[#3D4966] rounded-[20px] p-6 flex flex-col items-center gap-4 group cursor-pointer active:scale-95 relative",
                      isActive && "ring-2 ring-primary ring-offset-2 dark:ring-offset-slate-900"
                    )}
                  >
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                      <div className={cn(
                        "h-2.5 w-2.5 rounded-full animate-custom-pulse",
                        occupancy.occupied ? "bg-[#E24B4A]" : "bg-[#22C55E]"
                      )} />
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                      <Monitor size={24} />
                    </div>
                    <div className="text-center">
                      <span className="font-black text-lg tracking-tight text-slate-900 dark:text-white">{roomId}</span>
                      {occupancy.occupied && (
                        <p className="text-[9px] font-bold text-slate-400 truncate max-w-[120px] mt-1">
                          {occupancy.professorName}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {selectedRoomId && selectedRoomData && (
          <div className="w-[360px] shrink-0 animate-in slide-in-from-right duration-300 relative z-10">
            <Card className={cn(cardBaseStyle, "h-fit flex flex-col border border-[#B0BED6] dark:border-[#4A5878] shadow-2xl bg-[#F4F7FC] dark:bg-[#3D4966] transition-none hover:translate-y-0")}>
              <div className="p-6 flex flex-col items-center gap-8">
                <div className="w-full flex items-center justify-between">
                  <div className="text-left">
                    <h3 className="text-2xl font-black text-[#3D5C99] dark:text-[#4A90D9] tracking-tighter">
                      {selectedRoomId}
                    </h3>
                    <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">
                      Institutional Laboratory Room
                    </p>
                  </div>
                  <button 
                    onClick={() => setSelectedRoomId(null)}
                    className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-primary transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="w-full space-y-6">
                  <div className={cn(
                    "p-8 rounded-[40px] flex flex-col items-center justify-center text-center gap-4 border transition-all duration-500",
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
                    <Card className="border border-[#B0BED6] dark:border-[#4A5878] shadow-sm bg-white dark:bg-slate-800 rounded-3xl overflow-hidden">
                      <CardContent className="p-6 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-[#3D5C99]/10 dark:bg-[#4A90D9]/10 flex items-center justify-center text-[#3D5C99] dark:text-[#4A90D9]">
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

                  <div className="w-full space-y-4">
                    <div className="bg-white p-4 rounded-[24px] border border-[#B0BED6] dark:border-[#4A5878] shadow-inner flex items-center justify-center aspect-square max-w-[180px] mx-auto">
                      <QRCodeSVG
                        id={`qr-${selectedRoomId}`}
                        value={`https://neu-laboratory-log-usage.vercel.app/login?room=${selectedRoomId}`}
                        size={140}
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                    <div className="w-full grid grid-cols-2 gap-3">
                      <Button 
                        onClick={() => openView(selectedRoomId!)}
                        variant="outline"
                        className="h-10 rounded-xl font-black text-[10px] gap-2 border-[#B0BED6] dark:border-[#4A5878] shadow-sm uppercase tracking-wider"
                      >
                        <Maximize2 size={14} />
                        View Full
                      </Button>
                      <Button 
                        onClick={() => downloadQR(selectedRoomId!)}
                        className="h-10 rounded-xl bg-primary hover:bg-primary/90 text-white font-black text-[10px] gap-2 shadow-lg shadow-primary/20 uppercase tracking-wider"
                      >
                        <Download size={14} />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
