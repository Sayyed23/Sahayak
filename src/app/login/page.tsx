
"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { doc, getDoc } from 'firebase/firestore'
import { signOut } from 'firebase/auth'

import { LoginForm } from '@/components/auth/login-form';
import { Logo } from '@/components/logo'
import { useAuth } from '@/hooks/use-auth'
import Link from 'next/link'
import { useTranslation } from '@/hooks/use-translation'
import { db, auth } from '@/lib/firebase'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const { user, loading: authLoading } = useAuth()
  const { t } = useTranslation()
  const router = useRouter()
  const { toast } = useToast()
  const [isCheckingRole, setIsCheckingRole] = useState(true)

  useEffect(() => {
    // Don't do anything until Firebase auth state is resolved
    if (authLoading) {
      return
    }

    const checkUserAndRedirect = async () => {
      if (user) {
        // User is logged in, check their role in Firestore
        if (!db || !auth) {
          setIsCheckingRole(false);
          return;
        }

        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userRole = userDocSnap.data()?.role;
          if (userRole === 'teacher' || userRole === 'student') {
            router.push(`/dashboard/${userRole}`);
            router.refresh();
          } else {
            // Role is missing or invalid, treat as an error
            console.error("Authentication error: Invalid or missing role for UID:", user.uid);
            await signOut(auth);
            toast({
              title: t("Authentication Error"),
              description: t("Your user role could not be determined. Please log in again."),
              variant: "destructive",
            });
            setIsCheckingRole(false);
          }
        } else {
          // This is an inconsistent state, likely from an incomplete signup.
          console.error("Authentication error: User document not found for UID:", user.uid);
          await signOut(auth);
          toast({
            title: t("Incomplete Registration"),
            description: t("Your previous registration was not completed. Please sign up again."),
            variant: "destructive",
          });
          router.push('/signup');
        }
      } else {
        // No user is logged in, so stop checking and show the login form.
        setIsCheckingRole(false);
      }
    };
    
    checkUserAndRedirect();

  }, [user, authLoading, router, t, toast]);

  if (authLoading || isCheckingRole) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // If we're done loading and checking, and there's no user, show the form.
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
