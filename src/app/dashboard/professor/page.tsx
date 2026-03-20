"use client"

import { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  LogOut,
  QrCode,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  Check
} from 'lucide-react';
import { LAB_ROOMS } from '@/lib/constants';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  useUser, 
  useAuth, 
  useFirestore, 
  useCollection, 
  useMemoFirebase,
  errorEmitter,
  FirestorePermissionError 
} from '@/firebase';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { doc, query, where, collection, limit, orderBy, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Html5Qrcode } from 'html5-qrcode';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { ThemeToggle } from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

/**
 * Renders a suggestion box for Subject/Class Section.
 * Desktop: Dropdown list
 * Mobile: Scrollable horizontal chips
 */
const SuggestionBox = ({ items, onSelect }: { items: string[], onSelect: (val: string) => void }) => {
  if (items.length === 0) return null;
  return (
    <div className="w-full">
      {/* Desktop View */}
      <div className="hidden md:block absolute z-20 w-full top-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
        {items.map((item, idx) => (
          <button
            key={idx}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              onSelect(item);
            }}
            className="w-full text-left px-6 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-b last:border-none border-slate-50 dark:border-slate-800"
          >
            {item}
          </button>
        ))}
      </div>
      {/* Mobile View */}
      <div className="md:hidden mt-2">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2 pb-2">
            {items.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelect(item);
                }}
                className="inline-flex items-center px-4 h-9 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-black text-primary dark:text-blue-400 border border-slate-200 dark:border-slate-700 transition-all active:scale-95"
              >
                {item}
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
};

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
  const [subject, setSubject] = useState<string>("");
  const [classSection, setClassSection] = useState<string>("");
  const [isLogging, setIsLogging] = useState(false);
  const [activeSession, setActiveSession] = useState<{
    id: string; 
    roomId: string; 
    subject?: string; 
    classSection?: string; 
    startTime?: string;
  } | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [scannedRoomId, setScannedRoomId] = useState<string>("");
  const [greeting, setGreeting] = useState("Welcome back");
  const [showSuccess, setShowSuccess] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const [elapsedTime, setElapsedTime] = useState("00:00:00");
  
  const [errors, setErrors] = useState<{subject?: string, classSection?: string, room?: string}>({});
  const [activeInput, setActiveInput] = useState<'subject' | 'classSection' | null>(null);

  useEffect(() => {
    let fadeTimer: NodeJS.Timeout;
    let hideTimer: NodeJS.Timeout;
    if (showSuccess) {
      fadeTimer = setTimeout(() => {
        setIsFading(true);
        hideTimer = setTimeout(() => {
          setShowSuccess(false);
          setIsFading(false);
        }, 500); 
      }, 4000);
    }
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [showSuccess]);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
    const hours = new Date().getHours();
    if (hours < 12) setGreeting("Good morning");
    else if (hours < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, [user, isUserLoading, router]);

  const activeSessionQuery = useMemoFirebase(() => {
    if (!user?.uid || !db) return null;
    return query(
      collection(db, 'room_logs'),
      where('professorId', '==', user.uid),
      where('status', '==', 'Active'),
      limit(1)
    );
  }, [user?.uid, db]);

  const { data: activeSessions } = useCollection(activeSessionQuery);

  const personalLogsQuery = useMemoFirebase(() => {
    if (!user?.uid || !db) return null;
    return query(
      collection(db, 'room_logs'),
      where('professorId', '==', user.uid),
      orderBy('startTime', 'desc'),
      limit(100)
    );
  }, [user?.uid, db]);

  const { data: personalLogs } = useCollection(personalLogsQuery);

  useEffect(() => {
    let interval: any;
    if (activeSession?.startTime) {
      const updateTimer = () => {
        const start = new Date(activeSession.startTime!).getTime();
        const now = Date.now();
        const diff = Math.max(0, now - start);
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setElapsedTime(
          `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
        );
      };
      updateTimer();
      interval = setInterval(updateTimer, 1000);
    } else {
      setElapsedTime("00:00:00");
    }
    return () => clearInterval(interval);
  }, [activeSession?.startTime]);

  const suggestions = useMemo(() => {
    if (!personalLogs) return { subjects: [], classSections: [] };
    const subjectsSet = new Set<string>();
    const sectionsSet = new Set<string>();
    for (const log of personalLogs) {
      if (log.subject && subjectsSet.size < 5) subjectsSet.add(log.subject);
      if (log.classSection && sectionsSet.size < 5) sectionsSet.add(log.classSection);
      if (subjectsSet.size === 5 && sectionsSet.size === 5) break;
    }
    return {
      subjects: Array.from(subjectsSet),
      classSections: Array.from(sectionsSet)
    };
  }, [personalLogs]);

  const filteredSuggestions = useMemo(() => {
    if (activeInput === 'subject') {
      return suggestions.subjects.filter(s => s.toLowerCase().includes(subject.toLowerCase()));
    }
    if (activeInput === 'classSection') {
      return suggestions.classSections.filter(s => s.toLowerCase().includes(classSection.toLowerCase()));
    }
    return [];
  }, [activeInput, suggestions, subject, classSection]);

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
      if (log.startTime && log.endTime) ms += (new Date(log.endTime).getTime() - new Date(log.startTime).getTime());
      if (log.roomId) rooms[log.roomId] = (rooms[log.roomId] || 0) + 1;
    });
    let topRoom = '—';
    let max = 0;
    Object.entries(rooms).forEach(([room, freq]) => {
      if (freq > max) { max = freq; topRoom = room; }
    });
    return { sessionsThisMonth: count, totalHours: (ms / 3600000).toFixed(1), mostUsedRoom: topRoom };
  }, [personalLogs]);

  useEffect(() => {
    if (activeSessions && activeSessions.length > 0) {
      const sess = activeSessions[0];
      setActiveSession({ 
        id: sess.id, 
        roomId: sess.roomId,
        subject: sess.subject,
        classSection: sess.classSection,
        startTime: sess.startTime
      });
    } else {
      setActiveSession(null);
    }
  }, [activeSessions]);

  const handleSignOut = async () => {
    await auth.signOut();
    router.push('/login');
  };

  const handleLogEntry = (roomId: string) => {
    const newErrors: {subject?: string, classSection?: string, room?: string} = {};
    if (!roomId) newErrors.room = "Room is required";
    if (!subject.trim()) newErrors.subject = "This field is required.";
    if (!classSection.trim()) newErrors.classSection = "This field is required.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

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

    setDocumentNonBlocking(logRef, {
      id: logId,
      professorId: user.uid,
      professorName: user.displayName || 'Professor',
      roomId: roomId,
      subject: subject.trim(),
      classSection: classSection.trim(),
      startTime: now,
      status: 'Active',
      createdAt: now,
      updatedAt: now,
    }, { merge: true });
    
    setActiveSession({ 
      id: logId, 
      roomId: roomId,
      subject: subject.trim(),
      classSection: classSection.trim(),
      startTime: now
    });
    setShowSuccess(true);
    setIsFading(false);
    setIsLogging(false);
    setSubject("");
    setClassSection("");
    setSelectedRoom("");
    setIsConfirmModalOpen(false);
  };

  const handleEndSession = async () => {
    if (!activeSession || !db) return;
    const logRef = doc(db, 'room_logs', activeSession.id);
    
    try {
      await updateDoc(logRef, {
        status: 'Completed',
        endTime: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      await auth.signOut();
      router.push('/login');
    } catch (e: any) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: logRef.path,
        operation: 'update',
        requestResourceData: { status: 'Completed' }
      }));
    }
  };

  const fullName = user?.displayName || 'Professor';
  const firstName = fullName.split(' ')[0];
  const initial = firstName.charAt(0).toUpperCase();

  const GreetingContent = ({ className }: { className?: string }) => (
    <div className={cn("text-left space-y-2", className)}>
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
      <Button variant="ghost" size="icon" onClick={handleSignOut} className="h-12 w-12 text-[var(--color-text-tertiary)] hover:text-destructive hover:bg-destructive/5 rounded-2xl">
        <LogOut className="h-5 w-5" />
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--color-page-bg)] flex flex-col font-body antialiased transition-colors">
      <header className="h-16 border-b flex items-center justify-between px-6 sm:px-12 sticky top-0 z-50 shadow-sm bg-slate-200 dark:bg-slate-900 transition-colors">
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-full p-0.5 shadow-sm border border-slate-100 flex items-center justify-center">
            <img src="/NEU_LOGO.png" alt="New Era University Logo" style={{ width: '34px', height: '34px', objectFit: 'contain' }} />
          </div>
          <span className="font-black text-lg tracking-tight text-primary">New Era University</span>
        </div>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex flex-col items-center justify-start p-6 pt-12 md:pt-16">
        <div className="w-full max-w-6xl flex flex-col gap-8 md:gap-10">
          <div className="md:hidden w-full space-y-4">
            <GreetingContent />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start relative">
            <div className={cn(
              "md:col-span-4 flex flex-col gap-4 w-full md:border-r md:border-[var(--color-border)] md:pr-10",
              !activeSession ? "order-2 md:order-1" : "order-3 md:order-1"
            )}>
              <div className="flex flex-col items-center">
                <label className="text-[13px] font-black uppercase tracking-[0.2em] mb-2 text-slate-800 dark:text-white">
                  Usage Statistics
                </label>
                <div className="flex flex-row md:flex-col gap-3 md:gap-6 w-full mb-8">
                  <div className="flex-1 md:flex-none bg-[var(--color-card-bg)] p-4 md:p-8 rounded-[2rem] border border-[var(--color-border)] flex flex-col items-center justify-center text-center shadow-sm transition-all hover:shadow-md">
                    <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-400 mb-2 leading-none">Sessions</span>
                    <span className="text-xl md:text-4xl font-black text-primary dark:text-white leading-none">{sessionsThisMonth}</span>
                  </div>
                  <div className="flex-1 md:flex-none bg-[var(--color-card-bg)] p-4 md:p-8 rounded-[2rem] border border-[var(--color-border)] flex flex-col items-center justify-center text-center shadow-sm transition-all hover:shadow-md">
                    <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-400 mb-2 leading-none">Hours</span>
                    <span className="text-xl md:text-4xl font-black text-primary dark:text-white leading-none">{totalHours}h</span>
                  </div>
                  <div className="flex-1 md:flex-none bg-[var(--color-card-bg)] p-4 md:p-8 rounded-[2rem] border border-[var(--color-border)] flex flex-col items-center justify-center text-center shadow-sm transition-all hover:shadow-md">
                    <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-400 mb-2 leading-none">Top Room</span>
                    <span className="text-xl md:text-4xl font-black text-primary dark:text-white leading-none">{mostUsedRoom}</span>
                  </div>
                </div>
              </div>

              <div className="hidden md:block mt-auto pt-4">
                <UserProfileCard />
              </div>
            </div>

            <div className={cn(
              "md:col-span-8 w-full flex flex-col gap-8",
              activeSession ? "order-1 md:order-2" : "order-3 md:order-2"
            )}>
              <div className="hidden md:block">
                <GreetingContent />
              </div>

              {!activeSession ? (
                <Card className="w-full border-none shadow-2xl rounded-[40px] overflow-hidden bg-[var(--color-card-bg)]">
                  <CardContent className="p-8 md:p-12 space-y-8">
                    <div className="space-y-8">
                      <Button onClick={() => setIsScannerOpen(true)} className="w-full h-16 rounded-[2rem] bg-primary dark:bg-[#4A6BAD] hover:opacity-90 text-white font-black text-lg flex items-center justify-center gap-4 shadow-lg transition-all active:scale-[0.98] border-none">
                        <QrCode className="h-6 w-6" /> Auto-Log via QR
                      </Button>
                      <div className="relative flex items-center gap-6 py-2">
                        <div className="flex-1 h-px bg-[var(--color-border)] opacity-50"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-tertiary)] bg-[var(--color-card-bg)] px-2">or</span>
                        <div className="flex-1 h-px bg-[var(--color-border)] opacity-50"></div>
                      </div>
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <label className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--color-text-tertiary)] ml-2">Institutional Laboratory Unit</label>
                          <Select value={selectedRoom} onValueChange={(v) => { setSelectedRoom(v); setErrors(prev => ({...prev, room: ""})); }}>
                            <SelectTrigger className={cn("h-14 md:h-14 rounded-[2rem] bg-[var(--color-accent-bg)] border-none text-lg font-black text-[var(--color-text-primary)] px-8 shadow-inner focus:ring-0", errors.room && "ring-2 ring-red-500")}>
                              <SelectValue placeholder="Select Room" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-none shadow-xl bg-[var(--color-card-bg)]">
                              {LAB_ROOMS.map(room => (<SelectItem key={room} value={room} className="font-bold h-12 text-base">{room}</SelectItem>))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="relative space-y-4">
                          <label className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--color-text-tertiary)] ml-2">Subject</label>
                          <Input 
                            placeholder="e.g. Data Structures" 
                            value={subject} 
                            onFocus={() => setActiveInput('subject')}
                            onBlur={() => setTimeout(() => setActiveInput(null), 200)}
                            onChange={(e) => { setSubject(e.target.value); setErrors(prev => ({...prev, subject: ""})); }}
                            className={cn("h-14 md:h-14 min-h-[48px] rounded-[2rem] bg-[var(--color-accent-bg)] border-none text-lg font-black text-[var(--color-text-primary)] px-8 shadow-inner", errors.subject && "ring-2 ring-red-500")} 
                          />
                          {errors.subject && <p className="text-red-500 text-[12px] font-bold ml-4 mt-1">{errors.subject}</p>}
                          {activeInput === 'subject' && <SuggestionBox items={filteredSuggestions} onSelect={(val) => { setSubject(val); setActiveInput(null); }} />}
                        </div>

                        <div className="relative space-y-4">
                          <label className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--color-text-tertiary)] ml-2">Class Section</label>
                          <Input 
                            placeholder="e.g. BSIT 2-1" 
                            value={classSection} 
                            onFocus={() => setActiveInput('classSection')}
                            onBlur={() => setTimeout(() => setActiveInput(null), 200)}
                            onChange={(e) => { setClassSection(e.target.value); setErrors(prev => ({...prev, classSection: ""})); }}
                            className={cn("h-14 md:h-14 min-h-[48px] rounded-[2rem] bg-[var(--color-accent-bg)] border-none text-lg font-black text-[var(--color-text-primary)] px-8 shadow-inner", errors.classSection && "ring-2 ring-red-500")} 
                          />
                          {errors.classSection && <p className="text-red-500 text-[12px] font-bold ml-4 mt-1">{errors.classSection}</p>}
                          {activeInput === 'classSection' && <SuggestionBox items={filteredSuggestions} onSelect={(val) => { setClassSection(val); setActiveInput(null); }} />}
                        </div>
                      </div>
                      <Button onClick={() => handleLogEntry(selectedRoom)} disabled={isLogging} variant="outline" className="w-full h-16 rounded-[2rem] border-2 border-[#1E3A8A] dark:border-[#4A6BAD] bg-transparent text-[#1E3A8A] dark:text-white hover:bg-[#1E3A8A]/10 dark:hover:bg-[#4A6BAD]/20 font-black text-lg flex items-center justify-center gap-4 transition-all duration-200 active:scale-[0.98] disabled:opacity-70">
                        <ArrowRight className="h-5 w-5" /> {isLogging ? 'Logging...' : 'Log Entry'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="w-full border-none shadow-2xl rounded-[40px] overflow-hidden bg-[var(--color-card-bg)]">
                  <CardContent className="p-8 md:p-16 space-y-10 text-center flex flex-col items-center">
                    {showSuccess && (
                      <div className={cn("bg-[var(--color-status-active-bg)] border border-transparent text-[var(--color-status-active-text)] px-4 py-3 rounded-xl flex items-center gap-3 shadow-sm transition-opacity duration-500 w-full max-w-md mx-auto mb-2", isFading ? "opacity-0" : "opacity-100")}>
                        <CheckCircle2 className="h-5 w-5 shrink-0" />
                        <span className="font-bold text-sm">Session verified. Thank you for using room {activeSession.roomId}.</span>
                      </div>
                    )}
                    <div className="flex flex-col items-center gap-6">
                      <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-5 py-2 rounded-full">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-custom-pulse" />
                        <Clock className="h-4 w-4" />
                        <span className="text-[11px] font-black uppercase tracking-widest">Active Usage</span>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <h2 className="text-6xl md:text-8xl font-black text-[var(--color-text-primary)] tracking-tighter">{activeSession.roomId}</h2>
                        <div className="flex flex-col items-center gap-1">
                          <p className="text-[18px] font-semibold text-[var(--color-text-secondary)] leading-tight">{activeSession.subject || '—'}</p>
                          <p className="text-[15px] font-medium text-[var(--color-text-tertiary)] leading-tight">{activeSession.classSection || '—'}</p>
                        </div>
                      </div>
                      <div className="text-[22px] font-semibold text-primary">
                        {elapsedTime}
                      </div>
                    </div>
                    <Button onClick={handleEndSession} className={cn("w-full h-16 rounded-[2rem] font-black text-lg flex items-center justify-center gap-4 shadow-lg transition-all active:scale-[0.98] border-none", "bg-[#FEE2E2] text-[#991B1B] hover:bg-[#DC2626] hover:text-white", "dark:bg-red-950/40 dark:text-white dark:hover:bg-[#3D5C99]/30 dark:hover:text-white")}>
                      <LogOut className="h-6 w-6" /> End Session
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <div className="md:hidden w-full mt-4">
            <UserProfileCard />
          </div>
        </div>
      </main>
      
      <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-[32px] border-none bg-[var(--color-card-bg)]">
          <DialogHeader className="p-6 bg-[var(--color-card-bg)] border-b border-[var(--color-border)]">
            <DialogTitle className="text-xl font-black text-[var(--color-text-primary)] tracking-tight">Scan Room QR Code</DialogTitle>
          </DialogHeader>
          {isScannerOpen && (
            <div className="p-6 space-y-4">
              <ScannerView onScan={(roomId) => {
                setIsScannerOpen(false);
                setTimeout(() => {
                  setScannedRoomId(roomId);
                  setIsConfirmModalOpen(true);
                }, 400);
              }} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
        <DialogContent 
          className={cn(
            "p-0 overflow-hidden border-none bg-[var(--color-card-bg)] flex flex-col",
            "sm:max-w-[420px] sm:rounded-[14px] sm:p-8 sm:h-auto sm:max-h-[85vh]",
            "max-sm:fixed max-sm:inset-0 max-sm:h-[100dvh] max-sm:w-[100vw] max-sm:max-w-none max-sm:rounded-none max-sm:translate-x-0 max-sm:translate-y-0"
          )}
        >
          <div className="flex flex-col flex-1 max-sm:p-6 max-sm:pt-0 overflow-y-auto">
            {/* Drag handle pill at the very top for mobile */}
            <div className="md:hidden w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mt-4 mb-6" />
            
            <DialogHeader className="sm:mb-8 bg-transparent relative flex flex-row items-center justify-between mb-8">
              <DialogTitle className="text-xl font-black text-[var(--color-text-primary)] tracking-tight">Confirm Laboratory Session</DialogTitle>
            </DialogHeader>

            <div className="space-y-6 sm:space-y-8">
              <div className="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-4 rounded-2xl">
                <CheckCircle2 className="h-6 w-6" />
                <span className="font-black text-lg">Room {scannedRoomId} detected</span>
              </div>

              <div className="relative space-y-4">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--color-text-tertiary)] ml-2">Subject</label>
                <Input 
                  placeholder="e.g. Data Structures" 
                  value={subject} 
                  onFocus={() => setActiveInput('subject')}
                  onBlur={() => setTimeout(() => setActiveInput(null), 200)}
                  onChange={(e) => { setSubject(e.target.value); setErrors(prev => ({...prev, subject: ""})); }}
                  className={cn(
                    "rounded-[2rem] bg-[var(--color-accent-bg)] border-none text-lg font-black text-[var(--color-text-primary)] px-8 shadow-inner focus:ring-primary", 
                    "h-14 max-sm:min-h-[48px]",
                    errors.subject && "ring-2 ring-red-500"
                  )} 
                />
                {errors.subject && <p className="text-red-500 text-[12px] font-bold ml-4 mt-1">{errors.subject}</p>}
                {activeInput === 'subject' && <SuggestionBox items={filteredSuggestions} onSelect={(val) => { setSubject(val); setActiveInput(null); }} />}
              </div>

              <div className="relative space-y-4">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--color-text-tertiary)] ml-2">Class Section</label>
                <Input 
                  placeholder="e.g. BSIT 2-1" 
                  value={classSection} 
                  onFocus={() => setActiveInput('classSection')}
                  onBlur={() => setTimeout(() => setActiveInput(null), 200)}
                  onChange={(e) => { setClassSection(e.target.value); setErrors(prev => ({...prev, classSection: ""})); }}
                  className={cn(
                    "rounded-[2rem] bg-[var(--color-accent-bg)] border-none text-lg font-black text-[var(--color-text-primary)] px-8 shadow-inner focus:ring-primary",
                    "h-14 max-sm:min-h-[48px]",
                    errors.classSection && "ring-2 ring-red-500"
                  )} 
                />
                {errors.classSection && <p className="text-red-500 text-[12px] font-bold ml-4 mt-1">{errors.classSection}</p>}
                {activeInput === 'classSection' && <SuggestionBox items={filteredSuggestions} onSelect={(val) => { setClassSection(val); setActiveInput(null); }} />}
              </div>

              {/* Mobile Button - Normal Flow directly after Class Section with 16px gap via mt-4 */}
              <div className="sm:hidden mt-4">
                <Button 
                  onClick={() => handleLogEntry(scannedRoomId)} 
                  className="w-full h-16 rounded-[2rem] bg-primary text-white font-black text-lg flex items-center justify-center gap-4 shadow-lg transition-all active:scale-[0.98] border-none"
                >
                  <Check className="h-6 w-6" /> Confirm Session
                </Button>
              </div>
            </div>
          </div>

          {/* Desktop Footer Only */}
          <div className="hidden sm:block sm:mt-8">
            <Button 
              onClick={() => handleLogEntry(scannedRoomId)} 
              className="w-full h-16 rounded-[2rem] bg-primary text-white font-black text-lg flex items-center justify-center gap-4 shadow-lg transition-all active:scale-[0.98] border-none"
            >
              <Check className="h-6 w-6" /> Confirm Session
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
