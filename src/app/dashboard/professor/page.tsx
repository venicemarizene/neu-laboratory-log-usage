"use client"

import { useState, useEffect, useRef } from 'react';
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
  const { user, isUserLoading } = userHook();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [selectedRoom, setSelectedRoom] = useState<string>("M103");
  const [isLogging, setIsLogging] = useState(false);
  const [activeSession, setActiveSession] = useState<{id: string, roomId: string} | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  function userHook() {
      return useUser();
  }

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
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
    if (!user || !db || isLogging) return;

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

  return (
    <div className="min-h-screen bg-[var(--color-page-bg)] flex flex-col font-body antialiased transition-colors">
      <header className="h-16 border-b flex items-center justify-between px-6 sm:px-12 sticky top-0 z-50 shadow-sm bg-slate-50 dark:bg-slate-900 transition-colors">
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

      <main className="flex-1 flex flex-col items-center justify-start p-6 pt-16">
        {/* Unified Centered Container */}
        <div className="w-full max-w-md flex flex-col items-center gap-8">
          
          {/* Greeting Section */}
          <div className="w-full flex flex-col items-center gap-6">
            {activeSession && (
              <div className="w-full bg-[var(--color-status-active-bg)] border border-transparent text-[var(--color-status-active-text)] px-4 py-3 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-4 shadow-sm">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <span className="font-bold text-sm">
                  Session verified. Thank you for using room {activeSession.roomId}.
                </span>
              </div>
            )}

            <div className="text-center space-y-2">
              <h1 className="text-3xl font-black text-[var(--color-text-primary)] tracking-tight">Welcome back, {firstName}!</h1>
              <p className="text-base text-[var(--color-text-secondary)] font-bold">
                {activeSession ? "Current lab session in progress." : "Which room are you using today?"}
              </p>
            </div>
          </div>

          {/* Cards Group (Main Logic + Profile Info) */}
          <div className="w-full flex flex-col items-center gap-4">
            {!activeSession ? (
              <Card className="w-full max-w-[360px] border-none shadow-2xl rounded-[32px] overflow-hidden bg-[var(--color-card-bg)]">
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-tertiary)] ml-1">
                      Laboratory Room
                    </label>
                    <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                      <SelectTrigger className="h-12 rounded-2xl bg-[var(--color-accent-bg)] border-none text-base font-black text-[var(--color-text-primary)] px-6 shadow-inner focus:ring-0 transition-colors">
                        <SelectValue placeholder="Select a room" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-none shadow-xl bg-[var(--color-card-bg)]">
                        {LAB_ROOMS.map(room => (
                          <SelectItem key={room} value={room} className="font-bold h-10">
                            {room}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Button 
                      onClick={() => setIsScannerOpen(true)}
                      variant="outline"
                      className="w-full h-12 rounded-2xl bg-[var(--color-accent-bg)] border-none hover:opacity-80 text-[var(--color-text-secondary)] font-bold text-sm flex items-center justify-center gap-3 transition-all"
                    >
                      <QrCode className="h-4 w-4" />
                      Auto-Log via QR
                    </Button>

                    <Button 
                      onClick={() => handleLogEntry(selectedRoom)}
                      disabled={isLogging}
                      className="w-full h-12 rounded-2xl bg-[#3D5C99] dark:bg-[#3D6DB5] hover:bg-[#3D5C99]/90 dark:hover:bg-[#2F5A9E] text-white font-black text-base flex items-center justify-center gap-3 shadow-lg transition-all active:scale-[0.98] disabled:opacity-70"
                    >
                      <ArrowRight className="h-4 w-4" />
                      {isLogging ? 'Logging...' : `Log Entry ${selectedRoom}`}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="w-full max-w-[360px] border-none shadow-2xl rounded-[32px] overflow-hidden bg-[var(--color-card-bg)]">
                <CardContent className="p-8 space-y-6">
                  <div className="text-center space-y-2 py-4">
                    <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full mb-2">
                      <Clock className="h-3 w-3" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Active Usage</span>
                    </div>
                    <h2 className="text-5xl font-black text-[var(--color-text-primary)]">{activeSession.roomId}</h2>
                    <p className="text-xs font-bold text-[var(--color-text-secondary)]">Institutional Session Registered</p>
                  </div>

                  <Button 
                    onClick={handleEndSession}
                    className="w-full h-14 rounded-2xl bg-[var(--color-status-blocked-bg)] text-[var(--color-status-blocked-text)] hover:opacity-90 font-black text-base flex items-center justify-center gap-3 shadow-lg transition-all active:scale-[0.98]"
                  >
                    <LogOut className="h-4 w-4" />
                    End Session
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Professor Info Card (Now directly below the main card) */}
            <div className="w-full max-w-[360px] bg-[var(--color-card-bg)] rounded-3xl p-4 shadow-sm flex items-center justify-between border border-[var(--color-border)] transition-colors">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 bg-primary/10 rounded-2xl border-none">
                  <AvatarFallback className="text-primary font-black text-sm bg-transparent">
                    {initial}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <p className="font-black text-sm text-[var(--color-text-primary)] leading-none">{fullName}</p>
                  <Badge variant="secondary" className="bg-transparent p-0 text-[var(--color-text-tertiary)] font-black text-[9px] tracking-wider uppercase border-none">
                    PROFESSOR
                  </Badge>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleSignOut}
                className="text-[var(--color-text-tertiary)] hover:text-destructive hover:bg-destructive/5 rounded-xl"
              >
                <LogOut className="h-4 w-4" />
              </Button>
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
