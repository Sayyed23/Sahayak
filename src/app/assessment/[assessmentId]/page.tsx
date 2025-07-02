
"use client"

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { Mic, Square, Play, Undo2, Loader2, AlertTriangle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useTranslation } from '@/hooks/use-translation'

const mockPassage = {
  id: "assessment1",
  title: "The Brave Little Ant",
  text: "The brave little ant was not afraid. He marched on, looking for food for his family. He saw a big, juicy leaf. It was much bigger than him, but he did not give up. He pulled and he tugged. Finally, he moved the leaf. He was very proud."
}

export default function TakeAssessmentPage({ params }: { params: { assessmentId: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useTranslation()
  
  const [isRecording, setIsRecording] = useState(false)
  const [audioURL, setAudioURL] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        setHasPermission(true)
        mediaRecorderRef.current = new MediaRecorder(stream)
        
        mediaRecorderRef.current.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data)
        }
        
        mediaRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
          const url = URL.createObjectURL(audioBlob)
          setAudioURL(url)
          audioChunksRef.current = []
        }
      })
      .catch(err => {
        console.error("Error accessing microphone:", err)
        setHasPermission(false)
        toast({
          title: t("Microphone Access Denied"),
          description: t("Please allow microphone access in your browser settings to record."),
          variant: "destructive"
        })
      })
  }, [toast, t])

  const startRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "inactive") {
      audioChunksRef.current = []
      mediaRecorderRef.current.start()
      setIsRecording(true)
      setAudioURL(null)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const handleRetake = () => {
    setAudioURL(null)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    // In a real app, you would upload the audio blob to a server
    // and call the analyzeReadingAssessment AI flow.
    toast({
      title: t("Submitting..."),
      description: t("Analyzing your reading performance.")
    })
    
    // Simulate network delay and AI processing
    setTimeout(() => {
      setIsSubmitting(false)
      toast({
        title: t("Assessment Submitted!"),
        description: t("Your teacher will review your submission soon.")
      })
      router.push('/dashboard/student')
    }, 3000)
  }

  if (hasPermission === false) {
    return (
        <div className="flex h-screen items-center justify-center">
            <Card className="max-w-lg">
                <CardHeader>
                    <CardTitle>{t("Microphone Access Required")}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>{t("Permission Denied")}</AlertTitle>
                        <AlertDescription>
                            {t("Sahayak needs access to your microphone to record your reading. Please enable it in your browser settings and refresh the page.")}
                        </AlertDescription>
                    </Alert>
                    <Button asChild className="mt-4 w-full">
                        <Link href="/dashboard/student">{t("Back to Dashboard")}</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
  }
  
  if (hasPermission === null) {
     return <div className="flex h-screen items-center justify-center">{t("Requesting microphone access...")}</div>
  }

  return (
    <div className="flex flex-col items-center p-4 md:p-8">
      <Card className="w-full max-w-3xl">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-3xl">{t("Read Aloud: {{title}}", { title: mockPassage.title })}</CardTitle>
          <CardDescription>{t("Read the passage below clearly. Tap the microphone when you are ready to start.")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-6 border rounded-lg bg-muted/50 text-lg leading-relaxed">
            {mockPassage.text}
          </div>

          <div className="flex flex-col items-center gap-4">
            {!audioURL && (
              <Button
                size="lg"
                className="rounded-full h-20 w-20"
                onClick={isRecording ? stopRecording : startRecording}
                variant={isRecording ? 'destructive' : 'default'}
              >
                {isRecording ? <Square className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
              </Button>
            )}
            <p className="text-muted-foreground">{isRecording ? t("Recording... Tap to stop.") : t("Tap the mic to start recording")}</p>
            
            {audioURL && (
              <div className="w-full space-y-4">
                <h3 className="text-center font-semibold">{t("Your Recording")}</h3>
                <audio src={audioURL} controls className="w-full" />
                <div className="flex justify-center gap-4">
                  <Button variant="outline" onClick={handleRetake} disabled={isSubmitting}>
                    <Undo2 className="mr-2 h-4 w-4" />
                    {t("Retake")}
                  </Button>
                  <Button onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {t("Submit")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
