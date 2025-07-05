
'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/hooks/use-auth"
import { useTranslation } from "@/hooks/use-translation"
import { useEffect, useState } from "react"
<<<<<<< HEAD
import { db } from "@/lib/firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { updateProfile } from "firebase/auth"
import { Loader2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
=======
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
>>>>>>> 1d3e53a0853ff1235dc4d7644646c721a1f63dbd

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth()
  const { t, language, setLanguage } = useTranslation()
  const { toast } = useToast()
<<<<<<< HEAD

  const [name, setName] = useState("")
  const [school, setSchool] = useState("")
  const [grade, setGrade] = useState("")
  const [teacherName, setTeacherName] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isPageLoading, setIsPageLoading] = useState(true)
=======
  
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
>>>>>>> 1d3e53a0853ff1235dc4d7644646c721a1f63dbd

  useEffect(() => {
    if (user && db) {
      const fetchProfile = async () => {
<<<<<<< HEAD
        setIsPageLoading(true)
        const studentRef = doc(db, "users", user.uid)
        const studentSnap = await getDoc(studentRef)

        if (studentSnap.exists()) {
          const studentData = studentSnap.data()
          setName(studentData.name || "")
          setSchool(studentData.school || "")
          setGrade(studentData.grade || "")
          if (studentData.language) {
            setLanguage(studentData.language);
          }
          if (studentData.teacherId) {
            const teacherRef = doc(db, "users", studentData.teacherId)
=======
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
          
          if (userData.teacherId) {
            const teacherRef = doc(db, "users", userData.teacherId)
>>>>>>> 1d3e53a0853ff1235dc4d7644646c721a1f63dbd
            const teacherSnap = await getDoc(teacherRef)
            if (teacherSnap.exists()) {
              setTeacherName(teacherSnap.data().name)
            }
          }
        }
<<<<<<< HEAD
        setIsPageLoading(false)
      }
      fetchProfile()
    } else if (!authLoading) {
      setIsPageLoading(false)
    }
  }, [user, authLoading, setLanguage])

  const handleSaveChanges = async () => {
    if (!user || !db) return;
    setIsSaving(true);

    try {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
            name: name,
            school: school,
            grade: grade,
            language: language,
        });

        if (user.displayName !== name) {
            await updateProfile(user, { displayName: name });
        }
        
        toast({
            title: t("Profile Updated"),
            description: t("Your changes have been saved successfully."),
        });
    } catch (error) {
        console.error("Error updating profile:", error);
        toast({
            title: t("Error"),
            description: t("Could not save your changes. Please try again."),
            variant: "destructive",
        });
    } finally {
        setIsSaving(false);
    }
  };

  if (authLoading || isPageLoading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-4 w-1/2 mt-2" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-4 w-1/2 mt-1" />
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
              <div className="space-y-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
              <div className="space-y-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
              <div className="space-y-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
              <div className="space-y-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
              <div className="space-y-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
            </div>
            <Skeleton className="h-10 w-32 mt-4" />
          </CardContent>
        </Card>
      </div>
    )
  }
  
  if (!user) {
    return null; // Layout will handle redirect
=======
        setIsLoading(false)
      }
      fetchProfile()
    }
  }, [user, db, form])

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
>>>>>>> 1d3e53a0853ff1235dc4d7644646c721a1f63dbd
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">{t("My Profile")}</h1>
        <p className="text-muted-foreground">{t("Manage your personal information and preferences.")}</p>
      </div>

      <Card>
<<<<<<< HEAD
        <CardHeader>
          <CardTitle>{t("Profile Details")}</CardTitle>
          <CardDescription>{t("Update your personal information.")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("Name")}</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} disabled={isSaving}/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("Email")}</Label>
              <Input id="email" type="email" value={user.email || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="school">{t("School")}</Label>
              <Input id="school" value={school} onChange={(e) => setSchool(e.target.value)} disabled={isSaving}/>
            </div>
             <div className="space-y-2">
              <Label htmlFor="grade">{t("Grade")}</Label>
              <Input id="grade" value={grade} onChange={(e) => setGrade(e.target.value)} disabled={isSaving}/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="teacher">{t("My Teacher")}</Label>
              <Input id="teacher" value={teacherName ?? ""} disabled placeholder={t("No teacher assigned")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">{t("Language Preference")}</Label>
              <Select value={language} onValueChange={setLanguage} disabled={isSaving}>
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
          </div>
          <Button onClick={handleSaveChanges} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("Save Changes")}
          </Button>
        </CardContent>
=======
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
>>>>>>> 1d3e53a0853ff1235dc4d7644646c721a1f63dbd
      </Card>
    </div>
  )
}
