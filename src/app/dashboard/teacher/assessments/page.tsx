
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Plus, List, Users, Clock, ArrowRight } from "lucide-react"
import Link from "next/link"

const students = [
  { id: "student1", name: "Aarav Sharma", status: "Completed", score: "92 WPM", avatar: "https://placehold.co/100x100.png", hint: "boy portrait" },
  { id: "student2", name: "Priya Patel", status: "Pending", score: "N/A", avatar: "https://placehold.co/100x100.png", hint: "girl portrait" },
  { id: "student3", name: "Rohan Das", status: "Feedback Reviewed", score: "85 WPM", avatar: "https://placehold.co/100x100.png", hint: "boy portrait" },
  { id: "student4", name: "Meera Iyer", status: "Completed", score: "88 WPM", avatar: "https://placehold.co/100x100.png", hint: "girl portrait" },
]

const pendingReviews = [
  { id: "review1", studentName: "Aarav Sharma", passageTitle: "The Brave Little Ant", submissionDate: "2024-07-28" },
  { id: "review2", studentName: "Meera Iyer", passageTitle: "A Trip to the Market", submissionDate: "2024-07-27" },
]

export default function AssessmentsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Reading Assessments</h1>
        <p className="text-muted-foreground">Assign and review student reading passages.</p>
      </div>

      <div className="flex flex-wrap gap-4">
        <Button asChild>
          <Link href="/dashboard/teacher/assessments/assign">
            <Plus className="mr-2 h-4 w-4" />
            Assign New Reading Assessment
          </Link>
        </Button>
        <Button variant="outline">
          <List className="mr-2 h-4 w-4" />
          View All Assigned Passages
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Students Overview</CardTitle>
          <CardDescription>Review the latest assessment status for each student.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {students.map(student => (
            <div key={student.id} className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-lg hover:bg-accent">
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={student.avatar} alt={student.name} data-ai-hint={student.hint} />
                  <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{student.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Status: <Badge variant={student.status === 'Completed' ? 'default' : 'secondary'}>{student.status}</Badge>
                    <span className="mx-2">|</span>
                    Score: {student.score}
                  </p>
                </div>
              </div>
              <Button asChild variant="secondary" size="sm">
                {/* This link is a placeholder for a real report page */}
                <Link href={`/dashboard/teacher/assessments/review/review1`}>View Reports <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" /> Pending Reviews</CardTitle>
          <CardDescription>These assessments are waiting for your feedback.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {pendingReviews.length > 0 ? pendingReviews.map(review => (
             <div key={review.id} className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-lg hover:bg-accent">
               <div>
                  <p className="font-semibold">{review.studentName} - "{review.passageTitle}"</p>
                  <p className="text-sm text-muted-foreground">Submitted on {review.submissionDate}</p>
               </div>
                <Button asChild size="sm">
                    <Link href={`/dashboard/teacher/assessments/review/${review.id}`}>Review</Link>
                </Button>
             </div>
          )) : (
            <p className="text-sm text-muted-foreground text-center p-4">No pending reviews right now.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
