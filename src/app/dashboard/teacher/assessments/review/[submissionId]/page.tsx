
"use client"

import { useState, useEffect } from "react"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Download, Ear, Gauge, Loader2, Play, Send } from "lucide-react"
import Link from "next/link"
import { marked } from "marked"
import { useTranslation } from "@/hooks/use-translation"
import { db } from "@/lib/firebase"
import { AnalyzeReadingAssessmentOutput } from "@/ai/flows/analyze-reading-assessment"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface SubmissionReport {
  studentName: string
  passageTitle: string
  dateSubmitted: string
  report: AnalyzeReadingAssessmentOutput
  audioUrl: string
}

// Custom renderer for marked to handle markdown from AI
const renderer = new marked.Renderer();
renderer.strong = (text) => `<strong class="bg-destructive/20 text-destructive rounded-sm px-1">${text}</strong>`; // Mispronunciation/Substitution
renderer.del = (text) => `<del class="bg-red-500/20 text-red-600 rounded-sm px-1">${text}</del>`; // Omission
renderer.em = (text) => `<em class="bg-green-500/20 text-green-700 rounded-sm px-1">${text}</em>`; // Insertion

export default function ReviewAssessmentPage({ params }: { params: { submissionId: string } }) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const router = useRouter()
  
  const [report, setReport] = useState<SubmissionReport | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [feedback, setFeedback] = useState("")
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false)

  useEffect(() => {
    if (!db || !params.submissionId) return

    const fetchSubmission = async () => {
      setIsLoading(true)
      const submissionRef = doc(db, "submissions", params.submissionId)
      const submissionSnap = await getDoc(submissionRef)

      if (submissionSnap.exists()) {
        const data = submissionSnap.data()
        setReport({
          studentName: data.studentName,
          passageTitle: data.passageTitle,
          dateSubmitted: data.submittedAt.toDate().toLocaleDateString(),
          report: data.report,
          audioUrl: data.audioUrl,
        })
      } else {
        toast({ title: t("Submission not found"), variant: "destructive" })
        router.push("/dashboard/teacher/assessments")
      }
      setIsLoading(false)
    }

    fetchSubmission()
  }, [db, params.submissionId, t, toast, router])
  
  const handleFeedbackSubmit = async () => {
    if (!feedback) {
        toast({ title: t("Please write some feedback first."), variant: "destructive" });
        return;
    }
    setIsSubmittingFeedback(true);
    // In a real app, you would save this feedback to the submission document
    // and notify the student.
    const submissionRef = doc(db, "submissions", params.submissionId);
    try {
        await updateDoc(submissionRef, {
            teacherFeedback: feedback,
            status: 'reviewed'
        });
        toast({ title: t("Feedback Sent!"), description: t("The student has been notified.") });
        router.push("/dashboard/teacher/assessments");
    } catch (error) {
        console.error("Failed to submit feedback", error);
        toast({ title: t("Error"), description: t("Could not send feedback. Please try again."), variant: "destructive" });
    } finally {
        setIsSubmittingFeedback(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!report) {
    return null; // Or show a not found message
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard/teacher/assessments" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary">
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t("Back to Assessments")}
      </Link>

      <div>
        <h1 className="text-3xl font-bold font-headline">{report.studentName} - {t("Reading Report")}</h1>
        <p className="text-muted-foreground">
          {t("Assessed on")}: <span className="font-medium">{report.passageTitle}</span> | {t("Submitted")}: {report.dateSubmitted}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("Passage with AI-Detected Errors")}</CardTitle>
              <CardDescription>{t("Listen to the audio and see where the student struggled.")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <Button size="icon" disabled><Play /></Button>
                   <div className="w-full text-sm text-muted-foreground">{t("Audio playback coming soon.")}</div>
                </div>
                <div 
                  className="p-4 border rounded-lg prose prose-lg max-w-none bg-muted/30"
                  dangerouslySetInnerHTML={{ __html: marked(report.report.gradedText, { renderer }) }}
                >
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t("Provide Feedback")}</CardTitle>
              <CardDescription>{t("Write a short note for the student to help them improve.")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea 
                placeholder={t("Great job, {{name}}! Try to focus on the 'a' sound in words like 'ant'. Keep practicing!", { name: report.studentName.split(' ')[0] })} 
                rows={4}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                disabled={isSubmittingFeedback}
              />
              <Button onClick={handleFeedbackSubmit} disabled={isSubmittingFeedback}>
                {isSubmittingFeedback ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                {t("Submit Feedback")}
              </Button>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("Performance Summary")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-md bg-accent">
                <div className="flex items-center gap-3">
                  <Gauge className="text-primary h-6 w-6" />
                  <span className="font-medium">{t("Fluency (WPM)")}</span>
                </div>
                <span className="text-2xl font-bold">{report.report.fluencyWPM}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-md bg-accent">
                <div className="flex items-center gap-3">
                  <Ear className="text-primary h-6 w-6" />
                  <span className="font-medium">{t("Accuracy")}</span>
                </div>
                <span className="text-2xl font-bold">{report.report.accuracyPercentage}%</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t("Error Details")}</CardTitle>
            </CardHeader>
            <CardContent>
              {report.report.errors.length > 0 ? (
                <ul className="space-y-2 text-sm">
                  {report.report.errors.map((error, index) => (
                    <li key={index} className="flex items-center justify-between capitalize">
                      <span>{error.word}</span>
                      <Badge variant={error.errorType === 'omission' ? 'destructive' : 'secondary'}>{t(error.errorType)}</Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                 <p className="text-sm text-center text-muted-foreground">{t("No errors detected. Great job!")}</p>
              )}
            </CardContent>
          </Card>
           <Button variant="outline" className="w-full" disabled>
            <Download className="mr-2 h-4 w-4" /> {t("Download Report")}
          </Button>
        </div>
      </div>
    </div>
  )
}
