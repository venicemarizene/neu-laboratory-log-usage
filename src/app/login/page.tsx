"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Monitor, ArrowRight, ShieldCheck, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleSignIn = async (requestedRole: 'Admin' | 'Professor') => {
    setIsLoading(requestedRole);
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
      if (!user.email?.endsWith('@neu.edu.ph') && !user.email?.endsWith('@neu.edu')) {
        await auth.signOut();
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "Please use your institutional account.",
        });
        setIsLoading(null);
        return;
      }

      const isAdmin = ADMIN_EMAILS.includes(user.email);
      
      // If user clicked Admin Login but is not in the list
      if (requestedRole === 'Admin' && !isAdmin) {
        await auth.signOut();
        toast({
          variant: "destructive",
          title: "Admin Access Required",
          description: "This account does not have administrator privileges.",
        });
        setIsLoading(null);
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
        setDoc(doc(db, 'admin_roles', user.uid), { active: true });
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
      setIsLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-accent/5">
      <div className="max-w-4xl w-full space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-4 bg-primary rounded-3xl shadow-2xl shadow-primary/20 mb-2">
            <Monitor className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-5xl font-headline font-extrabold tracking-tight text-foreground">NEU LabTrack</h1>
          <p className="text-muted-foreground text-xl max-w-lg mx-auto">
            Institutional Laboratory Access & Management System
          </p>
          <div className="h-1 w-24 bg-primary mx-auto rounded-full opacity-20" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Professor Portal */}
          <Card className="border-none shadow-xl hover:shadow-2xl transition-all duration-300 group">
            <CardHeader className="text-center space-y-2">
              <div className="mx-auto bg-primary/10 p-3 rounded-2xl w-fit group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                <GraduationCap className="h-8 w-8 text-primary group-hover:text-white" />
              </div>
              <CardTitle className="text-2xl">Professor Portal</CardTitle>
              <CardDescription className="text-base">
                Log in with your institutional account to access laboratories.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center pb-8">
              <Button 
                onClick={() => handleSignIn('Professor')} 
                disabled={!!isLoading}
                className="w-full h-14 bg-primary hover:bg-primary/90 text-lg font-semibold group"
              >
                {isLoading === 'Professor' ? "Verifying..." : "Faculty Login"}
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>

          {/* Admin Access */}
          <Card className="border-none shadow-xl hover:shadow-2xl transition-all duration-300 group">
            <CardHeader className="text-center space-y-2">
              <div className="mx-auto bg-accent/10 p-3 rounded-2xl w-fit group-hover:bg-accent group-hover:text-white transition-colors duration-300">
                <ShieldCheck className="h-8 w-8 text-accent group-hover:text-white" />
              </div>
              <CardTitle className="text-2xl">Admin Access</CardTitle>
              <CardDescription className="text-base">
                Management portal for laboratory oversight and administration.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center pb-8">
              <Button 
                onClick={() => handleSignIn('Admin')} 
                disabled={!!isLoading}
                variant="outline"
                className="w-full h-14 border-2 border-accent text-accent hover:bg-accent hover:text-white text-lg font-semibold group"
              >
                {isLoading === 'Admin' ? "Verifying..." : "Admin Login"}
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>
        </div>

        <footer className="text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold opacity-50">
            Institutional credentials required • Secure Access Portals
          </p>
        </footer>
      </div>
    </div>
  );
}
