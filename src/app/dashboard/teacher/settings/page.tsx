
'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/hooks/use-auth"
import Link from "next/link"
import { useState, useEffect } from "react"
import { db } from "@/lib/firebase"
<<<<<<< HEAD
import { doc, onSnapshot, setDoc, updateDoc } from "firebase/firestore"
=======
import { doc, getDoc, updateDoc } from "firebase/firestore"
>>>>>>> 068d3fff1ebaa035e444337644b56c698b9ce125
import { useToast } from "@/hooks/use-toast"
import { Copy, Loader2 } from "lucide-react"
import { useTranslation } from "@/hooks/use-translation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Skeleton } from "@/components/ui/skeleton"

<<<<<<< HEAD
=======
const profileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  school: z.string().min(3, { message: "School name is required." }),
})
>>>>>>> 068d3fff1ebaa035e444337644b56c698b9ce125

export default function SettingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { t, language, setLanguage } = useTranslation()
  
  const [teacherCode, setTeacherCode] = useState("")
  const [isLoading, setIsLoading] = useState(true)
<<<<<<< HEAD

  const [name, setName] = useState(user?.displayName || "")
  const [school, setSchool] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (user && db) {
      const userRef = doc(db, "users", user.uid)
      const unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data()
          setTeacherCode(data.teacherCode || "")
          setName(data.name || "")
          setSchool(data.school || "")
          if (data.language && data.language !== language) {
            setLanguage(data.language);
          }
        }
        setIsLoading(false)
      }, (error) => {
        console.error("Error fetching user data:", error);
        toast({
            title: t("Error"),
            description: t("Could not load your profile data."),
            variant: "destructive"
        })
        setIsLoading(false)
      });

      return () => unsubscribe();
    }
  }, [user, t, toast, language, setLanguage])
=======
  const [isSaving, setIsSaving] = useState(false)

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      school: "",
    },
  })

  useEffect(() => {
    if (user && db) {
      const fetchProfile = async () => {
        setIsLoading(true)
        const teacherRef = doc(db, "users", user.uid)
        const docSnap = await getDoc(teacherRef)

        if (docSnap.exists()) {
          const data = docSnap.data()
          form.reset({
            name: data.name || '',
            school: data.school || '',
          })
          setTeacherCode(data.teacherCode || "")
        }
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
>>>>>>> 068d3fff1ebaa035e444337644b56c698b9ce125

  const handleCopyCode = () => {
    if (!teacherCode) return;
    navigator.clipboard.writeText(teacherCode)
    toast({
      title: t("Copied!"),
      description: t("Teacher code copied to clipboard."),
    })
  }

<<<<<<< HEAD
  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;

    setIsSaving(true);
    try {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
            name: name,
            school: school,
            language: language,
        });
        if(user.displayName !== name) {
            // This is an async operation, but we don't need to wait for it
            import('firebase/auth').then(({ updateProfile }) => updateProfile(user, { displayName: name }));
        }
        toast({
            title: t("Profile Updated"),
            description: t("Your changes have been saved successfully."),
        });
    } catch (error) {
        console.error("Error updating profile:", error);
        toast({
            title: t("Error"),
            description: t("Failed to save your changes."),
            variant: "destructive",
        });
    } finally {
        setIsSaving(false);
    }
  };


  if (isLoading) {
    return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  if (!user) {
    return <div>{t("Please log in to view settings.")}</div>
=======
  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-5 w-72 mt-2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-5 w-48 mt-2" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-32" />
            </CardFooter>
          </Card>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-5 w-full max-w-sm mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-36" />
                <Skeleton className="h-5 w-52 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-14 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
>>>>>>> 068d3fff1ebaa035e444337644b56c698b9ce125
  }
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">{t("Settings")}</h1>
        <p className="text-muted-foreground">{t("Manage your account and application preferences.")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
<<<<<<< HEAD
          <form onSubmit={handleSaveChanges}>
            <CardHeader>
              <CardTitle>{t("My Profile")}</CardTitle>
              <CardDescription>{t("Update your personal information.")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("Name")}</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t("Email")}</Label>
                <Input id="email" type="email" value={user.email || ""} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="school">{t("School")}</Label>
                <Input id="school" value={school} onChange={(e) => setSchool(e.target.value)} />
              </div>
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
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("Save Changes")}
              </Button>
            </CardContent>
          </form>
=======
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardHeader>
                <CardTitle>{t("My Profile")}</CardTitle>
                <CardDescription>{t("Update your personal information.")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("Save Changes")}
                </Button>
              </CardFooter>
            </form>
          </Form>
>>>>>>> 068d3fff1ebaa035e444337644b56c698b9ce125
        </Card>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("Your Teacher Code")}</CardTitle>
              <CardDescription>{t("Students use this code to join your classroom.")}</CardDescription>
            </CardHeader>
            <CardContent>
                {teacherCode ? (
                  <div className="flex items-center gap-2">
                    <Input value={teacherCode} readOnly className="font-mono text-lg tracking-widest" />
                    <Button variant="outline" size="icon" onClick={handleCopyCode}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{t("Generating code...")}</p>
                )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>{t("App Settings")}</CardTitle>
              <CardDescription>{t("Configure application notifications.")}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between space-x-2 p-4 rounded-md border">
                    <Label htmlFor="notifications-toggle" className="flex flex-col space-y-1">
                        <span>{t("Email Notifications")}</span>
                        <span className="font-normal leading-snug text-muted-foreground">
                            {t("Receive updates and summaries via email.")}
                        </span>
                    </Label>
                    <Switch id="notifications-toggle" />
                </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
            <CardHeader>
            <CardTitle>{t("Help & Support")}</CardTitle>
            <CardDescription>{t("Find answers to your questions.")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                <Button variant="link" className="p-0 h-auto" asChild><Link href="#">{t("Frequently Asked Questions")}</Link></Button>
                <br />
                <Button variant="link" className="p-0 h-auto" asChild><Link href="#">{t("Tutorials")}</Link></Button>
                 <br />
                <Button variant="link" className="p-0 h-auto" asChild><Link href="#">{t("Send Feedback")}</Link></Button>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
            <CardTitle>{t("Legal & Privacy")}</CardTitle>
            <CardDescription>{t("Understand our policies.")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                <Button variant="link" className="p-0 h-auto" asChild><Link href="#">{t("Privacy Policy")}</Link></Button>
                 <br />
                <Button variant="link" className="p-0 h-auto" asChild><Link href="#">{t("Terms of Service")}</Link></Button>
                 <br />
                <Button variant="link" className="p-0 h-auto" asChild><Link href="#">{t("About Sahayak")}</Link></Button>
            </CardContent>
        </Card>
      </div>

    </div>
  )
}
