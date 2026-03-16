"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  QrCode, 
  MapPin, 
  Clock, 
  ArrowRight,
  Microscope,
  CheckCircle2,
  LogOut
} from 'lucide-react';
import { LAB_ROOMS } from '@/lib/constants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser, useFirestore, useAuth } from '@/firebase';
import { collection, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useRouter } from 'next/navigation';

export default function ProfessorDashboard() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  
  const [isScanning, setIsScanning] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [activeSession, setActiveSession] = useState<{ id: string; room: string; startTime: Date } | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Extract first name
  const firstName = user?.displayName ? user.displayName.split(' ')[0] : 'Professor';

  const handleSignOut = async () => {
    await auth.signOut();
    router.push('/login');
  };

  const startSession = (room: string) => {
    if (!user || !db) return;

    const logId = crypto.randomUUID();
    const sessionData = {
      id: logId,
      professorId: user.uid,
      roomId: room,
      startTime: new Date().toISOString(),
      status: 'Active',
      createdAt: new Date().toISOString(),
    };

    // Simulated scanning delay if called from scanner
    const startAction = () => {
      // Use non-blocking write
      const logRef = collection(db, 'room_logs');
      addDocumentNonBlocking(logRef, sessionData);

      setActiveSession({ id: logId, room, startTime: new Date() });
      setSelectedRoom("");
      setStatusMessage(`Session verified. Thank you for using room ${room}!`);
      
      // Clear status message after 5 seconds
      setTimeout(() => setStatusMessage(null), 5000);
    };

    if (isScanning) {
      setTimeout(() => {
        setIsScanning(false);
        startAction();
      }, 1500);
    } else {
      startAction();
    }
  };

  const endSession = () => {
    if (!activeSession || !db) return;

    const logRef = doc(db, 'room_logs', activeSession.id);
    setDoc(logRef, {
      endTime: new Date().toISOString(),
      status: 'Completed',
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    setActiveSession(null);
  };

  if (isUserLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal Header (No Navbar as requested) */}
      <div className="container mx-auto px-4 py-4 flex justify-end">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleSignOut}
          className="text-muted-foreground hover:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
        <header>
          <h1 className="text-3xl font-headline font-bold text-foreground">
            Welcome back, {firstName}! Which room would you like to use?
          </h1>
          <p className="text-muted-foreground">Laboratory Access & Session Management</p>
        </header>

        {statusMessage && (
          <div className="bg-green-100 border border-green-200 text-green-800 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <span className="font-medium">{statusMessage}</span>
          </div>
        )}

        {activeSession ? (
          <Card className="border-none shadow-xl bg-primary text-white overflow-hidden">
            <CardHeader className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="secondary" className="bg-white/20 text-white border-none animate-pulse">
                  Session Active
                </Badge>
                <div className="h-10 w-10 bg-white/10 rounded-full flex items-center justify-center">
                  <Clock className="text-white" />
                </div>
              </div>
              <CardTitle className="text-3xl">Currently in {activeSession.room}</CardTitle>
              <CardDescription className="text-primary-foreground/70">
                Session started at {activeSession.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10 pt-4">
              <div className="flex items-center gap-2 text-primary-foreground">
                <Microscope size={18} />
                <span>All computer systems are active and monitoring.</span>
              </div>
            </CardContent>
            <CardFooter className="relative z-10 bg-black/10 pt-6">
              <Button 
                onClick={endSession} 
                className="w-full bg-white text-primary hover:bg-white/90 font-bold h-12"
              >
                End Session & Sign Out
              </Button>
            </CardFooter>
            <div className="absolute bottom-0 right-0 p-8 opacity-5">
              <MapPin size={200} />
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* QR Scanner Module (Simulated for Prototype) */}
            <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="text-primary" />
                  QR Access
                </CardTitle>
                <CardDescription>Scan the QR code at the laboratory entrance.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center py-8">
                <div className="w-48 h-48 bg-muted rounded-2xl flex items-center justify-center border-2 border-dashed border-muted-foreground/30 relative overflow-hidden group">
                  {isScanning ? (
                    <div className="absolute inset-0 bg-primary/10 flex flex-col items-center justify-center animate-pulse">
                      <div className="w-full h-0.5 bg-primary animate-[bounce_2s_infinite]" />
                      <span className="mt-4 text-xs font-bold text-primary">Scanning...</span>
                    </div>
                  ) : (
                    <QrCode className="h-16 w-16 text-muted-foreground opacity-50 group-hover:scale-110 transition-transform" />
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => {
                    setIsScanning(true);
                    startSession("M103"); // Mock room detected by scanner
                  }}
                  disabled={isScanning}
                  className="w-full h-11 bg-primary"
                >
                  {isScanning ? "Scanning..." : "Open Scanner"}
                </Button>
              </CardFooter>
            </Card>

            {/* Manual Entry Module */}
            <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="text-accent" />
                  Manual Selection
                </CardTitle>
                <CardDescription>Select a room to log your usage manually.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Laboratory Room</label>
                  <Select onValueChange={setSelectedRoom}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a room (M101-M111)" />
                    </SelectTrigger>
                    <SelectContent>
                      {LAB_ROOMS.map(room => (
                        <SelectItem key={room} value={room}>{room}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="p-4 bg-muted/50 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 size={16} className="text-green-500" />
                    <span>Instant activation after selection</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 size={16} className="text-green-500" />
                    <span>Institutional logging enabled</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  disabled={!selectedRoom} 
                  onClick={() => startSession(selectedRoom)}
                  className="w-full h-11 bg-accent hover:bg-accent/90"
                >
                  Confirm Room Selection
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
