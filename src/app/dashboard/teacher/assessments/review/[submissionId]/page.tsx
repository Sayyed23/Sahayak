
"use client"

import { useState, useEffect, useRef } from "react"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Download, Ear, FileWarning, Gauge, Loader2, Pause, Play, Send } from "lucide-react"
import Link from "next/link"
import { useTranslation } from "@/hooks/use-translation"
import { db } from "@/lib/firebase"
import { AnalyzeReadingAssessmentOutput } from "@/ai/flows/analyze-reading-assessment"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { useRouter, useParams } from "next/navigation"
import React from "react"
<<<<<<< HEAD
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
=======
import Image from "next/image"
>>>>>>> 1d3e53a0853ff1235dc4d7644646c721a1f63dbd

interface SubmissionReport {
  studentName: string
  passageTitle: string
  dateSubmitted: string
  submissionType: 'reading' | 'worksheet';
  status: 'pending_review' | 'reviewed';
  report?: AnalyzeReadingAssessmentOutput
  audioUrl?: string
  submissionImageUrl?: string
}

const getWordClassName = (status: string, isActive: boolean) => {
  let baseClasses = "px-1 rounded-sm transition-colors duration-150";
  if (isActive) baseClasses += " bg-primary/30";

  switch (status) {
    case "mispronunciation":
    case "substitution":
      return cn(baseClasses, "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300");
    case "omission":
      return cn(baseClasses, "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 line-through");
    case "insertion":
      return cn(baseClasses, "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 no-underline italic");
    case "correct":
      return cn(baseClasses, isActive ? "bg-primary/30" : "bg-transparent");
    default:
      return baseClasses;
  }
};

const getTooltipContent = (wordData: AnalyzeReadingAssessmentOutput['analysis'][0], t: (text: string, placeholders?: Record<string, string | number>) => string): string => {
    switch(wordData.status) {
        case "mispronunciation":
            return t("Mispronounced. Spoken: '{{spoken}}'", { spoken: wordData.spokenWord || "" });
        case "substitution":
            return t("Substituted '{{expected}}' with '{{spoken}}'", { expected: wordData.word, spoken: wordData.spokenWord || ""});
        case "insertion":
            return t("Inserted '{{word}}'", { word: wordData.word });
        case "omission":
            return t("Omitted '{{word}}'", { word: wordData.word });
        default:
            return "";
    }
}

const formatErrorDetail = (error: AnalyzeReadingAssessmentOutput['analysis'][0], t: (text: string, placeholders?: Record<string, string | number>) => string) => {
    switch (error.status) {
        case 'substitution':
            return <p>{t("Substituted")} <strong className="font-semibold">"{error.word}"</strong> {t("with")} <strong className="font-semibold text-destructive">"{error.spokenWord}"</strong></p>;
        case 'mispronunciation':
            return <p>{t("Mispronounced")} <strong className="font-semibold">"{error.word}"</strong> {t("as")} <strong className="font-semibold text-destructive">"{error.spokenWord}"</strong></p>;
        case 'omission':
            return <p>{t("Omitted")} <strong className="font-semibold text-destructive">"{error.word}"</strong></p>;
        case 'insertion':
            return <p>{t("Inserted")} <strong className="font-semibold text-green-700">"{error.word}"</strong></p>;
        default:
            return null;
    }
}


export default function ReviewAssessmentPage() {
  const params = useParams()
  const submissionId = params.submissionId as string
  const { t } = useTranslation()
  const { toast } = useToast()
  const router = useRouter()
  
  const [report, setReport] = useState<SubmissionReport | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [feedback, setFeedback] = useState("")
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false)
  
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [activeWordIndex, setActiveWordIndex] = useState(-1)

  useEffect(() => {
    if (!db || !submissionId) return

    const fetchSubmission = async () => {
      setIsLoading(true)
      const submissionRef = doc(db, "submissions", submissionId)
      const submissionSnap = await getDoc(submissionRef)

      if (submissionSnap.exists()) {
        const data = submissionSnap.data()
        setReport({
          studentName: data.studentName,
          passageTitle: data.passageTitle,
          dateSubmitted: data.submittedAt.toDate().toLocaleDateString(),
          submissionType: data.submissionType || 'reading',
          status: data.status,
          report: data.report,
          audioUrl: data.audioUrl,
          submissionImageUrl: data.submissionImageUrl,
        })
      } else {
        toast({ title: t("Submission not found"), variant: "destructive" })
        router.push("/dashboard/teacher/assessments")
      }
      setIsLoading(false)
    }

    fetchSubmission()
  }, [db, submissionId, t, toast, router])
  
  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleEnded = () => {
    setIsPlaying(false)
  }

  useEffect(() => {
    const audio = audioRef.current
    if (audio && report?.submissionType === 'reading') {
      audio.addEventListener('timeupdate', handleTimeUpdate)
      audio.addEventListener('ended', handleEnded)
      audio.addEventListener('play', () => setIsPlaying(true))
      audio.addEventListener('pause', () => setIsPlaying(false))

      if (report?.audioUrl && audio.src !== report.audioUrl) {
        audio.src = report.audioUrl;
      }

      return () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate)
        audio.removeEventListener('ended', handleEnded)
        audio.removeEventListener('play', () => setIsPlaying(true))
        audio.removeEventListener('pause', () => setIsPlaying(false))
      }
    }
  }, [report])
  
  useEffect(() => {
    if (report?.report?.analysis && report.submissionType === 'reading') {
      const activeIndex = report.report.analysis.findIndex(word => 
        word.startTime !== undefined && word.endTime !== undefined && 
        currentTime >= word.startTime && currentTime < word.endTime
      )
      setActiveWordIndex(activeIndex)
    }
  }, [currentTime, report])


  const handleFeedbackSubmit = async () => {
    if (!feedback) {
        toast({ title: t("Please write some feedback first."), variant: "destructive" });
        return;
    }
    setIsSubmittingFeedback(true);
    const submissionRef = doc(db, "submissions", submissionId);
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
  
  const errors = report?.report?.analysis?.filter(word => word.status !== 'correct') || [];

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!report) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard/teacher/assessments" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary">
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t("Back to Assessments")}
      </Link>

      <div>
        <h1 className="text-3xl font-bold font-headline">{report.studentName} - {report.submissionType === 'worksheet' ? t("Worksheet Review") : t("Reading Report")}</h1>
        <p className="text-muted-foreground">
          {t("Assessed on")}: <span className="font-medium">{report.passageTitle}</span> | {t("Submitted")}: {report.dateSubmitted}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
<<<<<<< HEAD
              <CardTitle>{t("Passage with AI-Detected Errors")}</CardTitle>
              <CardDescription>{t("Hover over highlighted words for details. Play the audio to follow along.")}</CardDescription>
=======
              <CardTitle>{report.submissionType === 'worksheet' ? t("Submitted Worksheet") : t("Passage with AI-Detected Errors")}</CardTitle>
              <CardDescription>{report.submissionType === 'worksheet' ? t("Review the student's uploaded work.") : t("Listen to the audio and see where the student struggled.")}</CardDescription>
>>>>>>> 1d3e53a0853ff1235dc4d7644646c721a1f63dbd
            </CardHeader>
            <CardContent>
              {report.submissionType === 'reading' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 border rounded-lg">
                    <Button size="icon" onClick={handlePlayPause} disabled={!report.audioUrl}>
                      {isPlaying ? <Pause /> : <Play />}
                    </Button>
                    <div className="w-full">
                      {report.audioUrl ? (
                        <audio ref={audioRef} src={report.audioUrl} preload="metadata" />
                      ) : (
                        <p className="text-sm text-muted-foreground">{t("Audio for this submission is not available.")}</p>
                      )}
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div className="bg-primary h-full" style={{ width: `${(currentTime / (audioRef.current?.duration || 1)) * 100}%` }}/>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg bg-muted/30 text-base md:text-lg leading-relaxed">
                    {report.report && report.report.analysis ? report.report.analysis.map((wordData, index) => {
                        const isActive = index === activeWordIndex;
                        let displayWord = wordData.word;
                        let className = "px-1 rounded-sm transition-colors duration-150";

                        if (wordData.status === "mispronunciation" || wordData.status === "substitution") {
                            displayWord = wordData.spokenWord || wordData.word;
                            className += " bg-destructive/20 text-destructive";
                        } else if (wordData.status === "omission") {
                            className += " bg-red-500/20 text-red-600 line-through";
                        } else if (wordData.status === "insertion") {
                            className += " bg-green-500/20 text-green-700 italic";
                        }

                        if (isActive) {
                            className += " bg-primary/30";
                        }
                        
                        return (
                            <span key={index} className={className}>{displayWord}</span>
                        );
                    }).reduce((prev, curr) => [prev, ' ', curr] as any) : (
                      <p className="text-sm text-muted-foreground">{t("No analysis data available.")}</p>
                    )}
                  </div>
                </div>
<<<<<<< HEAD
                <div className="p-4 border rounded-lg bg-muted/30 text-lg leading-relaxed">
                  <TooltipProvider>
                    {report.report.analysis ? report.report.analysis.map((wordData, index) => {
                      const isActive = index === activeWordIndex;
                      const isError = wordData.status !== 'correct';
                      let displayWord = wordData.status === 'substitution' ? wordData.spokenWord : wordData.word;
                      
                      const wordElement = (
                        <span className={getWordClassName(wordData.status, isActive)}>
                          {displayWord}
                        </span>
                      );

                      if (isError) {
                        return (
                          <React.Fragment key={index}>
                            <Tooltip>
                              <TooltipTrigger asChild>{wordElement}</TooltipTrigger>
                              <TooltipContent><p>{getTooltipContent(wordData, t)}</p></TooltipContent>
                            </Tooltip>
                            {' '}
                          </React.Fragment>
                        );
                      }
                      
                      return (
                        <span key={index}>{wordData.word}{' '}</span>
                      );
                   }) : (
                    <p className="text-sm text-muted-foreground">{t("No analysis data available.")}</p>
                   )}
                  </TooltipProvider>
=======
              )}
              {report.submissionType === 'worksheet' && (
                <div className="flex justify-center p-4 border rounded-lg bg-muted/30">
                  {report.submissionImageUrl ? (
                    <Image src={report.submissionImageUrl} alt={t("Submitted worksheet")} width={800} height={1100} className="rounded-md w-full h-auto object-contain" />
                  ) : (
                    <p>{t("Image not available for this submission.")}</p>
                  )}
>>>>>>> 1d3e53a0853ff1235dc4d7644646c721a1f63dbd
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t("Provide Feedback")}</CardTitle>
              <CardDescription>{t("Write a short note for the student to help them improve.")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea 
                placeholder={t("Great job, {{name}}! Keep up the good work.", { name: report.studentName.split(' ')[0] })} 
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
<<<<<<< HEAD
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
                <span className="text-2xl font-bold">{report.report.fluencyWPM ?? 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-md bg-accent">
                <div className="flex items-center gap-3">
                  <Ear className="text-primary h-6 w-6" />
                  <span className="font-medium">{t("Accuracy")}</span>
                </div>
                <span className="text-2xl font-bold">{report.report.accuracyPercentage?.toFixed(1) ?? 'N/A'}%</span>
              </div>
              {report.report.errorSummary && (
                <div className="space-y-2 pt-2 text-sm">
                  <h4 className="font-semibold">{t("Error Breakdown")}</h4>
                  <ul className="list-disc list-inside text-muted-foreground">
                    <li>{t("Substitutions")}: {report.report.errorSummary.substitutions}</li>
                    <li>{t("Mispronunciations")}: {report.report.errorSummary.mispronunciations}</li>
                    <li>{t("Omissions")}: {report.report.errorSummary.omissions}</li>
                    <li>{t("Insertions")}: {report.report.errorSummary.insertions}</li>
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileWarning className="h-5 w-5"/>{t("Error Details")}</CardTitle>
            </CardHeader>
            <CardContent>
              {errors.length > 0 ? (
                <ul className="space-y-3 text-sm">
                  {errors.map((error, index) => (
                    <li key={index} className="flex items-center justify-between capitalize border-b pb-2">
                      {formatErrorDetail(error, t)}
                    </li>
                  ))}
                </ul>
              ) : (
                 <p className="text-sm text-center text-muted-foreground">{t("No errors detected. Great job!")}</p>
              )}
            </CardContent>
          </Card>
=======
          {report.submissionType === 'reading' && report.report && (
            <>
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
                    <span className="text-2xl font-bold">{report.report.accuracyPercentage.toFixed(2)}%</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>{t("Error Details")}</CardTitle>
                </CardHeader>
                <CardContent>
                  {errors.length > 0 ? (
                    <ul className="space-y-2 text-sm">
                      {errors.map((error, index) => (
                        <li key={index} className="flex items-center justify-between capitalize">
                          <span>{error.status === 'substitution' || error.status === 'mispronunciation' ? error.spokenWord : error.word}</span>
                          <Badge variant={error.status === 'omission' ? 'destructive' : 'secondary'}>{t(error.status)}</Badge>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-center text-muted-foreground">{t("No errors detected. Great job!")}</p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
>>>>>>> 1d3e53a0853ff1235dc4d7644646c721a1f63dbd
           <Button variant="outline" className="w-full" disabled>
            <Download className="mr-2 h-4 w-4" /> {t("Download Report")}
          </Button>
        </div>
      </div>
    </div>
  )
}
