
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Plus, List, Users, Clock, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { db } from "@/lib/firebase"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { useAuth } from "@/hooks/use-auth"
import { Skeleton } from "@/components/ui/skeleton"

interface Student {
  id: string;
  name: string;
  status: string;
  score: string;
  avatar: string;
  hint: string;
}

const pendingReviews = [
  { id: "review1", studentName: "Aarav Sharma", passageTitle: "The Brave Little Ant", submissionDate: "2024-07-28" },
  { id: "review2", studentName: "Meera Iyer", passageTitle: "A Trip to the Market", submissionDate: "2024-07-27" },
]

export default function AssessmentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [isLoadingStudents, setIsLoadingStudents] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (!db || !user) return

    const studentsQuery = query(collection(db, "users"), where("role", "==", "student"))

    const unsubscribe = onSnapshot(studentsQuery, (querySnapshot) => {
      const studentsData: Student[] = []
      let isBoy = true;
      querySnapshot.forEach((doc) => {
        studentsData.push({
          id: doc.id,
          name: doc.data().name,
          // For now, let's mock the rest of the data.
          // In a real app, this would come from an 'assessments' collection.
          status: Math.random() > 0.5 ? "Completed" : "Pending",
          score: Math.random() > 0.5 ? `${Math.floor(Math.random() * 20 + 80)} WPM` : "N/A",
          avatar: "https://placehold.co/100x100.png",
          hint: isBoy ? "boy portrait" : "girl portrait",
        })
        isBoy = !isBoy
      })
      setStudents(studentsData)
      setIsLoadingStudents(false)
    })

    return () => unsubscribe()
  }, [user])

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
          {isLoadingStudents ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-4 p-3">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[150px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-[120px]" />
                </div>
              ))}
            </div>
          ) : students.length > 0 ? (
            students.map(student => (
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
            ))
          ) : (
             <p className="text-sm text-muted-foreground text-center p-4">No students have signed up yet.</p>
          )}
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
