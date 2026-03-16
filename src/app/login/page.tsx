"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Monitor, ShieldCheck, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth, useFirestore } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

/**
 * Institutional Administrators
 */
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
    
    // Standardize to institutional domain
    provider.setCustomParameters({
      hd: 'neu.edu.ph',
      prompt: 'select_account'
    });

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Validate institutional account
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

      const isAdmin = ADMIN_EMAILS.includes(user.email);
      
      // If user clicked Admin but is not in the list
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

      // Sync user profile with Firestore
      const userRef = doc(db, 'user_profiles', user.uid);
      setDoc(userRef, {
        id: user.uid,
        name: user.displayName,
        email: user.email,
        role: isAdmin ? 'Admin' : 'Professor',
        updatedAt: serverTimestamp(),
      }, { merge: true });

      // Ensure admin persistence for security rules
      if (isAdmin) {
        setDoc(doc(db, 'admin_roles', user.uid), { active: true }, { merge: true });
      }

      // Route based on role
      router.push(`/dashboard/${isAdmin ? 'admin' : 'professor'}`);
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: error.message || "An unexpected error occurred.",
        });
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      {/* Branding Section */}
      <div className="flex flex-col items-center mb-8 space-y-3 text-center">
        <div className="bg-primary p-3 rounded-2xl shadow-lg shadow-primary/20">
          <Monitor className="text-white h-10 w-10" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">NEU LabTrack</h1>
        <p className="text-slate-500 max-w-sm font-medium">
          Log in with your institutional account to access laboratories.
        </p>
      </div>

      {/* Standardized Card Container */}
      <Card className="w-full max-w-[400px] border-none shadow-2xl overflow-hidden rounded-3xl">
        <Tabs 
          defaultValue="Professor" 
          onValueChange={(v) => setActiveTab(v as 'Professor' | 'Admin')}
          className="w-full"
        >
          <TabsList className="w-full h-14 bg-slate-100/50 rounded-none p-1.5 gap-1.5">
            <TabsTrigger 
              value="Professor" 
              className="flex-1 h-full rounded-2xl data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2 text-sm font-bold transition-all"
            >
              <User size={18} className={activeTab === 'Professor' ? 'text-primary' : 'text-slate-400'} />
              Professor Portal
            </TabsTrigger>
            <TabsTrigger 
              value="Admin" 
              className="flex-1 h-full rounded-2xl data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2 text-sm font-bold transition-all"
            >
              <ShieldCheck size={18} className={activeTab === 'Admin' ? 'text-primary' : 'text-slate-400'} />
              Admin Portal
            </TabsTrigger>
          </TabsList>

          <CardContent className="p-8 pt-10">
            <div className="space-y-6">
              <div className="text-center space-y-1 mb-2">
                <h2 className="text-xl font-bold text-slate-800">
                  {activeTab === 'Professor' ? 'Faculty Sign-in' : 'Administrative Access'}
                </h2>
                <p className="text-sm text-slate-500">
                  Secure access for {activeTab === 'Professor' ? 'Professors' : 'Admins'}
                </p>
              </div>

              <Button 
                onClick={handleSignIn}
                disabled={isLoading}
                className="w-full h-14 bg-primary hover:bg-primary/90 text-white rounded-2xl text-lg font-bold gap-3 transition-all active:scale-[0.98] shadow-md"
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
                {isLoading ? "Connecting..." : "Google Sign-in"}
              </Button>

              <div className="pt-4 border-t border-slate-100">
                <p className="text-center text-[11px] text-slate-400 uppercase tracking-widest font-semibold">
                  NEU Institutional Domain Only
                </p>
              </div>
            </div>
          </CardContent>
        </Tabs>
      </Card>
      
      <p className="mt-8 text-slate-400 text-xs font-medium">
        &copy; 2026 New Era University. All rights reserved.
      </p>
    </div>
  );
}
