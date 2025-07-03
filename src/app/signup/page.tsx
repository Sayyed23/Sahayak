
"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Logo } from "@/components/logo"
import Link from "next/link"
import { ArrowLeft, User, School } from "lucide-react"
import { useTranslation } from "@/hooks/use-translation"

export default function SignUpPage() {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="mb-4 flex justify-center" aria-label="Back to home">
              <Logo className="h-14 w-14 text-primary" />
          </Link>
          <CardTitle className="font-headline text-3xl">{t("Join Sahayak")}</CardTitle>
          <CardDescription>{t("First, let us know who you are.")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
            <Button asChild size="lg" className="h-16 text-lg">
                <Link href="/signup/teacher">
                    <School className="mr-4 h-6 w-6" />
                    {t("I am a Teacher")}
                </Link>
            </Button>
            <Button asChild variant="secondary" size="lg" className="h-16 text-lg">
                <Link href="/signup/student">
                    <User className="mr-4 h-6 w-6" />
                    {t("I am a Student")}
                </Link>
            </Button>

            <div className="text-center text-sm mt-4">
                <Button variant="link" asChild>
                    <Link href="/login">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        {t("Back to Login")}
                    </Link>
                </Button>
            </div>
        </CardContent>
      </Card>
    </div>
  )
}
