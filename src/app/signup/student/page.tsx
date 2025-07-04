
"use client"

import { SignUpForm } from '@/components/auth/signup-form'
import { Logo } from '@/components/logo'
import Link from 'next/link'
import { useTranslation } from '@/hooks/use-translation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export default function StudentSignupPage() {
  const { t } = useTranslation()
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && db) {
      const userDocRef = doc(db, 'users', user.uid);
      getDoc(userDocRef).then(userDoc => {
        if (userDoc.exists()) {
          const userRole = userDoc.data()?.role || 'student';
          router.replace(`/dashboard/${userRole}`);
        } else {
            console.warn("User authenticated but no Firestore document found.");
        }
      });
    }
  }, [user, db, router]);


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
          <h1 className="text-3xl font-bold font-headline text-foreground">{t("Student Sign Up")}</h1>
          <p className="text-muted-foreground">{t("Create a student account to join your class.")}</p>
        </div>
        <SignUpForm role="student" />
        <div className="text-center text-sm">
            <Button variant="link" asChild>
                <Link href="/signup">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t("Back")}
                </Link>
            </Button>
        </div>
      </div>
    </div>
  )
}
