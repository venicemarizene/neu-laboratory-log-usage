"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Microscope, ShieldCheck, Mail, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (role: 'professor' | 'admin') => {
    setIsLoading(true);
    // Simulate auth redirect
    setTimeout(() => {
      router.push(`/dashboard/${role}`);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-accent/5">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-primary rounded-2xl shadow-xl shadow-primary/20 mb-4">
            <Microscope className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-headline font-extrabold tracking-tight text-foreground">NEU LabTrack</h1>
          <p className="text-muted-foreground text-lg">Institutional Laboratory Access Management</p>
        </div>

        <Tabs defaultValue="professor" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="professor" className="text-sm">Professor Access</TabsTrigger>
            <TabsTrigger value="admin" className="text-sm">Admin Portal</TabsTrigger>
          </TabsList>

          <TabsContent value="professor">
            <Card className="border-none shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  SSO Authentication
                </CardTitle>
                <CardDescription>
                  Log in with your institutional @neu.edu Google account to access laboratories.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={() => handleLogin('professor')} 
                  disabled={isLoading}
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-lg group"
                >
                  {isLoading ? "Redirecting..." : "Sign in with Google"}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
              <CardFooter>
                <p className="text-xs text-center w-full text-muted-foreground">
                  By signing in, you agree to the Laboratory Safety Policy and Terms of Use.
                </p>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="admin">
            <Card className="border-none shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-accent" />
                  Admin Authentication
                </CardTitle>
                <CardDescription>
                  Restricted access for laboratory administrators and facility managers.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Admin Email</Label>
                  <Input id="admin-email" placeholder="admin@neu.edu" type="email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-pass">Security Key</Label>
                  <Input id="admin-pass" type="password" />
                </div>
                <Button 
                  onClick={() => handleLogin('admin')} 
                  disabled={isLoading}
                  variant="default"
                  className="w-full h-12 bg-primary hover:bg-primary/90 group"
                >
                  {isLoading ? "Verifying..." : "Access Dashboard"}
                  <ShieldCheck className="ml-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Problems logging in? <button className="text-primary font-medium hover:underline">Contact IT Support</button>
          </p>
        </div>
      </div>
    </div>
  );
}