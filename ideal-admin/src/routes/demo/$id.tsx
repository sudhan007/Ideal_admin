import {
  createFileRoute,
  useLocation,
  useNavigate,
  useRouter,
} from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { _axios } from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowBigLeft, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type CourseDemoForm = {
  courseId: string;
  videoUrl: string;
};

export const Route = createFileRoute('/demo/$id')({
  component: DemoFormPage,
});

function DemoFormPage() {
  const navigate = useNavigate();
  const { id } = Route.useParams();
  const router = useRouter();
  const location = useLocation();
  const queryClient = useQueryClient();
  const isEditMode = id !== 'new';
  const passedDemo = isEditMode ? (location.state as any)?.demo : null;

  const getInitialFormData = () => {
    if (isEditMode && passedDemo) {
      return {
        videoUrl: passedDemo.videoUrl || '',
        courseId: passedDemo.courseId || '',
      };
    }
    return {
      videoUrl: '',
      courseId: '',
    };
  };

  const [formData, setFormData] =
    useState<CourseDemoForm>(getInitialFormData());

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: courses = [] } = useQuery({
    queryKey: ['courses-short'],
    queryFn: async () => {
      const res = await _axios.get('/courses?limit=1000&fields=courseName');
      return res.data.courses || [];
    },
  });

  useEffect(() => {
    if (isEditMode && passedDemo) {
      setFormData({
        videoUrl: passedDemo.videoUrl || '',
        courseId: passedDemo.courseId || '',
      });
    }
  }, [isEditMode, passedDemo]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...formData,
      };

      if (isEditMode) {
        return _axios.put(`/course-demo/${id}`, payload);
      }
      return _axios.post('/course-demo', payload);
    },
    onSuccess: () => {
      toast.success(
        isEditMode ? 'Demo updated successfully' : 'Demo created successfully',
      );
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      router.history.back();
    },
    onError: (err: any) => {
      const message =
        err.error || err.response?.data?.message || 'Something went wrong';
      toast.error(message);
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.videoUrl.trim()) {
      newErrors.videoUrl = 'video url  is required';
    }

    if (!formData.courseId) {
      newErrors.courseId = 'Please select a course';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      mutation.mutate();
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-4">
      <Button
        onClick={() =>
          navigate({
            to: '/demo',
            search: {
              page: 1,
              limit: 10,
              search: '',
              sortBy: 'createdAt',
              sortOrder: 'desc',
            },
          })
        }
        variant="outline"
        className="rounded-xsm hover:text-foreground text-foreground  cursor-pointer hover:bg-accent/50 my-2">
        <ArrowBigLeft className="mr-2 h-4 w-4" /> Back to Demos
      </Button>
      <Card className="rounded-xsm border-background">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Batch Name */}
              <div className="space-y-2">
                <Label htmlFor="videoUrl">Video Url</Label>
                <Input
                  id="videoUrl"
                  value={formData.videoUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, videoUrl: e.target.value })
                  }
                  placeholder="https://example.com/video.mp4"
                  className="h-10 rounded-xsm"
                />
                {errors.videoUrl && (
                  <p className="text-sm text-destructive">{errors.videoUrl}</p>
                )}
              </div>

              {/* Course Select */}
              <div className="space-y-2">
                <Label htmlFor="course">Course</Label>
                <Select
                  value={formData.courseId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, courseId: value })
                  }>
                  <SelectTrigger className="h-10 rounded-xsm">
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course: any) => (
                      <SelectItem key={course._id} value={course._id}>
                        {course.courseName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.courseId && (
                  <p className="text-sm text-destructive">{errors.courseId}</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.history.back()}
                className="rounded-xsm">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="min-w-[140px] rounded-xsm bg-foreground text-background hover:bg-foreground/90">
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditMode ? 'Updating...' : 'Creating...'}
                  </>
                ) : isEditMode ? (
                  'Update Demo'
                ) : (
                  'Create Demo'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
