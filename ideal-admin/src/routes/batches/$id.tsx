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
import { format } from 'date-fns';

type BatchForm = {
  batchName: string;
  batchCode: string;
  courseId: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  days: string[];
};

const DAYS = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const;

export const Route = createFileRoute('/batches/$id')({
  component: BatchFormPage,
});

function BatchFormPage() {
  const navigate = useNavigate();
  const { id } = Route.useParams();
  const router = useRouter();
  const location = useLocation();
  const queryClient = useQueryClient();
  const isEditMode = id !== 'new';
  const passedBatch = isEditMode ? (location.state as any)?.batch : null;

  const getInitialFormData = () => {
    if (isEditMode && passedBatch) {
      return {
        batchName: passedBatch.batchName || '',
        batchCode: passedBatch.batchCode || '',
        courseId: passedBatch.courseId || '',
        startDate: passedBatch.startDate
          ? format(new Date(passedBatch.startDate), 'yyyy-MM-dd')
          : '',
        endDate: passedBatch.endDate
          ? format(new Date(passedBatch.endDate), 'yyyy-MM-dd')
          : '',
        startTime: passedBatch.startTime || '',
        endTime: passedBatch.endTime || '',
        days: passedBatch.days || [],
      };
    }
    return {
      batchName: '',
      batchCode: '',
      courseId: '',
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
      days: [],
    };
  };

  const [formData, setFormData] = useState<BatchForm>(getInitialFormData());

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch courses for dropdown (you can adjust endpoint)
  const { data: courses = [] } = useQuery({
    queryKey: ['courses-short'],
    queryFn: async () => {
      const res = await _axios.get('/courses?limit=100&fields=courseName');
      return res.data.courses || [];
    },
  });

  useEffect(() => {
    if (isEditMode && passedBatch) {
      setFormData({
        batchName: passedBatch.batchName || '',
        batchCode: passedBatch.batchCode || '',
        courseId: passedBatch.courseId || '',
        startDate: passedBatch.startDate
          ? format(new Date(passedBatch.startDate), 'yyyy-MM-dd')
          : '',
        endDate: passedBatch.endDate
          ? format(new Date(passedBatch.endDate), 'yyyy-MM-dd')
          : '',
        startTime: passedBatch.startTime || '',
        endTime: passedBatch.endTime || '',
        days: passedBatch.days || [],
      });
    }
  }, [isEditMode, passedBatch]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...formData,
        // days: formData.days,
      };

      if (isEditMode) {
        return _axios.put(`/batches/${id}`, payload);
      }
      return _axios.post('/batches', payload);
    },
    onSuccess: () => {
      toast.success(
        isEditMode
          ? 'Batch updated successfully'
          : 'Batch created successfully',
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

    if (!formData.batchName.trim()) {
      newErrors.batchName = 'Batch name is required';
    }

    if (!formData.batchCode.trim()) {
      newErrors.batchCode = 'Batch code is required';
    }

    if (!formData.courseId) {
      newErrors.courseId = 'Please select a course';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (formData.startDate && formData.endDate) {
      if (new Date(formData.startDate) > new Date(formData.endDate)) {
        newErrors.dateRange = 'Start date must be before end date';
      }
    }

    if (!formData.startTime.trim()) {
      newErrors.startTime = 'Start time is required';
    }

    if (!formData.endTime.trim()) {
      newErrors.endTime = 'End time is required';
    }

    // if (formData.days.length === 0) {
    //   newErrors.days = 'Select at least one day';
    // }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      mutation.mutate();
    }
  };

  const toggleDay = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day],
    }));
    if (errors.days) setErrors((p) => ({ ...p, days: '' }));
  };

  return (
    <div className="mx-auto max-w-4xl p-4">
      <Button
        onClick={() =>
          navigate({
            to: '/batches',
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
        <ArrowBigLeft className="mr-2 h-4 w-4" /> Back to Batches
      </Button>
      <Card className="rounded-xsm border-background">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Batch Name */}
              <div className="space-y-2">
                <Label htmlFor="batchName">Batch Name</Label>
                <Input
                  id="batchName"
                  value={formData.batchName}
                  onChange={(e) =>
                    setFormData({ ...formData, batchName: e.target.value })
                  }
                  placeholder="Morning Batch"
                  className="h-10 rounded-xsm"
                />
                {errors.batchName && (
                  <p className="text-sm text-destructive">{errors.batchName}</p>
                )}
              </div>

              {/* Batch Code */}
              <div className="space-y-2">
                <Label htmlFor="batchCode">Batch Code</Label>
                <Input
                  id="batchCode"
                  value={formData.batchCode}
                  onChange={(e) =>
                    setFormData({ ...formData, batchCode: e.target.value })
                  }
                  placeholder="B001"
                  className="h-10 rounded-xsm"
                />
                {errors.batchCode && (
                  <p className="text-sm text-destructive">{errors.batchCode}</p>
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

            {/* Dates & Times */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  className="h-10 rounded-xsm"
                />
                {errors.startDate && (
                  <p className="text-sm text-destructive">{errors.startDate}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  className="h-10 rounded-xsm"
                />
                {errors.endDate && (
                  <p className="text-sm text-destructive">{errors.endDate}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                  className="h-10 rounded-xsm"
                />
                {errors.startTime && (
                  <p className="text-sm text-destructive">{errors.startTime}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData({ ...formData, endTime: e.target.value })
                  }
                  className="h-10 rounded-xsm"
                />
                {errors.endTime && (
                  <p className="text-sm text-destructive">{errors.endTime}</p>
                )}
              </div>
            </div>

            {/* Days Selection */}
            {/* <div className="space-y-3">
              <Label>Days of Week</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                {DAYS.map((day) => (
                  <label
                    key={day}
                    className={`flex items-center space-x-2 rounded-md border px-3 py-2 cursor-pointer transition-colors ${
                      formData.days.includes(day)
                        ? 'border-primary bg-primary/10'
                        : 'hover:bg-muted'
                    }`}>
                    <Checkbox
                      checked={formData.days.includes(day)}
                      onCheckedChange={() => toggleDay(day)}
                    />
                    <span className="text-sm">{day.slice(0, 3)}</span>
                  </label>
                ))}
              </div>
              {errors.days && (
                <p className="text-sm text-destructive">{errors.days}</p>
              )}
            </div> */}

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
                  'Update Batch'
                ) : (
                  'Create Batch'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
