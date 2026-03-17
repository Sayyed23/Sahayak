"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useRouter } from "next/navigation"
import React, { useState, useEffect } from "react"
import { createUserWithEmailAndPassword, updateProfile, signOut, GoogleAuthProvider, signInWithPopup } from "firebase/auth"
import { doc, setDoc, getDoc, runTransaction, collection, query, where, getDocs, type Firestore } from "firebase/firestore"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { auth, db } from "@/lib/firebase"
import { Loader2 } from "lucide-react"
import { useTranslation } from "@/hooks/use-translation"
import { Separator } from "../ui/separator"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"

type UserRole = "teacher" | "student"

// Schemas
const baseSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }).optional().or(z.literal("")),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }).optional().or(z.literal("")),
  school: z.string().min(3, { message: "School name is required." }),
  language: z.string().min(1, { message: "Please select a language." }),
})

const teacherSignUpSchema = baseSchema

const studentSignUpSchema = baseSchema.extend({
  grade: z.string().min(1, { message: "Please select your grade." }),
})

const emailPasswordSchema = z.object({
    email: z.string().email({ message: "Please enter a valid email." }),
    password: z.string().min(6, { message: "Password must be at least 6 characters." })
})

interface SignUpFormProps {
  role: UserRole
}

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    role="img"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.05 1.05-2.36 1.67-4.05 1.67-3.27 0-5.9-2.6-5.9-5.8s2.63-5.8 5.9-5.8c1.56 0 2.91.6 3.86 1.5l2.64-2.58C17.34 2.63 15.25 1.5 12.48 1.5c-4.42 0-8.01 3.47-8.01 7.75s3.59 7.75 8.01 7.75c2.31 0 4.05-.77 5.42-2.18 1.48-1.5 1.96-3.5 1.96-5.66 0-.6-.05-1.18-.15-1.71h-7.48z"
      fill="currentColor"
    />
  </svg>
);


export function SignUpForm({ role }: SignUpFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const signupSchema = role === "teacher" ? teacherSignUpSchema : studentSignUpSchema;

  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues:
      role === "teacher"
        ? {
            name: "",
            email: "",
            password: "",
            school: "",
            language: "",
          }
        : {
            name: "",
            email: "",
            password: "",
            school: "",
            language: "",
            grade: "",
          },
  })

  // Ensure unregistered users in auth get signed out
  useEffect(() => {
    if (auth?.currentUser && db) {
        getDoc(doc(db, "users", auth.currentUser.uid)).then(docSnap => {
            if (!docSnap.exists()) {
                if (auth) signOut(auth);
            }
        });
    }
  }, []);

  const processNewUser = async (user: any, values: z.infer<typeof signupSchema>) => {
    // This function contains the logic to create the DB record after auth user is created.
     if (role === 'teacher') {
      const teacherValues = values as z.infer<typeof teacherSignUpSchema>;
      
      const teacherData = {
        uid: user.uid,
        name: teacherValues.name,
        email: user.email,
        role: "teacher",
        school: teacherValues.school,
        language: teacherValues.language,
      };

      try {
        await setDoc(doc(db as Firestore, "users", user.uid), teacherData);
        toast({
          title: t("Account Created"),
          description: t("Welcome! Your account has been created successfully."),
        });
        router.push(`/dashboard/teacher`);
        router.refresh();
      } catch (error) {
        console.error("Teacher signup failed: ", error);
        // Clean up the created auth user since the db write failed
        await user.delete();
        toast({
            title: t("Sign Up Failed"),
            description: t("Could not create your teacher account. Please try again."),
            variant: "destructive"
        });
      }

    } else { // Student role
      const studentValues = values as z.infer<typeof studentSignUpSchema>;
      
      const studentData = {
          uid: user.uid,
          name: studentValues.name,
          email: user.email,
          role: "student",
          school: studentValues.school,
          language: studentValues.language,
          grade: studentValues.grade,
      };

      const userDocRef = doc(db as Firestore, 'users', user.uid);
      try {
        await setDoc(userDocRef, studentData);
        toast({
          title: t("Account Created"),
          description: t("Welcome! Your account has been created successfully."),
        });
        router.push(`/dashboard/student`);
        router.refresh();
      } catch (error) {
         console.error("Student signup failed: ", error);
         toast({
            title: t("Sign up failed"),
            description: t("Could not create your student account. Please try again."),
            variant: "destructive"
        })
        await user.delete();
      }
    }
  }


  const onFormSubmit = async (values: z.infer<typeof signupSchema>) => {
    if (!auth || !db) {
        toast({ title: t("Configuration Error"), variant: "destructive" });
        return;
    }

    const emailPasswordValidation = emailPasswordSchema.safeParse(values);
    if (!emailPasswordValidation.success) {
        if (values.email === '') {
            form.setError('email', { message: 'Please enter a valid email.' });
        }
        if (values.password === '') {
            form.setError('password', { message: 'Password must be at least 6 characters.' });
        }
        return;
    }
    
    setIsLoading(true);

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, values.email!, values.password!);
        const user = userCredential.user;
        await updateProfile(user, { displayName: values.name });
        await processNewUser(user, values);
    } catch (error: any) {
      if (error.code === "auth/email-already-in-use") {
        toast({
          title: t("Sign Up Failed"),
          description: t("This email is already registered. Please try logging in."),
          variant: "destructive",
        });
      } else {
        toast({
          title: t("Sign Up Failed"),
          description: error.message || t("An unexpected error occurred creating your account."),
          variant: "destructive",
        });
      }
    } finally {
        setIsLoading(false);
    }
  }

  const handleGoogleSignIn = async () => {
    if (!auth || !db) return;
    
    // Validate form before proceeding with Google Sign-In for a new user
    const validationResult = await form.trigger();
    if (!validationResult) {
        toast({
            title: t("Missing Information"),
            description: t("Please fill out all fields before signing up with Google."),
            variant: "destructive"
        })
        return;
    }

    setIsGoogleLoading(true);

    try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            // User already exists, just sign them in and redirect
            const userData = userDoc.data();
            router.push(`/dashboard/${userData.role}`);
            router.refresh();
        } else {
            // New user, process them with the form data
            const formValues = form.getValues();
            // The name/email from Google should override the form
            formValues.name = user.displayName || formValues.name;
            formValues.email = user.email || formValues.email;
            await processNewUser(user, formValues);
        }

    } catch (error: any) {
        if (error.code !== 'auth/popup-closed-by-user') {
            console.error("Google sign-in error:", error);
            toast({
                title: t("Google Sign-In Failed"),
                description: error.message || t("An unexpected error occurred."),
                variant: "destructive",
            });
        }
    } finally {
        setIsGoogleLoading(false);
    }
  }

  const anyLoading = isLoading || isGoogleLoading;

  return (
    <Card>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-4">
            <fieldset disabled={anyLoading} className="space-y-4">
              {/* Name */}
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
              {/* School */}
              <FormField
                control={form.control}
                name="school"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("School")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("Your school\'s name")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Student-only fields */}
              {role === "student" && (
                <>
                  <FormField
                    control={form.control}
                    name="grade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("Grade")}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("Select your grade")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.from({ length: 10 }, (_, i) => (
                              <SelectItem key={i + 1} value={`Grade ${i + 1}`}>
                                {t(`Grade ${i + 1}`)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              {/* Language */}
              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("Preferred Language")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("Select a language")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="english">English</SelectItem>
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
                <div className="pt-2 space-y-2">
                    <div className="relative">
                        <Separator />
                        <span className="absolute left-1/2 -translate-x-1/2 top-[-10px] bg-card px-2 text-xs text-muted-foreground">{t("Create Account With")}</span>
                    </div>
                </div>

                <Button variant="outline" type="button" className="w-full font-bold" onClick={handleGoogleSignIn} disabled={anyLoading}>
                    {isGoogleLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                    <GoogleIcon className="mr-2 h-4 w-4" />
                    )}
                    {t("Google")}
                </Button>

                <div className="relative">
                    <Separator />
                    <span className="absolute left-1/2 -translate-x-1/2 top-[-10px] bg-card px-2 text-xs text-muted-foreground">{t("OR")}</span>
                </div>

              {/* Email */}
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
              {/* Password */}
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
            <div className="pt-2">
              <Button type="submit" className="w-full font-bold" disabled={anyLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("Sign Up with Email")}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
