import { createFileRoute, useLocation, useRouter } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { _axios } from '@/lib/axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Upload } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export const Route = createFileRoute('/mentors/$id')({
  component: CreateMentorPage,
})

function CreateMentorPage() {
  const { id } = Route.useParams()
  const location = useLocation()
  const router = useRouter()
  const queryClient = useQueryClient()
  const isEditMode = id !== 'new'
  const stateStaff = isEditMode ? (location.state as any)?.mentor : null
  const [formData, setFormData] = useState({
    staffName: '',
    phoneNumber: '',
    image: null as File | null,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const goBack = () => {
    router.history.back()
  }

  useEffect(() => {
    if (isEditMode && stateStaff) {
      setFormData({
        staffName: stateStaff.staffName || '',
        phoneNumber: stateStaff.phoneNumber || '',
        image: null,
      })
      setPreviewImage(stateStaff.image || null)
    }
  }, [isEditMode, stateStaff])
  const mutation = useMutation({
    mutationFn: async () => {
      const data = new FormData()
      data.append('staffName', formData.staffName)
      data.append('phoneNumber', formData.phoneNumber)
      if (formData.image) data.append('image', formData.image)
      else if (isEditMode && typeof previewImage === 'string' && previewImage)
        data.append('image', previewImage || '')
      if (isEditMode) {
        return _axios.put(`/staffs/${id}`, data)
      } else {
        return _axios.post('/staffs', data)
      }
    },
    onSuccess: () => {
      toast.success(
        isEditMode
          ? 'Mentor updated successfully'
          : 'Mentor created successfully',
      )
      queryClient.invalidateQueries({ queryKey: ['mentors'] })
      goBack()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Operation failed')
    },
  })

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.staffName.trim()) {
      newErrors.staffName = 'Mentor name is required'
    } else if (
      formData.staffName.length < 3 ||
      formData.staffName.length > 100
    ) {
      newErrors.staffName = 'Mentor name must be between 3 and 100 characters'
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required'
    } else if (!/^\d+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Phone number must be a valid number'
    }

    if (!isEditMode && !formData.image) {
      newErrors.image = ' image is required'
    } else if (formData.image) {
      const file = formData.image
      if (file.size > 5 * 1024 * 1024) {
        newErrors.image = 'Max file size is 5MB'
      }
      if (
        !['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(
          file.type,
        )
      ) {
        newErrors.image =
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
      setFormData((prev) => ({ ...prev, image: file }))
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
    if (errors.image) {
      setErrors((prev) => ({ ...prev, image: '' }))
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
            <div className="flex flex-col gap-5">
              <Label className="text-foreground" htmlFor="staffName">
                Mentor Name
              </Label>
              <Input
                id="staffName"
                name="staffName"
                className="text-foreground h-10 rounded-xsm"
                value={formData.staffName}
                onChange={handleInputChange}
              />
              {errors.staffName && (
                <p className="text-sm text-destructive">{errors.staffName}</p>
              )}
            </div>

            <div className="flex flex-col gap-5">
              <Label className="text-foreground" htmlFor="phoneNumber">
                Phone Number
              </Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                type="number"
                className="text-foreground h-10 rounded-xsm"
                value={formData.phoneNumber}
                onChange={handleInputChange}
              />
              {errors.phoneNumber && (
                <p className="text-sm text-destructive">{errors.phoneNumber}</p>
              )}
            </div>

            <div className="flex flex-col gap-5 col-span-full">
              <Label className="text-foreground" htmlFor="mentor-image">
                Mentor Image
              </Label>
              <div className="grid w-full max-w-full bg-background! items-center gap-1.5">
                <Label
                  htmlFor="mentor-image"
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
                  id="mentor-image"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
              {formData.image && (
                <p className="text-sm text-foreground mt-2">
                  Selected: {formData.image.name}
                </p>
              )}
              {errors.image && (
                <p className="text-sm text-destructive">{errors.image}</p>
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
                  'Update Mentor'
                ) : (
                  'Create Mentor'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
