
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { sendPasswordResetEmail } from "firebase/auth"
import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"

import { auth } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Logo } from "@/components/logo"
import { useTranslation } from "@/hooks/use-translation"

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
})

export default function ForgotPasswordPage() {
  const { toast } = useToast()
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!auth) {
        toast({
            title: t("Error"),
            description: t("Firebase is not configured."),
            variant: "destructive",
        });
        return;
    }
    setIsLoading(true)
    try {
      await sendPasswordResetEmail(auth, values.email)
      setSubmitted(true)
    } catch (error: any) {
      toast({
        title: t("Error"),
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="mb-4 flex justify-center" aria-label="Back to home">
              <Logo className="h-14 w-14 text-primary" />
          </Link>
          <CardTitle className="font-headline text-3xl">{t("Forgot Password")}</CardTitle>
          <CardDescription>
            {submitted 
              ? t(`If an account exists for {{email}}, a password reset link has been sent.`, { email: form.getValues("email") })
              : t("Enter your email address and we'll send you a link to reset your password.")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!submitted ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                <Button type="submit" className="w-full font-bold" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("Send Reset Link")}
                </Button>
              </form>
            </Form>
          ) : (
             <Button asChild className="w-full">
                <Link href="/login">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t("Back to Login")}
                </Link>
             </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
