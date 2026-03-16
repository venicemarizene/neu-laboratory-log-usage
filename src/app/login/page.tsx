"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Monitor, ShieldCheck, User, ArrowRight } from 'lucide-react';
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
      <div className="w-full max-w-[480px] space-y-6">
        <Card className="border-none shadow-xl overflow-hidden rounded-3xl">
          <Tabs 
            defaultValue="Professor" 
            onValueChange={(v) => setActiveTab(v as 'Professor' | 'Admin')}
            className="w-full"
          >
            <TabsList className="w-full h-16 bg-slate-100/50 rounded-none p-2 gap-2">
              <TabsTrigger 
                value="Professor" 
                className="flex-1 h-full rounded-2xl data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2 text-base font-semibold"
              >
                <User size={20} className={activeTab === 'Professor' ? 'text-primary' : 'text-slate-500'} />
                Professor
              </TabsTrigger>
              <TabsTrigger 
                value="Admin" 
                className="flex-1 h-full rounded-2xl data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2 text-base font-semibold"
              >
                <ShieldCheck size={20} className={activeTab === 'Admin' ? 'text-primary' : 'text-slate-500'} />
                Admin
              </TabsTrigger>
            </TabsList>

            <CardContent className="p-10">
              <Button 
                onClick={handleSignIn}
                disabled={isLoading}
                className="w-full h-16 bg-primary hover:bg-primary/90 text-white rounded-2xl text-xl font-bold gap-3 transition-all active:scale-[0.98]"
              >
                <Monitor size={24} />
                {isLoading ? "Signing in..." : "Sign in with Google"}
              </Button>
            </CardContent>
          </Tabs>
        </Card>

        <div className="text-center">
          <p className="text-slate-500 font-medium">
            Institutional <span className="text-primary font-bold">@neu.edu.ph</span> domain enforced.
          </p>
        </div>
      </div>
    </div>
  );
}
