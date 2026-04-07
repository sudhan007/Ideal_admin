// src/routes/students/edit/$id.tsx
import {
  createFileRoute,
  useNavigate,
  useParams,
} from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { _axios } from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowBigLeft, Loader2, Upload, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export const Route = createFileRoute('/students/edit/$id')({
  component: EditStudent,
});

// ── Reuse almost the same schema (you can extract it to shared file later)
const studentEditSchema = z
  .object({
    studentName: z
      .string()
      .min(2, 'Student name must be at least 2 characters'),
    dateOfBirth: z.string().min(1, 'Date of birth is required'),
    gender: z.enum(['male', 'female', 'other']),
    studentPhoneNumber: z.string().regex(/^[0-9]{10}$/, 'Exactly 10 digits'),
    parentPhoneNumber: z.string().regex(/^[0-9]{10}$/, 'Exactly 10 digits'),
    parentPhoneNumber2: z
      .string()
      .regex(/^[0-9]{10}$/, 'Exactly 10 digits')
      .optional()
      .or(z.literal('')),
    parentName: z.string().min(2, 'Parent name must be at least 2 characters'),
    address: z.string().min(10, 'Address must be at least 10 characters'),
    grade: z.string().min(1, 'Please select a grade'),
    nameOfTheBoard: z.string().min(1, 'Please select a board'),
    previousYearAnnualTotalMarks: z
      .string()
      .regex(/^[0-9]+(\.[0-9]{1,2})?$/, 'Valid marks (e.g. 450 or 450.50)'),
    previousYearMathMarks: z
      .string()
      .regex(/^[0-9]+(\.[0-9]{1,2})?$/, 'Valid marks (e.g. 95 or 95.50)'),
    loginMethod: z.enum(['MOBILE', 'EMAIL']),
    mobileNumber: z
      .string()
      .regex(/^[0-9]{10}$/)
      .optional()
      .or(z.literal('')),
    email: z.string().email().optional().or(z.literal('')),
    referedBy: z.string().optional(),
    studentProfile: z.any().optional(), // new file upload
  })
  .refine(
    (data) =>
      data.loginMethod !== 'MOBILE' ||
      (data.mobileNumber && data.mobileNumber.length === 10),
    {
      message: 'Mobile number is required for mobile login',
      path: ['mobileNumber'],
    },
  )
  .refine((data) => data.loginMethod !== 'EMAIL' || !!data.email, {
    message: 'Email is required for email login',
    path: ['email'],
  });

type StudentEditFormValues = z.infer<typeof studentEditSchema>;

function EditStudent() {
  const { id } = useParams({ from: '/students/edit/$id' });
  console.log(id, 'sss');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const form = useForm<StudentEditFormValues>({
    resolver: zodResolver(studentEditSchema),
    defaultValues: {
      studentName: '',
      dateOfBirth: '',
      gender: 'male',
      studentPhoneNumber: '',
      parentPhoneNumber: '',
      parentPhoneNumber2: '',
      parentName: '',
      address: '',
      grade: '',
      nameOfTheBoard: '',
      previousYearAnnualTotalMarks: '',
      previousYearMathMarks: '',
      loginMethod: 'MOBILE',
      mobileNumber: '',
      email: '',
      referedBy: '',
    },
  });

  // Fetch single student
  const { data: student, isLoading: isLoadingStudent } = useQuery({
    queryKey: ['student', id],
    queryFn: async () => {
      const res = await _axios.get(`/student/${id}`);
      return res.data.student;
    },
    enabled: !!id,
  });

  // Fetch grades & boards (same as add form)
  const { data: grades = [] } = useQuery({
    queryKey: ['grades'],
    queryFn: async () => (await _axios.get('/grades')).data.grades || [],
  });

  const { data: boards = [] } = useQuery({
    queryKey: ['boards'],
    queryFn: async () => (await _axios.get('/boards')).data.boards || [],
  });

  // Prefill form when student data arrives
  useEffect(() => {
    if (!student) return;
    console.log(student.boardId, 'ssss');
    const loginMethod = student.loginMethod || 'MOBILE';
    const mobile = student.mobileNumber || '';
    const email = student.email || '';

    form.reset({
      studentName: student.studentName || '',
      dateOfBirth: student.dateOfBirth
        ? new Date(student.dateOfBirth).toISOString().split('T')[0]
        : '',
      gender: (student.gender || 'male') as 'male' | 'female' | 'other',
      studentPhoneNumber: student.studentPhoneNumber || '',
      parentPhoneNumber: student.parentPhoneNumber || '',
      parentPhoneNumber2: student.parentPhoneNumber2 || '',
      parentName: student.parentName || '',
      address: student.address || '',
      grade: student.gradeId,
      nameOfTheBoard: student.boardId || student.nameOfTheBoard || '',
      previousYearAnnualTotalMarks:
        student.previousYearAnnualTotalMarks?.toString() || '',
      previousYearMathMarks: student.previousYearMathMarks?.toString() || '',
      loginMethod,
      mobileNumber: loginMethod === 'MOBILE' ? mobile : '',
      email: loginMethod === 'EMAIL' ? email : '',
      referedBy: student.referedBy || '',
    });

    // Show existing profile image
    if (student.profileImageUrl) {
      setPreviewImage(student.profileImageUrl);
    }
  }, [student, form, grades, boards]);

  const updateMutation = useMutation({
    mutationFn: async (values: StudentEditFormValues) => {
      const formData = new FormData();

      formData.append('studentName', values.studentName);
      formData.append('dateOfBirth', values.dateOfBirth);
      formData.append('gender', values.gender);
      formData.append('studentPhoneNumber', values.studentPhoneNumber);
      formData.append('parentPhoneNumber', values.parentPhoneNumber);
      if (values.parentPhoneNumber2) {
        formData.append('parentPhoneNumber2', values.parentPhoneNumber2);
      }
      formData.append('parentName', values.parentName);
      formData.append('address', values.address);
      formData.append('grade', values.grade);
      formData.append('nameOfTheBoard', values.nameOfTheBoard);
      formData.append(
        'previousYearAnnualTotalMarks',
        values.previousYearAnnualTotalMarks,
      );
      formData.append('previousYearMathMarks', values.previousYearMathMarks);
      formData.append('loginMethod', values.loginMethod);
      if (values.mobileNumber)
        formData.append('mobileNumber', values.mobileNumber);
      if (values.email) formData.append('email', values.email);
      if (values.referedBy) formData.append('referedBy', values.referedBy);
      if (values.studentProfile instanceof File) {
        formData.append('studentProfile', values.studentProfile);
      }
      formData.append('id', student?._id || '');

      return _axios.put(`/student/admin-update-details`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      toast.success('Student updated successfully');
      queryClient.invalidateQueries({ queryKey: ['student', id] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      navigate({ to: '/students' });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to update student';
      toast.error(msg);
    },
  });

  const onSubmit = (values: StudentEditFormValues) => {
    updateMutation.mutate(values);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    form.setValue('studentProfile', file);
    const reader = new FileReader();
    reader.onloadend = () => setPreviewImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    form.setValue('studentProfile', undefined);
    setPreviewImage(student?.profileImageUrl || null); // revert to original if exists
  };

  if (isLoadingStudent) {
    return <div className="p-8 text-center">Loading student data...</div>;
  }

  if (!student) {
    return <div className="p-8 text-center">Student not found</div>;
  }

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6">
      <Button
        variant="outline"
        onClick={() => navigate({ to: '/students' })}
        className="my-2 rounded-xsm">
        <ArrowBigLeft className="mr-2 h-4 w-4" /> Back to Students
      </Button>

      <Card className="rounded-xsm border-background">
        <CardHeader>
          <CardTitle className="text-2xl">Edit Student</CardTitle>
          <CardDescription>
            Update information for {student.studentName || 'this student'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Profile Photo */}
              <div className="space-y-4">
                <FormLabel>Student Profile Photo</FormLabel>
                <div className="flex items-center gap-4">
                  {previewImage ? (
                    <div className="relative">
                      <img
                        src={previewImage}
                        alt="Preview"
                        className="h-24 w-24 rounded-full object-cover border-2"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="h-24 w-24 rounded-full border-2 border-dashed flex items-center justify-center">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="max-w-xs"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Upload new photo (optional – JPG, PNG)
                    </p>
                  </div>
                </div>
              </div>

              {/* Personal Details */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Personal Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="studentName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Student Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="John Doe"
                            className="h-10 rounded-xsm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth *</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            className="h-10 rounded-xsm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender *</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex gap-4">
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="male" id="male" />
                              <FormLabel
                                htmlFor="male"
                                className="font-normal cursor-pointer">
                                Male
                              </FormLabel>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="female" id="female" />
                              <FormLabel
                                htmlFor="female"
                                className="font-normal cursor-pointer">
                                Female
                              </FormLabel>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="other" id="other" />
                              <FormLabel
                                htmlFor="other"
                                className="font-normal cursor-pointer">
                                Other
                              </FormLabel>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="studentPhoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Student Phone Number *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="9876543210"
                            className="h-10 rounded-xsm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Parent Details */}
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Parent/Guardian Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="parentName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parent/Guardian Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Jane Doe"
                            className="h-10 rounded-xsm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="parentPhoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parent Phone Number *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="9876543210"
                            className="h-10 rounded-xsm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="parentPhoneNumber2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parent Phone Number 2 </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="9876543210"
                            className="h-10 rounded-xsm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Address *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter full address"
                            className="rounded-xsm"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Academic Details */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Academic Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="grade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grade/Class *</FormLabel>
                        <Select
                          key={field.value} // 👈 ADD THIS
                          onValueChange={field.onChange}
                          value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-10 rounded-xsm">
                              <SelectValue placeholder="Select grade" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {grades.map((grade: any) => (
                              <SelectItem key={grade._id} value={grade._id}>
                                {grade.grade}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="nameOfTheBoard"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Board *</FormLabel>
                        <Select
                          key={field.value} // 👈 ADD THIS
                          onValueChange={field.onChange}
                          value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-10 rounded-xsm">
                              <SelectValue placeholder="Select board" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {boards.map((board: any) => (
                              <SelectItem key={board._id} value={board._id}>
                                {board.boardName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="previousYearAnnualTotalMarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Previous Year Total Marks *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="450"
                            className="h-10 rounded-xsm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="previousYearMathMarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Previous Year Math Marks *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="95"
                            className="h-10 rounded-xsm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Login Credentials */}
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Login Credentials
                </h3>
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="loginMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Login Method *</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex gap-4">
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="MOBILE" id="mobile" />
                              <FormLabel
                                htmlFor="mobile"
                                className="font-normal cursor-pointer">
                                Mobile Number
                              </FormLabel>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="EMAIL" id="email" />
                              <FormLabel
                                htmlFor="email"
                                className="font-normal cursor-pointer">
                                Email
                              </FormLabel>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {form.watch('loginMethod') === 'MOBILE' && (
                      <FormField
                        control={form.control}
                        name="mobileNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mobile Number for Login *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="9876543210"
                                className="h-10 rounded-xsm"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              This will be used to login to the app
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {form.watch('loginMethod') === 'EMAIL' && (
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email for Login *</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="student@example.com"
                                className="h-10 rounded-xsm"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              This will be used to login to the app
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Optional Fields */}
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Additional Information
                </h3>
                <FormField
                  control={form.control}
                  name="referedBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Referred By (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Name of referrer"
                          className="h-10 rounded-xsm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {/* Submit */}
              <div className="flex justify-end gap-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate({ to: '/students' })}
                  disabled={updateMutation.isPending}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending || isLoadingStudent}
                  className="min-w-[160px] rounded-xsm bg-foreground text-background hover:bg-foreground/90">
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Student'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
