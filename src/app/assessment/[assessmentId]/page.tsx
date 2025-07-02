
"use client"

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { Mic, Square, Loader2, AlertTriangle, Undo2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useTranslation } from '@/hooks/use-translation'
import { doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from '@/hooks/use-auth'
import { Skeleton } from '@/components/ui/skeleton'
import { analyzeReadingAssessment } from '@/ai/flows/analyze-reading-assessment'

interface Passage {
  id: string;
  title: string;
  text: string;
  teacherId: string;
}

const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

export default function TakeAssessmentPage({ params }: { params: { assessmentId: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useTranslation()
  const { user } = useAuth()
  
  const [passage, setPassage] = useState<Passage | null>(null)
  const [isLoadingPassage, setIsLoadingPassage] = useState(true)
  const [isRecording, setIsRecording] = useState(false)
  const [audioURL, setAudioURL] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  
  useEffect(() => {
    if (!db || !params.assessmentId) return;

    const fetchPassage = async () => {
        setIsLoadingPassage(true);
        const docRef = doc(db, "assessments", params.assessmentId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            setPassage({
                id: docSnap.id,
                title: data.title,
                text: data.passage,
                teacherId: data.teacherId,
            });
        } else {
            console.error("No such assessment!");
            toast({
                title: t("Assessment not found"),
                variant: "destructive",
            });
            router.push('/dashboard/student');
        }
        setIsLoadingPassage(false);
    };

    fetchPassage();
  }, [db, params.assessmentId, toast, t, router]);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        setHasPermission(true)
        mediaRecorderRef.current = new MediaRecorder(stream)
        
        mediaRecorderRef.current.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data)
        }
        
        mediaRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
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
    if (!audioURL || !passage || !user || !db) return

    setIsSubmitting(true)
    toast({
      title: t("Submitting..."),
      description: t("Analyzing your reading performance. This may take a moment."),
    })

    try {
        const audioBlob = await fetch(audioURL).then(r => r.blob());
        const audioDataUri = await blobToBase64(audioBlob);

        const analysisResult = await analyzeReadingAssessment({
            passageText: passage.text,
            audioDataUri: audioDataUri,
        });
        
        await addDoc(collection(db, "submissions"), {
            studentId: user.uid,
            studentName: user.displayName,
            assessmentId: passage.id,
            passageTitle: passage.title,
            teacherId: passage.teacherId,
            submittedAt: serverTimestamp(),
            report: analysisResult,
            audioUrl: '', // In a real app we'd upload the audio to Cloud Storage and save the URL here.
            status: 'pending_review',
        });

        toast({
            title: t("Assessment Submitted!"),
            description: t("Your teacher has been notified and will review your submission."),
        })
        router.push('/dashboard/student')
    } catch (error) {
        console.error("Error submitting assessment:", error)
        setIsSubmitting(false)
        toast({
            title: t("Submission Failed"),
            description: t("There was an error analyzing your reading. Please try again. You may need to add your Gemini API key."),
            variant: "destructive"
        })
    }
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
  
  if (hasPermission === null || isLoadingPassage) {
     return (
       <div className="flex h-screen items-center justify-center">
         <Loader2 className="h-8 w-8 animate-spin" />
       </div>
     )
  }

  return (
    <div className="flex flex-col items-center p-4 md:p-8">
      <Card className="w-full max-w-3xl">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-3xl">{t("Read Aloud: {{title}}", { title: passage?.title || "" })}</CardTitle>
          <CardDescription>{t("Read the passage below clearly. Tap the microphone when you are ready to start.")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-6 border rounded-lg bg-muted/50 text-lg leading-relaxed">
            {passage ? passage.text : <Skeleton className="h-40 w-full" />}
          </div>

          <div className="flex flex-col items-center gap-4">
            {!audioURL && (
              <Button
                size="lg"
                className="rounded-full h-20 w-20"
                onClick={isRecording ? stopRecording : startRecording}
                variant={isRecording ? 'destructive' : 'default'}
                disabled={isSubmitting}
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
                    {isSubmitting ? t("Submitting...") : t("Submit")}
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
