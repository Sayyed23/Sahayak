'use client'

import {
  Home,
  BookOpen,
  HelpCircle,
  MessageSquare,
  User,
  Settings,
  LogOut,
} from 'lucide-react'
import Link from 'next/link'
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
} from '@/components/ui/sidebar'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useEffect } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Terminal } from 'lucide-react'

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading, firebaseInitialized } = useAuth()

  useEffect(() => {
    if (!loading && !user && firebaseInitialized) {
      router.push('/login')
    }
  }, [user, loading, router, firebaseInitialized])

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth)
    }
    router.push('/login')
  }
  
  if (!firebaseInitialized) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background p-4">
        <Alert variant="destructive" className="max-w-lg">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Configuration Error</AlertTitle>
          <AlertDescription>
            Firebase is not configured correctly. Authentication is disabled. Please
            add your Firebase credentials to the <code>.env</code> file.
            <Button asChild variant="link" className="p-0 h-auto ml-1"><Link href="/login">Go to Login Page</Link></Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (loading || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        Loading...
      </div>
    )
  }

  const navItems = [
    { href: '/dashboard/student', icon: Home, label: 'Home' },
    { href: '/dashboard/student/my-lessons', icon: BookOpen, label: 'My Lessons' },
    { href: '/dashboard/student/ask-a-question', icon: HelpCircle, label: 'Ask a Question' },
    { href: '/dashboard/student/feedback', icon: MessageSquare, label: 'Feedback' },
    { href: '/dashboard/student/profile', icon: User, label: 'Profile' },
  ]

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2 p-2">
              <Logo className="w-8 h-8 text-primary" />
              <span className="font-headline font-semibold text-lg group-data-[collapsible=icon]:hidden">Sahayak</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={{ children: item.label }}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-2 p-2 h-auto">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src="https://placehold.co/100x100.png" alt={user.displayName || "Student"} data-ai-hint="student portrait" />
                        <AvatarFallback>{user.displayName?.charAt(0).toUpperCase() || 'S'}</AvatarFallback>
                    </Avatar>
                    <div className="text-left group-data-[collapsible=icon]:hidden">
                        <p className="font-semibold text-sm">{user.displayName || "Student"}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="start">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem><User className="mr-2 h-4 w-4" /><span>Profile</span></DropdownMenuItem>
                <DropdownMenuItem><HelpCircle className="mr-2 h-4 w-4" /><span>Help</span></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}><LogOut className="mr-2 h-4 w-4" /><span>Log out</span></DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <DashboardHeader />
          <main className="flex-1 p-4 lg:p-6">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
