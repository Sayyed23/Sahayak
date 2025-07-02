
"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Download, Ear, Gauge, Play, Send } from "lucide-react"
import Link from "next/link"
import { marked } from "marked"

// Mock data that would come from the analyzeReadingAssessment AI flow
const mockReport = {
  studentName: "Aarav Sharma",
  passageTitle: "The Brave Little Ant",
  dateSubmitted: "2024-07-28",
  fluencyWPM: 92,
  accuracyPercentage: 96.5,
  audioUrl: "", // Placeholder for audio file
  gradedText: "The brave little **ent** was not afraid. He marched on, looking for food for his family. He saw a big, juicy leaf. It was much bigger than him, but he did not give up. He pulled and ~~he~~ tugged. *Finally*, he moved the leaf. He was very proud.",
  errors: [
    { word: "ant", errorType: "mispronunciation", expected: "ant", actual: "ent" },
    { word: "he", errorType: "omission" },
    { word: "Finally", errorType: "insertion" },
  ],
}

// Custom renderer for marked to handle ++word++ for insertions
const renderer = new marked.Renderer();
renderer.strong = (text) => `<strong class="bg-destructive/20 text-destructive rounded-sm px-1">${text}</strong>`; // Mispronunciation
renderer.del = (text) => `<del class="bg-red-500/20 text-red-600 rounded-sm px-1">${text}</del>`; // Omission
renderer.em = (text) => `<em class="bg-green-500/20 text-green-700 rounded-sm px-1">${text}</em>`; // Insertion


export default function ReviewAssessmentPage({ params }: { params: { submissionId: string } }) {
  const report = mockReport;

  return (
    <div className="space-y-6">
      <Link href="/dashboard/teacher/assessments" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Assessments
      </Link>

      <div>
        <h1 className="text-3xl font-bold font-headline">{report.studentName} - Reading Report</h1>
        <p className="text-muted-foreground">
          Assessed on: <span className="font-medium">{report.passageTitle}</span> | Submitted: {report.dateSubmitted}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Passage with AI-Detected Errors</CardTitle>
              <CardDescription>Listen to the audio and see where the student struggled.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <Button size="icon"><Play /></Button>
                  <div className="w-full h-2 rounded-full bg-muted">
                    <div className="w-1/3 h-2 rounded-full bg-primary"></div>
                  </div>
                  <span className="text-sm text-muted-foreground">0:12 / 0:45</span>
                </div>
                <div 
                  className="p-4 border rounded-lg prose prose-lg max-w-none bg-muted/30"
                  dangerouslySetInnerHTML={{ __html: marked(report.gradedText, { renderer }) }}
                >
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Provide Feedback</CardTitle>
              <CardDescription>Write a short note for the student to help them improve.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea placeholder="Great job, Aarav! Try to focus on the 'a' sound in words like 'ant'. Keep practicing!" rows={4} />
              <Button>
                <Send className="mr-2 h-4 w-4" />
                Submit Feedback
              </Button>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-md bg-accent">
                <div className="flex items-center gap-3">
                  <Gauge className="text-primary h-6 w-6" />
                  <span className="font-medium">Fluency (WPM)</span>
                </div>
                <span className="text-2xl font-bold">{report.fluencyWPM}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-md bg-accent">
                <div className="flex items-center gap-3">
                  <Ear className="text-primary h-6 w-6" />
                  <span className="font-medium">Accuracy</span>
                </div>
                <span className="text-2xl font-bold">{report.accuracyPercentage}%</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Error Details</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {report.errors.map((error, index) => (
                  <li key={index} className="flex items-center justify-between">
                    <span>{error.word}</span>
                    <Badge variant={error.errorType === 'omission' ? 'destructive' : 'secondary'}>{error.errorType}</Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
           <Button variant="outline" className="w-full">
            <Download className="mr-2 h-4 w-4" /> Download Report
          </Button>
        </div>
      </div>
    </div>
  )
}
