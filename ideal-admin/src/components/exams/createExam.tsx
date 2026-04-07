import React, { useEffect } from 'react';
import { useNavigate, useRouter } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Loader2, ArrowBigLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { _axios } from '@/lib/axios';
import { toast } from 'sonner';

interface CreateEditExamProps {
  courseId: string;
  lessonId: string;
  chapterId: string;
  examId?: string;
  examData?: any;
}

interface ExamFormData {
  examName: string;
  dueDateTime: string;
}

const CreateEditExam: React.FC<CreateEditExamProps> = ({
  courseId,
  lessonId,
  chapterId,
  examId,
  examData,
}) => {
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();

  const isEditMode = !!examId;

  const form = useForm<ExamFormData>({
    defaultValues: {
      examName: '',
      dueDateTime: '',
    },
  });

  const createExamMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await _axios.post('/exam', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      toast('Exam created successfully');
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      navigateBack();
    },
    onError: (error: any) => {
      toast(error.response?.data?.error || 'Failed to create exam');
    },
  });

  const updateExamMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await _axios.put(`/exam/${examId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      toast('Exam updated successfully');
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      queryClient.invalidateQueries({ queryKey: ['exam', examId] });
      navigateBack();
    },
    onError: (error: any) => {
      toast(error.response?.data?.error || 'Failed to create exam');
    },
  });

  // Populate form with existing data
  useEffect(() => {
    if (examData && isEditMode) {
      form.reset({
        examName: examData.examName,
        dueDateTime: new Date(examData.dueDateTime).toISOString().slice(0, 16),
      });
    }
  }, [examData, isEditMode, form]);

  const navigateBack = () => {
    navigate({
      to: '/courses/exams',
      search: {
        limit: 10,
        page: 1,
        courseId,
        chapterId,
        lessonId,
        mode: 'list',
      },
    });
  };

  const onSubmit = async (data: ExamFormData) => {
    const formData = new FormData();
    formData.append('courseId', courseId);
    formData.append('chapterId', chapterId);
    formData.append('lessonId', lessonId);
    formData.append('examName', data.examName);
    formData.append('dueDateTime', new Date(data.dueDateTime).toISOString());

    // Handle file uploads based on type

    if (isEditMode) {
      updateExamMutation.mutate(formData);
    } else {
      createExamMutation.mutate(formData);
    }
  };

  const isLoading =
    createExamMutation.isPending || updateExamMutation.isPending;

  // if (isLoadingData) {
  //   return (
  //     <div className="flex items-center justify-center h-screen">
  //       <Loader2 className="h-8 w-8 animate-spin" />
  //     </div>
  //   )
  // }

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <Button
        onClick={() => router.history.back()}
        variant="outline"
        className="rounded-xsm hover:text-foreground text-foreground my-3  cursor-pointer hover:bg-accent/50">
        <ArrowBigLeft className="mr-2 h-4 w-4" /> Back to Exams
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>{isEditMode ? 'Edit Exam' : 'Create New Exam'}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="examName"
                rules={{ required: 'Exam name is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exam Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter exam name" {...field} />
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

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={navigateBack}
                  disabled={isLoading}>
                  Cancel
                </Button>
                <Button
                  onClick={form.handleSubmit(onSubmit)}
                  disabled={isLoading}
                  className="flex-1">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isEditMode ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>{isEditMode ? 'Update Exam' : 'Create Exam'}</>
                  )}
                </Button>
              </div>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateEditExam;
