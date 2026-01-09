import { Button } from '@/components/ui/button'
import { _axios } from '@/lib/axios'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  Plus,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  HelpCircle,
} from 'lucide-react'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion' // ← Add this import
import { toast } from 'sonner'

export const Route = createFileRoute('/courses/$id/chapters/$chapterId/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { id: courseId, chapterId } = Route.useParams()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingLesson, setEditingLesson] = useState<any>(null)

  const { data: lessons = [], isLoading } = useQuery({
    queryKey: ['lessons', chapterId],
    queryFn: async () => {
      if (!chapterId || chapterId === 'new') return []
      const res = await _axios.get(`/lessons/${chapterId}`)
      return res.data.lessons || res.data || []
    },
    enabled: !!chapterId && chapterId !== 'new',
  })

  // Mutations (unchanged)
  const createMutation = useMutation({
    mutationFn: (data: any) =>
      _axios.post('/lessons', { ...data, courseId, chapterId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons', chapterId] })
      setIsCreateOpen(false)
      toast.success('Lesson created successfully')
    },
    onError: () => toast.error('Failed to create lesson'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ lessonId, data }: any) =>
      _axios.put(`/lessons/${lessonId}`, { ...data, courseId, chapterId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons', chapterId] })
      setIsEditOpen(false)
      toast.success('Lesson updated successfully')
    },
  })

  const toggleStatusMutation = useMutation({
    mutationFn: (lessonId: string) => _axios.patch(`/lessons/${lessonId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons', chapterId] })
      toast.success('Lesson status updated successfully')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (lessonId: string) => _axios.delete(`/lessons/${lessonId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons', chapterId] })
      toast.success('Lesson deleted successfully')
    },
  })

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      lessonName: formData.get('lessonName') as string,
      order: Number(formData.get('order')),
      duration: Number(formData.get('duration')),
      videoUrl: formData.get('videoUrl') as string,
    }
    createMutation.mutate(data)
  }

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingLesson) return
    const formData = new FormData(e.currentTarget)
    const data = {
      lessonName: formData.get('lessonName') as string,
      order: Number(formData.get('order')),
      duration: Number(formData.get('duration')),
      videoUrl: formData.get('videoUrl') as string,
    }
    updateMutation.mutate({ lessonId: editingLesson._id, data })
  }

  const openEdit = (lesson: any) => {
    setEditingLesson(lesson)
    setIsEditOpen(true)
  }

  if (isLoading)
    return <div className="p-8 text-center">Loading lessons...</div>

  return (
    <div className="">
      <header className="flex justify-between items-center p-4  text-foreground">
        <h5 className="font-medium font-nunito">Lessons</h5>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xsm cursor-pointer">
              <Plus className="mr-2 h-4 w-4" /> Add Lesson
            </Button>
          </DialogTrigger>
          <DialogContent autoFocus={false}>
            <DialogHeader>
              <DialogTitle>Create New Lesson</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="lessonName">Lesson Name</Label>
                  <Input
                    type="text"
                    autoFocus={false}
                    id="lessonName"
                    name="lessonName"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="duration">Duration</Label>
                  <Input id="duration" name="duration" type="number" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="order">Order</Label>
                  <Input
                    id="order"
                    name="order"
                    type="number"
                    defaultValue={lessons.length + 1}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="videoUrl">Video URL</Label>
                  <Input
                    id="videoUrl"
                    name="videoUrl"
                    placeholder="https://..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending}>
                  Create
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      {lessons.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <p>No lessons found. Add one to get started!</p>
        </div>
      ) : (
        <Accordion type="single" collapsible className="w-full px-2 pt-2">
          {lessons.map((lesson: any) => (
            <AccordionItem
              key={lesson._id}
              value={lesson._id}
              className={`mb-2 bg-accent hover:bg-foreground/10 rounded-xsm border-none! overflow-hidden ${
                !lesson.isActive ? 'opacity-60' : ''
              }`}
            >
              <AccordionTrigger
                className={`px-4 py-3 hover:no-underline hover:bg-accent/50 border-none! transition-colors cursor-pointer ${
                  !lesson.isActive ? 'text-muted-foreground' : ''
                }`}
              >
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-3 text-left">
                    <span className="font-medium capitalize text-foreground">
                      {lesson.lessonName}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      (Order: {lesson.order})
                    </span>
                  </div>

                  {/* Action Buttons - Always Visible */}
                  <div
                    className="flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigate({
                          to: '/questions',
                          search: {
                            lessonId: lesson._id,
                            courseId,
                            chapterId,
                            mode: 'create',
                          },
                        })
                      }}
                      className="gap-1.5"
                    >
                      <HelpCircle className="h-4 w-4" />
                      Add Questions
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(lesson)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleStatusMutation.mutate(lesson._id)}
                      disabled={toggleStatusMutation.isPending}
                    >
                      {lesson.isActive ? (
                        <ToggleRight className="h-5 w-5 text-green-600" />
                      ) : (
                        <ToggleLeft className="h-5 w-5 text-red-600" />
                      )}
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Delete "{lesson.lessonName}"?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This action will permanently remove the lesson and
                            its questions.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(lesson._id)}
                            className="bg-destructive text-destructive-foreground"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent className="px-4 pb-4 pt-2 text-foreground ">
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-medium">Status:</span>{' '}
                    {lesson.isActive ? (
                      <span className="text-green-600">Active</span>
                    ) : (
                      <span className="text-red-600">Inactive</span>
                    )}
                  </p>
                  <p>
                    <span className="font-medium">Video URL:</span>{' '}
                    {lesson.videoUrl ? (
                      <a
                        href={lesson.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline hover:text-blue-800"
                      >
                        {lesson.videoUrl}
                      </a>
                    ) : (
                      <span className="text-muted-foreground italic">
                        No video attached
                      </span>
                    )}
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {/* Edit Dialog (unchanged) */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent autoFocus={false}>
          <DialogHeader>
            <DialogTitle>Edit Lesson</DialogTitle>
          </DialogHeader>
          {editingLesson && (
            <form onSubmit={handleUpdate}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-lessonName">Lesson Name</Label>
                  <Input
                    id="edit-lessonName"
                    name="lessonName"
                    defaultValue={editingLesson.lessonName}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-duration">Duration</Label>
                  <Input
                    id="edit-duration"
                    name="duration"
                    type="number"
                    required
                    defaultValue={editingLesson.duration}
                    autoFocus={false}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-order">Order</Label>
                  <Input
                    id="edit-order"
                    name="order"
                    type="number"
                    defaultValue={editingLesson.order}
                    required
                    autoFocus={false}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-videoUrl">Video URL</Label>
                  <Input
                    id="edit-videoUrl"
                    name="videoUrl"
                    defaultValue={editingLesson.videoUrl || ''}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={updateMutation.isPending}>
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
