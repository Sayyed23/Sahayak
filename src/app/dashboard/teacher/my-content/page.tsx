import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MoreHorizontal, Search, Trash2, Edit, Download } from "lucide-react"
import Image from "next/image"

const stories = [
  { title: "The Monkey and The River", type: "Story", date: "2023-10-26" },
  { title: "Explanation of Photosynthesis", type: "Explanation", date: "2023-10-24" },
]
const worksheets = [
  { title: "Addition Practice (Grade 2)", subject: "Math", date: "2023-10-25" },
  { title: "Hindi Alphabet Worksheet", subject: "Language", date: "2023-10-22" },
]
const visuals = [
  { title: "Water Cycle Diagram", filetype: "PNG", date: "2023-10-23", src: "https://placehold.co/400x200.png", hint: "water cycle" },
  { title: "Solar System Chart", filetype: "JPG", date: "2023-10-20", src: "https://placehold.co/400x200.png", hint: "solar system" },
]

export default function MyContentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">My Content</h1>
        <p className="text-muted-foreground">All your saved creations in one place.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search content..." className="pl-10" />
      </div>

      <Tabs defaultValue="stories" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="stories">Stories & Explanations</TabsTrigger>
          <TabsTrigger value="worksheets">Generated Worksheets</TabsTrigger>
          <TabsTrigger value="visuals">Saved Visual Aids</TabsTrigger>
        </TabsList>
        <TabsContent value="stories">
          <Card>
            <CardHeader>
              <CardTitle>Stories & Explanations</CardTitle>
              <CardDescription>Your collection of generated narratives and explanations.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {stories.map(item => <ContentListItem key={item.title} {...item} />)}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="worksheets">
          <Card>
            <CardHeader>
              <CardTitle>Generated Worksheets</CardTitle>
              <CardDescription>Your collection of custom worksheets.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {worksheets.map(item => <ContentListItem key={item.title} {...item} />)}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="visuals">
          <Card>
            <CardHeader>
              <CardTitle>Saved Visual Aids</CardTitle>
              <CardDescription>Your collection of generated images and charts.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {visuals.map(item => (
                <Card key={item.title}>
                  <CardContent className="p-0">
                    <Image src={item.src} alt={item.title} width={400} height={200} className="rounded-t-lg object-cover" data-ai-hint={item.hint}/>
                  </CardContent>
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">Saved on {item.date}</p>
                      </div>
                      <ItemActions />
                    </div>
                  </div>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ContentListItem(item: { title: string, type?: string, subject?: string, date: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent">
      <div>
        <h3 className="font-semibold">{item.title}</h3>
        <p className="text-sm text-muted-foreground">
          {item.type && <Badge variant="outline" className="mr-2">{item.type}</Badge>}
          {item.subject && <Badge variant="secondary" className="mr-2">{item.subject}</Badge>}
          Saved on {item.date}
        </p>
      </div>
      <ItemActions />
    </div>
  )
}

function ItemActions() {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                <DropdownMenuItem><Download className="mr-2 h-4 w-4" /> Download</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
