
'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ArrowRight, BookText, FileText, HelpCircle, PencilRuler } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { useTranslation } from "@/hooks/use-translation"

const quickAccessItems = [
  { title: "Start Lesson", href: "/dashboard/student/my-lessons", icon: PencilRuler, description: "Jump into your next lesson." },
  { title: "Ask a Question", href: "/dashboard/student/ask-a-question", icon: HelpCircle, description: "Get help with any topic." },
  { title: "Review Notes", href: "#", icon: BookText, description: "Look over your saved notes." },
  { title: "View Assignments", href: "#", icon: FileText, description: "Check your upcoming tasks." },
]

const assignments = [
  { title: "Reading: The Brave Little Ant", due: "Due Today", href: "/assessment/1" },
  { title: "Science: Chapter 3 Questions", due: "Due Tomorrow", href: "#" },
  { title: "Math: Addition Worksheet", due: "Due in 3 days", href: "#" },
  { title: "Hindi: Reading Practice", due: "Due next week", href: "#" },
]

export default function StudentDashboardPage() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const name = user?.displayName?.split(' ')[0] || t('Student')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">{t("Good Morning, {{name}}!", { name })}</h1>
        <p className="text-muted-foreground">{t("Ready for a new day of learning?")}</p>
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
                <Link href={item.href}>{t("Start")} <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("Upcoming Assignments")}</CardTitle>
            <CardDescription>{t("Don't forget to complete these tasks.")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {assignments.map((task, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-accent">
                      <div>
                          <p className="text-sm font-medium leading-none">{t(task.title)}</p>
                          <p className="text-xs text-muted-foreground">{t(task.due)}</p>
                      </div>
                      <Button asChild variant="secondary" size="sm">
                        <Link href={task.href || '#'}>{t("View")}</Link>
                      </Button>
                  </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("Learning Progress")}</CardTitle>
            <CardDescription>{t("See how you're doing in your subjects.")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
                <div className="flex justify-between items-baseline">
                    <p className="text-sm font-medium">{t("Science")}</p>
                    <p className="text-sm text-muted-foreground">80%</p>
                </div>
                <Progress value={80} />
            </div>
            <div className="space-y-1">
                <div className="flex justify-between items-baseline">
                    <p className="text-sm font-medium">{t("Mathematics")}</p>
                    <p className="text-sm text-muted-foreground">65%</p>
                </div>
                <Progress value={65} />
            </div>
            <div className="space-y-1">
                <div className="flex justify-between items-baseline">
                    <p className="text-sm font-medium">{t("English")}</p>
                    <p className="text-sm text-muted-foreground">92%</p>
                </div>
                <Progress value={92} />
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("Feedback from your Teacher")}</CardTitle>
          <CardDescription>{t("Personalized tips to help you improve.")}</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="p-4 bg-primary/10 rounded-lg">
                <p className="text-sm font-medium">{t("\"Great work on the last math worksheet! Try to double-check your subtraction. You're doing an amazing job!\"")}</p>
            </div>
        </CardContent>
      </Card>
    </div>
  )
}
