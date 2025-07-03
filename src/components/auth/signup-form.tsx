"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useRouter } from "next/navigation"
import React, { useState } from "react"
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
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
import { useToast } from "@/hooks/use-toast"
import { auth, db } from "@/lib/firebase"
import { Loader2 } from "lucide-react"
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
  language: z.string({ required_error: "Please select a language." }),
})

type UserRole = "teacher" | "student"

function generateTeacherCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}


interface SignUpFormProps {
    role: UserRole;
}

export function SignUpForm({ role }: SignUpFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)

  const signupSchema = role === "teacher" ? teacherSignUpSchema : studentSignUpSchema

  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
      school: "",
      language: undefined,
      ...(role === "student" && { grade: "" }),
    },
  })

  const onFormSubmit = async (values: z.infer<typeof signupSchema>) => {
    if (!auth || !db) {
      toast({
        title: t("Configuration Error"),
        description: t("Firebase is not configured correctly."),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
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
            const studentData = {
                uid: user.uid,
                name: studentValues.name,
                email: user.email,
                role: 'student',
                school: studentValues.school,
                language: studentValues.language,
                grade: studentValues.grade,
                teacherId: null, // No teacher assigned at signup
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

    setIsLoading(false);
  }

  return (
    <Card>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-4">
            <fieldset disabled={isLoading} className="space-y-4">
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
            <div className="pt-2">
              <Button type="submit" className="w-full font-bold" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('Sign Up')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
