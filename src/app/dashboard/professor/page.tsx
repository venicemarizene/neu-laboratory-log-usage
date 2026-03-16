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

  const fullName = user?.displayName || 'Professor Name';
  const email = user?.email || 'email@neu.edu.ph';
  const initial = fullName.split(' ').pop()?.charAt(0).toUpperCase() || fullName.charAt(0).toUpperCase();

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
      <header className="bg-white border-b border-slate-100 px-6 sm:px-12 py-4 flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-1.5 rounded-lg shadow-sm">
            <Monitor className="text-white h-5 w-5" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-primary">NEU LabTrack</span>
        </div>

        <div className="flex items-center gap-6 sm:gap-12">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-900 leading-tight">{fullName}</p>
            <p className="text-[11px] text-slate-400 font-medium">{email}</p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleSignOut}
            className="text-slate-500 hover:text-destructive flex items-center gap-2 px-0 hover:bg-transparent"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-bold text-sm">Sign Out</span>
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 space-y-12">
        {/* Success Alert */}
        {statusMessage && (
          <div className="w-full max-w-md bg-green-50 border border-green-100 text-green-700 px-5 py-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 shadow-sm">
            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
            <span className="font-bold text-sm">{statusMessage}</span>
          </div>
        )}

        {/* Welcome Section */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl sm:text-6xl font-[900] text-slate-900 tracking-tight">Welcome back!</h1>
          <p className="text-lg sm:text-2xl text-slate-400 font-bold">Which room would you like to use?</p>
        </div>

        {/* Central Selection Card */}
        <Card className="w-full max-w-lg border-none shadow-[0_20px_50px_rgba(0,0,0,0.06)] rounded-[3rem] overflow-hidden bg-white">
          <CardContent className="p-8 sm:p-14 space-y-10">
            <div className="space-y-4">
              <label className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-300 ml-1">
                Laboratory Room
              </label>
              <Select defaultValue={selectedRoom} onValueChange={setSelectedRoom}>
                <SelectTrigger className="h-16 sm:h-20 rounded-2xl bg-[#F8FAFC] border-none text-xl sm:text-2xl font-black text-slate-900 px-8 shadow-inner ring-offset-0 focus:ring-0">
                  <SelectValue placeholder="Select a room" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-xl">
                  {LAB_ROOMS.map(room => (
                    <SelectItem key={room} value={room} className="font-bold h-14 text-lg">
                      {room}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-5">
              <Button 
                variant="outline"
                className="w-full h-16 sm:h-20 rounded-2xl bg-[#F8FAFC] border-none hover:bg-slate-100 text-slate-500 font-bold text-lg flex items-center justify-center gap-4 transition-all"
              >
                <QrCode className="h-6 w-6 text-slate-300" />
                Auto-Log via QR
              </Button>

              <Button 
                onClick={handleLogEntry}
                disabled={isLogging}
                className="w-full h-16 sm:h-20 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-xl sm:text-2xl flex items-center justify-center gap-4 shadow-[0_10px_30px_rgba(37,99,235,0.25)] transition-all active:scale-[0.98] disabled:opacity-70"
              >
                <ArrowRight className="h-7 w-7" />
                {isLogging ? 'Logging...' : `Log Entry ${selectedRoom}`}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* User Profile Footer Card */}
        <div className="w-full max-w-lg bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-[0_10px_30px_rgba(0,0,0,0.03)] flex items-center justify-between border border-slate-50/50">
          <div className="flex items-center gap-5">
            <Avatar className="h-16 w-16 bg-primary/10 rounded-[1.25rem] border-none">
              <AvatarFallback className="text-primary font-black text-2xl bg-transparent">
                {initial}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-black text-xl text-slate-900 leading-tight">{fullName}</p>
              <p className="text-sm text-slate-400 font-semibold">{email}</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-[#F8FAFC] text-slate-300 font-[900] text-[11px] tracking-[0.2em] px-5 py-2 rounded-full border-none hidden sm:block">
            PROFESSOR
          </Badge>
        </div>
      </main>
      
      {/* Decorative Bottom Left Circle */}
      <div className="fixed bottom-10 left-10 h-12 w-12 bg-slate-900 rounded-full flex items-center justify-center text-white font-black text-base shadow-xl z-0 pointer-events-none">
        N
      </div>

      {/* Decorative Bottom Right Circle */}
      <div className="fixed bottom-10 right-10 h-3 w-3 bg-orange-400 rounded-full z-0 pointer-events-none" />
    </div>
  );
}
