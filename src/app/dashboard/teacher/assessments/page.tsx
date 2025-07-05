
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
import { useTranslation } from "@/hooks/use-translation"
import { formatDistanceToNow } from "date-fns"

interface Student {
  id: string;
  name: string;
  status: string;
  score: string;
  avatar: string;
  hint: string;
}

interface PendingReview {
    id: string;
    studentName: string;
    passageTitle: string;
    submissionDate: string;
    submittedAt: Date;
    submissionType?: 'reading' | 'worksheet';
}

export default function AssessmentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([])
  const [isLoadingStudents, setIsLoadingStudents] = useState(true)
  const [isLoadingReviews, setIsLoadingReviews] = useState(true)
  const { user } = useAuth()
  const { t } = useTranslation()

  useEffect(() => {
    if (!db || !user) return

    setIsLoadingStudents(true)
    const studentsQuery = query(collection(db, "users"), where("role", "==", "student"), where("teacherId", "==", user.uid))
    const unsubscribeStudents = onSnapshot(studentsQuery, (querySnapshot) => {
      const studentsData: Student[] = []
      let isBoy = true;
      querySnapshot.forEach((doc) => {
        if (doc.data().name) {
            studentsData.push({
              id: doc.id,
              name: doc.data().name,
              // TODO: This should come from an aggregation of assessments for this student
              status: "N/A",
              score: "N/A",
              avatar: "https://placehold.co/100x100.png",
              hint: isBoy ? "boy portrait" : "girl portrait",
            })
            isBoy = !isBoy
        }
      })
      setStudents(studentsData)
      setIsLoadingStudents(false)
    })

    setIsLoadingReviews(true);
    const reviewsQuery = query(
        collection(db, "submissions"),
        where("teacherId", "==", user.uid),
        where("status", "==", "pending_review")
    );
    const unsubscribeReviews = onSnapshot(reviewsQuery, (snapshot) => {
        const reviewsData = snapshot.docs.map(doc => {
            const data = doc.data();
            const submittedAt = data.submittedAt?.toDate();
            return {
                id: doc.id,
                studentName: data.studentName,
                passageTitle: data.passageTitle,
                submittedAt: submittedAt || new Date(0),
                submissionDate: submittedAt ? formatDistanceToNow(submittedAt, { addSuffix: true }) : t("Just now"),
                submissionType: data.submissionType,
            };
        });

        reviewsData.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());

        setPendingReviews(reviewsData);
        setIsLoadingReviews(false);
    });

    return () => {
        unsubscribeStudents();
        unsubscribeReviews();
    }
  }, [user, t])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">{t("Reading Assessments")}</h1>
        <p className="text-muted-foreground">{t("Assign and review student reading passages.")}</p>
      </div>

      <div className="flex flex-wrap gap-4">
        <Button asChild>
          <Link href="/dashboard/teacher/assessments/assign">
            <Plus className="mr-2 h-4 w-4" />
            {t("Assign New Reading Assessment")}
          </Link>
        </Button>
        <Button variant="outline" disabled>
          <List className="mr-2 h-4 w-4" />
          {t("View All Assigned Passages")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> {t("Students Overview")}</CardTitle>
          <CardDescription>{t("Review the latest assessment status for each student.")}</CardDescription>
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
                      {t("Status")}: <Badge variant={student.status === 'Completed' ? 'default' : 'secondary'}>{t(student.status)}</Badge>
                      <span className="mx-2">|</span>
                      {t("Score")}: {student.score}
                    </p>
                  </div>
                </div>
                <Button asChild variant="secondary" size="sm" disabled>
                  <Link href={`/dashboard/teacher/assessments/review/placeholder`}>{t("View Reports")} <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </div>
            ))
          ) : (
             <p className="text-sm text-muted-foreground text-center p-4">{t("No students have signed up yet. Students will appear here once they create an account with your teacher code.")}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" /> {t("Pending Reviews")}</CardTitle>
          <CardDescription>{t("These assessments are waiting for your feedback.")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingReviews ? (
            <div className="space-y-4">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
            </div>
          ) : pendingReviews.length > 0 ? pendingReviews.map(review => (
             <div key={review.id} className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-lg hover:bg-accent">
               <div>
                  <p className="font-semibold">{review.studentName} - "{t(review.passageTitle)}"</p>
                   <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Badge variant="secondary">{review.submissionType === 'worksheet' ? t('Worksheet') : t('Reading')}</Badge>
                      <span>{t("Submitted {{date}}", { date: review.submissionDate})}</span>
                  </p>
               </div>
                <Button asChild size="sm">
                    <Link href={`/dashboard/teacher/assessments/review/${review.id}`}>{t("Review")}</Link>
                </Button>
             </div>
          )) : (
            <p className="text-sm text-muted-foreground text-center p-4">{t("No pending reviews right now.")}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
