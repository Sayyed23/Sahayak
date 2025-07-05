
'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/hooks/use-auth"
import { useTranslation } from "@/hooks/use-translation"
import { useState, useEffect } from "react"
import { db } from "@/lib/firebase"
import { doc, onSnapshot, updateDoc, getDoc } from "firebase/firestore"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function ProfilePage() {
  const { user } = useAuth()
  const { t, language, setLanguage } = useTranslation()
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  const [name, setName] = useState(user?.displayName || "")
  const [school, setSchool] = useState("")
  const [grade, setGrade] = useState("")
  const [teacherName, setTeacherName] = useState("")
  
  useEffect(() => {
    if (user && db) {
      const userRef = doc(db, "users", user.uid)
      const unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data()
          setName(data.name || "")
          setSchool(data.school || "")
          setGrade(data.grade || "")
          if (data.language && data.language !== language) {
            setLanguage(data.language);
          }
          if (data.teacherId) {
            const teacherRef = doc(db, "users", data.teacherId);
            getDoc(teacherRef).then(teacherSnap => {
              if (teacherSnap.exists()) {
                setTeacherName(teacherSnap.data().name);
              }
            })
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

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
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
        if(user.displayName !== name) {
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
    return <div>{t("Loading profile...")}</div>
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">{t("My Profile")}</h1>
        <p className="text-muted-foreground">{t("Manage your personal information.")}</p>
      </div>

      <Card>
        <form onSubmit={handleSaveChanges}>
            <CardHeader>
            <CardTitle>{t("Profile Details")}</CardTitle>
            <CardDescription>{t("Update your personal information.")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <Label htmlFor="grade">{t("Grade")}</Label>
                  <Select value={grade} onValueChange={setGrade}>
                    <SelectTrigger id="grade"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[...Array(10)].map((_, i) => (
                          <SelectItem key={i+1} value={`Grade ${i+1}`}>{t(`Grade ${i+1}`)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                <Label htmlFor="teacher">{t("My Teacher")}</Label>
                <Input id="teacher" value={teacherName} disabled />
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
            </div>
            <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("Save Changes")}
            </Button>
            </CardContent>
        </form>
      </Card>
    </div>
  )
}
