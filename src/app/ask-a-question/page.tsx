
"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Mic, Wand2, Save, ThumbsUp, ThumbsDown, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { askAQuestion, AskAQuestionOutput } from "@/ai/flows/ask-a-question"
import { Skeleton } from "@/components/ui/skeleton"
import { useTranslation } from "@/hooks/use-translation"

export default function AskAQuestionPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { t, language } = useTranslation()

  const [question, setQuestion] = useState("")
  const [explanation, setExplanation] = useState<AskAQuestionOutput | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleGetExplanation = async () => {
    if (!question) {
      toast({
        title: t("Missing Information"),
        description: t("Please enter a question."),
        variant: "destructive",
      })
      return
    }
    setIsLoading(true)
    setExplanation(null)
    try {
      const result = await askAQuestion({
        question,
        explanationLanguage: language,
      })
      setExplanation(result)
    } catch (error) {
      console.error(error)
      toast({
        title: t("Error"),
        description: t("Failed to get an explanation. Please try again. You may need to add your Gemini API key."),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="p-4 border-b">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("Back")}
        </Button>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle className="font-headline text-3xl">{t("Instant Knowledge Base")}</CardTitle>
            <CardDescription>{t("Have a question? Get a simple explanation with analogies.")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="question-input">{t("Your Question")}</Label>
              <div className="relative">
                <Input 
                  id="question-input" 
                  placeholder={t("e.g., Why is the sky blue?")}
                  className="pr-10"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                />
                <Button variant="ghost" size="icon" className="absolute top-0 right-0 h-full w-10">
                  <Mic className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button className="w-full" onClick={handleGetExplanation} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
              {isLoading ? t("Getting Explanation...") : t("Get Explanation")}
            </Button>
          </CardContent>
          <CardFooter className="flex flex-col items-start space-y-4">
            <Label>{t("AI Generated Explanation")}</Label>
            <div className="w-full p-4 border rounded-md bg-muted/50 min-h-[150px] space-y-2">
              {isLoading && <Skeleton className="w-full h-24" />}
              {!isLoading && !explanation && (
                <p className="text-sm text-muted-foreground">{t("Your explanation will appear here...")}</p>
              )}
              {explanation && (
                <p className="text-sm whitespace-pre-wrap">{explanation.explanation}</p>
              )}
            </div>
            <div className="flex justify-between w-full items-center">
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" disabled={!explanation || isLoading}><ThumbsUp className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" disabled={!explanation || isLoading}><ThumbsDown className="h-4 w-4" /></Button>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" disabled={!explanation || isLoading}><Save className="mr-2 h-4 w-4" /> {t("Save Explanation")}</Button>
                </div>
            </div>
          </CardFooter>
        </Card>
      </main>
    </div>
  )
}
