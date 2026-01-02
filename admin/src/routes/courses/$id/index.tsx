// src/routes/courses/$id.tsx  (or keep as create.tsx if you prefer)
import { createFileRoute, useLocation, useRouter } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { _axios } from '@/lib/axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Upload } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export const Route = createFileRoute('/courses/$id/')({
  component: CreateCoursePage,
})

function CreateCoursePage() {
  const { id } = Route.useParams()
  const location = useLocation()
  const router = useRouter()
  const queryClient = useQueryClient()

  const isEditMode = id !== 'new'
  const stateCourse = isEditMode ? (location.state as any)?.course : null
  console.log(stateCourse, 'stateCourse')
  const [formData, setFormData] = useState({
    courseName: '',
    mentor: '',
    strikePrice: '',
    actualPrice: '',
    board: '',
    grade: '',
    bannerImage: null as File | null,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const goBack = () => {
    router.history.back()
  }

  // Fetch mentors
  const { data: mentors = [], isLoading: mentorsLoading } = useQuery({
    queryKey: ['mentors'],
    queryFn: async () => {
      const res = await _axios.get('/staffs')
      return res.data.staffs || res.data
    },
  })

  // Prefill form on edit
  useEffect(() => {
    if (isEditMode && stateCourse && mentors.length > 0) {
      setFormData({
        courseName: stateCourse.courseName || '',
        mentor: stateCourse.mentor?.id || '',
        strikePrice: stateCourse.strikePrice || '',
        actualPrice: stateCourse.actualPrice || '',
        board: stateCourse.board || '',
        grade: stateCourse.grade || '',
        bannerImage: null,
      })
      setPreviewImage(stateCourse.bannerImage || null)
    }
  }, [isEditMode, stateCourse, mentors])
  console.log(formData)
  const mutation = useMutation({
    mutationFn: async () => {
      const data = new FormData()
      data.append('courseName', formData.courseName)
      if (formData.mentor) data.append('mentor', formData.mentor)
      data.append('strikePrice', formData.strikePrice)
      data.append('actualPrice', formData.actualPrice)
      data.append('board', formData.board)
      data.append('grade', formData.grade)
      if (formData.bannerImage) data.append('bannerImage', formData.bannerImage)
      else if (isEditMode && typeof previewImage === 'string' && previewImage)
        data.append('bannerImage', previewImage || '')
      if (isEditMode) {
        return _axios.put(`/courses/${id}`, data)
      } else {
        return _axios.post('/courses', data)
      }
    },
    onSuccess: () => {
      toast.success(
        isEditMode
          ? 'Course updated successfully'
          : 'Course created successfully',
      )
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      goBack()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Operation failed')
    },
  })

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.courseName.trim()) {
      newErrors.courseName = 'Course name is required'
    } else if (
      formData.courseName.length < 3 ||
      formData.courseName.length > 100
    ) {
      newErrors.courseName = 'Course name must be between 3 and 100 characters'
    }

    if (!formData.mentor.trim()) {
      newErrors.mentor = 'please select a mentor'
    }

    if (!formData.strikePrice) {
      newErrors.strikePrice = 'Strike price is required'
    } else if (!/^\d+$/.test(formData.strikePrice)) {
      newErrors.strikePrice = 'Strike price must be a valid number'
    }

    if (!formData.actualPrice) {
      newErrors.actualPrice = 'Actual price is required'
    } else if (!/^\d+$/.test(formData.actualPrice)) {
      newErrors.actualPrice = 'Actual price must be a valid number'
    }

    if (!formData.board) {
      newErrors.board = 'Please select a board'
    }

    if (!formData.grade) {
      newErrors.grade = 'Please select a grade'
    }

    // Banner required only on create, optional on edit
    if (!isEditMode && !formData.bannerImage) {
      newErrors.bannerImage = 'Banner image is required'
    } else if (formData.bannerImage) {
      const file = formData.bannerImage
      if (file.size > 5 * 1024 * 1024) {
        newErrors.bannerImage = 'Max file size is 5MB'
      }
      if (
        !['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(
          file.type,
        )
      ) {
        newErrors.bannerImage =
          'Only .jpg, .jpeg, .png and .webp formats are supported'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData((prev) => ({ ...prev, bannerImage: file }))
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
    if (errors.bannerImage) {
      setErrors((prev) => ({ ...prev, bannerImage: '' }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      mutation.mutate()
    }
  }

  return (
    <div className="mx-auto p-2">
      <Card className="rounded-xsm border-background">
        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
          >
            {/* Course Name */}
            <div className="flex flex-col gap-5">
              <Label className="text-foreground" htmlFor="courseName">
                Course Name
              </Label>
              <Input
                id="courseName"
                name="courseName"
                className="text-foreground h-10 rounded-xsm"
                value={formData.courseName}
                onChange={handleInputChange}
                placeholder="e.g. Complete React Mastery"
              />
              {errors.courseName && (
                <p className="text-sm text-destructive">{errors.courseName}</p>
              )}
            </div>

            {/* Mentor */}
            <div className="flex flex-col gap-5 h-full">
              <Label className="text-foreground">Mentor</Label>
              <Select
                value={formData.mentor}
                onValueChange={(value) => handleSelectChange('mentor', value)}
                disabled={mentorsLoading}
              >
                <SelectTrigger className="w-full h-10! rounded-xsm text-foreground">
                  <SelectValue
                    placeholder={
                      mentorsLoading ? 'Loading mentors...' : 'Select a mentor'
                    }
                  />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  {mentors?.map((mentor: any) => (
                    <SelectItem
                      className=" hover:text-foreground! cursor-pointer"
                      key={mentor._id}
                      value={mentor._id}
                    >
                      <div className="flex items-center gap-2 text-foreground">
                        <img
                          src={mentor.image}
                          alt={mentor.staffName}
                          className="h-6 w-6 rounded-full object-cover"
                        />
                        <span>{mentor.staffName}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.mentor && (
                <p className="text-sm text-destructive">{errors.mentor}</p>
              )}
            </div>

            <div className="flex flex-col gap-5">
              <Label className="text-foreground" htmlFor="strikePrice">
                Strike Price (₹)
              </Label>
              <Input
                id="strikePrice"
                name="strikePrice"
                type="number"
                className="text-foreground h-10 rounded-xsm"
                value={formData.strikePrice}
                onChange={handleInputChange}
                placeholder="2999"
              />
              {errors.strikePrice && (
                <p className="text-sm text-destructive">{errors.strikePrice}</p>
              )}
            </div>

            <div className="flex flex-col gap-5">
              <Label className="text-foreground" htmlFor="actualPrice">
                Actual Price (₹)
              </Label>
              <Input
                id="actualPrice"
                name="actualPrice"
                type="number"
                className="text-foreground h-10 rounded-xsm"
                value={formData.actualPrice}
                onChange={handleInputChange}
                placeholder="999"
              />
              {errors.actualPrice && (
                <p className="text-sm text-destructive">{errors.actualPrice}</p>
              )}
            </div>

            <div className="flex flex-col gap-5">
              <Label className="text-foreground">Board</Label>
              <Select
                value={formData.board}
                onValueChange={(value) => handleSelectChange('board', value)}
              >
                <SelectTrigger className="w-full h-10! rounded-xsm text-foreground">
                  <SelectValue placeholder="Select board" />
                </SelectTrigger>
                <SelectContent className="text-foreground">
                  {['CBSE', 'TN State Board'].map((board) => (
                    <SelectItem
                      className=" hover:text-foreground! cursor-pointer"
                      key={board}
                      value={board}
                    >
                      {board}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.board && (
                <p className="text-sm text-destructive">{errors.board}</p>
              )}
            </div>

            <div className="flex flex-col gap-5">
              <Label className="text-foreground">Grade/Class</Label>
              <Select
                value={formData.grade}
                onValueChange={(value) => handleSelectChange('grade', value)}
              >
                <SelectTrigger className="w-full h-10! rounded-xsm text-foreground">
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent className="text-foreground">
                  {[
                    'I',
                    'II',
                    'III',
                    'IV',
                    'V',
                    'VI',
                    'VII',
                    'VIII',
                    'IX',
                    'X',
                    'XI',
                    'XII',
                  ].map((g) => (
                    <SelectItem
                      className=" hover:text-foreground! cursor-pointer"
                      key={g}
                      value={String(g)}
                    >
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.grade && (
                <p className="text-sm text-destructive">{errors.grade}</p>
              )}
            </div>

            {/* Banner Image Upload */}
            <div className="flex flex-col gap-5 col-span-full">
              <Label className="text-foreground" htmlFor="banner-image">
                Banner Image
              </Label>
              <div className="grid w-full max-w-full bg-background! items-center gap-1.5">
                <Label
                  htmlFor="banner-image"
                  className={`flex flex-col items-center justify-center w-full h-64 ${previewImage ? `` : `border-2 border-dashed`} rounded-xsm cursor-pointer`}
                >
                  {previewImage ? (
                    <img
                      src={previewImage}
                      alt="Preview"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-10 h-10 mb-3 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span>{' '}
                        or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, JPEG up to 5MB
                      </p>
                    </div>
                  )}
                </Label>
                <Input
                  id="banner-image"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
              {formData.bannerImage && (
                <p className="text-sm text-foreground mt-2">
                  Selected: {formData.bannerImage.name}
                </p>
              )}
              {errors.bannerImage && (
                <p className="text-sm text-destructive">{errors.bannerImage}</p>
              )}
            </div>

            {/* Submit */}
            <div className="flex gap-4 col-span-full justify-end">
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="w-full rounded-xsm bg-foreground text-background hover:bg-foreground/90 hover:text-background cursor-pointer sm:w-auto"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditMode ? 'Updating...' : 'Creating...'}
                  </>
                ) : isEditMode ? (
                  'Update Course'
                ) : (
                  'Create Course'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
