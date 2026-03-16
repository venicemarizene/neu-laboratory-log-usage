"use client"

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Monitor, 
  LogOut,
  QrCode,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { LAB_ROOMS } from '@/lib/constants';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useUser, useAuth, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export default function ProfessorDashboard() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [selectedRoom, setSelectedRoom] = useState<string>("M103");
  const [isLogging, setIsLogging] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleSignOut = async () => {
    await auth.signOut();
    router.push('/login');
  };

  const handleLogEntry = async () => {
    if (!user || !db) return;
    setIsLogging(true);

    const logId = crypto.randomUUID();
    const logRef = doc(db, 'room_logs', logId);

    try {
      await setDoc(logRef, {
        id: logId,
        professorId: user.uid,
        roomId: selectedRoom,
        startTime: new Date().toISOString(),
        status: 'Active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      setStatusMessage(`Session verified. Thank you for using room ${selectedRoom}!`);
      
      // Auto-clear success message after 5 seconds
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Logging Error',
        description: 'Failed to log room usage. Please try again.',
      });
    } finally {
      setIsLogging(false);
    }
  };

  // Extract first name for personalized greeting
  const fullName = user?.displayName || 'Professor';
  const firstName = fullName.split(' ')[0];
  const email = user?.email || 'email@neu.edu.ph';
  const initial = firstName.charAt(0).toUpperCase();

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 bg-primary/20 rounded-full" />
          <div className="h-4 w-24 bg-slate-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-body antialiased">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-1.5 rounded-lg shadow-sm">
            <Monitor className="text-white h-5 w-5" />
          </div>
          <span className="font-bold text-lg tracking-tight text-primary">NEU LabTrack</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-900 leading-tight">{fullName}</p>
            <p className="text-[11px] text-slate-400 font-medium">{email}</p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleSignOut}
            className="text-slate-500 hover:text-destructive flex items-center gap-2 px-3"
          >
            <LogOut className="h-4 w-4" />
            <span className="font-bold text-sm">Sign Out</span>
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
        {/* Success Alert */}
        {statusMessage && (
          <div className="w-full max-w-md bg-green-50 border border-green-100 text-green-700 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 shadow-sm">
            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
            <span className="font-bold text-sm">{statusMessage}</span>
          </div>
        )}

        {/* Welcome Section */}
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Welcome back, {firstName}!</h1>
          <p className="text-base text-slate-400 font-bold">Which room would you like to use?</p>
        </div>

        {/* Central Selection Card */}
        <Card className="w-full max-w-md border-none shadow-xl rounded-3xl overflow-hidden bg-white">
          <CardContent className="p-8 space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 ml-1">
                Laboratory Room
              </label>
              <Select defaultValue={selectedRoom} onValueChange={setSelectedRoom}>
                <SelectTrigger className="h-14 rounded-xl bg-slate-50 border-none text-lg font-black text-slate-900 px-6 shadow-inner ring-offset-0 focus:ring-0">
                  <SelectValue placeholder="Select a room" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-xl">
                  {LAB_ROOMS.map(room => (
                    <SelectItem key={room} value={room} className="font-bold h-12">
                      {room}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <Button 
                variant="outline"
                className="w-full h-14 rounded-xl bg-slate-50 border-none hover:bg-slate-100 text-slate-500 font-bold text-base flex items-center justify-center gap-3 transition-all"
              >
                <QrCode className="h-5 w-5 text-slate-300" />
                Auto-Log via QR
              </Button>

              <Button 
                onClick={handleLogEntry}
                disabled={isLogging}
                className="w-full h-14 rounded-xl bg-primary hover:bg-primary/90 text-white font-black text-lg flex items-center justify-center gap-3 shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-70"
              >
                <ArrowRight className="h-5 w-5" />
                {isLogging ? 'Logging...' : `Log Entry ${selectedRoom}`}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* User Profile Footer Card - Simplified */}
        <div className="w-full max-w-md bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between border border-slate-50">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12 bg-primary/10 rounded-xl border-none">
              <AvatarFallback className="text-primary font-black text-lg bg-transparent">
                {initial}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-black text-base text-slate-900 leading-tight">{fullName}</p>
              <p className="text-xs text-slate-400 font-semibold">Institutional Account</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-slate-50 text-slate-300 font-black text-[10px] tracking-wider px-3 py-1 rounded-full border-none">
            PROFESSOR
          </Badge>
        </div>
      </main>
      
      {/* Decorative Brand Accent */}
      <div className="fixed bottom-6 right-6 h-2 w-2 bg-primary rounded-full opacity-20 pointer-events-none" />
    </div>
  );
}