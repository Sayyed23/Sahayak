import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen } from "lucide-react"

export default function MyLessonsPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="mx-auto bg-primary/10 p-3 rounded-full">
            <BookOpen className="h-12 w-12 text-primary" />
          </div>
        </CardHeader>
        <CardContent className="mt-4">
          <CardTitle className="font-headline text-2xl">My Lessons</CardTitle>
          <CardDescription className="mt-2">
            This is where you'll find all your lessons assigned by your teacher. This feature is coming soon!
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  )
}
