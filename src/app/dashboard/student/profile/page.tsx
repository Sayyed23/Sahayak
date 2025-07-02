
'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/hooks/use-auth"
import { useTranslation } from "@/hooks/use-translation"

export default function ProfilePage() {
  const { user } = useAuth()
  const { t, language, setLanguage } = useTranslation()

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
        <CardHeader>
          <CardTitle>{t("Profile Details")}</CardTitle>
          <CardDescription>{t("Update your personal information.")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Label htmlFor="grade">{t("Grade")}</Label>
              <Input id="grade" defaultValue="5th" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">{t("Language Preference")}</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger id="language"><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="hindi">Hindi</SelectItem>
                    <SelectItem value="bengali">Bengali</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button>{t("Save Changes")}</Button>
        </CardContent>
      </Card>
    </div>
  )
}
