
"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MoreHorizontal, Search, Trash2, Edit, Send, Loader2, Gamepad2 } from "lucide-react"
import Image from "next/image"
import { useTranslation } from "@/hooks/use-translation"
import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { db } from "@/lib/firebase"
import { collection, query, where, onSnapshot, doc, deleteDoc, addDoc, serverTimestamp, updateDoc, arrayUnion } from "firebase/firestore"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"

interface Content {
  id: string
  title: string
  type: 'Story' | 'Explanation' | 'Worksheet' | 'Visual' | 'Game'
  date: string
  content: string; // Will be text or a data URI for images
  createdAt: any
}

interface Student {
  id: string
  name: string
}

export default function MyContentPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [content, setContent] = useState<Content[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [students, setStudents] = useState<Student[]>([])
  const [isLoadingStudents, setIsLoadingStudents] = useState(true)

  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [contentToAssign, setContentToAssign] = useState<Content | null>(null)
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [isAssigning, setIsAssigning] = useState(false)

  useEffect(() => {
    if (!user || !db) return

    setIsLoading(true)
    const q = query(collection(db, "content"), where("teacherId", "==", user.uid))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedContent: Content[] = snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          title: data.title,
          type: data.type,
          content: data.content,
          date: data.createdAt ? format(data.createdAt.toDate(), "yyyy-MM-dd") : "N/A",
          createdAt: data.createdAt
        }
      })
      fetchedContent.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
      setContent(fetchedContent)
      setIsLoading(false)
    })
    return () => unsubscribe()
  }, [user])

  useEffect(() => {
    if (!user || !db) return

    setIsLoadingStudents(true)
    const studentsQuery = query(collection(db, "users"), where("role", "==", "student"), where("teacherId", "==", user.uid))
    const unsubscribe = onSnapshot(studentsQuery, (querySnapshot) => {
      const studentsData: Student[] = []
      querySnapshot.forEach((doc) => {
        if (doc.data().name) {
          studentsData.push({ id: doc.id, name: doc.data().name })
        }
      })
      setStudents(studentsData)
      setIsLoadingStudents(false)
    })
    return () => unsubscribe()
  }, [user])

  const handleDelete = async (contentId: string) => {
    if (!db) return
    if (confirm(t("Are you sure you want to delete this content?"))) {
      try {
        await deleteDoc(doc(db, "content", contentId))
        toast({ title: t("Content deleted") })
      } catch (error) {
        console.error("Error deleting content:", error)
        toast({ title: t("Error"), description: t("Failed to delete content."), variant: "destructive" })
      }
    }
  }

  const openAssignDialog = (content: Content) => {
    setContentToAssign(content)
    setSelectedStudents([])
    setIsAssignDialogOpen(true)
  }

  const handleAssignContent = async () => {
    if (!contentToAssign || selectedStudents.length === 0 || !user || !db) return

    setIsAssigning(true)
    try {
      const assignmentPromises = selectedStudents.map(studentId => {
        return addDoc(collection(db, "assignments"), {
          teacherId: user.uid,
          studentId: studentId,
          contentId: contentToAssign.id,
          contentType: contentToAssign.type,
          contentTitle: contentToAssign.title,
          status: 'assigned',
          assignedAt: serverTimestamp(),
        })
      })
      await Promise.all(assignmentPromises)

      // Add student IDs to the content document for read permissions
      const contentRef = doc(db, "content", contentToAssign.id);
      await updateDoc(contentRef, {
        assignedStudentIds: arrayUnion(...selectedStudents)
      });
      
      toast({
        title: t("Content Assigned!"),
        description: t("Your students can now see this in their 'My Lessons' section."),
      })
      setIsAssignDialogOpen(false)
    } catch (error) {
      console.error("Error assigning content:", error)
      toast({ title: t("Error"), description: t("Failed to assign content."), variant: "destructive" })
    } finally {
      setIsAssigning(false)
    }
  }

  const stories = content.filter(c => c.type === 'Story' || c.type === 'Explanation')
  const worksheets = content.filter(c => c.type === 'Worksheet')
  const visuals = content.filter(c => c.type === 'Visual')
  const games = content.filter(c => c.type === 'Game')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">{t("My Content")}</h1>
        <p className="text-muted-foreground">{t("All your saved creations in one place.")}</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder={t("Search content...")} className="pl-10" />
      </div>

      <Tabs defaultValue="stories" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="stories">{t("Stories & Explanations")}</TabsTrigger>
          <TabsTrigger value="worksheets">{t("Worksheets")}</TabsTrigger>
          <TabsTrigger value="visuals">{t("Visual Aids")}</TabsTrigger>
          <TabsTrigger value="games">{t("Games")}</TabsTrigger>
        </TabsList>

        <TabsContent value="stories">
          <Card>
            <CardHeader><CardTitle>{t("Stories & Explanations")}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {isLoading ? <Skeleton className="h-20 w-full" /> : stories.length > 0 ? (
                stories.map(item => <ContentListItem key={item.id} item={item} onAssign={() => openAssignDialog(item)} onDelete={() => handleDelete(item.id)} />)
              ) : <p className="text-muted-foreground text-center p-4">{t("No stories or explanations saved yet.")}</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="worksheets">
          <Card>
            <CardHeader><CardTitle>{t("Generated Worksheets")}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
               {isLoading ? <Skeleton className="h-20 w-full" /> : worksheets.length > 0 ? (
                worksheets.map(item => <ContentListItem key={item.id} item={item} onAssign={() => openAssignDialog(item)} onDelete={() => handleDelete(item.id)} />)
              ) : <p className="text-muted-foreground text-center p-4">{t("No worksheets saved yet.")}</p>}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="visuals">
          <Card>
            <CardHeader><CardTitle>{t("Saved Visual Aids")}</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {isLoading ? <Skeleton className="h-40 w-full" /> : visuals.length > 0 ? (
                visuals.map(item => <VisualListItem key={item.id} item={item} onAssign={() => openAssignDialog(item)} onDelete={() => handleDelete(item.id)} />)
              ) : <p className="text-muted-foreground text-center p-4 col-span-full">{t("No visuals saved yet.")}</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="games">
            <Card>
                <CardHeader><CardTitle>{t("Saved Games")}</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                {isLoading ? <Skeleton className="h-20 w-full" /> : games.length > 0 ? (
                    games.map(item => <ContentListItem key={item.id} item={item} onAssign={() => openAssignDialog(item)} onDelete={() => handleDelete(item.id)} />)
                ) : <p className="text-muted-foreground text-center p-4">{t("No games saved yet.")}</p>}
                </CardContent>
            </Card>
        </TabsContent>

      </Tabs>

      {/* Assign Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("Assign Content")}</DialogTitle>
            <DialogDescription>{t("Select students to assign this practice material to.")}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <h4 className="font-medium text-sm mb-2">{t("Content")}: <span className="font-normal">{contentToAssign?.title}</span></h4>
            {isLoadingStudents ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : (
              <ScrollArea className="h-72 w-full rounded-md border">
                <div className="p-4 space-y-2">
                   {students.map(student => (
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
              </ScrollArea>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>{t("Cancel")}</Button>
            <Button onClick={handleAssignContent} disabled={isAssigning || selectedStudents.length === 0}>
              {isAssigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("Assign to {{count}} student(s)", { count: selectedStudents.length })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ContentListItem({ item, onAssign, onDelete }: { item: Content, onAssign: () => void, onDelete: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent">
      <div>
        <h3 className="font-semibold">{t(item.title)}</h3>
        <p className="text-sm text-muted-foreground">
          <Badge variant="outline" className="mr-2">{t(item.type)}</Badge>
          {t("Saved on {{date}}", { date: item.date })}
        </p>
      </div>
      <ItemActions onAssign={onAssign} onDelete={onDelete} />
    </div>
  )
}

function VisualListItem({ item, onAssign, onDelete }: { item: Content, onAssign: () => void, onDelete: () => void }) {
  const { t } = useTranslation()
  return (
    <Card>
      <CardContent className="p-0">
        <Image src={item.content} alt={item.title} width={400} height={200} className="rounded-t-lg object-cover aspect-video" data-ai-hint="lesson visual" />
      </CardContent>
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold">{t(item.title)}</h3>
            <p className="text-sm text-muted-foreground">{t("Saved on {{date}}", { date: item.date })}</p>
          </div>
          <ItemActions onAssign={onAssign} onDelete={onDelete} />
        </div>
      </div>
    </Card>
  )
}

function ItemActions({ onAssign, onDelete }: { onAssign: () => void, onDelete: () => void }) {
    const { t } = useTranslation()
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem onClick={onAssign}><Send className="mr-2 h-4 w-4" /> {t("Assign")}</DropdownMenuItem>
                <DropdownMenuItem><Edit className="mr-2 h-4 w-4" /> {t("Edit")}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={onDelete}>
                  <Trash2 className="mr-2 h-4 w-4" /> {t("Delete")}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
