// src/routes/batches/addstudents/$batchId.tsx
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
import { useState } from 'react';
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

export const Route = createFileRoute('/batches/addstudents/$batchId')({
  component: AddStudentToBatch,
});

// Form validation schema
const studentRegistrationSchema = z
  .object({
    studentName: z
      .string()
      .min(2, 'Student name must be at least 2 characters'),
    dateOfBirth: z.string().min(1, 'Date of birth is required'),
    gender: z.enum(['male', 'female', 'other'], {
      required_error: 'Please select a gender',
    }),
    studentPhoneNumber: z
      .string()
      .regex(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits'),
    parentPhoneNumber: z
      .string()
      .regex(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits'),
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
      .regex(
        /^[0-9]+(\.[0-9]{1,2})?$/,
        'Enter valid marks (e.g., 450 or 450.50)',
      ),
    previousYearMathMarks: z
      .string()
      .regex(
        /^[0-9]+(\.[0-9]{1,2})?$/,
        'Enter valid marks (e.g., 95 or 95.50)',
      ),
    loginMethod: z.enum(['MOBILE', 'EMAIL'], {
      required_error: 'Please select a login method',
    }),
    mobileNumber: z
      .string()
      .regex(/^[0-9]{10}$/, 'Mobile number must be exactly 10 digits')
      .optional()
      .or(z.literal('')),
    email: z
      .string()
      .email('Enter a valid email address')
      .optional()
      .or(z.literal('')),
    referedBy: z.string().optional(),
    studentProfile: z.any().optional(),
  })
  .refine(
    (data) => {
      if (data.loginMethod === 'MOBILE') {
        return !!data.mobileNumber && data.mobileNumber.length === 10;
      }
      return true;
    },
    {
      message: 'Mobile number is required for mobile login',
      path: ['mobileNumber'],
    },
  )
  .refine(
    (data) => {
      if (data.loginMethod === 'EMAIL') {
        return !!data.email && data.email.includes('@');
      }
      return true;
    },
    {
      message: 'Email is required for email login',
      path: ['email'],
    },
  );

type StudentRegistrationFormValues = z.infer<typeof studentRegistrationSchema>;

function AddStudentToBatch() {
  const { batchId } = Route.useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  // const { batchName, batchCode } = location.state;
  const form = useForm<StudentRegistrationFormValues>({
    resolver: zodResolver(studentRegistrationSchema),
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

  // Fetch grades (you can adjust endpoint)
  const { data: grades = [] } = useQuery({
    queryKey: ['grades'],
    queryFn: async () => {
      const res = await _axios.get('/grades');
      return res.data.grades || [];
    },
  });

  // Fetch boards
  const { data: boards = [] } = useQuery({
    queryKey: ['boards'],
    queryFn: async () => {
      const res = await _axios.get('/boards');
      return res.data.boards || [];
    },
  });

  // Register student mutation
  const mutation = useMutation({
    mutationFn: async (values: StudentRegistrationFormValues) => {
      const formData = new FormData();

      // Append all fields to FormData
      formData.append('batchId', batchId);
      formData.append('studentName', values.studentName);
      formData.append('dateOfBirth', values.dateOfBirth);
      formData.append('gender', values.gender);
      formData.append('studentPhoneNumber', values.studentPhoneNumber);
      formData.append('parentPhoneNumber', values.parentPhoneNumber);
      formData.append('parentPhoneNumber2', values.parentPhoneNumber2);
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

      if (values.mobileNumber) {
        formData.append('mobileNumber', values.mobileNumber);
      }
      if (values.email) {
        formData.append('email', values.email);
      }
      if (values.referedBy) {
        formData.append('referedBy', values.referedBy);
      }
      if (values.studentProfile) {
        formData.append('studentProfile', values.studentProfile);
      }
      return _axios.post('/batches/enroll-student', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    onSuccess: () => {
      toast.success('Student registered successfully');
      queryClient.invalidateQueries({ queryKey: ['batch-students', batchId] });
      router.history.back();
    },
    onError: (err: any) => {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Failed to register student';
      toast.error(message);
    },
  });

  const onSubmit = (values: StudentRegistrationFormValues) => {
    mutation.mutate(values);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue('studentProfile', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    form.setValue('studentProfile', undefined);
    setPreviewImage(null);
  };

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6">
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
        <CardHeader>
          <CardTitle className="text-2xl">Add Student to Batch</CardTitle>
          <CardDescription>
            {/* Batch: <span className="font-semibold">{batchName}</span> (
            {batchCode}) */}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Profile Image Upload */}
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
                      Upload student photo (JPG, PNG)
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

              {/* Actions */}
              <div className="flex justify-end gap-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.history.back()}
                  className="rounded-xsm"
                  disabled={mutation.isPending}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={mutation.isPending}
                  className="min-w-[160px] rounded-xsm bg-foreground text-background hover:bg-foreground/90">
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    'Register Student'
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
