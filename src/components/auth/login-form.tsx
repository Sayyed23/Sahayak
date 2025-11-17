
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

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
import { Separator } from "../ui/separator";

// Schemas
const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

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


export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

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

      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userRole = userDocSnap.data()?.role || "student";
        toast({
          title: t("Login Successful"),
          description: t("Welcome back! Redirecting..."),
        });
        router.push(`/dashboard/${userRole}`);
        router.refresh();
      } else {
        // This is an inconsistent state, likely from an incomplete signup.
        // Sign the user out and guide them to sign up again.
        await signOut(auth);
        toast({
          title: t("Incomplete Registration"),
          description: t("Your previous registration was incomplete. Please sign up again."),
          variant: "destructive",
          duration: 5000,
        });
        router.push('/signup');
      }
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

  const handleGoogleSignIn = async () => {
    if (!auth || !db) {
      toast({
        title: t("Configuration Error"),
        description: t("Firebase is not configured correctly."),
        variant: "destructive",
      });
      return;
    }
    setIsGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userRole = userDocSnap.data()?.role || "student";
        router.push(`/dashboard/${userRole}`);
        router.refresh();
      } else {
        // New user signing in via login page.
        // They need to be directed to the signup flow.
        toast({
          title: t("Welcome!"),
          description: t("Looks like you're new here. Please complete the sign up process."),
        });
        // We keep them signed in and send them to the main signup page
        // to choose their role.
        router.push('/signup');
      }
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
          console.error(error);
          toast({
            title: t("Google Sign-In Failed"),
            description: error.message,
            variant: "destructive",
          });
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const anyLoading = isLoading || isGoogleLoading;

  return (
    <Card>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-4">
            <fieldset disabled={anyLoading} className="space-y-4">
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
            <div className="pt-2 space-y-3">
              <Button type="submit" className="w-full font-bold" disabled={anyLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("Login")}
              </Button>
              <div className="relative">
                <Separator />
                <span className="absolute left-1/2 -translate-x-1/2 top-[-10px] bg-card px-2 text-xs text-muted-foreground">{t("OR")}</span>
              </div>
              <Button variant="outline" type="button" className="w-full font-bold" onClick={handleGoogleSignIn} disabled={anyLoading}>
                {isGoogleLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <GoogleIcon className="mr-2 h-4 w-4" />
                )}
                {t("Continue with Google")}
              </Button>
            </div>
            <div className="text-center text-sm !mt-4 space-y-2">
                <Button variant="link" asChild className="p-0 h-auto" disabled={anyLoading}>
                    <Link href="/signup">
                        {t("Don\'t have an account? Sign Up")}
                    </Link>
                </Button>
                <br />
                <Button variant="link" asChild className="p-0 h-auto" disabled={anyLoading}>
                    <Link href="/forgot-password">
                        {t("Forgot Password?")}
                    </Link>
                </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

      