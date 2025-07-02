
'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/hooks/use-auth"
import Link from "next/link"
import { useState, useEffect } from "react"
import { db } from "@/lib/firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { Copy } from "lucide-react"
import { useTranslation } from "@/hooks/use-translation"

export default function SettingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { t, language, setLanguage } = useTranslation()
  const [teacherCode, setTeacherCode] = useState("")

  function generateTeacherCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  useEffect(() => {
    if (user && db) {
      const fetchTeacherCode = async () => {
        const teacherRef = doc(db, "users", user.uid)
        const teacherSnap = await getDoc(teacherRef)
        if (teacherSnap.exists()) {
          let code = teacherSnap.data().teacherCode
          if (!code) {
            code = generateTeacherCode()
            await updateDoc(teacherRef, { teacherCode: code })
          }
          setTeacherCode(code)
        }
      }
      fetchTeacherCode()
    }
  }, [user])

  const handleCopyCode = () => {
    navigator.clipboard.writeText(teacherCode)
    toast({
      title: t("Copied!"),
      description: t("Teacher code copied to clipboard."),
    })
  }

  if (!user) {
    return <div>{t("Loading settings...")}</div>
  }
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">{t("Settings")}</h1>
        <p className="text-muted-foreground">{t("Manage your account and application preferences.")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("My Profile")}</CardTitle>
            <CardDescription>{t("Update your personal information.")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("Name")}</Label>
              <Input id="name" defaultValue={user.displayName || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("Email")}</Label>
              <Input id="email" type="email" defaultValue={user.email || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="school">{t("School")}</Label>
              <Input id="school" defaultValue="Govt. Model School" />
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
            <Button>{t("Save Changes")}</Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("Your Teacher Code")}</CardTitle>
              <CardDescription>{t("Students can use this code to join your classroom when they sign up.")}</CardDescription>
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
