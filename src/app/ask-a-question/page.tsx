"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Mic, Wand2, Save, ThumbsUp, ThumbsDown, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function AskAQuestionPage() {
  const router = useRouter()

  return (
    <div className="flex flex-col min-h-screen">
      <header className="p-4 border-b">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle className="font-headline text-3xl">Instant Knowledge Base</CardTitle>
            <CardDescription>Have a question? Get a simple explanation with analogies.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="question-input">Your Question</Label>
              <div className="relative">
                <Input id="question-input" placeholder="e.g., Why is the sky blue?" className="pr-10"/>
                <Button variant="ghost" size="icon" className="absolute top-0 right-0 h-full w-10">
                  <Mic className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="explanation-language">Explanation Language</Label>
                <Select>
                    <SelectTrigger id="explanation-language">
                        <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="english">English</SelectItem>
                        <SelectItem value="hindi">Hindi</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <Button className="w-full"><Wand2 className="mr-2 h-4 w-4" /> Get Explanation</Button>
          </CardContent>
          <CardFooter className="flex flex-col items-start space-y-4">
            <Label>AI Generated Explanation</Label>
            <div className="w-full p-4 border rounded-md bg-muted/50 min-h-[150px] space-y-2">
              <h3 className="font-semibold">Why is the sky blue?</h3>
              <p className="text-sm">Imagine the sunlight is like a bunch of tiny balls of different colors all mixed together. When this light travels from the sun to us, it bumps into tiny things in the air, like dust and water droplets.</p>
              <p className="text-sm"><span className="font-semibold">Analogy:</span> Think of it like throwing a mix of big red balls and small blue marbles at a net. The big red balls will mostly go straight through, but the small blue marbles will bounce and scatter everywhere. The Earth's atmosphere is like that net. It scatters the blue light (marbles) all over the sky, making it look blue to us!</p>
            </div>
            <div className="flex justify-between w-full items-center">
                <div className="flex gap-2">
                    <Button variant="outline" size="icon"><ThumbsUp className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon"><ThumbsDown className="h-4 w-4" /></Button>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline"><Save className="mr-2 h-4 w-4" /> Save Explanation</Button>
                </div>
            </div>
          </CardFooter>
        </Card>
      </main>
    </div>
  )
}
