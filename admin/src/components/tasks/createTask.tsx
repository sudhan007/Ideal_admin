import React, { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Calendar, Upload, X, FileText, Image, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { _axios } from '@/lib/axios'
import { toast } from 'sonner'

interface CreateEditTaskProps {
  courseId: string
  lessonId: string
  chapterId: string
  taskId?: string
  taskData?: any
}

interface TaskFormData {
  taskName: string
  taskDescription: string
  dueDateTime: string
  fileType: 'PDF' | 'IMAGE'
  taskImage?: FileList | File[]
  taskPdf?: File
}

interface TaskData {
  _id: string
  taskName: string
  taskDescription: string
  dueDateTime: string
  fileType: 'PDF' | 'IMAGE'
  fileUrls: string[]
}

const CreateEditTask: React.FC<CreateEditTaskProps> = ({
  courseId,
  lessonId,
  chapterId,
  taskId,
  taskData,
}) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [imagePreview, setImagePreview] = useState<string[]>([])
  const [pdfPreview, setPdfPreview] = useState<string | null>(null)
  const [existingFiles, setExistingFiles] = useState<string[]>([])

  const isEditMode = !!taskId

  const form = useForm<TaskFormData>({
    defaultValues: {
      taskName: '',
      taskDescription: '',
      dueDateTime: '',
      fileType: 'IMAGE',
    },
  })

  const fileType = form.watch('fileType')

  // Fetch task data for edit mode
  // const { data: taskData, isLoading: isLoadingData } = useQuery({
  //   queryKey: ['task', taskId],
  //   queryFn: async () => {
  //     const params = new URLSearchParams({ taskId: taskId! })
  //     const response = await _axios.get(`/task?${params.toString()}`)
  //     return response.data as TaskData
  //   },
  //   enabled: isEditMode && !!taskId,
  // })

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await _axios.post('/task', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    },
    onSuccess: () => {
      toast('Task created successfully')
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      navigateBack()
    },
    onError: (error: any) => {
      toast(error.response?.data?.error || 'Failed to create task')
    },
  })

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await _axios.put(`/task/${taskId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    },
    onSuccess: () => {
      toast('Task updated successfully')
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['task', taskId] })
      navigateBack()
    },
    onError: (error: any) => {
      toast(error.response?.data?.error || 'Failed to create task')
    },
  })

  // Populate form with existing data
  useEffect(() => {
    if (taskData && isEditMode) {
      form.reset({
        taskName: taskData.taskName,
        taskDescription: taskData.taskDescription,
        dueDateTime: new Date(taskData.dueDateTime).toISOString().slice(0, 16),
        fileType: taskData.fileType,
      })

      setExistingFiles(taskData.fileUrls)
      if (taskData.fileType === 'IMAGE') {
        setImagePreview(taskData.fileUrls)
      } else {
        setPdfPreview(taskData.fileUrls[0])
      }
    }
  }, [taskData, isEditMode, form])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const fileArray = Array.from(files)
    const previews = fileArray.map((file) => URL.createObjectURL(file))
    setImagePreview(previews)
    setPdfPreview(null)
    setExistingFiles([])
  }

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setPdfPreview(file.name)
    setImagePreview([])
    setExistingFiles([])
  }

  const removeImage = (index: number) => {
    const newPreviews = imagePreview.filter((_, i) => i !== index)
    setImagePreview(newPreviews)

    if (index < existingFiles.length) {
      const newExistingFiles = existingFiles.filter((_, i) => i !== index)
      setExistingFiles(newExistingFiles)
    }
  }

  const removePdf = () => {
    setPdfPreview(null)
    setExistingFiles([])
  }

  const navigateBack = () => {
    navigate({
      to: '/tasks',
      search: {
        courseId,
        chapterId,
        lessonId,
        mode: 'list',
      },
    })
  }

  const onSubmit = async (data: TaskFormData) => {
    const formData = new FormData()
    formData.append('courseId', courseId)
    formData.append('chapterId', chapterId)
    formData.append('lessonId', lessonId)
    formData.append('taskName', data.taskName)
    formData.append('taskDescription', data.taskDescription)
    formData.append('dueDateTime', new Date(data.dueDateTime).toISOString())
    formData.append('fileType', data.fileType)

    // Handle file uploads based on type
    if (data.fileType === 'IMAGE' && data.taskImage) {
      const files = Array.from(data.taskImage)
      files.forEach((file) => {
        formData.append('taskImage', file)
      })
    } else if (data.fileType === 'PDF' && data.taskPdf) {
      formData.append('taskPdf', data.taskPdf)
    }

    if (isEditMode) {
      updateTaskMutation.mutate(formData)
    } else {
      createTaskMutation.mutate(formData)
    }
  }

  const isLoading = createTaskMutation.isPending || updateTaskMutation.isPending

  // if (isLoadingData) {
  //   return (
  //     <div className="flex items-center justify-center h-screen">
  //       <Loader2 className="h-8 w-8 animate-spin" />
  //     </div>
  //   )
  // }

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>{isEditMode ? 'Edit Task' : 'Create New Task'}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="taskName"
                rules={{ required: 'Task name is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter task name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="taskDescription"
                rules={{ required: 'Task description is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter task description"
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDateTime"
                rules={{ required: 'Due date and time is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date & Time</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type="datetime-local" {...field} />
                        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fileType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>File Type</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value)
                        setImagePreview([])
                        setPdfPreview(null)
                        setExistingFiles([])
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select file type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="IMAGE">
                          <div className="flex items-center gap-2">
                            <Image className="h-4 w-4" />
                            <span>Images</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="PDF">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span>PDF</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose whether to upload images or a PDF file
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {fileType === 'IMAGE' && (
                <FormField
                  control={form.control}
                  name="taskImage"
                  rules={{
                    validate: () => {
                      if (!isEditMode && imagePreview.length === 0) {
                        return 'At least one image is required'
                      }
                      if (
                        isEditMode &&
                        imagePreview.length === 0 &&
                        existingFiles.length === 0
                      ) {
                        return 'At least one image is required'
                      }
                      return true
                    },
                  }}
                  render={({ field: { onChange, value, ...field } }) => (
                    <FormItem>
                      <FormLabel>Upload Images</FormLabel>
                      <FormControl>
                        <div className="space-y-4">
                          <div className="flex items-center justify-center w-full">
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="h-8 w-8 mb-2 text-gray-400" />
                                <p className="mb-2 text-sm text-gray-500">
                                  <span className="font-semibold">
                                    Click to upload
                                  </span>{' '}
                                  or drag and drop
                                </p>
                                <p className="text-xs text-gray-500">
                                  PNG, JPG, GIF (MAX. 5MB each)
                                </p>
                              </div>
                              <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                multiple
                                onChange={(e) => {
                                  handleImageChange(e)
                                  onChange(e.target.files)
                                }}
                                {...field}
                              />
                            </label>
                          </div>

                          {imagePreview.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              {imagePreview.map((preview, index) => (
                                <div key={index} className="relative group">
                                  <img
                                    src={preview}
                                    alt={`Preview ${index + 1}`}
                                    className="w-full h-32 object-cover rounded-lg"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {fileType === 'PDF' && (
                <FormField
                  control={form.control}
                  name="taskPdf"
                  rules={{
                    validate: () => {
                      if (!isEditMode && !pdfPreview) {
                        return 'PDF file is required'
                      }
                      if (
                        isEditMode &&
                        !pdfPreview &&
                        existingFiles.length === 0
                      ) {
                        return 'PDF file is required'
                      }
                      return true
                    },
                  }}
                  render={({ field: { onChange, value, ...field } }) => (
                    <FormItem>
                      <FormLabel>Upload PDF</FormLabel>
                      <FormControl>
                        <div className="space-y-4">
                          <div className="flex items-center justify-center w-full">
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <FileText className="h-8 w-8 mb-2 text-gray-400" />
                                <p className="mb-2 text-sm text-gray-500">
                                  <span className="font-semibold">
                                    Click to upload
                                  </span>{' '}
                                  or drag and drop
                                </p>
                                <p className="text-xs text-gray-500">
                                  PDF (MAX. 10MB)
                                </p>
                              </div>
                              <input
                                type="file"
                                className="hidden"
                                accept="application/pdf"
                                onChange={(e) => {
                                  handlePdfChange(e)
                                  onChange(e.target.files?.[0])
                                }}
                                {...field}
                              />
                            </label>
                          </div>

                          {pdfPreview && (
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <FileText className="h-8 w-8 text-red-500" />
                                <span className="text-sm font-medium">
                                  {pdfPreview}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={removePdf}
                                className="p-1 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                              >
                                <X className="h-5 w-5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={navigateBack}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={form.handleSubmit(onSubmit)}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isEditMode ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>{isEditMode ? 'Update Task' : 'Create Task'}</>
                  )}
                </Button>
              </div>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

export default CreateEditTask
