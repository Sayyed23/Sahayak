
'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowRight, BookText, FileText, HelpCircle, Image as ImageIcon } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { useTranslation } from "@/hooks/use-translation"

const quickAccessItems = [
  { title: "Generate Story", href: "/dashboard/teacher/create-content", icon: BookText, description: "Create a hyper-local story." },
  { title: "Create Worksheet", href: "/dashboard/teacher/create-content", icon: FileText, description: "From a textbook image." },
  { title: "Ask a Question", href: "/ask-a-question", icon: HelpCircle, description: "Get instant explanations." },
  { title: "Design Visual Aid", href: "/dashboard/teacher/create-content", icon: ImageIcon, description: "Generate a custom visual." },
]

const recentActivities = [
    { title: "Generated 'The Clever Crow' Story", time: "2 hours ago" },
    { title: "Created Math Worksheet for Grade 3", time: "1 day ago" },
    { title: "Saved a visual for Photosynthesis", time: "2 days ago" },
    { title: "Asked about Newton's Third Law", time: "3 days ago" },
]

export default function TeacherDashboardPage() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const name = user?.displayName?.split(' ')[0] || t('Teacher')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">{t('Good Morning, {{name}}!', { name })}</h1>
        <p className="text-muted-foreground">{t("Here's your dashboard to kickstart the day.")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {quickAccessItems.map((item) => (
          <Card key={item.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t(item.title)}</CardTitle>
              <item.icon className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-4">{t(item.description)}</p>
              <Button asChild variant="outline" size="sm">
                <Link href={item.href}>{t("Go")} <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("Recent Activities")}</CardTitle>
            <CardDescription>{t("A log of your recent actions in the app.")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
                <div className="space-y-4">
                    {recentActivities.map((activity, index) => (
                        <div key={index} className="flex items-center">
                            <div className="flex-1 space-y-1">
                                <p className="text-sm font-medium leading-none">{t(activity.title)}</p>
                                <p className="text-xs text-muted-foreground">{t(activity.time)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("Announcements & Tips")}</CardTitle>
            <CardDescription>{t("Updates and pedagogical tips.")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-lg bg-primary/10">
                <h4 className="font-semibold mb-1">{t("New Feature: Audio Conversion")}</h4>
                <p className="text-sm text-muted-foreground">{t("You can now convert any generated text into audio for your students!")}</p>
            </div>
            <div className="p-3 rounded-lg bg-accent">
                <h4 className="font-semibold mb-1">{t("Tip of the Day")}</h4>
                <p className="text-sm text-muted-foreground">{t("Use visual aids to explain complex topics. It boosts retention by 65%.")}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
