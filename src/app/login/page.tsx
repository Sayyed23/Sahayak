import { AuthForm } from '@/components/auth/auth-form'
import { Logo } from '@/components/logo'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center">
          <Link href="/" className="mb-4" aria-label="Back to home">
            <Logo className="h-14 w-14 text-primary" />
          </Link>
          <h1 className="text-3xl font-bold font-headline text-foreground">Welcome to Sahayak</h1>
          <p className="text-muted-foreground">Your teaching companion awaits.</p>
        </div>
        <AuthForm />
      </div>
    </div>
  )
}
