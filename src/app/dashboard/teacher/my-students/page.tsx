
"use client"

import { useState, useEffect } from "react"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/hooks/use-auth"
import { useTranslation } from "@/hooks/use-translation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { BookUp, Users } from "lucide-react"

interface Student {
  id: string
  name: string
  grade: string
}

type GroupedStudents = Record<string, Student[]>

export default function MyStudentsPage() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const [groupedStudents, setGroupedStudents] = useState<GroupedStudents>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user || !db) return

    setIsLoading(true)
    const studentsQuery = query(collection(db, "users"), where("role", "==", "student"))

    const unsubscribe = onSnapshot(studentsQuery, (querySnapshot) => {
      const studentsData: Student[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        if (data.name && data.grade) {
          studentsData.push({ 
            id: doc.id, 
            name: data.name,
            grade: data.grade,
          })
        }
      })

      const grouped = studentsData.reduce((acc, student) => {
        const { grade } = student
        if (!acc[grade]) {
          acc[grade] = []
        }
        acc[grade].push(student)
        return acc
      }, {} as GroupedStudents)

      // Sort grades
      const sortedGrades = Object.keys(grouped).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      const sortedGroupedStudents: GroupedStudents = {}
      for (const grade of sortedGrades) {
        // Sort students within grade
        grouped[grade].sort((a, b) => a.name.localeCompare(b.name));
        sortedGroupedStudents[grade] = grouped[grade];
      }

      setGroupedStudents(sortedGroupedStudents)
      setIsLoading(false)
    }, (error) => {
      console.error("Error fetching students:", error)
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">{t("My Students")}</h1>
        <p className="text-muted-foreground">{t("View and manage your students by class.")}</p>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : Object.keys(groupedStudents).length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Object.entries(groupedStudents).map(([grade, students]) => (
            <Card key={grade}>
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle>{t("Grade")} {grade}</CardTitle>
                <Button variant="outline" size="sm" disabled>
                  <BookUp className="mr-2 h-4 w-4" />
                  {t("Assign to Class")}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {students.map((student, index) => (
                    <div key={student.id} className="flex items-center gap-4 p-2 rounded-lg hover:bg-accent">
                      <Avatar>
                        <AvatarImage src={`https://placehold.co/100x100.png`} alt={student.name} data-ai-hint={index % 2 === 0 ? "boy portrait" : "girl portrait"} />
                        <AvatarFallback>{student.name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <p className="font-medium">{student.name}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
            <div className="mb-4 rounded-full bg-primary/10 p-4">
                <Users className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="font-headline">{t("No Students Found")}</CardTitle>
            <CardDescription className="mt-2">
                {t("New students will appear here once they sign up and specify their grade.")}
            </CardDescription>
        </Card>
      )}
    </div>
  )
}
