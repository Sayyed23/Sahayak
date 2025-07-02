import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare } from "lucide-react"

export default function FeedbackPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="mx-auto bg-primary/10 p-3 rounded-full">
            <MessageSquare className="h-12 w-12 text-primary" />
          </div>
        </CardHeader>
        <CardContent className="mt-4">
          <CardTitle className="font-headline text-2xl">Feedback from Teacher</CardTitle>
          <CardDescription className="mt-2">
            A dedicated space to view personalized feedback from your teacher is coming soon!
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  )
}
