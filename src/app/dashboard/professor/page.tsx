
"use client"

import { useState, useEffect } from 'react';
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
import { doc, setDoc, query, where, collection, getDocs, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Html5QrcodeScanner } from 'html5-qrcode';

/**
 * Sub-component to handle QR scanning to ensure the DOM element 'qr-reader' 
 * exists before initialization.
 */
function ScannerView({ onScan }: { onScan: (roomId: string) => void }) {
  const { toast } = useToast();

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        // Expect decodedText to be the Room ID like "M101"
        const foundRoom = LAB_ROOMS.find(r => r === decodedText);
        if (foundRoom) {
          scanner.clear().then(() => {
            onScan(foundRoom);
          }).catch(e => console.warn("Failed to clear scanner", e));
        } else {
          toast({
            variant: 'destructive',
            title: 'Invalid QR Code',
            description: 'This QR code is not recognized as a laboratory room.',
          });
        }
      },
      () => {
        // Quietly handle scan errors (e.g. no QR in frame)
      }
    );

    return () => {
      scanner.clear().catch(e => console.warn("Scanner cleanup failed", e));
    };
  }, [onScan, toast]);

  return (
    <div className="p-6">
      <div id="qr-reader" className="w-full rounded-2xl overflow-hidden border-none bg-slate-50"></div>
      <p className="text-center text-xs text-slate-400 mt-4 font-bold">
        Point your camera at the laboratory's identification QR code.
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
  
  const [selectedRoom, setSelectedRoom] = useState<string>("M103");
  const [isLogging, setIsLogging] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const handleSignOut = async () => {
    if (user && db) {
      // End all active sessions for this professor before signing out
      try {
        const q = query(
          collection(db, 'room_logs'),
          where('professorId', '==', user.uid),
          where('status', '==', 'Active')
        );
        const querySnapshot = await getDocs(q);
        const updates = querySnapshot.docs.map(doc => 
          updateDoc(doc.ref, {
            status: 'Completed',
            endTime: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
        );
        await Promise.all(updates);
      } catch (e) {
        console.error("Error closing sessions on sign out", e);
      }
    }
    await auth.signOut();
    router.push('/login');
  };

  const handleLogEntry = async (roomId: string) => {
    if (!user || !db) return;
    setIsLogging(true);

    try {
      // Prevent duplicate active sessions for the same room to avoid clutter
      const q = query(
        collection(db, 'room_logs'),
        where('professorId', '==', user.uid),
        where('roomId', '==', roomId),
        where('status', '==', 'Active')
      );
      const existing = await getDocs(q);
      
      if (!existing.empty) {
        toast({
          title: 'Session Already Active',
          description: `You already have an active session in ${roomId}.`,
        });
        setIsLogging(false);
        return;
      }

      const logId = crypto.randomUUID();
      const logRef = doc(db, 'room_logs', logId);

      await setDoc(logRef, {
        id: logId,
        professorId: user.uid,
        roomId: roomId,
        startTime: new Date().toISOString(),
        status: 'Active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      setStatusMessage(`Session verified. Thank you for using room ${roomId}!`);
      
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
      {/* Branding Header (Minimal) */}
      <div className="w-full flex justify-center py-8">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-2 rounded-xl shadow-lg shadow-primary/20">
            <Monitor className="text-white h-6 w-6" />
          </div>
          <span className="font-black text-2xl tracking-tight text-primary">NEU LabTrack</span>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 space-y-6 -mt-12">
        {/* Success Alert */}
        {statusMessage && (
          <div className="w-full max-w-md bg-green-50 border border-green-100 text-green-700 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in shadow-sm">
            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
            <span className="font-bold text-sm">{statusMessage}</span>
          </div>
        )}

        {/* Welcome Section */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Welcome back, {firstName}!</h1>
          <p className="text-base text-slate-400 font-bold">Which room would you like to use?</p>
        </div>

        {/* Central Selection Card */}
        <Card className="w-full max-w-[360px] border-none shadow-2xl rounded-[32px] overflow-hidden bg-white">
          <CardContent className="p-8 space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 ml-1">
                Laboratory Room
              </label>
              <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none text-base font-black text-slate-900 px-6 shadow-inner focus:ring-0">
                  <SelectValue placeholder="Select a room" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-xl">
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
                className="w-full h-12 rounded-2xl bg-slate-50 border-none hover:bg-slate-100 text-slate-500 font-bold text-sm flex items-center justify-center gap-3 transition-all"
              >
                <QrCode className="h-4 w-4 text-slate-300" />
                Auto-Log via QR
              </Button>

              <Button 
                onClick={() => handleLogEntry(selectedRoom)}
                disabled={isLogging}
                className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-base flex items-center justify-center gap-3 shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-70"
              >
                <ArrowRight className="h-4 w-4" />
                {isLogging ? 'Logging...' : `Log Entry ${selectedRoom}`}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* User Profile & Sign Out Footer */}
        <div className="w-full max-w-[360px] bg-white rounded-3xl p-4 shadow-sm flex items-center justify-between border border-slate-50">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 bg-primary/10 rounded-2xl border-none">
              <AvatarFallback className="text-primary font-black text-sm bg-transparent">
                {initial}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <p className="font-black text-sm text-slate-900 leading-none">{fullName}</p>
              <Badge variant="secondary" className="bg-transparent p-0 text-slate-300 font-black text-[9px] tracking-wider uppercase border-none">
                PROFESSOR
              </Badge>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleSignOut}
            className="text-slate-300 hover:text-destructive hover:bg-destructive/5 rounded-xl"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </main>
      
      {/* QR Scanner Dialog */}
      <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-[32px] border-none">
          <DialogHeader className="p-6 bg-white border-b border-slate-50">
            <DialogTitle className="text-xl font-black text-slate-900">Scan Room QR Code</DialogTitle>
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
