
"use client"

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LAB_ROOMS } from '@/lib/constants';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Monitor } from 'lucide-react';

export default function RoomQrGeneratorPage() {
  const downloadQR = (roomName: string) => {
    const svg = document.getElementById(`qr-${roomName}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width + 40; // Add padding
      canvas.height = img.height + 40;
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 20, 20);
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `NEU_Lab_${roomName}_QR.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };
    
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <div className="p-8 space-y-8 max-w-[1400px] mx-auto">
      <header className="space-y-1">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Laboratory QR Registry</h1>
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">
          Generate and manage institutional QR identification for physical lab rooms
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {LAB_ROOMS.map((room) => (
          <Card key={room} className="border-none shadow-sm bg-white rounded-[32px] overflow-hidden hover:shadow-md transition-shadow">
            <CardHeader className="p-6 pb-0 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-black text-slate-900">{room}</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase text-slate-400">
                  Computer Lab
                </CardDescription>
              </div>
              <div className="bg-primary/5 p-2 rounded-xl">
                <Monitor className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="p-6 flex flex-col items-center gap-6">
              <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-inner">
                <QRCodeSVG
                  id={`qr-${room}`}
                  value={room}
                  size={160}
                  level="H"
                  includeMargin={true}
                  bgColor="#FFFFFF"
                  fgColor="#1242A1"
                />
              </div>
              <Button 
                onClick={() => downloadQR(room)}
                className="w-full bg-[#57B9FF] hover:bg-[#57B9FF]/90 text-white border-none rounded-2xl font-bold h-11 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <Download className="h-4 w-4" />
                Download PNG
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
