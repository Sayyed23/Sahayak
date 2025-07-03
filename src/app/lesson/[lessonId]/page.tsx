
'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useTranslation } from '@/hooks/use-translation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { marked } from 'marked'

interface Assignment {
  contentId: string;
  contentTitle: string;
  contentType: string;
}

interface Content {
  title: string;
  type: 'Story' | 'Explanation' | 'Worksheet' | 'Visual';
  content: string;
}

export default function LessonViewerPage() {
  const params = useParams()
  const router = useRouter()
  const { t } = useTranslation()
  const lessonId = params.lessonId as string
  
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [content, setContent] = useState<Content | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!lessonId || !db) return

    const fetchLesson = async () => {
      setIsLoading(true)
      try {
        const assignmentRef = doc(db, 'assignments', lessonId)
        const assignmentSnap = await getDoc(assignmentRef)

        if (assignmentSnap.exists()) {
          const assignmentData = assignmentSnap.data() as Assignment
          setAssignment(assignmentData)

          const contentRef = doc(db, 'content', assignmentData.contentId)
          const contentSnap = await getDoc(contentRef)

          if (contentSnap.exists()) {
            setContent(contentSnap.data() as Content)
          } else {
             throw new Error("Content not found")
          }
        } else {
            throw new Error("Assignment not found")
        }
      } catch (error) {
        console.error("Error fetching lesson:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLesson()
  }, [lessonId])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!assignment || !content) {
    return (
      <div className="flex h-screen items-center justify-center text-center">
        <div>
          <h2 className="text-2xl font-bold">{t("Lesson Not Found")}</h2>
          <p className="text-muted-foreground">{t("This lesson may have been removed or is unavailable.")}</p>
          <Button onClick={() => router.back()} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> {t("Go Back")}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t("Back to My Lessons")}
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl">{t(content.title)}</CardTitle>
          <CardDescription>{t(content.type)}</CardDescription>
        </CardHeader>
        <CardContent>
          {content.type === 'Visual' ? (
            <div className="flex justify-center">
              <Image src={content.content} alt={content.title} width={800} height={600} className="rounded-lg border" />
            </div>
          ) : content.type === 'Worksheet' ? (
             <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: marked(content.content) as string }} />
          ) : (
            <p className="whitespace-pre-wrap leading-relaxed">
              {content.content}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
