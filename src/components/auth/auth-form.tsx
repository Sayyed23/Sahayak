"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

const teacherSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  school: z.string().min(3, { message: "School name is required." }),
  language: z.string({ required_error: "Please select a language." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
})

const studentSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  school: z.string().min(3, { message: "School name is required." }),
  grade: z.string().min(1, { message: "Grade is required." }),
  language: z.string({ required_error: "Please select a language." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
})

type UserRole = "teacher" | "student"

export function AuthForm() {
  const router = useRouter()
  const { toast } = useToast()

  const handleFormSubmit = (role: UserRole) => (values: z.infer<typeof teacherSchema> | z.infer<typeof studentSchema>) => {
    console.log(`Submitting for ${role}:`, values)
    toast({
      title: "Login Successful",
      description: `Welcome! Redirecting to your dashboard.`,
    })
    router.push(`/dashboard/${role}`)
  }

  return (
    <Tabs defaultValue="teacher" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="teacher">Teacher</TabsTrigger>
        <TabsTrigger value="student">Student</TabsTrigger>
      </TabsList>
      <TabsContent value="teacher">
        <AuthCard role="teacher" schema={teacherSchema} onSubmit={handleFormSubmit("teacher")} />
      </TabsContent>
      <TabsContent value="student">
        <AuthCard role="student" schema={studentSchema} onSubmit={handleFormSubmit("student")} />
      </TabsContent>
    </Tabs>
  )
}

interface AuthCardProps {
  role: UserRole
  schema: typeof teacherSchema | typeof studentSchema
  onSubmit: (values: any) => void
}

function AuthCard({ role, schema, onSubmit }: AuthCardProps) {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      school: "",
      language: undefined,
      email: "",
      password: "",
      ...(role === "student" && { grade: "" }),
    },
  })

  return (
    <Card>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="school"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>School</FormLabel>
                  <FormControl>
                    <Input placeholder="Your school's name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {role === 'student' && (
              <FormField
                control={form.control}
                name="grade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grade</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 5th" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Local Language</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a language" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="hindi">Hindi</SelectItem>
                      <SelectItem value="bengali">Bengali</SelectItem>
                      <SelectItem value="marathi">Marathi</SelectItem>
                      <SelectItem value="telugu">Telugu</SelectItem>
                      <SelectItem value="tamil">Tamil</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="pt-2">
              <Button type="submit" className="w-full font-bold">
                Login / Sign Up
              </Button>
            </div>
            <div className="text-center text-sm">
                <Link href="#" className="underline text-muted-foreground hover:text-primary">
                    Forgot Password?
                </Link>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
