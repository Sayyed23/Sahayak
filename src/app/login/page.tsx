"use client"

import { AuthForm } from '@/components/auth/auth-form'
import { Logo } from '@/components/logo'
import { useAuth } from '@/hooks/use-auth'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function LoginPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      // User is logged in, redirect to a default dashboard.
      // The specific dashboard layout will handle role-based content.
      router.push('/dashboard/teacher')
    }
  }, [user, loading, router])

  if (loading || user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        Loading...
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
          <h1 className="text-3xl font-bold font-headline text-foreground">Welcome to Sahayak</h1>
          <p className="text-muted-foreground">Login or create an account to continue.</p>
        </div>
        <AuthForm />
      </div>
    </div>
  )
}
