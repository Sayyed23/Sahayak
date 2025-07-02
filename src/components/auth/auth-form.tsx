"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { useState } from "react"
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

const teacherSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  school: z.string().min(3, { message: "School name is required." }),
  language: z.string({ required_error: "Please select a language." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
})

const studentSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  school: z.string().min(3, { message: "School name is required." }),
  grade: z.string().min(1, { message: "Grade is required." }),
  language: z.string({ required_error: "Please select a language." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
})

type UserRole = "teacher" | "student"

export function AuthForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const { firebaseInitialized } = useAuth()

  const handleFormSubmit = (role: UserRole) => async (values: z.infer<typeof teacherSchema> | z.infer<typeof studentSchema>) => {
    if (!auth) {
      toast({
        title: "Configuration Error",
        description: "Firebase is not configured correctly. Please check your .env file.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true)
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password)
      toast({
        title: "Login Successful",
        description: `Welcome back! Redirecting...`,
      })
      router.push(`/dashboard/${role}`)
      router.refresh()
    } catch (signInError: any) {
      if (signInError.code === 'auth/invalid-credential') {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
          await updateProfile(userCredential.user, { displayName: values.name });
          toast({
            title: "Account Created Successfully",
            description: "Welcome! Redirecting...",
          });
          router.push(`/dashboard/${role}`);
          router.refresh();
        } catch (signUpError: any) {
          if (signUpError.code === 'auth/email-already-in-use') {
             toast({
              title: "Login Failed",
              description: "Incorrect password. Please try again.",
              variant: "destructive",
            });
          } else {
             toast({
              title: "Sign Up Failed",
              description: signUpError.message,
              variant: "destructive",
            });
          }
        }
      } else {
        toast({
          title: "Authentication Failed",
          description: signInError.message,
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

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
          <AuthCard role="teacher" schema={teacherSchema} onSubmit={handleFormSubmit("teacher")} isLoading={isLoading} disabled={!firebaseInitialized} />
        </TabsContent>
        <TabsContent value="student">
          <AuthCard role="student" schema={studentSchema} onSubmit={handleFormSubmit("student")} isLoading={isLoading} disabled={!firebaseInitialized} />
        </TabsContent>
      </Tabs>
    </>
  )
}

interface AuthCardProps {
  role: UserRole
  schema: typeof teacherSchema | typeof studentSchema
  onSubmit: (values: any) => void
  isLoading: boolean
  disabled: boolean
}

function AuthCard({ role, schema, onSubmit, isLoading, disabled }: AuthCardProps) {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      school: "",
      language: undefined,
      email: "",
      password: "",
      ...(role === "student" && { grade: "" }),
    },
  })

  return (
    <Card>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <fieldset disabled={disabled} className="space-y-4">
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
            <div className="pt-2">
              <Button type="submit" className="w-full font-bold" disabled={isLoading || disabled}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {disabled ? "Firebase Not Configured" : "Login / Sign Up"}
              </Button>
            </div>
            <div className="text-center text-sm">
                <Link href="#" className={cn("underline text-muted-foreground hover:text-primary", disabled && "pointer-events-none opacity-50")}>
                    Forgot Password?
                </Link>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
