
'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { doc, getDoc, addDoc, collection, serverTimestamp, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useTranslation } from '@/hooks/use-translation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2, ArrowLeft, UploadCloud, CheckCircle, FileUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { marked } from 'marked'
import { useAuth } from '@/hooks/use-auth'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'

interface Assignment {
  contentId: string;
  contentTitle: string;
  contentType: string;
  teacherId: string;
}

interface Content {
  title: string;
  type: 'Story' | 'Explanation' | 'Worksheet' | 'Visual' | 'Game';
  content: string;
}

const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

export default function LessonViewerPage() {
  const params = useParams()
  const router = useRouter()
  const { t } = useTranslation()
  const { toast } = useToast()
  const { user } = useAuth()
  const lessonId = params.lessonId as string
  
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [content, setContent] = useState<Content | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [isCheckingSubmission, setIsCheckingSubmission] = useState(true)

  // State for worksheet submission
  const [submissionImage, setSubmissionImage] = useState<File | null>(null)
  const [submissionPreview, setSubmissionPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

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

          // If it's a game, redirect to the game player
          if (assignmentData.contentType === 'Game') {
            router.replace(`/play-quiz/${lessonId}`);
            return;
          }

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
  }, [lessonId, router])

  useEffect(() => {
    if (!user || !lessonId || !db) return;
    setIsCheckingSubmission(true);
    const q = query(collection(db, "submissions"), where("assignmentId", "==", lessonId), where("studentId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        setHasSubmitted(!snapshot.empty);
        setIsCheckingSubmission(false);
    });
    return () => unsubscribe();
  }, [user, lessonId, db]);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSubmissionImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setSubmissionPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmitWorksheet = async () => {
    if (!submissionImage || !user || !assignment || !content) return;

    setIsSubmitting(true);
    try {
        const imageDataUri = await blobToBase64(submissionImage);
        
        await addDoc(collection(db, "submissions"), {
            studentId: user.uid,
            studentName: user.displayName,
            assignmentId: lessonId,
            passageTitle: content.title,
            teacherId: assignment.teacherId,
            submittedAt: serverTimestamp(),
            submissionType: 'worksheet',
            submissionImageUrl: imageDataUri,
            status: 'pending_review',
        });

        toast({
            title: t("Assignment Submitted!"),
            description: t("Your teacher has been notified and will review your submission."),
        });
        setHasSubmitted(true); // Update UI immediately
    } catch (error) {
        console.error("Error submitting worksheet:", error);
        toast({
            title: t("Submission Failed"),
            description: t("There was an error submitting your worksheet. Please try again."),
            variant: "destructive",
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  if (isLoading || isCheckingSubmission) {
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

  const renderWorksheetSubmission = () => {
    if (hasSubmitted) {
        return (
            <Card className="mt-6 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
                <CardHeader className="text-center">
                    <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-500 mx-auto" />
                    <CardTitle>{t("Assignment Submitted")}</CardTitle>
                    <CardDescription>{t("Your teacher will review your work soon.")}</CardDescription>
                </CardHeader>
            </Card>
        )
    }

    return (
        <Card className="mt-6">
            <CardHeader>
                <CardTitle>{t("Submit Your Work")}</CardTitle>
                <CardDescription>{t("Upload a photo of your completed worksheet.")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-center w-full">
                    <label htmlFor="worksheet-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-accent hover:bg-muted">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">{t("Click to upload")}</span></p>
                            <p className="text-xs text-muted-foreground">{t("PNG, JPG, or JPEG")}</p>
                        </div>
                        <Input id="worksheet-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                </div>
                {submissionPreview && (
                    <div>
                        <p className="text-sm font-medium mb-2">{t("Preview:")}</p>
                        <Image src={submissionPreview} alt="Submission preview" width={200} height={200} className="rounded-md border" />
                    </div>
                )}
                <Button className="w-full" onClick={handleSubmitWorksheet} disabled={!submissionImage || isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}
                    {t("Submit Assignment")}
                </Button>
            </CardContent>
        </Card>
    );
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
             <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: marked(content.content) as string }} />
          ) : (
            <p className="whitespace-pre-wrap leading-relaxed">
              {content.content}
            </p>
          )}
        </CardContent>
      </Card>

      {content.type === 'Worksheet' && renderWorksheetSubmission()}
    </div>
  )
}
