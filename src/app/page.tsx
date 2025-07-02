import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Logo } from "@/components/logo"

export default function WelcomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="p-4 sm:p-6">
        <Link href="/" aria-label="Sahayak Home">
          <Logo className="h-10 w-10 text-primary" />
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="flex flex-col items-center text-center max-w-3xl">
          <h1 className="text-5xl md:text-7xl font-bold font-headline text-primary tracking-tight">
            Sahayak
          </h1>
          <p className="mt-4 text-lg md:text-xl text-foreground/80 max-w-2xl">
            Your AI-powered teaching assistant, designed for the vibrant classrooms of India.
          </p>
          <Button asChild size="lg" className="mt-8 font-bold text-lg px-8 py-6 rounded-full">
            <Link href="/login">Get Started</Link>
          </Button>
        </div>
      </main>
      <footer className="p-4 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Sahayak. All rights reserved.
      </footer>
    </div>
  )
}
