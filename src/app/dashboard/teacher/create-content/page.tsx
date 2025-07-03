
"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Mic, UploadCloud, Image as ImageIcon, Wand2, Save, Printer, FileAudio, Download, RefreshCw, Loader2, X, Gamepad2 } from "lucide-react"
import Image from "next/image"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { generateHyperLocalContent } from "@/ai/flows/generate-hyper-local-content"
import { designVisualAid } from "@/ai/flows/design-visual-aid"
import { extractTextFromImage, generateWorksheet } from "@/ai/flows/generate-worksheet"
import { generateGame, GameData } from "@/ai/flows/generate-quiz"
import { Skeleton } from "@/components/ui/skeleton"
import { marked } from "marked"
import { useTranslation } from "@/hooks/use-translation"
import { useAuth } from "@/hooks/use-auth"
import { db } from "@/lib/firebase"
import { addDoc, collection, serverTimestamp } from "firebase/firestore"

export default function CreateContentPage() {
  const { toast } = useToast()
  const { t, language } = useTranslation()
  const { user } = useAuth()

  // State for Hyper-Local Content
  const [contentText, setContentText] = useState("")
  const [contentType, setContentType] = useState("")
  const [generatedContent, setGeneratedContent] = useState("")
  const [isGeneratingContent, setIsGeneratingContent] = useState(false)
  const [isSavingContent, setIsSavingContent] = useState(false)

  // State for Visual Aid Designer
  const [visualDescription, setVisualDescription] = useState("")
  const [visualStyle, setVisualStyle] = useState<'hand-drawn' | 'professional' | 'chalkboard'>("hand-drawn")
  const [generatedImageUrl, setGeneratedImageUrl] = useState("https://placehold.co/600x400.png")
  const [isGeneratingVisual, setIsGeneratingVisual] = useState(false)
  const [isSavingVisual, setIsSavingVisual] = useState(false)

  // State for Differentiated Materials
  const [textbookImageDataUri, setTextbookImageDataUri] = useState<string | null>(null)
  const [extractedText, setExtractedText] = useState("")
  const [isExtractingText, setIsExtractingText] = useState(false)
  const [gradeLevel, setGradeLevel] = useState("")
  const [worksheetType, setWorksheetType] = useState<"mcq" | "fill-blanks" | "short-answer" | "">("")
  const [generatedWorksheet, setGeneratedWorksheet] = useState("")
  const [isGeneratingWorksheet, setIsGeneratingWorksheet] = useState(false)
  const [isSavingWorksheet, setIsSavingWorksheet] = useState(false)

  // State for Game Generator
  const [gameTopic, setGameTopic] = useState("")
  const [gameGradeLevel, setGameGradeLevel] = useState("")
  const [generatedGame, setGeneratedGame] = useState<GameData | null>(null)
  const [isGeneratingGame, setIsGeneratingGame] = useState(false)
  const [isSavingGame, setIsSavingGame] = useState(false)
  
  const handleGenerateContent = async () => {
    if (!contentText || !contentType) {
      toast({
        title: t("Missing Information"),
        description: t("Please fill out all fields to generate content."),
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
        outputLanguage: language,
      })
      setGeneratedContent(result.generatedContent)
    } catch (error) {
      console.error(error)
      toast({
        title: t("Error Generating Content"),
        description: t("Something went wrong. Please try again. You may need to add your Gemini API key."),
        variant: "destructive",
      })
    } finally {
      setIsGeneratingContent(false)
    }
  }

  const handleSaveContent = async () => {
    if (!generatedContent || !user || !db) return
    setIsSavingContent(true)
    try {
        const docRef = await addDoc(collection(db, "content"), {
            teacherId: user.uid,
            type: contentType === 'story' ? 'Story' : 'Explanation',
            title: contentText.substring(0, 50) + (contentText.length > 50 ? "..." : ""),
            content: generatedContent,
            createdAt: serverTimestamp(),
            language: language,
        })
        toast({ title: t("Content Saved!"), description: t("You can now assign it from 'My Content'.")})
    } catch (error) {
        console.error("Error saving content:", error)
        toast({ title: t("Error"), description: t("Failed to save content."), variant: "destructive"})
    } finally {
        setIsSavingContent(false)
    }
  }
  
  const handleGenerateVisual = async () => {
     if (!visualDescription) {
      toast({
        title: t("Missing Description"),
        description: t("Please provide a description for the visual aid."),
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
        title: t("Error Generating Visual"),
        description: t("Something went wrong. Please try again. You may need to add your Gemini API key."),
        variant: "destructive",
      })
      setGeneratedImageUrl("https://placehold.co/600x400.png")
    } finally {
      setIsGeneratingVisual(false)
    }
  }

  const handleSaveVisual = async () => {
    if (generatedImageUrl === "https://placehold.co/600x400.png" || !user || !db) return
    setIsSavingVisual(true)
    try {
        await addDoc(collection(db, "content"), {
            teacherId: user.uid,
            type: 'Visual',
            title: visualDescription.substring(0, 50) + (visualDescription.length > 50 ? "..." : ""),
            content: generatedImageUrl, // Saving data URI
            createdAt: serverTimestamp(),
        })
        toast({ title: t("Visual Saved!"), description: t("You can now assign it from 'My Content'.")})
    } catch (error) {
        console.error("Error saving visual:", error)
        toast({ title: t("Error"), description: t("Failed to save visual aid."), variant: "destructive"})
    } finally {
        setIsSavingVisual(false)
    }
  }


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUri = e.target?.result as string;
        setTextbookImageDataUri(dataUri);
        setIsExtractingText(true);
        setExtractedText("");
        setGeneratedWorksheet("");
        try {
          const result = await extractTextFromImage({ imageDataUri: dataUri });
          setExtractedText(result.extractedText);
        } catch (error) {
          console.error(error);
          toast({
            title: t("Error Extracting Text"),
            description: t("Could not read text from the image. Please try another image."),
            variant: "destructive",
          });
          setTextbookImageDataUri(null);
        } finally {
          setIsExtractingText(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateWorksheet = async () => {
    if (!extractedText || !gradeLevel || !worksheetType) {
        toast({
            title: t("Missing Information"),
            description: t("Please ensure text is extracted and you've selected a grade and worksheet type."),
            variant: "destructive",
        });
        return;
    }
    setIsGeneratingWorksheet(true);
    setGeneratedWorksheet("");
    try {
        const result = await generateWorksheet({
            text: extractedText,
            gradeLevel,
            worksheetType,
        });
        setGeneratedWorksheet(result.worksheetContent);
    } catch (error) {
        console.error(error);
        toast({
            title: t("Error Generating Worksheet"),
            description: t("Something went wrong. Please try again."),
            variant: "destructive",
        });
    } finally {
        setIsGeneratingWorksheet(false);
    }
  };

  const handleSaveWorksheet = async () => {
    if (!generatedWorksheet || !user || !db) return
    setIsSavingWorksheet(true)
    try {
        await addDoc(collection(db, "content"), {
            teacherId: user.uid,
            type: 'Worksheet',
            title: `Worksheet for ${gradeLevel} (${worksheetType})`,
            content: generatedWorksheet,
            originalText: extractedText,
            createdAt: serverTimestamp(),
        })
        toast({ title: t("Worksheet Saved!"), description: t("You can now assign it from 'My Content'.")})
    } catch (error) {
        console.error("Error saving worksheet:", error)
        toast({ title: t("Error"), description: t("Failed to save worksheet."), variant: "destructive"})
    } finally {
        setIsSavingWorksheet(false)
    }
  }

  const handleGenerateGame = async () => {
    if (!gameTopic || !gameGradeLevel) {
        toast({
            title: t("Missing Information"),
            description: t("Please enter a topic and select a grade level."),
            variant: "destructive",
        });
        return;
    }
    setIsGeneratingGame(true);
    setGeneratedGame(null);
    try {
        const result = await generateGame({
            topic: gameTopic,
            gradeLevel: gameGradeLevel,
        });
        setGeneratedGame(result);
    } catch (error) {
        console.error(error);
        toast({
            title: t("Error Generating Game"),
            description: t("Something went wrong. Please try again. You may need to add your Gemini API key."),
            variant: "destructive",
        });
    } finally {
        setIsGeneratingGame(false);
    }
  };

  const handleSaveGame = async () => {
    if (!generatedGame || !user || !db) return;
    setIsSavingGame(true);
    try {
        await addDoc(collection(db, "content"), {
            teacherId: user.uid,
            type: 'Game',
            title: generatedGame.title,
            content: JSON.stringify(generatedGame), // Store game config as a JSON string
            createdAt: serverTimestamp(),
        });
        toast({ title: t("Game Saved!"), description: t("You can now assign it from 'My Content'.")});
    } catch (error) {
        console.error("Error saving game:", error);
        toast({ title: t("Error"), description: t("Failed to save game."), variant: "destructive"});
    } finally {
        setIsSavingGame(false);
    }
  };


  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-3xl font-bold font-headline">{t("Create Content")}</h1>
        <p className="text-muted-foreground">{t("Your creative toolkit for the classroom.")}</p>
      </div>
      <Tabs defaultValue="hyper-local" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="hyper-local">{t("Hyper-Local Content")}</TabsTrigger>
          <TabsTrigger value="differentiated">{t("Differentiated Materials")}</TabsTrigger>
          <TabsTrigger value="visual-aid">{t("Visual Aid Designer")}</TabsTrigger>
          <TabsTrigger value="game-generator">{t("Game Generator")}</TabsTrigger>
        </TabsList>

        <TabsContent value="hyper-local">
          <Card>
            <CardHeader>
              <CardTitle>{t("Hyper-Local Content Generator")}</CardTitle>
              <CardDescription>{t("Generate stories and explanations tailored to your students' context.")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="content-text">{t("Input Text")}</Label>
                <div className="relative">
                  <Textarea 
                    id="content-text" 
                    placeholder={t("e.g., A story about a monkey in a mango grove near our village...")}
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
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="content-type">{t("Content Type")}</Label>
                  <Select onValueChange={setContentType} value={contentType}>
                    <SelectTrigger id="content-type">
                      <SelectValue placeholder={t("Select type")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="story">{t("Story")}</SelectItem>
                      <SelectItem value="explanation">{t("Explanation")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="w-full" onClick={handleGenerateContent} disabled={isGeneratingContent}>
                {isGeneratingContent ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                {isGeneratingContent ? t("Generating...") : t("Generate Content")}
              </Button>
            </CardContent>
            <CardFooter className="flex flex-col items-start space-y-4">
              <Label>{t("Generated Output")}</Label>
              <div className="w-full p-4 border rounded-md bg-muted/50 min-h-[150px]">
                {isGeneratingContent && <Skeleton className="h-20 w-full" />}
                {!isGeneratingContent && !generatedContent && <p className="text-sm text-muted-foreground">{t("Your generated content will appear here...")}</p>}
                {generatedContent && <p className="text-sm whitespace-pre-wrap">{generatedContent}</p>}
              </div>
              <div className="flex gap-2">
                  <Button variant="outline" onClick={handleSaveContent} disabled={!generatedContent || isSavingContent}>
                    {isSavingContent ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} 
                    {t("Save")}
                  </Button>
                  <Button variant="outline" disabled={!generatedContent}><Printer className="mr-2 h-4 w-4" /> {t("Print")}</Button>
                  <Button variant="outline" disabled={!generatedContent}><FileAudio className="mr-2 h-4 w-4" /> {t("Convert to Audio")}</Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="differentiated">
            <Card>
                <CardHeader>
                    <CardTitle>{t("Differentiated Materials Creator")}</CardTitle>
                    <CardDescription>{t("Upload a textbook page to create worksheets for different grade levels.")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>{t("Upload Textbook Image")}</Label>
                        {textbookImageDataUri ? (
                            <div className="relative">
                                <Image src={textbookImageDataUri} width={600} height={400} alt={t("Textbook page preview")} className="w-full h-auto rounded-md border" />
                                <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => {
                                    setTextbookImageDataUri(null)
                                    setExtractedText("")
                                    setGeneratedWorksheet("")
                                }}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center w-full">
                                <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-accent hover:bg-muted">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                                        <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">{t("Click to upload")}</span> {t("or drag and drop")}</p>
                                        <p className="text-xs text-muted-foreground">{t("PNG, JPG (MAX. 5MB)")}</p>
                                    </div>
                                    <Input id="dropzone-file" type="file" className="hidden" onChange={handleFileChange} accept="image/png, image/jpeg" />
                                </label>
                            </div>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="extracted-text">{t("Extracted Text (Editable)")}</Label>
                        {isExtractingText ? (
                            <Skeleton className="h-32 w-full" />
                        ) : (
                            <Textarea 
                                id="extracted-text" 
                                placeholder={t("Text from your image will appear here...")}
                                rows={8}
                                value={extractedText}
                                onChange={(e) => setExtractedText(e.target.value)}
                                disabled={!textbookImageDataUri || isExtractingText}
                            />
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="grade-level">{t("Grade Level")}</Label>
                        <Select onValueChange={setGradeLevel} value={gradeLevel} disabled={isExtractingText || isGeneratingWorksheet}>
                          <SelectTrigger id="grade-level"><SelectValue placeholder={t("Select grade")} /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1-2">{t("Grade 1-2")}</SelectItem>
                            <SelectItem value="3-4">{t("Grade 3-4")}</SelectItem>
                            <SelectItem value="5">{t("Grade 5")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="worksheet-type">{t("Worksheet Type")}</Label>
                        <Select onValueChange={(v) => setWorksheetType(v as any)} value={worksheetType} disabled={isExtractingText || isGeneratingWorksheet}>
                          <SelectTrigger id="worksheet-type"><SelectValue placeholder={t("Select type")} /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mcq">{t("Multiple Choice")}</SelectItem>
                            <SelectItem value="fill-blanks">{t("Fill in the Blanks")}</SelectItem>
                            <SelectItem value="short-answer">{t("Short Answer")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button className="w-full" onClick={handleGenerateWorksheet} disabled={isExtractingText || isGeneratingWorksheet || !extractedText}>
                        {isGeneratingWorksheet ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                        {isGeneratingWorksheet ? t("Generating Worksheet...") : t("Generate Worksheet")}
                    </Button>
                </CardContent>
                <CardFooter className="flex flex-col items-start space-y-4">
                    <Label>{t("Generated Worksheet")}</Label>
                    <div className="w-full p-4 border rounded-md bg-muted/50 min-h-[150px] prose prose-sm max-w-none">
                        {isGeneratingWorksheet && <Skeleton className="h-24 w-full" />}
                        {!isGeneratingWorksheet && !generatedWorksheet && (
                            <p className="text-sm text-muted-foreground not-prose">{t("Generated worksheet will appear here...")}</p>
                        )}
                        {generatedWorksheet && (
                          <div dangerouslySetInnerHTML={{ __html: marked(generatedWorksheet) as string }} />
                        )}
                    </div>
                     <div className="flex gap-2">
                        <Button variant="outline" onClick={handleSaveWorksheet} disabled={!generatedWorksheet || isSavingWorksheet}>
                            {isSavingWorksheet ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} 
                            {t("Save Worksheet")}
                        </Button>
                        <Button variant="outline" disabled={!generatedWorksheet || isGeneratingWorksheet}><Printer className="mr-2 h-4 w-4" /> {t("Print")}</Button>
                    </div>
                </CardFooter>
            </Card>
        </TabsContent>
        
        <TabsContent value="visual-aid">
            <Card>
                <CardHeader>
                    <CardTitle>{t("Visual Aid Designer")}</CardTitle>
                    <CardDescription>{t("Create drawings, charts, and diagrams from a simple text description.")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="visual-description">{t("Description")}</Label>
                        <Textarea 
                            id="visual-description" 
                            placeholder={t("e.g., A simple diagram of the water cycle with labels for evaporation, condensation, and precipitation.")}
                            rows={3}
                            value={visualDescription}
                            onChange={(e) => setVisualDescription(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="visual-style">{t("Style")}</Label>
                        <Select onValueChange={(v) => setVisualStyle(v as any)} value={visualStyle}>
                            <SelectTrigger id="visual-style"><SelectValue placeholder={t("Select style")} /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="hand-drawn">{t("Hand-drawn")}</SelectItem>
                                <SelectItem value="professional">{t("Professional")}</SelectItem>
                                <SelectItem value="chalkboard">{t("Chalkboard")}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button className="w-full" onClick={handleGenerateVisual} disabled={isGeneratingVisual}>
                      {isGeneratingVisual ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-2 h-4 w-4" />}
                      {isGeneratingVisual ? t("Generating...") : t("Generate Visual")}
                    </Button>
                </CardContent>
                <CardFooter className="flex flex-col items-start space-y-4">
                    <Label>{t("Generated Visual")}</Label>
                    <div className="w-full p-4 border rounded-md bg-muted/50 aspect-video flex items-center justify-center">
                        {isGeneratingVisual ? <Skeleton className="h-full w-full" /> : 
                            <Image src={generatedImageUrl} alt={t("Generated visual aid")} width={600} height={400} className="rounded-md" data-ai-hint="water cycle diagram" />
                        }
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleSaveVisual} disabled={isGeneratingVisual || isSavingVisual || generatedImageUrl === "https://placehold.co/600x400.png"}>
                            {isSavingVisual ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            {t("Save")}
                        </Button>
                        <Button variant="outline" disabled={isGeneratingVisual || generatedImageUrl === "https://placehold.co/600x400.png"}><Download className="mr-2 h-4 w-4" /> {t("Download Image")}</Button>
                        <Button variant="outline" disabled={isGeneratingVisual || generatedImageUrl === "https://placehold.co/600x400.png"}><RefreshCw className="mr-2 h-4 w-4" /> {t("Generate Variations")}</Button>
                    </div>
                </CardFooter>
            </Card>
        </TabsContent>

        <TabsContent value="game-generator">
          <Card>
            <CardHeader>
              <CardTitle>{t("Game Generator")}</CardTitle>
              <CardDescription>{t("Create an interactive game for your students on any topic.")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="game-topic">{t("Game Topic")}</Label>
                <Input 
                  id="game-topic" 
                  placeholder={t("e.g., The Solar System, Indian History, Basic Math")}
                  value={gameTopic}
                  onChange={(e) => setGameTopic(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="game-grade-level">{t("Grade Level")}</Label>
                <Select onValueChange={setGameGradeLevel} value={gameGradeLevel}>
                  <SelectTrigger id="game-grade-level"><SelectValue placeholder={t("Select grade")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Grade 1-2">{t("Grade 1-2")}</SelectItem>
                    <SelectItem value="Grade 3-4">{t("Grade 3-4")}</SelectItem>
                    <SelectItem value="Grade 5">{t("Grade 5")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={handleGenerateGame} disabled={isGeneratingGame}>
                {isGeneratingGame ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Gamepad2 className="mr-2 h-4 w-4" />}
                {isGeneratingGame ? t("Generating Game...") : t("Generate Game")}
              </Button>
            </CardContent>
            <CardFooter className="flex flex-col items-start space-y-4">
              <Label>{t("Generated Game Preview")}</Label>
              <div className="w-full p-4 border rounded-md bg-muted/50 min-h-[150px]">
                {isGeneratingGame && <Skeleton className="h-24 w-full" />}
                {!isGeneratingGame && !generatedGame && (
                    <p className="text-sm text-muted-foreground">{t("Your generated game will appear here...")}</p>
                )}
                {generatedGame && (
                    <div className="space-y-2 text-sm">
                        <p className="font-bold">{generatedGame.title}</p>
                        <p className="text-muted-foreground">{t("{{count}} questions generated.", { count: generatedGame.questions.length })}</p>
                    </div>
                )}
              </div>
              <div className="flex gap-2">
                  <Button variant="outline" onClick={handleSaveGame} disabled={!generatedGame || isSavingGame}>
                    {isSavingGame ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} 
                    {t("Save Game")}
                  </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  )
}
