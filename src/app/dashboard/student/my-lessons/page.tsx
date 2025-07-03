
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, BookText, Image as ImageIcon, FileText, Gamepad2 } from "lucide-react"
import { useTranslation } from "@/hooks/use-translation"
import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { db } from "@/lib/firebase"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface Lesson {
  id: string
  title: string
  type: string
  assignedAt: string
  rawDate: Date
}

const getIconForType = (type: string) => {
    switch (type) {
        case 'Story':
        case 'Explanation':
            return <BookText className="h-6 w-6 text-primary" />;
        case 'Worksheet':
            return <FileText className="h-6 w-6 text-primary" />;
        case 'Visual':
            return <ImageIcon className="h-6 w-6 text-primary" />;
        case 'Quiz':
            return <Gamepad2 className="h-6 w-6 text-primary" />;
        default:
            return <BookOpen className="h-6 w-6 text-primary" />;
    }
};

export default function MyLessonsPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user || !db) return

    setIsLoading(true)
    const q = query(collection(db, "assignments"), where("studentId", "==", user.uid))
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedLessons: Lesson[] = snapshot.docs.map(doc => {
        const data = doc.data()
        const assignedAtDate = data.assignedAt?.toDate()
        return {
          id: doc.id,
          title: data.contentTitle,
          type: data.contentType,
          rawDate: assignedAtDate || new Date(0),
          assignedAt: assignedAtDate ? formatDistanceToNow(assignedAtDate, { addSuffix: true }) : t("Just now"),
        }
      })
      
      fetchedLessons.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime())
      setLessons(fetchedLessons)
      setIsLoading(false)
    }, (error) => {
      console.error("Error fetching lessons:", error)
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [user, t])

  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-3xl font-bold font-headline">{t("My Lessons")}</h1>
        <p className="text-muted-foreground">{t("Practice materials and lessons assigned by your teacher.")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("Assigned Materials")}</CardTitle>
          <CardDescription>{t("Click on any item to start practicing.")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <>
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </>
          ) : lessons.length > 0 ? (
            lessons.map(lesson => {
              const href = lesson.type === 'Quiz' ? `/play-quiz/${lesson.id}` : `/lesson/${lesson.id}`;
              return (
                <Link href={href} key={lesson.id} className="block">
                  <div className="flex items-center justify-between p-4 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        {getIconForType(lesson.type)}
                      </div>
                      <div>
                        <p className="font-semibold">{lesson.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {t(lesson.type)} - {t("Assigned {{date}}", { date: lesson.assignedAt })}
                        </p>
                      </div>
                    </div>
                    <Button variant="secondary" size="sm">{t(lesson.type === 'Quiz' ? 'Play' : 'View')}</Button>
                  </div>
                </Link>
              )
            })
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-8">
              <div className="mx-auto bg-primary/10 p-3 rounded-full mb-4">
                <BookOpen className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="font-headline text-2xl">{t("No Lessons Yet")}</CardTitle>
              <CardDescription className="mt-2">
                {t("This is where you'll find all your lessons assigned by your teacher.")}
              </CardDescription>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
