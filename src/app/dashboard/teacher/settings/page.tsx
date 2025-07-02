'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/hooks/use-auth"
import Link from "next/link"

export default function SettingsPage() {
  const { user } = useAuth()

  if (!user) {
    return <div>Loading settings...</div>
  }
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Settings</h1>
        <p className="text-muted-foreground">Manage your account and application preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Profile</CardTitle>
          <CardDescription>Update your personal information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" defaultValue={user.displayName || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue={user.email || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="school">School</Label>
              <Input id="school" defaultValue="Govt. Model School" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">Language Preference</Label>
              <Select defaultValue="hindi">
                <SelectTrigger id="language"><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="hindi">Hindi</SelectItem>
                    <SelectItem value="bengali">Bengali</SelectItem>
                    <SelectItem value="marathi">Marathi</SelectItem>
                    <SelectItem value="telugu">Telugu</SelectItem>
                    <SelectItem value="tamil">Tamil</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button>Save Changes</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>App Settings</CardTitle>
          <CardDescription>Configure application notifications.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex items-center justify-between space-x-2 p-4 rounded-md border">
                <Label htmlFor="notifications-toggle" className="flex flex-col space-y-1">
                    <span>Email Notifications</span>
                    <span className="font-normal leading-snug text-muted-foreground">
                        Receive updates and summaries via email.
                    </span>
                </Label>
                <Switch id="notifications-toggle" />
            </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
            <CardHeader>
            <CardTitle>Help & Support</CardTitle>
            <CardDescription>Find answers to your questions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                <Button variant="link" className="p-0 h-auto" asChild><Link href="#">Frequently Asked Questions</Link></Button>
                <br />
                <Button variant="link" className="p-0 h-auto" asChild><Link href="#">Tutorials</Link></Button>
                 <br />
                <Button variant="link" className="p-0 h-auto" asChild><Link href="#">Send Feedback</Link></Button>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
            <CardTitle>Legal & Privacy</CardTitle>
            <CardDescription>Understand our policies.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                <Button variant="link" className="p-0 h-auto" asChild><Link href="#">Privacy Policy</Link></Button>
                 <br />
                <Button variant="link" className="p-0 h-auto" asChild><Link href="#">Terms of Service</Link></Button>
                 <br />
                <Button variant="link" className="p-0 h-auto" asChild><Link href="#">About Sahayak</Link></Button>
            </CardContent>
        </Card>
      </div>

    </div>
  )
}
