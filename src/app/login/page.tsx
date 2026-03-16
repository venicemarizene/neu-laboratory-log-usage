"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Monitor, ArrowRight } from 'lucide-react';
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
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
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
      if (!user.email?.endsWith('@neu.edu.ph') && !user.email?.endsWith('@neu.edu')) {
        await auth.signOut();
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "Please use your institutional @neu.edu account.",
        });
        setIsLoading(false);
        return;
      }

      const isAdmin = ADMIN_EMAILS.includes(user.email);
      
      // Sync user profile with Firestore
      const userRef = doc(db, 'user_profiles', user.uid);
      setDoc(userRef, {
        id: user.uid,
        name: user.displayName,
        email: user.email,
        role: isAdmin ? 'Admin' : 'Professor',
        updatedAt: serverTimestamp(),
      }, { merge: true });

      // Ensure admin persistence in dedicated collection for security rules
      if (isAdmin) {
        setDoc(doc(db, 'admin_roles', user.uid), { active: true });
      }

      // Route based on detected role
      router.push(`/dashboard/${isAdmin ? 'admin' : 'professor'}`);
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: error.message || "An unexpected error occurred during sign-in.",
        });
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-accent/5">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-primary rounded-2xl shadow-xl shadow-primary/20 mb-4">
            <Monitor className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-headline font-extrabold tracking-tight text-foreground">NEU LabTrack</h1>
          <p className="text-muted-foreground text-lg">Computer Laboratory Access Management</p>
        </div>

        <Card className="border-none shadow-2xl">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Faculty & Staff Login</CardTitle>
            <CardDescription className="text-center text-base">
              Log in with your institutional @neu.edu account to access laboratories.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <Button 
              onClick={handleGoogleSignIn} 
              disabled={isLoading}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-lg group font-semibold"
            >
              {isLoading ? "Verifying..." : "Sign in with Google"}
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <p className="text-xs text-center w-full text-muted-foreground">
              Institutional credentials required. Access is monitored and logged.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
