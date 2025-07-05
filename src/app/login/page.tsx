
"use client"

import { LoginForm } from '@/components/auth/login-form';
import { Logo } from '@/components/logo'
import { useAuth } from '@/hooks/use-auth'
import Link from 'next/link'
import { useTranslation } from '@/hooks/use-translation'
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const { user, loading } = useAuth()
  const { t } = useTranslation()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const checkUserAndRedirect = async () => {
      if (user && db) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userRole = userDoc.data()?.role || 'student';
            router.push(`/dashboard/${userRole}`);
            router.refresh();
          } else {
            console.error("Authentication error: User document not found for UID:", user.uid);
            await signOut(auth);
            toast({
              title: t("Incomplete Registration"),
              description: t("Your previous registration was incomplete. Please sign up again."),
              variant: "destructive",
              duration: 5000,
            });
            router.push('/signup'); 
          }
        } catch (error) {
           console.error("Error checking user document:", error);
           await signOut(auth);
           router.push('/');
        }
      }
    };
    checkUserAndRedirect();
  }, [user, db, router, t, toast]);


  if (loading || user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }


  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center">
          <Link href="/" className="mb-4" aria-label="Back to home">
            <Logo className="h-14 w-14 text-primary" />
          </Link>
          <h1 className="text-3xl font-bold font-headline text-foreground">{t("Welcome to Sahayak")}</h1>
          <p className="text-muted-foreground">{t("Login or create an account to continue.")}</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
