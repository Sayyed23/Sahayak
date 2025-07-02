"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Mic, UploadCloud, Image as ImageIcon, Wand2, Save, Printer, FileAudio, Download, RefreshCw, Loader2 } from "lucide-react"
import Image from "next/image"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { generateHyperLocalContent } from "@/ai/flows/generate-hyper-local-content"
import { designVisualAid } from "@/ai/flows/design-visual-aid"
import { Skeleton } from "@/components/ui/skeleton"

export default function CreateContentPage() {
  const { toast } = useToast()

  // State for Hyper-Local Content
  const [contentText, setContentText] = useState("")
  const [contentType, setContentType] = useState("")
  const [outputLanguage, setOutputLanguage] = useState("")
  const [generatedContent, setGeneratedContent] = useState("")
  const [isGeneratingContent, setIsGeneratingContent] = useState(false)

  const handleGenerateContent = async () => {
    if (!contentText || !contentType || !outputLanguage) {
      toast({
        title: "Missing Information",
        description: "Please fill out all fields to generate content.",
        variant: "destructive",
      })
      return
    }
    setIsGeneratingContent(true)
    setGeneratedContent("")
    try {
      const result = await generateHyperLocalContent({
        text: contentText,
        contentType: contentType,
        outputLanguage: outputLanguage,
      })
      setGeneratedContent(result.generatedContent)
    } catch (error) {
      console.error(error)
      toast({
        title: "Error Generating Content",
        description: "Something went wrong. Please try again. You may need to add your Gemini API key.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingContent(false)
    }
  }

  // State for Visual Aid Designer
  const [visualDescription, setVisualDescription] = useState("")
  const [visualStyle, setVisualStyle] = useState<'hand-drawn' | 'professional' | 'chalkboard'>("hand-drawn")
  const [generatedImageUrl, setGeneratedImageUrl] = useState("https://placehold.co/600x400.png")
  const [isGeneratingVisual, setIsGeneratingVisual] = useState(false)

  const handleGenerateVisual = async () => {
     if (!visualDescription) {
      toast({
        title: "Missing Description",
        description: "Please provide a description for the visual aid.",
        variant: "destructive",
      })
      return
    }
    setIsGeneratingVisual(true)
    try {
      const result = await designVisualAid({
        description: visualDescription,
        style: visualStyle,
      })
      setGeneratedImageUrl(result.imageUrl)
    } catch (error) {
      console.error(error)
      toast({
        title: "Error Generating Visual",
        description: "Something went wrong. Please try again. You may need to add your Gemini API key.",
        variant: "destructive",
      })
      setGeneratedImageUrl("https://placehold.co/600x400.png")
    } finally {
      setIsGeneratingVisual(false)
    }
  }


  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-3xl font-bold font-headline">Create Content</h1>
        <p className="text-muted-foreground">Your creative toolkit for the classroom.</p>
      </div>
      <Tabs defaultValue="hyper-local" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="hyper-local">Hyper-Local Content</TabsTrigger>
          <TabsTrigger value="differentiated">Differentiated Materials</TabsTrigger>
          <TabsTrigger value="visual-aid">Visual Aid Designer</TabsTrigger>
        </TabsList>

        <TabsContent value="hyper-local">
          <Card>
            <CardHeader>
              <CardTitle>Hyper-Local Content Generator</CardTitle>
              <CardDescription>Generate stories and explanations tailored to your students' context.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="content-text">Input Text</Label>
                <div className="relative">
                  <Textarea 
                    id="content-text" 
                    placeholder="e.g., A story about a monkey in a mango grove near our village..." 
                    className="pr-10" 
                    rows={5}
                    value={contentText}
                    onChange={(e) => setContentText(e.target.value)}
                  />
                  <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7">
                    <Mic className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="content-type">Content Type</Label>
                  <Select onValueChange={setContentType} value={contentType}>
                    <SelectTrigger id="content-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="story">Story</SelectItem>
                      <SelectItem value="explanation">Explanation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="output-language">Output Language</Label>
                  <Select onValueChange={setOutputLanguage} value={outputLanguage}>
                    <SelectTrigger id="output-language">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="hindi">Hindi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="w-full" onClick={handleGenerateContent} disabled={isGeneratingContent}>
                {isGeneratingContent ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                {isGeneratingContent ? "Generating..." : "Generate Content"}
              </Button>
            </CardContent>
            <CardFooter className="flex flex-col items-start space-y-4">
              <Label>Generated Output</Label>
              <div className="w-full p-4 border rounded-md bg-muted/50 min-h-[150px]">
                {isGeneratingContent && <Skeleton className="h-20 w-full" />}
                {!isGeneratingContent && !generatedContent && <p className="text-sm text-muted-foreground">Your generated content will appear here...</p>}
                {generatedContent && <p className="text-sm whitespace-pre-wrap">{generatedContent}</p>}
              </div>
              <div className="flex gap-2">
                  <Button variant="outline" disabled={!generatedContent}><Save className="mr-2 h-4 w-4" /> Save</Button>
                  <Button variant="outline" disabled={!generatedContent}><Printer className="mr-2 h-4 w-4" /> Print</Button>
                  <Button variant="outline" disabled={!generatedContent}><FileAudio className="mr-2 h-4 w-4" /> Convert to Audio</Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="differentiated">
            <Card>
                <CardHeader>
                    <CardTitle>Differentiated Materials Creator</CardTitle>
                    <CardDescription>Upload a textbook page to create worksheets for different grade levels.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Upload Textbook Image</Label>
                        <div className="flex items-center justify-center w-full">
                            <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-accent hover:bg-muted">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                                    <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                    <p className="text-xs text-muted-foreground">PNG, JPG (MAX. 5MB)</p>
                                </div>
                                <Input id="dropzone-file" type="file" className="hidden" />
                            </label>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="grade-level">Grade Level</Label>
                        <Select>
                          <SelectTrigger id="grade-level"><SelectValue placeholder="Select grade" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1-2">Grade 1-2</SelectItem>
                            <SelectItem value="3-4">Grade 3-4</SelectItem>
                            <SelectItem value="5">Grade 5</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="worksheet-type">Worksheet Type</Label>
                        <Select>
                          <SelectTrigger id="worksheet-type"><SelectValue placeholder="Select type" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mcq">Multiple Choice</SelectItem>
                            <SelectItem value="fill-blanks">Fill in the Blanks</SelectItem>
                            <SelectItem value="short-answer">Short Answer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button className="w-full"><Wand2 className="mr-2 h-4 w-4" /> Generate Worksheets</Button>
                </CardContent>
                <CardFooter className="flex flex-col items-start space-y-4">
                    <Label>Generated Worksheets</Label>
                    <div className="w-full p-4 border rounded-md bg-muted/50 min-h-[150px]">
                        <p className="text-sm text-muted-foreground">Generated worksheets will appear here...</p>
                    </div>
                     <div className="flex gap-2">
                        <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Download All (PDF)</Button>
                        <Button variant="outline"><Printer className="mr-2 h-4 w-4" /> Print Selected</Button>
                    </div>
                </CardFooter>
            </Card>
        </TabsContent>
        
        <TabsContent value="visual-aid">
            <Card>
                <CardHeader>
                    <CardTitle>Visual Aid Designer</CardTitle>
                    <CardDescription>Create drawings, charts, and diagrams from a simple text description.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="visual-description">Description</Label>
                        <Textarea 
                            id="visual-description" 
                            placeholder="e.g., A simple diagram of the water cycle with labels for evaporation, condensation, and precipitation." 
                            rows={3}
                            value={visualDescription}
                            onChange={(e) => setVisualDescription(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="visual-style">Style</Label>
                        <Select onValueChange={(v) => setVisualStyle(v as any)} value={visualStyle}>
                            <SelectTrigger id="visual-style"><SelectValue placeholder="Select style" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="hand-drawn">Hand-drawn</SelectItem>
                                <SelectItem value="professional">Professional</SelectItem>
                                <SelectItem value="chalkboard">Chalkboard</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button className="w-full" onClick={handleGenerateVisual} disabled={isGeneratingVisual}>
                      {isGeneratingVisual ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-2 h-4 w-4" />}
                      {isGeneratingVisual ? "Generating..." : "Generate Visual"}
                    </Button>
                </CardContent>
                <CardFooter className="flex flex-col items-start space-y-4">
                    <Label>Generated Visual</Label>
                    <div className="w-full p-4 border rounded-md bg-muted/50 aspect-video flex items-center justify-center">
                        {isGeneratingVisual ? <Skeleton className="h-full w-full" /> : 
                            <Image src={generatedImageUrl} alt="Generated visual aid" width={600} height={400} className="rounded-md" data-ai-hint="water cycle diagram" />
                        }
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" disabled={isGeneratingVisual || generatedImageUrl === "https://placehold.co/600x400.png"}><Download className="mr-2 h-4 w-4" /> Download Image</Button>
                        <Button variant="outline" disabled={isGeneratingVisual || generatedImageUrl === "https://placehold.co/600x400.png"}><Save className="mr-2 h-4 w-4" /> Save</Button>
                        <Button variant="outline" disabled={isGeneratingVisual || generatedImageUrl === "https://placehold.co/600x400.png"}><RefreshCw className="mr-2 h-4 w-4" /> Generate Variations</Button>
                    </div>
                </CardFooter>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
