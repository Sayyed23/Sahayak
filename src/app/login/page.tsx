
"use client"

import { AuthForm } from '@/components/auth/auth-form'
import { Logo } from '@/components/logo'
import { useAuth } from '@/hooks/use-auth'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { UserCheck } from 'lucide-react'
import { useTranslation } from '@/hooks/use-translation'

export default function LoginPage() {
  const { user, loading } = useAuth()
  const { t } = useTranslation()

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        {t("Loading...")}
      </div>
    )
  }

  // If user is already logged in, show a role selection screen
  if (user) {
    return (
       <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
         <Card className="w-full max-w-md">
           <CardHeader className="text-center">
             <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
               <UserCheck className="h-10 w-10 text-primary" />
             </div>
             <CardTitle className="font-headline text-2xl">{t("You're Already Logged In")}</CardTitle>
             <CardDescription>
               {t("Welcome back, {{name}}! Please select your dashboard.", { name: user.displayName || 'user' })}
             </CardDescription>
           </CardHeader>
           <CardContent className="flex flex-col gap-4">
             <Button asChild size="lg">
               <Link href="/dashboard/teacher">{t("Teacher Dashboard")}</Link>
             </Button>
             <Button asChild variant="secondary" size="lg">
               <Link href="/dashboard/student">{t("Student Dashboard")}</Link>
             </Button>
           </CardContent>
         </Card>
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
        <AuthForm />
      </div>
    </div>
  )
}
