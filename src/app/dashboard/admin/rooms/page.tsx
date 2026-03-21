
"use client"

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LAB_ROOMS } from '@/lib/constants';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Monitor, Search, Maximize2, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function RoomQrGeneratorPage() {
  const [selectedRoom, setSelectedRoom] = useState<string>(LAB_ROOMS[0]);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRooms = useMemo(() => {
    return LAB_ROOMS.filter(room => 
      room.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

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

  const cardStyle = "border border-[#B0BED6] dark:border-[#4A5878] shadow-[0_2px_8px_rgba(30,40,80,0.10)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.25)] hover:shadow-[0_4px_16px_rgba(45,58,107,0.14)] hover:-translate-y-[1px] transition-all duration-200 bg-[#F4F7FC] dark:bg-[#3D4966] rounded-[32px] overflow-hidden";

  return (
    <div className="flex flex-col h-full bg-transparent">
      <div className="max-w-[1400px] w-full mx-auto flex items-center justify-between px-8 pt-6 pb-6 bg-transparent">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="h-9 w-9 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors" />
          <div className="flex flex-col">
            <h1 className="text-2xl font-black text-[#3D5C99] dark:text-[#4A90D9] tracking-tight leading-none">Laboratory QR Registry</h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
              Generate and manage institutional QR identification
            </p>
          </div>
        </div>
        <ThemeToggle />
      </div>

      <div className="flex-1 flex overflow-hidden border-t border-[#B0BED6] dark:border-[#4A5878]">
        <div className="max-w-[1400px] w-full mx-auto flex h-full">
          <div className="w-80 border-r border-[#B0BED6] dark:border-[#4A5878] bg-white dark:bg-slate-900 flex flex-col shrink-0">
            <div className="p-6 border-b border-[#B0BED6] dark:border-[#4A5878]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Filter rooms..." 
                  className="pl-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border-[#B0BED6] dark:border-[#4A5878] text-xs font-bold focus-visible:ring-primary"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-1">
                {filteredRooms.map((room) => (
                  <button
                    key={room}
                    onClick={() => setSelectedRoom(room)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group",
                      selectedRoom === room 
                        ? "bg-primary text-white shadow-lg shadow-primary/20" 
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Monitor className={cn("h-4 w-4", selectedRoom === room ? "text-white" : "text-slate-400")} />
                      <span className="font-bold text-sm tracking-tight">{room}</span>
                    </div>
                    <ChevronRight className={cn("h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity", selectedRoom === room && "opacity-100")} />
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="flex-1 p-8 overflow-auto flex items-center justify-center bg-transparent">
            <Card className={cn(cardStyle, "max-w-md w-full max-h-[540px] flex flex-col")}>
              <CardContent className="p-8 flex flex-col items-center gap-6 flex-1 overflow-hidden">
                <div className="text-center space-y-1">
                  <h3 className="text-3xl font-black text-slate-900 dark:text-[#4A90D9] tracking-tighter">
                    {selectedRoom}
                  </h3>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">
                    Institutional Laboratory Unit
                  </p>
                </div>

                <div className="bg-white p-4 rounded-[32px] border-4 border-slate-50 dark:border-slate-800 shadow-inner relative group flex items-center justify-center">
                  <div className="hidden group-hover:flex absolute inset-0 bg-white/60 backdrop-blur-[1px] rounded-[28px] items-center justify-center transition-all animate-in fade-in cursor-pointer" onClick={() => openView(selectedRoom)}>
                     <Maximize2 className="h-10 w-10 text-primary" />
                  </div>
                  <QRCodeSVG
                    id={`qr-${selectedRoom}`}
                    value={`https://neu-laboratory-log-usage.vercel.app/login?room=${selectedRoom}`}
                    size={220}
                    level="H"
                    includeMargin={true}
                    bgColor="#FFFFFF"
                    fgColor="#000000"
                  />
                </div>

                <div className="w-full flex flex-col gap-3 mt-auto">
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => openView(selectedRoom)}
                      variant="outline"
                      className="flex-1 h-11 rounded-xl font-black text-xs gap-2 border-2 border-[#B0BED6] dark:border-[#4A5878] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
                    >
                      <Maximize2 className="h-4 w-4" />
                      View Full
                    </Button>
                    <Button 
                      onClick={() => downloadQR(selectedRoom)}
                      className="flex-1 h-11 rounded-xl bg-primary hover:bg-primary/90 text-white font-black text-xs gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95"
                    >
                      <Download className="h-4 w-4" />
                      Download PNG
                    </Button>
                  </div>
                  
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl w-full border border-[#B0BED6] dark:border-[#4A5878]">
                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Encoded Destination</p>
                    <code className="text-[9px] font-bold text-primary break-all block leading-tight">
                      https://neu-laboratory-log-usage.vercel.app/login?room={selectedRoom}
                    </code>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
