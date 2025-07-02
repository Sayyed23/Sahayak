
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2, Upload, Wand2 } from "lucide-react"
import { collection, query, where, onSnapshot } from "firebase/firestore"

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

interface Student {
  id: string
  name: string
}

export default function AssignAssessmentPage() {
  const { toast } = useToast()
  const [passage, setPassage] = useState("")
  const [topic, setTopic] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [isLoadingStudents, setIsLoadingStudents] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (!db || !user) return

    // In a real app, you would likely filter students by teacherId or school
    const studentsQuery = query(collection(db, "users"), where("role", "==", "student"))

    const unsubscribe = onSnapshot(studentsQuery, (querySnapshot) => {
      const studentsData: Student[] = []
      querySnapshot.forEach((doc) => {
        studentsData.push({ id: doc.id, name: doc.data().name })
      })
      setStudents(studentsData)
      setIsLoadingStudents(false)
    }, (error) => {
      console.error("Error fetching students:", error)
      toast({
        title: "Error fetching students",
        description: "Could not load the list of students. Please try again later.",
        variant: "destructive"
      })
      setIsLoadingStudents(false)
    })

    return () => unsubscribe()
  }, [user, toast])

  const handleGeneratePassage = async () => {
    if (!topic) {
      toast({ title: "Please enter a topic.", variant: "destructive" })
      return
    }
    setIsGenerating(true)
    setPassage("")
    try {
      const result = await generateReadingPassage({
        topic: topic,
        gradeLevel: "Grade 4", // Placeholder
        wordCount: 100, // Placeholder
      })
      setPassage(result.passage)
    } catch (error) {
      console.error(error)
      toast({ title: "Failed to generate passage.", description: "Please check your API key and try again.", variant: "destructive" })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSelectAll = (checked: boolean | string) => {
    if (checked) {
      setSelectedStudents(students.map(s => s.id))
    } else {
      setSelectedStudents([])
    }
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard/teacher/assessments" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Assessments
      </Link>
      
      <h1 className="text-3xl font-bold font-headline">Assign New Reading Assessment</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>1. Reading Passage</CardTitle>
              <CardDescription>Provide the text students will read. Generate one, paste it in, or upload a file.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="generate">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="generate">Generate</TabsTrigger>
                  <TabsTrigger value="paste">Paste Text</TabsTrigger>
                  <TabsTrigger value="upload">Upload</TabsTrigger>
                </TabsList>
                <TabsContent value="generate" className="pt-4 space-y-4">
                  <Label htmlFor="topic">Generate a passage on the topic of...</Label>
                  <div className="flex gap-2">
                    <Input id="topic" placeholder="e.g., 'A rainy day'" value={topic} onChange={(e) => setTopic(e.target.value)} />
                    <Button onClick={handleGeneratePassage} disabled={isGenerating}>
                      {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                      Generate
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="paste" className="pt-4">
                  <Label htmlFor="paste-area">Paste your passage below</Label>
                  <Textarea id="paste-area" rows={10} placeholder="Paste your reading passage here." value={passage} onChange={(e) => setPassage(e.target.value)} />
                </TabsContent>
                <TabsContent value="upload" className="pt-4">
                  <div className="flex items-center justify-center w-full">
                      <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-accent hover:bg-muted">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                              <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                              <p className="text-xs text-muted-foreground">.txt or .pdf file</p>
                          </div>
                          <Input id="dropzone-file" type="file" className="hidden" />
                      </label>
                  </div>
                </TabsContent>
              </Tabs>
              <div className="mt-4">
                <Label>Passage Preview</Label>
                {isGenerating ? (
                  <Skeleton className="w-full h-40" />
                ) : (
                  <Textarea rows={10} value={passage} onChange={(e) => setPassage(e.target.value)} placeholder="Your passage will appear here..." />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>2. Assign Students</CardTitle>
              <CardDescription>Select the students who should receive this assessment.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox id="select-all" onCheckedChange={handleSelectAll} checked={selectedStudents.length === students.length && students.length > 0} />
                <Label htmlFor="select-all" className="font-medium">Select All Students</Label>
              </div>
              <div className="space-y-2 border rounded-md p-2 h-64 overflow-y-auto">
                {isLoadingStudents ? (
                  <div className="space-y-2 p-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-6 w-2/3" />
                    <Skeleton className="h-6 w-3/4" />
                  </div>
                ) : students.length > 0 ? (
                  students.map(student => (
                    <div key={student.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={student.id}
                        checked={selectedStudents.includes(student.id)}
                        onCheckedChange={(checked) => {
                          setSelectedStudents(prev => checked ? [...prev, student.id] : prev.filter(id => id !== student.id))
                        }}
                      />
                      <Label htmlFor={student.id}>{student.name}</Label>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground p-2 text-center">No students found. New students will appear here once they sign up.</p>
                )}
              </div>
            </CardContent>
          </Card>
          <Button size="lg" className="w-full">Assign Assessment ({selectedStudents.length} {selectedStudents.length === 1 ? 'Student' : 'Students'})</Button>
        </div>
      </div>
    </div>
  )
}
