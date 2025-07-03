
'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/use-auth'
import { useTranslation } from '@/hooks/use-translation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2, ArrowLeft, CheckCircle2, XCircle, Trophy, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { GameData } from '@/ai/flows/generate-quiz'
import { Progress } from '@/components/ui/progress'
import { cn, shuffleArray } from '@/lib/utils'

interface Assignment {
  contentId: string;
}

export default function PlayGamePage() {
  const params = useParams()
  const router = useRouter()
  const assignmentId = params.assignmentId as string
  
  const { t } = useTranslation()
  const { user } = useAuth()
  
  const [game, setGame] = useState<GameData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Quiz state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [isAnswered, setIsAnswered] = useState(false)

  // Matching game state
  const [shuffledRightItems, setShuffledRightItems] = useState<string[]>([]);
  const [leftItems, setLeftItems] = useState<{ item: string; index: number }[]>([]);
  const [selectedLeft, setSelectedLeft] = useState<{ item: string; index: number } | null>(null);
  const [selectedRight, setSelectedRight] = useState<{ item: string; index: number } | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
  const [isMismatch, setIsMismatch] = useState(false);
  const [attempts, setAttempts] = useState(0);

  // General state
  const [isFinished, setIsFinished] = useState(false)

  useEffect(() => {
    if (!assignmentId || !db) return

    const fetchGame = async () => {
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
            if (contentData.type === 'Game') {
              const parsedGame = JSON.parse(contentData.content) as GameData
              setGame(parsedGame)
              if (parsedGame.gameType === 'matching') {
                setLeftItems(parsedGame.pairs.map((p, i) => ({ item: p.item1, index: i })));
                setShuffledRightItems(shuffleArray(parsedGame.pairs.map(p => p.item2)));
              }
            } else {
                throw new Error("Content is not a game")
            }
          } else {
             throw new Error("Content not found")
          }
        } else {
            throw new Error("Assignment not found")
        }
      } catch (error) {
        console.error("Error fetching game:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchGame()
  }, [assignmentId])

  useEffect(() => {
    if (isFinished && user && game && db) {
      const saveSession = async () => {
        try {
          await addDoc(collection(db, "game_sessions"), {
            studentId: user.uid,
            assignmentId: assignmentId,
            gameTitle: game.title,
            score: game.gameType === 'quiz' ? score : attempts,
            totalQuestions: game.gameType === 'quiz' ? game.questions.length : game.pairs.length,
            gameType: game.gameType,
            completedAt: serverTimestamp(),
          });
        } catch (error) {
          console.error("Failed to save game session", error);
        }
      };
      saveSession();
    }
  }, [isFinished, user, game, db, assignmentId, score, attempts]);
  
  // Effect to check for a match in the matching game
  useEffect(() => {
    if (!selectedLeft || !selectedRight || !game || game.gameType !== 'matching') return;

    const checkMatch = () => {
      setAttempts(prev => prev + 1);
      const correctPair = game.pairs.find(p => p.item1 === selectedLeft.item);
      if (correctPair && correctPair.item2 === selectedRight.item) {
        // It's a match!
        setMatchedPairs(prev => [...prev, selectedLeft.item, selectedRight.item]);
      } else {
        // It's a mismatch
        setIsMismatch(true);
        setTimeout(() => {
          setIsMismatch(false);
        }, 500);
      }
      // Reset selections after a short delay
      setTimeout(() => {
        setSelectedLeft(null);
        setSelectedRight(null);
      }, 500);
    };

    checkMatch();
  }, [selectedLeft, selectedRight, game]);

  // Effect to check if matching game is finished
  useEffect(() => {
    if (game?.gameType === 'matching' && matchedPairs.length === game.pairs.length * 2) {
      setIsFinished(true);
    }
  }, [matchedPairs, game]);


  const handleAnswerSubmit = () => {
    if (selectedAnswer === null || !game || game.gameType !== 'quiz') return
    
    setIsAnswered(true)
    const currentQuestion = game.questions[currentQuestionIndex]
    if (selectedAnswer === currentQuestion.correctAnswerIndex) {
      setScore(prev => prev + 1)
    }
  }

  const handleNextQuestion = () => {
    if (!game || game.gameType !== 'quiz') return;
    if (currentQuestionIndex < game.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
      setSelectedAnswer(null)
      setIsAnswered(false)
    } else {
      setIsFinished(true)
    }
  }

  const handleRestartGame = () => {
    if (!game) return;
    setIsFinished(false)
    if (game.gameType === 'quiz') {
      setCurrentQuestionIndex(0)
      setSelectedAnswer(null)
      setIsAnswered(false)
      setScore(0)
    } else if (game.gameType === 'matching') {
        setSelectedLeft(null);
        setSelectedRight(null);
        setMatchedPairs([]);
        setAttempts(0);
        setShuffledRightItems(shuffleArray(game.pairs.map(p => p.item2)));
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!game) {
    return (
      <div className="flex h-screen items-center justify-center text-center">
        <div>
          <h2 className="text-2xl font-bold">{t("Game Not Found")}</h2>
          <Button onClick={() => router.back()} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> {t("Go Back")}
          </Button>
        </div>
      </div>
    )
  }

  if (isFinished) {
    return (
        <div className="flex flex-col items-center justify-center h-screen p-4 text-center">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
                        <Trophy className="h-12 w-12 text-primary" />
                    </div>
                    <CardTitle className="font-headline text-3xl">{t("Game Complete!")}</CardTitle>
                    <CardDescription>{t("You've completed the '{{title}}' game.", { title: game.title })}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {game.gameType === 'quiz' ? (
                       <p className="text-2xl font-bold">{t("Your Score")}: {score} / {game.questions.length}</p>
                    ) : (
                       <p className="text-2xl font-bold">{t("Completed in {{count}} attempts!", { count: attempts })}</p>
                    )}
                    <div className="flex gap-4 justify-center">
                        <Button onClick={handleRestartGame}>
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

  const renderQuiz = () => {
    if (game.gameType !== 'quiz') return null;
    const currentQuestion = game.questions[currentQuestionIndex];
    return (
        <>
            <CardDescription>{t("Question {{current}} of {{total}}", { current: currentQuestionIndex + 1, total: game.questions.length})}</CardDescription>
            <Progress value={((currentQuestionIndex + 1) / game.questions.length) * 100} className="mt-2" />
            <CardContent className="space-y-6 mt-6">
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
                            {currentQuestionIndex < game.questions.length - 1 ? t("Next Question") : t("Finish Game")}
                        </Button>
                    ) : (
                        <Button onClick={handleAnswerSubmit} disabled={selectedAnswer === null}>
                            {t("Submit Answer")}
                        </Button>
                    )}
                </div>
            </CardContent>
        </>
    );
  }

  const renderMatchingGame = () => {
    if (game.gameType !== 'matching') return null;
    const progress = (matchedPairs.length / (game.pairs.length * 2)) * 100;

    return (
        <>
            <CardDescription>{t("Match all the pairs to complete the game. Attempts: {{count}}", { count: attempts })}</CardDescription>
            <Progress value={progress} className="mt-2" />
            <CardContent className="space-y-6 mt-6">
                 <div className="grid grid-cols-2 gap-4">
                    {/* Left Column */}
                    <div className="flex flex-col gap-2">
                        <h3 className="font-bold text-center">{t(game.item1Title)}</h3>
                        {leftItems.map(({ item, index }) => (
                            <Button 
                                key={item} 
                                variant="outline"
                                className={cn("h-auto min-h-12 p-2 justify-center text-center whitespace-normal",
                                    selectedLeft?.item === item && "border-primary ring-2 ring-primary",
                                    isMismatch && selectedLeft?.item === item && "border-destructive bg-destructive/10",
                                    matchedPairs.includes(item) && "bg-green-100 border-green-500 text-green-800 hover:bg-green-100"
                                )}
                                onClick={() => !matchedPairs.includes(item) && !selectedLeft && setSelectedLeft({ item, index })}
                                disabled={matchedPairs.includes(item) || !!selectedLeft}
                            >{t(item)}</Button>
                        ))}
                    </div>
                    {/* Right Column */}
                    <div className="flex flex-col gap-2">
                        <h3 className="font-bold text-center">{t(game.item2Title)}</h3>
                         {shuffledRightItems.map((item, index) => (
                            <Button 
                                key={item} 
                                variant="outline"
                                className={cn("h-auto min-h-12 p-2 justify-center text-center whitespace-normal",
                                    selectedRight?.item === item && "border-primary ring-2 ring-primary",
                                    isMismatch && selectedRight?.item === item && "border-destructive bg-destructive/10",
                                    matchedPairs.includes(item) && "bg-green-100 border-green-500 text-green-800 hover:bg-green-100"
                                )}
                                onClick={() => !matchedPairs.includes(item) && selectedLeft && setSelectedRight({ item, index })}
                                disabled={matchedPairs.includes(item) || !selectedLeft || !!selectedRight}
                            >{t(item)}</Button>
                        ))}
                    </div>
                 </div>
            </CardContent>
        </>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl md:text-3xl">{t(game.title)}</CardTitle>
          {game.gameType === 'quiz' && renderQuiz()}
          {game.gameType === 'matching' && renderMatchingGame()}
        </CardHeader>
      </Card>
    </div>
  )
}
