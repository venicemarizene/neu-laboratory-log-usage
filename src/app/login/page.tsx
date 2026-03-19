"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Monitor, ShieldCheck, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth, useFirestore } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { ThemeToggle } from '@/components/ThemeToggle';

const ADMIN_EMAILS = [
  'venicemarizene.linga@neu.edu.ph',
  'jcesperanza@neu.edu.ph'
];

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'Professor' | 'Admin'>('Professor');

  const handleSignIn = async () => {
    if (!auth || !db) return;
    
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    
    provider.setCustomParameters({
      hd: 'neu.edu.ph',
      prompt: 'select_account'
    });

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (!user.email?.endsWith('@neu.edu.ph')) {
        await auth.signOut();
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "Please use your institutional @neu.edu.ph account.",
        });
        setIsLoading(false);
        return;
      }

      const isAdmin = ADMIN_EMAILS.includes(user.email || '');
      
      if (activeTab === 'Admin' && !isAdmin) {
        await auth.signOut();
        toast({
          variant: "destructive",
          title: "Admin Access Required",
          description: "This account does not have administrator privileges.",
        });
        setIsLoading(false);
        return;
      }

      const userRef = doc(db, 'user_profiles', user.uid);
      setDocumentNonBlocking(userRef, {
        id: user.uid,
        name: user.displayName,
        email: user.email,
        role: isAdmin ? 'Admin' : 'Professor',
        updatedAt: serverTimestamp(),
      }, { merge: true });

      if (isAdmin) {
        const adminRoleRef = doc(db, 'admin_roles', user.uid);
        setDocumentNonBlocking(adminRoleRef, { active: true }, { merge: true });
      }

      router.push(`/dashboard/${isAdmin ? 'admin' : 'professor'}`);
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        const contextualError = new FirestorePermissionError({
          operation: 'write',
          path: 'auth/sign-in',
        });
        errorEmitter.emit('permission-error', contextualError);
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
      {/* Top Navigation Bar */}
      <header className="h-16 border-b bg-white dark:bg-slate-900 flex items-center justify-between px-6 sm:px-12 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-xl shadow-lg shadow-primary/20">
            <Monitor className="text-white h-5 w-5" />
          </div>
          <span className="font-black text-lg tracking-tight text-slate-900 dark:text-white">NEU LabTrack</span>
        </div>
        <ThemeToggle />
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center mb-8 space-y-2 text-center">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Institutional Access</h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-sm font-bold text-sm">
            Sign in with your university credentials
          </p>
        </div>

        <Card className="w-full max-w-[400px] border-none shadow-2xl dark:shadow-primary/5 overflow-hidden rounded-[2.5rem] bg-white dark:bg-slate-900">
          <Tabs 
            defaultValue="Professor" 
            onValueChange={(v) => setActiveTab(v as 'Professor' | 'Admin')}
            className="w-full"
          >
            <TabsList className="w-full h-14 bg-slate-100/50 dark:bg-slate-800/50 rounded-none p-1.5 gap-1.5">
              <TabsTrigger 
                value="Professor" 
                className="flex-1 h-full rounded-3xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm gap-2 text-xs font-black transition-all"
              >
                <User size={16} className={activeTab === 'Professor' ? 'text-primary' : 'text-slate-400'} />
                Faculty
              </TabsTrigger>
              <TabsTrigger 
                value="Admin" 
                className="flex-1 h-full rounded-3xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm gap-2 text-xs font-black transition-all"
              >
                <ShieldCheck size={16} className={activeTab === 'Admin' ? 'text-primary' : 'text-slate-400'} />
                Admin
              </TabsTrigger>
            </TabsList>

            <CardContent className="p-8 pt-10">
              <div className="space-y-6">
                <Button 
                  onClick={handleSignIn}
                  disabled={isLoading}
                  className="w-full h-14 bg-primary hover:bg-primary/90 text-white rounded-2xl text-lg font-black gap-3 transition-all active:scale-[0.98] shadow-lg shadow-primary/10"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  {isLoading ? "Connecting..." : "Google Login"}
                </Button>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-center text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black">
                    Institutional Accounts Only
                  </p>
                </div>
              </div>
            </CardContent>
          </Tabs>
        </Card>
      </main>

      {/* Institutional Footer */}
      <footer className="h-20 border-t bg-white dark:bg-slate-900 flex flex-col items-center justify-center text-center px-4 space-y-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Developed by the College of Computer Studies
        </p>
        <p className="text-xs font-bold text-slate-900 dark:text-white">
          New Era University | CCS Department
        </p>
      </footer>
    </div>
  );
}
