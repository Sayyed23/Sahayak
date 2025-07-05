
'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/hooks/use-auth"
import { useTranslation } from "@/hooks/use-translation"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { db } from "@/lib/firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

const profileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  school: z.string().min(3, { message: "School name is required." }),
  grade: z.string().min(1, { message: "Grade is required." }),
})

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth()
  const { t, language, setLanguage } = useTranslation()
  const { toast } = useToast()
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [teacherName, setTeacherName] = useState("")

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      school: "",
      grade: "",
    },
  })

  useEffect(() => {
    if (user && db) {
      const fetchProfile = async () => {
        setIsLoading(true)
        const userRef = doc(db, "users", user.uid)
        const userSnap = await getDoc(userRef)

        if (userSnap.exists()) {
          const userData = userSnap.data()
          form.reset({
            name: userData.name || '',
            school: userData.school || '',
            grade: userData.grade || '',
          })
          
          if (userData.language) {
            setLanguage(userData.language);
          }

          if (userData.teacherId) {
            const teacherRef = doc(db, "users", userData.teacherId)
            const teacherSnap = await getDoc(teacherRef)
            if (teacherSnap.exists()) {
              setTeacherName(teacherSnap.data().name)
            }
          }
        }
        setIsLoading(false)
      }
      fetchProfile()
    } else if (!authLoading) {
        setIsLoading(false)
    }
  }, [user, authLoading, db, form, setLanguage])

  const onSubmit = async (values: z.infer<typeof profileSchema>) => {
    if (!user || !db) return
    setIsSaving(true)
    try {
      const userRef = doc(db, "users", user.uid)
      await updateDoc(userRef, {
        name: values.name,
        school: values.school,
        grade: values.grade,
        language: language,
      })
      toast({
        title: t("Profile Updated"),
        description: t("Your information has been saved."),
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: t("Error"),
        description: t("Failed to update your profile. Please try again."),
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-64 mt-2" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-5 w-56 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-5 w-12" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-32" />
          </CardFooter>
        </Card>
      </div>
    )
  }
  
  if (!user) {
    return null; // Layout will handle redirect
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">{t("My Profile")}</h1>
        <p className="text-muted-foreground">{t("Manage your personal information and preferences.")}</p>
      </div>

      <Card>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>{t("Profile Details")}</CardTitle>
              <CardDescription>{t("Update your personal information.")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("Name")}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={t("Your full name")} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-2">
                  <Label htmlFor="email">{t("Email")}</Label>
                  <Input id="email" type="email" defaultValue={user?.email || ""} disabled />
                </div>
                <FormField
                  control={form.control}
                  name="school"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("School")}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={t("Your school's name")} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="grade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("Grade")}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={t("e.g., 5th")} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-2">
                  <Label htmlFor="language">{t("Language Preference")}</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger id="language"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="english">English</SelectItem>
                        <SelectItem value="hindi">Hindi</SelectItem>
                        <SelectItem value="bengali">Bengali</SelectItem>
                        <SelectItem value="marathi">Marathi</SelectItem>
                        <SelectItem value="telugu">Telugu</SelectItem>
                        <SelectItem value="tamil">Tamil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teacher">{t("My Teacher")}</Label>
                  <Input id="teacher" value={teacherName || t("Not assigned")} disabled />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("Save Changes")}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  )
}
