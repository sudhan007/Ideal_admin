import { createFileRoute, useLocation, useRouter } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { _axios } from '@/lib/axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export const Route = createFileRoute('/grades/$id')({
  component: CreateGradePage,
})

function CreateGradePage() {
  const { id } = Route.useParams()
  const location = useLocation()
  const router = useRouter()
  const queryClient = useQueryClient()
  const isEditMode = id !== 'new'
  const stateGrade = isEditMode ? (location.state as any)?.grade : null
  const [formData, setFormData] = useState({
    grade: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const goBack = () => {
    router.history.back()
  }

  useEffect(() => {
    if (isEditMode && stateGrade) {
      setFormData({
        grade: stateGrade.grade || '',
      })
    }
  }, [isEditMode, stateGrade])
  const mutation = useMutation({
    mutationFn: async () => {
      const data = new FormData()
      data.append('grade', formData.grade)
      if (isEditMode) {
        return _axios.put(`/grades/${id}`, data)
      } else {
        return _axios.post('/grades', data)
      }
    },
    onSuccess: () => {
      toast.success(
        isEditMode
          ? 'Grade updated successfully'
          : 'Grade created successfully',
      )
      queryClient.invalidateQueries({ queryKey: ['grades'] })
      goBack()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Operation failed')
    },
  })

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.grade.trim()) {
      newErrors.grade = 'Grade name is required'
    } else if (formData.grade.length < 1 || formData.grade.length > 3) {
      newErrors.grade = 'Grade name must be between 1 and 3 characters'
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
              <Label className="text-foreground" htmlFor="grade">
                Grade Name
              </Label>
              <Input
                id="grade"
                name="grade"
                className="text-foreground h-10 rounded-xsm"
                value={formData.grade}
                placeholder="eg.XII"
                onChange={handleInputChange}
              />
              {errors.grade && (
                <p className="text-sm text-destructive">{errors.grade}</p>
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
                  'Update Grade'
                ) : (
                  'Create Grade'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
