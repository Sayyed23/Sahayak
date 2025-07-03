
'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useTranslation } from '@/hooks/use-translation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2, ArrowLeft, CheckCircle2, XCircle, Trophy, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { QuizData, QuizQuestion } from '@/ai/flows/generate-quiz'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface Assignment {
  contentId: string;
}

export default function PlayQuizPage() {
  const params = useParams()
  const router = useRouter()
  const { t } = useTranslation()
  const assignmentId = params.assignmentId as string
  
  const [quiz, setQuiz] = useState<QuizData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [isAnswered, setIsAnswered] = useState(false)
  const [isFinished, setIsFinished] = useState(false)

  useEffect(() => {
    if (!assignmentId || !db) return

    const fetchQuiz = async () => {
      setIsLoading(true)
      try {
        const assignmentRef = doc(db, 'assignments', assignmentId)
        const assignmentSnap = await getDoc(assignmentRef)

        if (assignmentSnap.exists()) {
          const assignmentData = assignmentSnap.data() as Assignment
          const contentRef = doc(db, 'content', assignmentData.contentId)
          const contentSnap = await getDoc(contentRef)

          if (contentSnap.exists()) {
            const contentData = contentSnap.data()
            if (contentData.type === 'Quiz') {
              setQuiz(JSON.parse(contentData.content))
            } else {
                throw new Error("Content is not a quiz")
            }
          } else {
             throw new Error("Content not found")
          }
        } else {
            throw new Error("Assignment not found")
        }
      } catch (error) {
        console.error("Error fetching quiz:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchQuiz()
  }, [assignmentId])

  const handleAnswerSubmit = () => {
    if (selectedAnswer === null) return
    
    setIsAnswered(true)
    const currentQuestion = quiz!.questions[currentQuestionIndex]
    if (selectedAnswer === currentQuestion.correctAnswerIndex) {
      setScore(prev => prev + 1)
    }
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quiz!.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
      setSelectedAnswer(null)
      setIsAnswered(false)
    } else {
      setIsFinished(true)
    }
  }

  const handleRestartQuiz = () => {
    setCurrentQuestionIndex(0)
    setSelectedAnswer(null)
    setIsAnswered(false)
    setScore(0)
    setIsFinished(false)
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="flex h-screen items-center justify-center text-center">
        <div>
          <h2 className="text-2xl font-bold">{t("Quiz Not Found")}</h2>
          <Button onClick={() => router.back()} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> {t("Go Back")}
          </Button>
        </div>
      </div>
    )
  }

  const currentQuestion = quiz.questions[currentQuestionIndex]

  if (isFinished) {
    return (
        <div className="flex flex-col items-center justify-center h-screen p-4 text-center">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
                        <Trophy className="h-12 w-12 text-primary" />
                    </div>
                    <CardTitle className="font-headline text-3xl">{t("Quiz Complete!")}</CardTitle>
                    <CardDescription>{t("You've completed the '{{title}}' quiz.", { title: quiz.title })}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-2xl font-bold">{t("Your Score")}: {score} / {quiz.questions.length}</p>
                    <div className="flex gap-4 justify-center">
                        <Button onClick={handleRestartQuiz}>
                           <RotateCcw className="mr-2 h-4 w-4" /> {t("Play Again")}
                        </Button>
                        <Button variant="outline" onClick={() => router.push('/dashboard/student/my-lessons')}>
                           <ArrowLeft className="mr-2 h-4 w-4" /> {t("Back to Lessons")}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl md:text-3xl">{t(quiz.title)}</CardTitle>
          <CardDescription>{t("Question {{current}} of {{total}}", { current: currentQuestionIndex + 1, total: quiz.questions.length})}</CardDescription>
          <Progress value={((currentQuestionIndex + 1) / quiz.questions.length) * 100} className="mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-lg font-semibold">{t(currentQuestion.questionText)}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentQuestion.options.map((option, index) => {
              const isCorrect = index === currentQuestion.correctAnswerIndex
              const isSelected = index === selectedAnswer
              return (
                <Button 
                    key={index}
                    variant="outline"
                    className={cn(
                        "h-auto p-4 justify-start text-left whitespace-normal",
                        isAnswered && isCorrect && "bg-green-100 border-green-500 text-green-800 hover:bg-green-200",
                        isAnswered && isSelected && !isCorrect && "bg-red-100 border-red-500 text-red-800 hover:bg-red-200",
                        !isAnswered && isSelected && "bg-accent border-primary"
                    )}
                    onClick={() => !isAnswered && setSelectedAnswer(index)}
                    disabled={isAnswered}
                >
                    {isAnswered && isCorrect && <CheckCircle2 className="mr-2 h-5 w-5 flex-shrink-0" />}
                    {isAnswered && isSelected && !isCorrect && <XCircle className="mr-2 h-5 w-5 flex-shrink-0" />}
                    {t(option)}
                </Button>
              )
            })}
          </div>

          {isAnswered && (
            <div className="p-4 bg-muted/70 rounded-lg space-y-2">
                <h4 className="font-bold">{t("Explanation")}</h4>
                <p className="text-sm text-muted-foreground">{t(currentQuestion.explanation)}</p>
            </div>
          )}
          
          <div className="flex justify-end">
            {isAnswered ? (
                <Button onClick={handleNextQuestion}>
                    {currentQuestionIndex < quiz.questions.length - 1 ? t("Next Question") : t("Finish Quiz")}
                </Button>
            ) : (
                <Button onClick={handleAnswerSubmit} disabled={selectedAnswer === null}>
                    {t("Submit Answer")}
                </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
