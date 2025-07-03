"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore"; // Import getDoc

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/lib/firebase";
import { Loader2 } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import { cn } from "@/lib/utils";

// Schemas
const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onFormSubmit = async (values: LoginFormValues) => {
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
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      // Retrieve user role from Firestore
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      let userRole: string = "student"; // Default to student if role not found

      if (userDocSnap.exists()) {
        userRole = userDocSnap.data()?.role || "student"; // Get role, default to student
      } else {
        console.warn("User document not found in Firestore. Defaulting role to student.");
      }


      toast({
        title: t("Login Successful"),
        description: t("Welcome back! Redirecting..."),
      });

      router.push(`/dashboard/${userRole}`);
      router.refresh();

    } catch (error: any) {
      toast({
        title: t("Login Failed"),
        description: error.code === 'auth/invalid-credential' ? t('Invalid email or password.') : t("An unexpected error occurred."),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-4">
            <fieldset disabled={isLoading} className="space-y-4">
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
              <Button type="submit" className="w-full font-bold" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("Login")}
              </Button>
               <Button variant="link" type="button" className="p-0 w-full" asChild disabled={isLoading}>
                <Link href="/signup">
                  {t("Don\'t have an account? Sign Up")}
                </Link>
              </Button>
            </div>
            <div className="text-center text-sm">
                <Link href="/forgot-password" className={cn("underline text-muted-foreground hover:text-primary", isLoading && "pointer-events-none opacity-50")}>
                    {t("Forgot Password?")}
                </Link>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}