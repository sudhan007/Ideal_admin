// src/routes/courses/$id/chapters.tsx
import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { _axios } from '@/lib/axios'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Pencil, ArrowBigLeft } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useState } from 'react'
import { toast } from 'sonner'
import { Route as ChapterRoute } from './$chapterId'

// Define types (adjust as per your actual types)
interface Chapter {
  _id: string
  chapterName: string
  chapterDescription?: string
  order?: number
  courseId: string
}

type FormData = {
  chapterName: string
  chapterDescription: string
  order?: number
}

export const Route = createFileRoute('/courses/$id/chapters')({
  component: ChaptersPage,
})

function ChaptersPage() {
  const { id: courseId } = Route.useParams()
  const { chapterId } = ChapterRoute?.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null)
  const [formData, setFormData] = useState<FormData>({
    chapterName: '',
    chapterDescription: '',
    order: undefined,
  })

  // Fetch chapters
  const { data: chapters = [], isLoading: chaptersLoading } = useQuery<
    Chapter[]
  >({
    queryKey: ['chapters', courseId],
    queryFn: async () => {
      const res = await _axios.get(`/chapters/${courseId}`)
      const chaptersData = res.data.chapters || res.data
      return chaptersData
    },
  })

  // Mutation for create chapter
  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await _axios.post('/chapters', {
        courseId,
        chapterName: data.chapterName,
        chapterDescription: data.chapterDescription,
        order: data.order,
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chapters', courseId] })
      setIsDialogOpen(false)
      setFormData({ chapterName: '', chapterDescription: '' })
      toast.success('Chapter created successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create chapter')
    },
  })

  // Mutation for update chapter
  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!editingChapter) return
      const res = await _axios.put(`/chapters/${editingChapter._id}`, {
        courseId,
        chapterName: data.chapterName,
        chapterDescription: data.chapterDescription,
        order: data.order,
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chapters', courseId] })
      setIsDialogOpen(false)
      setEditingChapter(null)
      setFormData({ chapterName: '', chapterDescription: '', order: undefined })
      toast.success('Chapter updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update chapter')
    },
  })

  const handleOpenDialog = (chapter?: Chapter) => {
    if (chapter) {
      setEditingChapter(chapter)
      setFormData({
        chapterName: chapter.chapterName,
        chapterDescription: chapter.chapterDescription || '',
        order: chapter.order,
      })
    } else {
      setEditingChapter(null)
      setFormData({ chapterName: '', chapterDescription: '', order: undefined })
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingChapter) {
      updateMutation.mutate(formData)
    } else {
      createMutation.mutate(formData)
    }
  }

  console.log(chapters.length > 0, chapterId === 'new', chapterId)
  if (chapters.length > 0 && chapterId === 'new') {
    navigate({ to: `/courses/${courseId}/chapters/${chapters[0]._id}` })
  }

  return (
    <>
      <div className="p-2 flex flex-col">
        {/* Header */}
        <div className="mb-3 flex justify-between items-center">
          <Button
            onClick={() =>
              navigate({
                to: '/courses',
                search: {
                  page: 1,
                  search: '',
                  sortBy: 'createdAt',
                  sortOrder: 'desc',
                },
              })
            }
            variant="outline"
            className="rounded-xsm hover:text-foreground text-foreground  cursor-pointer hover:bg-accent/50"
          >
            <ArrowBigLeft className="mr-2 h-4 w-4" /> Back to Courses
          </Button>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 min-h-[75vh] overflow-auto">
          {/* Chapters Sidebar */}
          <div className="flex flex-col h-full bg-sidebar text-foreground">
            <header className="flex justify-between items-center p-4 ">
              <h5 className="font-medium ">Chapters</h5>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => handleOpenDialog()}
                    className=" rounded-xsm cursor-pointer"
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add Chapter
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>
                      {editingChapter ? 'Edit Chapter' : 'Add New Chapter'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingChapter
                        ? 'Update the chapter details below.'
                        : 'Fill in the details to create a new chapter.'}
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="chapterName">Chapter Name</Label>
                        <Input
                          id="chapterName"
                          value={formData.chapterName}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              chapterName: e.target.value,
                            })
                          }
                          className="text-foreground h-10 rounded-xsm"
                          placeholder="Enter chapter name"
                          required
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="chapterDescription">Description</Label>
                        <Textarea
                          id="chapterDescription"
                          value={formData.chapterDescription}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              chapterDescription: e.target.value,
                            })
                          }
                          className="text-foreground  rounded-xsm"
                          placeholder="Optional description"
                          rows={3}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="order">Order</Label>
                        <Input
                          id="order"
                          type="number"
                          value={formData.order}
                          className="text-foreground h-10 rounded-xsm"
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              order: Number(e.target.value),
                            })
                          }
                          placeholder="Enter order"
                          required
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <DialogClose asChild>
                        <Button
                          className="hover:text-foreground cursor-pointer rounded-xsm"
                          variant="outline"
                          type="button"
                        >
                          Cancel
                        </Button>
                      </DialogClose>
                      <Button
                        className="hover:text-background! cursor-pointer text-background rounded-xsm px-5"
                        // type="submit"
                        // disabled={createMutation.isPending || updateMutation.isPending}
                      >
                        {createMutation.isPending || updateMutation.isPending
                          ? 'Saving...'
                          : 'Create'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </header>

            {chaptersLoading ? (
              <div className="p-4 text-center">Loading chapters...</div>
            ) : (
              <ul className="flex-1 overflow-auto flex flex-col p-2 gap-3">
                {chapters.length === 0 ? (
                  <li className="p-4 text-center text-foreground">
                    No chapters yet. Add one to get started!
                  </li>
                ) : (
                  chapters.map((chapter) => (
                    <li
                      key={chapter._id}
                      className={`flex items-center justify-between p-3 bg-accent hover:bg-foreground/10 cursor-pointer ${chapter._id === chapterId ? 'bg-accent border-foreground border-[0.1px] rounded-xsm' : ''}`}
                      onClick={() =>
                        navigate({
                          to: `/courses/${courseId}/chapters/${chapter._id}`,
                        })
                      }
                    >
                      <span className="capitalize">{chapter.chapterName}</span>
                      <div className="">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenDialog(chapter)
                          }}
                          className="cursor-pointer hover:text-foreground text-foreground"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>

          {/* Outlet for chapter details */}
          <div className="flex flex-col h-full xl:col-span-2 bg-sidebar">
            <Outlet />
          </div>
        </div>
      </div>
    </>
  )
}
