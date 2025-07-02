import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ClipboardCheck } from "lucide-react"

export default function AssessmentsPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="mx-auto bg-primary/10 p-3 rounded-full">
            <ClipboardCheck className="h-12 w-12 text-primary" />
          </div>
        </CardHeader>
        <CardContent className="mt-4">
          <CardTitle className="font-headline text-2xl">Assessments Coming Soon!</CardTitle>
          <CardDescription className="mt-2">
            We're working on powerful tools to help you create reading assessments and educational games. Stay tuned!
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  )
}
