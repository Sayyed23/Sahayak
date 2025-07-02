
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useRouter } from "next/navigation"
import React, { useState } from "react"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth"
import { doc, setDoc, getDocs, collection, query, where } from "firebase/firestore"

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
import { auth, db } from "@/lib/firebase"
import { Loader2, Terminal } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/hooks/use-translation"

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
  teacherCode: z.string()
    .length(6, { message: "Teacher code must be exactly 6 characters." }),
  language: z.string({ required_error: "Please select a language." }),
})

type UserRole = "teacher" | "student"

function generateTeacherCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export function AuthForm() {
  const { firebaseInitialized } = useAuth()
  const { t } = useTranslation()
  
  return (
    <>
      {!firebaseInitialized && (
         <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>{t("Configuration Error")}</AlertTitle>
            <AlertDescription>
              {t("Firebase is not configured. Please add your Firebase credentials to the")}
              <code> .env </code> {t("file to enable authentication.")}
            </AlertDescription>
          </Alert>
      )}
      <Tabs defaultValue="teacher" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="teacher" disabled={!firebaseInitialized}>{t("Teacher")}</TabsTrigger>
          <TabsTrigger value="student" disabled={!firebaseInitialized}>{t("Student")}</TabsTrigger>
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
  const { t } = useTranslation()
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
      ...(role === "student" && { grade: "", teacherCode: "" }),
    },
  })

  React.useEffect(() => {
    form.reset()
  }, [mode, role, form])

  const onFormSubmit = async (values: z.infer<typeof currentSchema>) => {
    if (!auth || !db) {
      toast({
        title: t("Configuration Error"),
        description: t("Firebase is not configured correctly."),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    if (mode === 'login') {
      try {
        await signInWithEmailAndPassword(auth, values.email, values.password);
        toast({
          title: t("Login Successful"),
          description: t("Welcome back! Redirecting..."),
        });
        router.push(`/dashboard/${role}`);
        router.refresh();
      } catch (error: any) {
        toast({
          title: t("Login Failed"),
          description: error.code === 'auth/invalid-credential' ? t('Invalid email or password.') : t("An unexpected error occurred."),
          variant: "destructive",
        });
      }
    } else { // signup
      try {
        // For students, validate teacher code *before* creating the auth user.
        if (role === 'student') {
          const studentValues = values as z.infer<typeof studentSignUpSchema>;
          const teacherCode = studentValues.teacherCode.toUpperCase();
          const q = query(collection(db, "users"), where("teacherCode", "==", teacherCode), where("role", "==", "teacher"));
          const querySnapshot = await getDocs(q);

          if (querySnapshot.empty) {
            toast({
              title: t("Invalid Teacher Code"),
              description: t("No teacher found with that code. Please check and try again."),
              variant: "destructive",
            });
            setIsLoading(false);
            return;
          }
        }

        const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
        const user = userCredential.user;
        await updateProfile(user, { displayName: (values as any).name });
        
        if (role === 'teacher') {
            const teacherData = {
                uid: user.uid,
                name: (values as any).name,
                email: user.email,
                role: 'teacher',
                school: (values as any).school,
                language: (values as any).language,
                teacherCode: generateTeacherCode(),
            };
            await setDoc(doc(db, "users", user.uid), teacherData);
        } else { // student
            const studentValues = values as z.infer<typeof studentSignUpSchema>;
            const teacherCode = studentValues.teacherCode.toUpperCase();
            const q = query(collection(db, "users"), where("teacherCode", "==", teacherCode), where("role", "==", "teacher"));
            const querySnapshot = await getDocs(q);
            const teacherId = querySnapshot.docs[0].id; // We know this exists from the check above

            const studentData = {
                uid: user.uid,
                name: studentValues.name,
                email: user.email,
                role: 'student',
                school: studentValues.school,
                language: studentValues.language,
                grade: studentValues.grade,
                teacherId: teacherId,
            };
            await setDoc(doc(db, "users", user.uid), studentData);
        }
        
        toast({
          title: t("Account Created"),
          description: t("Welcome! Your account has been created successfully."),
        });
        router.push(`/dashboard/${role}`);
        router.refresh();
      } catch (error: any) {
        if (error.code === 'unavailable' || (error.message && error.message.toLowerCase().includes('offline'))) {
            toast({
                title: t("Network Error"),
                description: t("Could not connect to the server. Please check your connection and try again."),
                variant: "destructive",
            });
        } else if (error.code === 'auth/email-already-in-use') {
            toast({
                title: t("Sign Up Failed"),
                description: t("This email is already registered."),
                variant: "destructive",
            });
        } else {
            toast({
                title: t("Sign Up Failed"),
                description: error.message || t("An unexpected error occurred. Please try again."),
                variant: "destructive",
            });
        }
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
                        <FormLabel>{t("Name")}</FormLabel>
                        <FormControl>
                          <Input placeholder={t("Your full name")} {...field} />
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
                        <FormLabel>{t("School")}</FormLabel>
                        <FormControl>
                          <Input placeholder={t("Your school's name")} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {role === 'student' && (
                    <>
                    <FormField
                      control={form.control}
                      name="grade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("Grade")}</FormLabel>
                          <FormControl>
                            <Input placeholder={t("e.g., 5th")} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="teacherCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("Teacher Code")}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t("Enter the 6-character code")}
                              {...field}
                              maxLength={6}
                              className="uppercase tracking-widest"
                              autoCapitalize="characters"
                              onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    </>
                  )}
                   <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("Local Language")}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("Select a language")} />
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
                      <FormLabel>{t("Email")}</FormLabel>
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
                      <FormLabel>{t("Password")}</FormLabel>
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
                {disabled ? t("Firebase Not Configured") : (mode === 'login' ? t('Login') : t('Sign Up'))}
              </Button>
               <Button variant="link" type="button" className="p-0 w-full" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} disabled={isLoading || disabled}>
                {mode === 'login' ? t("Don't have an account? Sign Up") : t("Already have an account? Login")}
              </Button>
            </div>
            {mode === 'login' && (
              <div className="text-center text-sm">
                  <Link href="/forgot-password" className={cn("underline text-muted-foreground hover:text-primary", disabled && "pointer-events-none opacity-50")}>
                      {t("Forgot Password?")}
                  </Link>
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
