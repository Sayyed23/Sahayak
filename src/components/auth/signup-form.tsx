
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useRouter } from "next/navigation"
import React, { useState } from "react"
import { createUserWithEmailAndPassword, updateProfile, signOut } from "firebase/auth"
import { doc, setDoc, getDoc, runTransaction, collection, query, where, getDocs } from "firebase/firestore"

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

type UserRole = "teacher" | "student"

function generateTeacherCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

// Schemas
const baseSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  school: z.string().min(3, { message: "School name is required." }),
  language: z.string({ required_error: "Please select a language." }),
});

const teacherSignUpSchema = baseSchema;

const studentSignUpSchema = baseSchema.extend({
  grade: z.string({ required_error: "Please select your grade." }),
  teacherCode: z.string().length(6, { message: "Teacher code must be 6 characters." }),
})

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
      name: "",
      email: "",
      password: "",
      school: "",
      language: undefined,
      ...(role === "student" && { grade: undefined, teacherCode: "" }),
    },
  })

  // This handles the case where a user is authenticated but doesn't have a DB record.
  // We sign them out so they can reuse their email to sign up properly.
  React.useEffect(() => {
    if (auth?.currentUser && db) {
        getDoc(doc(db, "users", auth.currentUser.uid)).then(docSnap => {
            if (!docSnap.exists()) {
                signOut(auth);
            }
        });
    }
  }, []);

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
        // Step 1: Create the user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
        const user = userCredential.user;
        await updateProfile(user, { displayName: values.name });

        // Step 2: Create the user document in Firestore
        if (role === 'teacher') {
            const teacherValues = values as z.infer<typeof teacherSignUpSchema>;
            
            await runTransaction(db, async (transaction) => {
                let newTeacherCode = '';
                let codeExists = true;
                let retries = 0;
                const maxRetries = 5;

                // Attempt to generate a unique teacher code
                while(codeExists && retries < maxRetries) {
                    newTeacherCode = generateTeacherCode();
                    const codeDocRef = doc(db, "teacherCodes", newTeacherCode);
                    const codeDoc = await transaction.get(codeDocRef);
                    if (!codeDoc.exists()) {
                        codeExists = false;
                    } else {
                        retries++;
                    }
                }

                if (codeExists) {
                    throw new Error("Could not generate a unique teacher code after multiple attempts.");
                }

                const teacherData = {
                    uid: user.uid,
                    name: teacherValues.name,
                    email: user.email,
                    role: 'teacher',
                    school: teacherValues.school,
                    language: teacherValues.language,
                    teacherCode: newTeacherCode,
                };
                
                const userDocRef = doc(db, "users", user.uid);
                const codeDocRef = doc(db, "teacherCodes", newTeacherCode);

                transaction.set(userDocRef, teacherData);
                transaction.set(codeDocRef, { teacherId: user.uid });
            });

        } else { // Student Signup
            const studentValues = values as z.infer<typeof studentSignUpSchema>;
            const teacherCode = studentValues.teacherCode.toUpperCase();
            
            // First, validate the teacher code exists
            const q = query(collection(db, "users"), where("teacherCode", "==", teacherCode), where("role", "==", "teacher"));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
              toast({
                title: t("Invalid Teacher Code"),
                description: t("No teacher found with that code. Please check and try again."),
                variant: "destructive",
              });
              // IMPORTANT: Delete the created auth user if the teacher code is invalid
              await user.delete();
              setIsLoading(false);
              return;
            }
            const teacherId = querySnapshot.docs[0].id;

            // Now, create the student document
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
        // If there's an error during the process, especially after auth user creation,
        // it's crucial to delete the auth user to allow them to try again.
        if (auth.currentUser) {
            await auth.currentUser.delete().catch(e => console.error("Failed to delete auth user on signup error:", e));
        }

        if (error.code === 'auth/email-already-in-use') {
            toast({
                title: t("Sign Up Failed"),
                description: t("This email is already registered. Please try logging in."),
                variant: "destructive",
            });
        } else {
            console.error("Signup error:", error);
            toast({
                title: t("Sign Up Failed"),
                description: error.message || t("An unexpected error occurred. Please try again."),
                variant: "destructive",
            });
        }
      } finally {
        setIsLoading(false);
      }
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t("Select your grade")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {[...Array(10)].map((_, i) => (
                                <SelectItem key={i+1} value={`Grade ${i+1}`}>{t(`Grade ${i+1}`)}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                              placeholder={t("Enter 6-character code")}
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
                      <FormLabel>{t("Preferred Language")}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
