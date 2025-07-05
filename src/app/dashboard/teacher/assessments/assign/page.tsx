
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2, Upload, Wand2, ChevronDown } from "lucide-react"
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { generateReadingPassage } from "@/ai/flows/generate-reading-passage"
import { Skeleton } from "@/components/ui/skeleton"
import { db } from "@/lib/firebase"
import { useAuth } from "@/hooks/use-auth"
import { useTranslation } from "@/hooks/use-translation"
import { Accordion, AccordionContent, AccordionItem } from "@/components/ui/accordion"
import * as AccordionPrimitive from "@radix-ui/react-accordion"


interface Student {
  id: string
  name: string
  grade: string
}

type GroupedStudents = Record<string, Student[]>

export default function AssignAssessmentPage() {
  const { toast } = useToast()
  const { t } = useTranslation()
  const router = useRouter()
  const { user } = useAuth()
  
  const [passage, setPassage] = useState("")
  const [passageTopic, setPassageTopic] = useState("")
  const [assessmentTitle, setAssessmentTitle] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)
  
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [groupedStudents, setGroupedStudents] = useState<GroupedStudents>({})
  const [isLoadingStudents, setIsLoadingStudents] = useState(true)

  useEffect(() => {
    if (!db || !user) return

    const studentsQuery = query(collection(db, "users"), where("role", "==", "student"), where("teacherId", "==", user.uid))

    const unsubscribe = onSnapshot(studentsQuery, (querySnapshot) => {
      const studentsData: Student[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        // Ensure student has a name and grade before adding
        if (data.name && data.grade) {
          studentsData.push({ id: doc.id, name: data.name, grade: data.grade })
        }
      })
      setStudents(studentsData)

      // Group students
      const grouped = studentsData.reduce((acc, student) => {
        const { grade } = student
        if (!acc[grade]) {
          acc[grade] = []
        }
        acc[grade].push(student)
        return acc
      }, {} as GroupedStudents)
      
      const sortedGrades = Object.keys(grouped).sort();
      const sortedGrouped: GroupedStudents = {};
      for (const grade of sortedGrades) {
          sortedGrouped[grade] = grouped[grade];
      }
      setGroupedStudents(sortedGrouped)
      setIsLoadingStudents(false)

    }, (error) => {
      console.error("Error fetching students:", error)
      toast({
        title: t("Error fetching students"),
        description: t("Could not load the list of students. Please try again later."),
        variant: "destructive"
      })
      setIsLoadingStudents(false)
    })

    return () => unsubscribe()
  }, [user, toast, t])

  const handleGeneratePassage = async () => {
    if (!passageTopic) {
      toast({ title: t("Please enter a topic."), variant: "destructive" })
      return
    }
    setIsGenerating(true)
    setPassage("")
    try {
      const result = await generateReadingPassage({
        topic: passageTopic,
        gradeLevel: "Grade 4", // Placeholder
        wordCount: 100, // Placeholder
      })
      setPassage(result.passage)
    } catch (error) {
      console.error(error)
      toast({ title: t("Failed to generate passage."), description: t("Please check your API key and try again."), variant: "destructive" })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAssignAssessment = async () => {
    if (!passage || selectedStudents.length === 0 || !assessmentTitle) {
      toast({
        title: t("Missing Information"),
        description: t("Please provide a title, a passage, and select at least one student."),
        variant: "destructive",
      })
      return
    }
    if (!user || !db) return;

    setIsAssigning(true)
    try {
      await addDoc(collection(db, "assessments"), {
        title: assessmentTitle,
        passage: passage,
        teacherId: user.uid,
        assignedStudentIds: selectedStudents,
        createdAt: serverTimestamp(),
      })
      toast({
        title: t("Assessment Assigned!"),
        description: t("Your students can now see the new assignment."),
      })
      router.push("/dashboard/teacher/assessments")
    } catch (error) {
      console.error("Error assigning assessment:", error)
      toast({
        title: t("Assignment Failed"),
        description: t("There was a problem assigning the assessment. Please try again."),
        variant: "destructive",
      })
    } finally {
      setIsAssigning(false)
    }
  }

  const handleSelectAll = (checked: boolean | string) => {
    if (checked) {
      setSelectedStudents(students.map(s => s.id))
    } else {
      setSelectedStudents([])
    }
  }
  
  const handleSelectGrade = (grade: string, checked: boolean | string) => {
    const studentIdsInGrade = groupedStudents[grade]?.map(s => s.id) || [];
    if (checked) {
      setSelectedStudents(prev => [...new Set([...prev, ...studentIdsInGrade])]);
    } else {
      setSelectedStudents(prev => prev.filter(id => !studentIdsInGrade.includes(id)));
    }
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard/teacher/assessments" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary">
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t("Back to Assessments")}
      </Link>
      
      <h1 className="text-3xl font-bold font-headline">{t("Assign New Reading Assessment")}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>1. {t("Assessment Details")}</CardTitle>
              <CardDescription>{t("Give your assessment a title for your records.")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Label htmlFor="assessment-title">{t("Assessment Title")}</Label>
              <Input id="assessment-title" placeholder={t("e.g., Chapter 1 Reading Practice")} value={assessmentTitle} onChange={(e) => setAssessmentTitle(e.target.value)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. {t("Reading Passage")}</CardTitle>
              <CardDescription>{t("Provide the text students will read. Generate one, paste it in, or upload a file.")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="generate">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="generate">{t("Generate")}</TabsTrigger>
                  <TabsTrigger value="paste">{t("Paste Text")}</TabsTrigger>
                  <TabsTrigger value="upload" disabled>{t("Upload")}</TabsTrigger>
                </TabsList>
                <TabsContent value="generate" className="pt-4 space-y-4">
                  <Label htmlFor="topic">{t("Generate a passage on the topic of...")}</Label>
                  <div className="flex gap-2">
                    <Input id="topic" placeholder={t("e.g., 'A rainy day'")} value={passageTopic} onChange={(e) => setPassageTopic(e.target.value)} />
                    <Button onClick={handleGeneratePassage} disabled={isGenerating}>
                      {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                      {isGenerating ? t("Generating...") : t("Generate")}
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="paste" className="pt-4">
                  <Label htmlFor="paste-area">{t("Paste your passage below")}</Label>
                  <Textarea id="paste-area" rows={10} placeholder={t("Paste your reading passage here.")} value={passage} onChange={(e) => setPassage(e.target.value)} />
                </TabsContent>
                <TabsContent value="upload" className="pt-4">
                  {/* Upload functionality to be implemented */}
                </TabsContent>
              </Tabs>
              <div className="mt-4">
                <Label>{t("Passage Preview")}</Label>
                {isGenerating ? (
                  <Skeleton className="w-full h-40" />
                ) : (
                  <Textarea rows={10} value={passage} onChange={(e) => setPassage(e.target.value)} placeholder={t("Your passage will appear here...")} />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>3. {t("Assign Students")}</CardTitle>
              <CardDescription>{t("Select the students who should receive this assessment.")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox id="select-all" onCheckedChange={handleSelectAll} checked={students.length > 0 && selectedStudents.length === students.length} />
                <Label htmlFor="select-all" className="font-medium">{t("Select All Students")}</Label>
              </div>
              <Accordion type="multiple" className="w-full border-t">
                {isLoadingStudents ? (
                  <div className="space-y-2 p-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : Object.keys(groupedStudents).length > 0 ? (
                  Object.entries(groupedStudents).map(([grade, studentsInGrade]) => {
                    const allInGradeSelected = studentsInGrade.every(s => selectedStudents.includes(s.id));

                    return (
                      <AccordionItem value={grade} key={grade}>
                        <AccordionPrimitive.Header className="flex items-center px-2 py-1">
                            <div className="flex items-center space-x-3 flex-1 p-2">
                                <Checkbox
                                    id={`select-grade-${grade}`}
                                    checked={allInGradeSelected}
                                    onCheckedChange={(checked) => handleSelectGrade(grade, checked)}
                                    aria-label={`Select all students in grade ${grade}`}
                                />
                                <Label htmlFor={`select-grade-${grade}`} className="font-semibold text-base flex-1 cursor-pointer">
                                    {t("Grade")} {grade}
                                </Label>
                            </div>
                            <AccordionPrimitive.Trigger className="p-2 rounded-sm hover:bg-accent">
                                <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 data-[state=open]:rotate-180" />
                            </AccordionPrimitive.Trigger>
                        </AccordionPrimitive.Header>
                        <AccordionContent>
                          <div className="space-y-2 pt-2 pl-10">
                            {studentsInGrade.map(student => (
                              <div key={student.id} className="flex items-center space-x-2 p-1 rounded-md">
                                <Checkbox
                                  id={student.id}
                                  checked={selectedStudents.includes(student.id)}
                                  onCheckedChange={(checked) => {
                                    setSelectedStudents(prev => checked ? [...prev, student.id] : prev.filter(id => id !== student.id))
                                  }}
                                />
                                <Label htmlFor={student.id} className="w-full cursor-pointer">{student.name}</Label>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    )
                  })
                ) : (
                  <p className="text-sm text-muted-foreground p-4 text-center">{t("No students found. New students will appear here once they sign up with your teacher code.")}</p>
                )}
              </Accordion>
            </CardContent>
          </Card>
          <Button size="lg" className="w-full" onClick={handleAssignAssessment} disabled={isAssigning}>
            {isAssigning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {t("Assign Assessment")} ({selectedStudents.length} {selectedStudents.length === 1 ? t('Student') : t('Students')})
          </Button>
        </div>
      </div>
    </div>
  )
}
