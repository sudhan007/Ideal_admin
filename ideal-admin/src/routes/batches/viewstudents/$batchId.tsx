// src/routes/batches.viewstudents.$batchId.tsx
import { createFileRoute } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { _axios } from '@/lib/axios';
import {
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useState } from 'react';
import { useSearch } from '@tanstack/react-router';
import {
  ArrowBigLeft,
  ArrowUpDown,
  CheckCircle,
  Eye,
  Plus,
  PlusIcon,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useDebouncedValue } from '@mantine/hooks';
import { Pagination } from '@/components/Pagination';
import { CourseTableSkeleton } from '@/components/TableSkeleton';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { toast } from 'sonner';
type StudentEnrollment = {
  _id: string;
  courseId: string;
  totalClassesAttended: number;
  attendancePercentage: number;
  onlineCourseAccess: boolean;
  batchEnrollmentDate: string;
  student: {
    _id: string;
    studentName: string;
    profileImageUrl: string;
    studentType: 'OFFLINE' | 'ONLINE' | string;
  };
};

type ApiResponse = {
  status: boolean;
  data: StudentEnrollment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  count: number;
};

export const Route = createFileRoute('/batches/viewstudents/$batchId')({
  component: BatchStudentsPage,
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page ?? 1),
    limit: (search.limit as number) ?? 10,
    search: (search.search as string) ?? '',
    sortBy: (search.sortBy as string) ?? 'student.studentName',
    sortOrder: (search.sortOrder as 'asc' | 'desc') ?? 'asc',
  }),
});

function BatchStudentsPage() {
  const queryClient = useQueryClient();
  const { batchId } = Route.useParams();
  const navigate = Route.useNavigate();
  const search = useSearch({ from: Route.fullPath });

  const {
    page = 1,
    limit,
    search: searchTerm = '',
    sortBy = 'student.studentName',
    sortOrder = 'asc',
  } = search;
  const [debounced] = useDebouncedValue(searchTerm, 600);

  const [sorting, setSorting] = useState<SortingState>([
    { id: sortBy, desc: sortOrder === 'desc' },
  ]);
  const [columnVisibility] = useState<VisibilityState>({});
  const [selectedStudent, setSelectedStudent] =
    useState<StudentEnrollment | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const { data, isLoading } = useQuery<ApiResponse>({
    queryKey: [
      'batch-students',
      batchId,
      { page, limit, search: debounced, sortBy, sortOrder },
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search: debounced,
        sortBy,
        sortOrder,
      });
      const res = await _axios.get(`/batches/students/${batchId}/?${params}`);
      return res.data;
    },
  });

  const grantAccessMutation = useMutation({
    mutationFn: async (enrollment: StudentEnrollment) => {
      const response = await _axios.post('/course-enrollment/offline', {
        courseId: enrollment.courseId,
        studentId: enrollment.student._id,
        batchId: batchId,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Online course access granted successfully!');
      queryClient.invalidateQueries({
        queryKey: ['batch-students', batchId],
      });
      setIsAlertOpen(false);
      setSelectedStudent(null);
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.error ||
        'Failed to grant course access';
      toast.error(errorMessage);
      setIsAlertOpen(false);
      setSelectedStudent(null);
    },
  });

  const handleGrantAccess = (enrollment: StudentEnrollment) => {
    setSelectedStudent(enrollment);
    setIsAlertOpen(true);
  };
  const confirmGrantAccess = () => {
    if (selectedStudent) {
      grantAccessMutation.mutate(selectedStudent);
    }
  };
  const handlePageChange = (newPage: number) => {
    navigate({ search: (prev) => ({ ...prev, page: newPage }) });
  };

  const handleLimitChange = (newLimit: number) => {
    navigate({ search: (prev) => ({ ...prev, page: 1, limit: newLimit }) });
  };

  const students = data?.data ?? [];
  const totalPages = data?.pagination?.totalPages || 1;
  const totalItems = data?.pagination?.total;
  const itemsPerPage = data?.pagination?.limit || limit;

  const columns: ColumnDef<StudentEnrollment>[] = [
    {
      accessorKey: 'student.studentName',
      id: 'studentName',
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 font-medium"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Student Name
          <ArrowUpDown className="h-4 w-4" />
        </button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <img
            src={row.original.student.profileImageUrl}
            alt={row.original.student.studentName}
            className="h-10 w-10 rounded-full object-cover border border-gray-200"
            onError={(e) => (e.currentTarget.src = '/fallback-avatar.png')}
          />
          <div className="font-medium">{row.original.student.studentName}</div>
        </div>
      ),
    },
    {
      accessorKey: 'student.studentType',
      header: 'Type',
      cell: ({ row }) => (
        <div className="font-medium">{row.original.student.studentType}</div>
      ),
    },
    {
      accessorKey: 'totalClassesAttended',
      header: 'Classes Attended',
      cell: ({ row }) => (
        <div className="font-medium">{row.original.totalClassesAttended}</div>
      ),
    },
    {
      accessorKey: 'attendancePercentage',
      header: 'Attendance %',
      cell: ({ row }) => (
        <div className="font-medium">
          {row.original.attendancePercentage.toFixed(1)}%
        </div>
      ),
    },
    {
      accessorKey: 'batchEnrollmentDate',
      header: 'Enrolled On',
      cell: ({ row }) => (
        <div className="font-medium">
          {format(new Date(row.original.batchEnrollmentDate), 'MMM dd, yyyy')}
        </div>
      ),
    },
    {
      accessorKey: 'onlineCourseAccess',
      header: 'Course Access',
      cell: ({ row }) => (
        <div
          className={`font-medium ${
            row.original.onlineCourseAccess ? 'text-green-600' : 'text-red-600'
          }`}>
          {row.original.onlineCourseAccess ? 'Yes' : 'No'}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() =>
                  navigate({
                    to: '/students/$id',
                    params: { id: row.original.student._id },
                  })
                }
                className="p-2 rounded-md cursor-pointer  hover:bg-gray-100 transition-colors">
                <Eye className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View Student</p>
            </TooltipContent>
          </Tooltip>
          {!row.original.onlineCourseAccess && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleGrantAccess(row.original)}
                  disabled={grantAccessMutation.isPending}
                  className="p-2 rounded-md cursor-pointer hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Grant Online Access</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: students,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnVisibility,
    },
  });

  return (
    <div className="mx-auto p-2">
      {/* Header + Search + Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
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

        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) =>
              navigate({
                search: (prev) => ({
                  ...prev,
                  search: e.target.value,
                  page: 1,
                }),
                replace: true,
              })
            }
            className="w-full sm:w-72 border border-foreground px-4 py-2 h-10 rounded-xsm focus-visible:outline-none focus-visible:ring-0"
          />

          <Button
            onClick={() => {
              navigate({
                to: '/batches/attendance/$batchId',
                params: {
                  batchId: batchId,
                },
              });
            }}
            className="h-10 rounded-xsm cursor-pointer">
            Mark Attendance
          </Button>
          <Button
            onClick={() => {
              navigate({
                to: `/batches/addstudents/$batchId`,
                params: { batchId: batchId },
              });
            }}
            className="h-10 rounded-xsm cursor-pointer">
            <PlusIcon />
            Add Student
          </Button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <CourseTableSkeleton />
      ) : (
        <div className="rounded-md border bg-card">
          <table className="w-full ">
            <thead className="">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-sm font-medium text-muted-foreground border-b">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="h-24 text-center text-muted-foreground">
                    No students found in this batch
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-background">
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-3 py-2 border-[0.5px] border-background hover:bg-secondary-background">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems ?? 0}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
        className="p-6 bg-gray-50 border-t"
      />
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Grant Online Course Access</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to grant online course access to{' '}
              <span className="font-semibold">
                {selectedStudent?.student.studentName}
              </span>
              ? This will allow them to access the online course content.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsAlertOpen(false);
                setSelectedStudent(null);
              }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmGrantAccess}
              disabled={grantAccessMutation.isPending}
              className="bg-green-600 hover:bg-green-700">
              {grantAccessMutation.isPending ? 'Granting...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
