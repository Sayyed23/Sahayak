"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useRouter } from "next/navigation"
import React, { useState } from "react"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { auth } from "@/lib/firebase"
import { Loader2, Terminal } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

// Schemas
const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

const teacherSignUpSchema = loginSchema.extend({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  school: z.string().min(3, { message: "School name is required." }),
  language: z.string({ required_error: "Please select a language." }),
})

const studentSignUpSchema = loginSchema.extend({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  school: z.string().min(3, { message: "School name is required." }),
  grade: z.string().min(1, { message: "Grade is required." }),
  language: z.string({ required_error: "Please select a language." }),
})

type UserRole = "teacher" | "student"

export function AuthForm() {
  const { firebaseInitialized } = useAuth()
  
  return (
    <>
      {!firebaseInitialized && (
         <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Configuration Error</AlertTitle>
            <AlertDescription>
              Firebase is not configured. Please add your Firebase credentials to the 
              <code> .env </code> file to enable authentication.
            </AlertDescription>
          </Alert>
      )}
      <Tabs defaultValue="teacher" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="teacher" disabled={!firebaseInitialized}>Teacher</TabsTrigger>
          <TabsTrigger value="student" disabled={!firebaseInitialized}>Student</TabsTrigger>
        </TabsList>
        <TabsContent value="teacher">
          <AuthCard role="teacher" disabled={!firebaseInitialized} />
        </TabsContent>
        <TabsContent value="student">
          <AuthCard role="student" disabled={!firebaseInitialized} />
        </TabsContent>
      </Tabs>
    </>
  )
}

interface AuthCardProps {
  role: UserRole
  disabled: boolean
}

function AuthCard({ role, disabled }: AuthCardProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [mode, setMode] = useState<"login" | "signup">("login")

  const signupSchema = role === "teacher" ? teacherSignUpSchema : studentSignUpSchema
  const currentSchema = mode === "login" ? loginSchema : signupSchema

  const form = useForm<z.infer<typeof currentSchema>>({
    resolver: zodResolver(currentSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
      school: "",
      language: undefined,
      ...(role === "student" && { grade: "" }),
    },
  })

  React.useEffect(() => {
    form.reset()
  }, [mode, form])

  const onFormSubmit = async (values: z.infer<typeof currentSchema>) => {
    if (!auth) {
      toast({
        title: "Configuration Error",
        description: "Firebase is not configured correctly.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    if (mode === 'login') {
      try {
        await signInWithEmailAndPassword(auth, values.email, values.password);
        toast({
          title: "Login Successful",
          description: "Welcome back! Redirecting...",
        });
        router.push(`/dashboard/${role}`);
        router.refresh();
      } catch (error: any) {
        toast({
          title: "Login Failed",
          description: error.code === 'auth/invalid-credential' ? 'Invalid email or password.' : "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    } else { // signup
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
        const signupValues = values as z.infer<typeof signupSchema>;
        await updateProfile(userCredential.user, { displayName: signupValues.name });
        
        toast({
          title: "Account Created",
          description: "Welcome! Your account has been created successfully.",
        });
        router.push(`/dashboard/${role}`);
        router.refresh();
      } catch (error: any) {
        toast({
          title: "Sign Up Failed",
          description: error.code === 'auth/email-already-in-use' ? 'This email is already registered.' : "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    }
    setIsLoading(false);
  }

  return (
    <Card>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-4">
            <fieldset disabled={disabled || isLoading} className="space-y-4">
              {mode === 'signup' && (
                <>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="school"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>School</FormLabel>
                        <FormControl>
                          <Input placeholder="Your school's name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {role === 'student' && (
                    <FormField
                      control={form.control}
                      name="grade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Grade</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 5th" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                   <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Local Language</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a language" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="hindi">Hindi</SelectItem>
                            <SelectItem value="bengali">Bengali</SelectItem>
                            <SelectItem value="marathi">Marathi</SelectItem>
                            <SelectItem value="telugu">Telugu</SelectItem>
                            <SelectItem value="tamil">Tamil</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </fieldset>
            <div className="pt-2 space-y-2">
              <Button type="submit" className="w-full font-bold" disabled={isLoading || disabled}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {disabled ? "Firebase Not Configured" : (mode === 'login' ? 'Login' : 'Sign Up')}
              </Button>
               <Button variant="link" type="button" className="p-0 w-full" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} disabled={isLoading || disabled}>
                {mode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Login"}
              </Button>
            </div>
            {mode === 'login' && (
              <div className="text-center text-sm">
                  <Link href="/forgot-password" className={cn("underline text-muted-foreground hover:text-primary", disabled && "pointer-events-none opacity-50")}>
                      Forgot Password?
                  </Link>
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
