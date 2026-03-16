"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Monitor, ShieldCheck, Mail, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth, useFirestore } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

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

  const handleGoogleSignIn = async (intendedRole: 'professor' | 'admin') => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      hd: 'neu.edu.ph'
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

      const isAdmin = ADMIN_EMAILS.includes(user.email);
      
      // If they tried to log into admin portal but aren't an admin
      if (intendedRole === 'admin' && !isAdmin) {
        await auth.signOut();
        toast({
          variant: "destructive",
          title: "Unauthorized",
          description: "You do not have administrative privileges.",
        });
        setIsLoading(false);
        return;
      }

      // Sync user profile
      const userRef = doc(db, 'user_profiles', user.uid);
      await setDoc(userRef, {
        id: user.uid,
        name: user.displayName,
        email: user.email,
        role: isAdmin ? 'Admin' : 'Professor',
        updatedAt: serverTimestamp(),
      }, { merge: true });

      // If admin, also ensure they have the role document for rules
      if (isAdmin) {
        await setDoc(doc(db, 'admin_roles', user.uid), { active: true });
      }

      router.push(`/dashboard/${isAdmin ? 'admin' : 'professor'}`);
    } catch (error: any) {
      console.error(error);
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

        <Tabs defaultValue="professor" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="professor" className="text-sm">Professor Portal</TabsTrigger>
            <TabsTrigger value="admin" className="text-sm">Admin Portal</TabsTrigger>
          </TabsList>

          <TabsContent value="professor">
            <Card className="border-none shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  Institutional Login
                </CardTitle>
                <CardDescription>
                  Log in with your institutional @neu.edu.ph account to access laboratories.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={() => handleGoogleSignIn('professor')} 
                  disabled={isLoading}
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-lg group"
                >
                  {isLoading ? "Connecting..." : "Sign in with Google"}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
              <CardFooter>
                <p className="text-xs text-center w-full text-muted-foreground">
                  By signing in, you agree to the Laboratory Safety Policy.
                </p>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="admin">
            <Card className="border-none shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-accent" />
                  Admin Login
                </CardTitle>
                <CardDescription>
                  Log in with your institutional @neu.edu.ph account to access laboratories.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={() => handleGoogleSignIn('admin')} 
                  disabled={isLoading}
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-lg group"
                >
                  {isLoading ? "Verifying..." : "Sign in with Google"}
                  <ShieldCheck className="ml-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                </Button>
              </CardContent>
              <CardFooter>
                <p className="text-xs text-center w-full text-muted-foreground">
                  Restricted access for authorized faculty managers.
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
