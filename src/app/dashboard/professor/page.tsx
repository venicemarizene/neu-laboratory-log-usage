
"use client"

import { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LogOut,
  QrCode,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock
} from 'lucide-react';
import { LAB_ROOMS } from '@/lib/constants';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useUser, useAuth, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { doc, query, where, collection, limit } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Html5Qrcode } from 'html5-qrcode';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Separator } from '@/components/ui/separator';

function ScannerView({ onScan }: { onScan: (roomId: string) => void }) {
  const { toast } = useToast();
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("qr-reader");
    scannerRef.current = html5QrCode;

    const startScanner = async () => {
      try {
        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            const foundRoom = LAB_ROOMS.find(r => r === decodedText);
            if (foundRoom) {
              html5QrCode.stop().then(() => {
                onScan(foundRoom);
              }).catch(err => {
                console.warn("Scanner stop failed", err);
                onScan(foundRoom);
              });
            } else {
              toast({
                variant: 'destructive',
                title: 'Invalid QR Code',
                description: `Room identifier "${decodedText}" is not recognized.`,
              });
            }
          },
          () => {}
        );
        setHasCameraPermission(true);
      } catch (err) {
        console.error("Scanner start error:", err);
        setHasCameraPermission(false);
      }
    };

    const timer = setTimeout(startScanner, 400);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(err => console.warn("Cleanup stop failed", err));
      }
    };
  }, [onScan, toast]);

  return (
    <div className="p-6 space-y-4">
      <div className="relative w-full aspect-square rounded-[2rem] overflow-hidden bg-slate-100 dark:bg-slate-800 border-4 border-slate-50 dark:border-slate-700 shadow-inner flex items-center justify-center">
        <div 
          id="qr-reader" 
          className="w-full h-full [&_video]:object-cover [&_video]:w-full [&_video]:h-full"
        />
      </div>
      
      {hasCameraPermission === false && (
        <Alert variant="destructive" className="rounded-xl border-none bg-red-50 text-red-600">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="font-black text-xs uppercase tracking-widest">Camera Access Required</AlertTitle>
          <AlertDescription className="text-[11px] font-bold">
            Please allow camera access in your browser settings to scan laboratory QR codes.
          </AlertDescription>
        </Alert>
      )}

      <p className="text-center text-[10px] text-slate-400 font-black uppercase tracking-widest">
        Position the QR code within the frame
      </p>
    </div>
  );
}

export default function ProfessorDashboard() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [isLogging, setIsLogging] = useState(false);
  const [activeSession, setActiveSession] = useState<{id: string, roomId: string} | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [greeting, setGreeting] = useState("Welcome back");

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
    
    // Time-aware greeting logic
    const hours = new Date().getHours();
    if (hours < 12) setGreeting("Good morning");
    else if (hours < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, [user, isUserLoading, router]);

  const activeSessionQuery = useMemoFirebase(() => {
    if (!user || !db) return null;
    return query(
      collection(db, 'room_logs'),
      where('professorId', '==', user.uid),
      where('status', '==', 'Active'),
      limit(1)
    );
  }, [user, db]);

  const { data: activeSessions } = useCollection(activeSessionQuery);

  const personalLogsQuery = useMemoFirebase(() => {
    if (!user || !db) return null;
    return query(
      collection(db, 'room_logs'),
      where('professorId', '==', user.uid),
      limit(100)
    );
  }, [user, db]);

  const { data: personalLogs } = useCollection(personalLogsQuery);

  // Calculate Personal Stats from personalLogs
  const { sessionsThisMonth, totalHours, mostUsedRoom } = useMemo(() => {
    if (!personalLogs) return { sessionsThisMonth: 0, totalHours: '0.0', mostUsedRoom: '—' };
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthLogs = personalLogs.filter(log => {
      const logDate = new Date(log.startTime);
      return logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear;
    });

    const count = monthLogs.length;
    let ms = 0;
    const rooms: Record<string, number> = {};

    monthLogs.forEach(log => {
      if (log.startTime && log.endTime) {
        ms += (new Date(log.endTime).getTime() - new Date(log.startTime).getTime());
      }
      if (log.roomId) {
        rooms[log.roomId] = (rooms[log.roomId] || 0) + 1;
      }
    });

    let topRoom = '—';
    let max = 0;
    Object.entries(rooms).forEach(([room, freq]) => {
      if (freq > max) {
        max = freq;
        topRoom = room;
      }
    });

    return {
      sessionsThisMonth: count,
      totalHours: (ms / 3600000).toFixed(1),
      mostUsedRoom: topRoom
    };
  }, [personalLogs]);

  useEffect(() => {
    if (activeSessions && activeSessions.length > 0) {
      setActiveSession({ id: activeSessions[0].id, roomId: activeSessions[0].roomId });
    } else {
      setActiveSession(null);
    }
  }, [activeSessions]);

  const handleSignOut = async () => {
    if (user && db && activeSession) {
      const logRef = doc(db, 'room_logs', activeSession.id);
      const updateData = {
        status: 'Completed',
        endTime: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      updateDocumentNonBlocking(logRef, updateData);
    }
    await auth.signOut();
    router.push('/login');
  };

  const handleLogEntry = (roomId: string) => {
    if (!user || !db || isLogging || !roomId) {
      if (!roomId) {
        toast({
          variant: 'destructive',
          title: 'Room Required',
          description: 'Please select a laboratory room before logging an entry.',
        });
      }
      return;
    }

    if (activeSession) {
      toast({
        variant: 'destructive',
        title: 'Session Already Active',
        description: `You are currently logged into room ${activeSession.roomId}. Please end that session first.`,
      });
      return;
    }

    setIsLogging(true);

    const logId = crypto.randomUUID();
    const logRef = doc(db, 'room_logs', logId);
    const now = new Date().toISOString();

    const logData = {
      id: logId,
      professorId: user.uid,
      professorName: user.displayName || 'Professor',
      roomId: roomId,
      startTime: now,
      status: 'Active',
      createdAt: now,
      updatedAt: now,
    };

    setDocumentNonBlocking(logRef, logData, { merge: true });
    
    setActiveSession({ id: logId, roomId: roomId });
    setIsLogging(false);
  };

  const handleEndSession = async () => {
    if (!activeSession || !db) return;
    
    const logRef = doc(db, 'room_logs', activeSession.id);
    const updateData = {
      status: 'Completed',
      endTime: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    updateDocumentNonBlocking(logRef, updateData);
    
    setActiveSession(null);
    await auth.signOut();
    router.push('/login');

    toast({
      title: "Session Completed",
      description: `You have been automatically logged out after finishing your session in ${activeSession.roomId}.`,
    });
  };

  const fullName = user?.displayName || 'Professor';
  const firstName = fullName.split(' ')[0];
  const initial = firstName.charAt(0).toUpperCase();

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 bg-primary/20 rounded-full" />
          <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  const GreetingContent = () => (
    <div className="text-left space-y-2 mb-8">
      <h1 className="text-2xl md:text-3xl font-black text-primary tracking-tight">
        {greeting}, {firstName}!
      </h1>
      <p className="text-sm text-[var(--color-text-secondary)] font-bold">
        {activeSession ? "Current lab session in progress." : "Which room are you using today?"}
      </p>
    </div>
  );

  const UserProfileCard = () => (
    <div className="w-full bg-[var(--color-card-bg)] rounded-[2.5rem] p-6 md:p-8 shadow-sm flex items-center justify-between border border-[var(--color-border)] transition-colors">
      <div className="flex items-center gap-4">
        <Avatar className="h-12 w-12 bg-primary/10 rounded-2xl border-none">
          <AvatarFallback className="text-primary font-black text-base bg-transparent">
            {initial}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <p className="font-black text-base text-[var(--color-text-primary)] leading-none">{fullName}</p>
          <Badge variant="secondary" className="bg-transparent p-0 mt-1 text-[var(--color-text-tertiary)] font-black text-[10px] tracking-widest uppercase border-none">
            PROFESSOR
          </Badge>
        </div>
      </div>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={handleSignOut}
        className="h-12 w-12 text-[var(--color-text-tertiary)] hover:text-destructive hover:bg-destructive/5 rounded-2xl"
      >
        <LogOut className="h-5 w-5" />
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--color-page-bg)] flex flex-col font-body antialiased transition-colors">
      <header className="h-16 border-b flex items-center justify-between px-6 sm:px-12 sticky top-0 z-50 shadow-sm bg-slate-200 dark:bg-slate-900 transition-colors">
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-full p-0.5 shadow-sm border border-slate-100 flex items-center justify-center">
            <img
              src="/NEU_LOGO.png"
              alt="New Era University Logo"
              style={{ width: '34px', height: '34px', objectFit: 'contain' }}
            />
          </div>
          <span className="font-black text-lg tracking-tight text-primary">New Era University</span>
        </div>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex flex-col items-center justify-start p-6 pt-12 md:pt-16">
        <div className="w-full max-w-6xl flex flex-col gap-8 md:gap-10">
          
          {/* Global Alert Area */}
          {activeSession && (
            <div className="w-fit mx-auto md:mx-0 bg-[var(--color-status-active-bg)] border border-transparent text-[var(--color-status-active-text)] px-4 py-3 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-4 shadow-sm">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <span className="font-bold text-sm">
                Session verified. Thank you for using room {activeSession.roomId}.
              </span>
            </div>
          )}

          {/* Main Content Layout Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start relative">
            
            {/* Stats Column - Left (Stack on Desktop | Row on Mobile) */}
            <div className="md:col-span-4 flex flex-col gap-4 w-full md:border-r md:border-[var(--color-border)] md:pr-10">
              <label className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--color-text-tertiary)] ml-2 mb-2">
                Usage Statistics
              </label>
              
              <div className="flex flex-row md:flex-col gap-3 md:gap-6 w-full mb-8">
                {/* Sessions Chip */}
                <div className="flex-1 md:flex-none bg-[var(--color-card-bg)] p-4 md:p-8 rounded-[2rem] border border-[var(--color-border)] flex flex-col items-center justify-center text-center shadow-sm transition-all hover:shadow-md">
                  <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-400 mb-2 leading-none">
                    <span className="hidden md:inline">Sessions This Month</span>
                    <span className="md:hidden">Sessions</span>
                  </span>
                  <span className="text-xl md:text-4xl font-black text-primary dark:text-white leading-none">
                    {sessionsThisMonth}
                  </span>
                </div>

                {/* Hours Chip */}
                <div className="flex-1 md:flex-none bg-[var(--color-card-bg)] p-4 md:p-8 rounded-[2rem] border border-[var(--color-border)] flex flex-col items-center justify-center text-center shadow-sm transition-all hover:shadow-md">
                  <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-400 mb-2 leading-none">
                    <span className="hidden md:inline">Hours Used</span>
                    <span className="md:hidden">Hours</span>
                  </span>
                  <span className="text-xl md:text-4xl font-black text-primary dark:text-white leading-none">
                    {totalHours}h
                  </span>
                </div>

                {/* Room Chip */}
                <div className="flex-1 md:flex-none bg-[var(--color-card-bg)] p-4 md:p-8 rounded-[2rem] border border-[var(--color-border)] flex flex-col items-center justify-center text-center shadow-sm transition-all hover:shadow-md">
                  <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-400 mb-2 leading-none">
                    <span className="hidden md:inline">Most Used Room</span>
                    <span className="md:hidden">Top Room</span>
                  </span>
                  <span className="text-xl md:text-4xl font-black text-primary dark:text-white leading-none">
                    {mostUsedRoom}
                  </span>
                </div>
              </div>

              {/* Professor Profile - Desktop Position */}
              <div className="hidden md:block mt-auto pt-4">
                <UserProfileCard />
              </div>
            </div>

            {/* Main Action Card Column - Right */}
            <div className="md:col-span-8 w-full flex flex-col gap-8">
              {!activeSession ? (
                <Card className="w-full border-none shadow-2xl rounded-[40px] overflow-hidden bg-[var(--color-card-bg)]">
                  <CardContent className="p-8 md:p-12 space-y-8">
                    {/* Greeting integrated into action card */}
                    <GreetingContent />
                    <Separator className="bg-[var(--color-border)] opacity-50 -mt-2 mb-8" />

                    <Button 
                      onClick={() => setIsScannerOpen(true)}
                      className="w-full h-16 rounded-[2rem] bg-primary dark:bg-[#4A6BAD] hover:opacity-90 text-white font-black text-lg flex items-center justify-center gap-4 shadow-lg transition-all active:scale-[0.98] border-none"
                    >
                      <QrCode className="h-6 w-6" />
                      Auto-Log via QR
                    </Button>

                    <div className="relative flex items-center gap-6 py-2">
                      <div className="flex-1 h-px bg-[var(--color-border)] opacity-50"></div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-tertiary)] bg-[var(--color-card-bg)] px-2">or</span>
                      <div className="flex-1 h-px bg-[var(--color-border)] opacity-50"></div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--color-text-tertiary)] ml-2">
                        Institutional Laboratory Unit
                      </label>
                      <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                        <SelectTrigger className="h-14 rounded-[2rem] bg-[var(--color-accent-bg)] border-none text-lg font-black text-[var(--color-text-primary)] px-8 shadow-inner focus:ring-0 transition-colors">
                          <SelectValue placeholder="Select Room" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-xl bg-[var(--color-card-bg)]">
                          {LAB_ROOMS.map(room => (
                            <SelectItem key={room} value={room} className="font-bold h-12 text-base">
                              {room}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button 
                      onClick={() => handleLogEntry(selectedRoom)}
                      disabled={isLogging}
                      variant="outline"
                      className="w-full h-16 rounded-[2rem] border-2 border-[#1E3A8A] dark:border-[#4A6BAD] bg-transparent text-[#1E3A8A] dark:text-white hover:bg-[#1E3A8A]/10 dark:hover:bg-[#4A6BAD]/20 font-black text-lg flex items-center justify-center gap-4 transition-all duration-200 active:scale-[0.98] disabled:opacity-70"
                    >
                      <ArrowRight className="h-5 w-5" />
                      {isLogging ? 'Logging...' : selectedRoom ? `Log Entry ${selectedRoom}` : 'Log Entry'}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="w-full border-none shadow-2xl rounded-[40px] overflow-hidden bg-[var(--color-card-bg)]">
                  <CardContent className="p-8 md:p-16 space-y-10 text-center">
                    {/* Greeting integrated into action card */}
                    <GreetingContent />
                    <Separator className="bg-[var(--color-border)] opacity-50 -mt-2 mb-10" />

                    <div className="space-y-4">
                      <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-5 py-2 rounded-full mb-4">
                        <Clock className="h-4 w-4" />
                        <span className="text-[11px] font-black uppercase tracking-widest">Active Usage</span>
                      </div>
                      <h2 className="text-6xl md:text-8xl font-black text-[var(--color-text-primary)] tracking-tighter">{activeSession.roomId}</h2>
                      <p className="text-sm font-bold text-[var(--color-text-secondary)]">Institutional Session Registered</p>
                    </div>

                    <Button 
                      onClick={handleEndSession}
                      className="w-full h-16 rounded-[2rem] bg-[var(--color-status-blocked-bg)] text-[var(--color-status-blocked-text)] hover:opacity-90 font-black text-lg flex items-center justify-center gap-4 shadow-lg transition-all active:scale-[0.98]"
                    >
                      <LogOut className="h-6 w-6" />
                      End Session
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Professor Profile - Mobile Position */}
              <div className="md:hidden w-full mt-4">
                <UserProfileCard />
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-[32px] border-none bg-[var(--color-card-bg)]">
          <DialogHeader className="p-6 bg-[var(--color-card-bg)] border-b border-[var(--color-border)]">
            <DialogTitle className="text-xl font-black text-[var(--color-text-primary)] tracking-tight">Scan Room QR Code</DialogTitle>
          </DialogHeader>
          
          {isScannerOpen && (
            <ScannerView onScan={(roomId) => {
              setIsScannerOpen(false);
              handleLogEntry(roomId);
            }} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
