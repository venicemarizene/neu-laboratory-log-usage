"use client"

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LAB_ROOMS } from '@/lib/constants';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Monitor, Search, Maximize2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function RoomQrRegistryPage() {
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
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

  const cardStyle = "border border-[#B0BED6] dark:border-[#4A5878] shadow-[0_2px_8px_rgba(30,40,80,0.10)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.25)] hover:shadow-[0_4px_16px_rgba(45,58,107,0.14)] hover:-translate-y-[1px] transition-all duration-200 bg-[#F4F7FC] dark:bg-[#3D4966] rounded-[24px] overflow-hidden";
  const roomCardStyle = "border border-[#B0BED6] dark:border-[#4A5878] shadow-[0_2px_8px_rgba(30,40,80,0.10)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.25)] hover:shadow-[0_4px_16px_rgba(45,58,107,0.14)] transition-all duration-200 bg-white dark:bg-[#3D4966] rounded-[20px] p-6 flex flex-col items-center gap-4 group cursor-pointer active:scale-95";

  return (
    <div className="px-8 pt-6 pb-8 space-y-8 max-w-[1400px] mx-auto flex flex-col h-screen overflow-hidden">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="h-9 w-9 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors" />
          <h1 className="text-2xl font-black text-[#3D5C99] dark:text-[#4A90D9] tracking-tight leading-none">Lab QR Registry</h1>
        </div>
        <ThemeToggle />
      </div>

      <div className="flex-1 flex gap-8 overflow-hidden relative">
        <div 
          className="flex-1 flex flex-col gap-8 overflow-hidden"
          onClick={() => { if (selectedRoom) setSelectedRoom(null); }}
        >
          <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search rooms..." 
              className="pl-10 h-12 rounded-2xl bg-white dark:bg-[#3D4966] border-[#B0BED6] dark:border-[#4A5878] text-sm font-bold shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <ScrollArea className="flex-1">
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pr-4">
              {filteredRooms.map((room) => (
                <div
                  key={room}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedRoom(room);
                  }}
                  className={cn(
                    roomCardStyle,
                    selectedRoom === room && "ring-2 ring-primary ring-offset-2 dark:ring-offset-slate-900"
                  )}
                >
                  <div className="h-12 w-12 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                    <Monitor size={24} />
                  </div>
                  <span className="font-black text-lg tracking-tight text-slate-900 dark:text-white">{room}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {selectedRoom && (
          <div className="w-[340px] shrink-0 animate-in slide-in-from-right duration-300 relative z-10">
            <Card className={cn(cardStyle, "h-fit flex flex-col border border-[#B0BED6] dark:border-[#4A5878] shadow-2xl")}>
              <div className="p-6 flex flex-col items-center gap-6">
                <div className="w-full flex items-center justify-between">
                  <div className="text-left">
                    <h3 className="text-2xl font-black text-[#3D5C99] dark:text-[#4A90D9] tracking-tighter">
                      {selectedRoom}
                    </h3>
                    <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">
                      Institutional Laboratory Room
                    </p>
                  </div>
                  <button 
                    onClick={() => setSelectedRoom(null)}
                    className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-primary transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="w-full space-y-4">
                  <div className="bg-white p-4 rounded-[24px] border border-[#B0BED6] dark:border-[#4A5878] shadow-inner flex items-center justify-center aspect-square">
                    <QRCodeSVG
                      id={`qr-${selectedRoom}`}
                      value={`https://neu-laboratory-log-usage.vercel.app/login?room=${selectedRoom}`}
                      size={180}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-[#B0BED6] dark:border-[#4A5878]">
                    <p className="text-[9px] font-bold text-slate-400 break-all leading-tight line-clamp-2">
                      {`https://neu-laboratory-log-usage.vercel.app/login?room=${selectedRoom}`}
                    </p>
                  </div>
                </div>

                <div className="w-full grid grid-cols-2 gap-3">
                  <Button 
                    onClick={() => openView(selectedRoom!)}
                    variant="outline"
                    className="h-10 rounded-xl font-black text-[10px] gap-2 border-[#B0BED6] dark:border-[#4A5878] shadow-sm uppercase tracking-wider"
                  >
                    <Maximize2 size={14} />
                    View Full
                  </Button>
                  <Button 
                    onClick={() => downloadQR(selectedRoom!)}
                    className="h-10 rounded-xl bg-primary hover:bg-primary/90 text-white font-black text-[10px] gap-2 shadow-lg shadow-primary/20 uppercase tracking-wider"
                  >
                    <Download size={14} />
                    Download PNG
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
