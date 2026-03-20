
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

/**
 * Laboratory QR Registry Page
 * Redesigned into a two-panel layout for efficient room management.
 */
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
      // Create a high-quality print canvas
      canvas.width = 1200;
      canvas.height = 1200;
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Scale and center the QR code
        const padding = 100;
        const qrSize = canvas.width - (padding * 2);
        ctx.drawImage(img, padding, padding, qrSize, qrSize);
        
        // Add room label to the image
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

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-slate-50/50 dark:bg-slate-950/50">
      {/* Left Panel: Sidebar List */}
      <div className="w-80 border-r border-[#C5D3E8] dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col">
        <div className="p-6 border-b border-[#C5D3E8] dark:border-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Filter rooms..." 
              className="pl-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border-[#C5D3E8] dark:border-slate-700 text-xs font-bold focus-visible:ring-primary"
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
            {filteredRooms.length === 0 && (
              <p className="text-center py-8 text-xs font-bold text-slate-400 italic">No rooms found</p>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Right Panel: Preview Area */}
      <div className="flex-1 p-8 md:p-12 overflow-auto flex items-center justify-center">
        <Card className="max-w-2xl w-full border border-[#C5D3E8] shadow-[0_2px_8px_rgba(45,58,107,0.08)] hover:shadow-[0_4px_16px_rgba(45,58,107,0.14)] hover:-translate-y-1 transition-all duration-200 bg-[#F4F7FC] dark:bg-slate-900 rounded-[40px] overflow-hidden">
          <CardContent className="p-12 flex flex-col items-center gap-10">
            <div className="text-center space-y-2">
              <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
                {selectedRoom}
              </h3>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                Institutional Laboratory Unit
              </p>
            </div>

            <div className="bg-white p-8 rounded-[48px] border-8 border-slate-50 dark:border-slate-800 shadow-inner relative group">
              <div className="hidden group-hover:flex absolute inset-0 bg-white/60 backdrop-blur-[2px] rounded-[40px] items-center justify-center transition-all animate-in fade-in">
                 <Maximize2 className="h-12 w-12 text-primary" />
              </div>
              <QRCodeSVG
                id={`qr-${selectedRoom}`}
                value={`https://neu-laboratory-log-usage.vercel.app/login?room=${selectedRoom}`}
                size={320}
                level="H"
                includeMargin={true}
                bgColor="#FFFFFF"
                fgColor="#000000"
              />
            </div>

            <div className="w-full flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={() => openView(selectedRoom)}
                variant="outline"
                className="flex-1 h-14 rounded-2xl font-black text-sm gap-3 border-2 border-[#C5D3E8] dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
              >
                <Maximize2 className="h-5 w-5" />
                View Full
              </Button>
              <Button 
                onClick={() => downloadQR(selectedRoom)}
                className="flex-1 h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-sm gap-3 shadow-lg shadow-primary/20 transition-all active:scale-95"
              >
                <Download className="h-5 w-5" />
                Download PNG
              </Button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl w-full border border-[#C5D3E8] dark:border-slate-800">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Encoded Destination</p>
              <code className="text-[11px] font-bold text-primary break-all">
                https://neu-laboratory-log-usage.vercel.app/login?room={selectedRoom}
              </code>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
