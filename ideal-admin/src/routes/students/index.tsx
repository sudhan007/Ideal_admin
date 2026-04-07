// src/routes/students.tsx
import { createFileRoute, useSearch } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { _axios } from '@/lib/axios';
import {
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useState } from 'react';
import { format } from 'date-fns';
import { AlertTriangle, ArrowUpDown, Eye, Pencil, Power } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useDebouncedValue } from '@mantine/hooks';
import { CourseTableSkeleton } from '@/components/TableSkeleton';
import { Pagination } from '@/components/Pagination';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
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

type Student = {
  _id: string;
  studentName?: string;
  mobileNumber: string;
  email: string;
  isActive: boolean;
  gender?: 'male' | 'female' | 'other';
  registrationComplete?: boolean;
  createdAt: string;
};

type ApiResponse = {
  students: Student[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  message?: string;
};

export const Route = createFileRoute('/students/')({
  component: StudentsPage,
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page ?? 1),
    limit: (search.limit as number) ?? 10,
    search: (search.search as string) ?? '',
    gender: (search.gender as string) ?? '',
    sortBy: (search.sortBy as 'studentName' | 'createdAt') ?? 'createdAt',
    sortOrder: (search.sortOrder as 'asc' | 'desc') ?? 'desc',
  }),
});

function StudentsPage() {
  const navigate = Route.useNavigate();
  const search = useSearch({ from: '/students/' });
  const {
    page = 1,
    limit,
    search: searchTerm = '',
    gender = '',
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = search;

  const [sorting, setSorting] = useState<SortingState>([
    { id: sortBy, desc: sortOrder === 'desc' },
  ]);
  const queryClient = useQueryClient();

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [debounced] = useDebouncedValue(searchTerm, 600);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    studentId: string;
    studentName: string | undefined;
    action: 'deactivate' | 'activate';
  }>({
    open: false,
    studentId: '',
    studentName: '',
    action: 'deactivate',
  });
  const { data, isLoading, refetch } = useQuery<ApiResponse>({
    queryKey: [
      'students',
      { page, limit, search: debounced, gender, sortBy, sortOrder },
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: '10',
        search: debounced,
        gender,
        sortBy,
        sortOrder,
      });
      const res = await _axios.get(`/student/list?${params.toString()}`);
      return res.data;
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (studentId: string) => {
      const res = await _axios.patch(`/student/toggle-status/${studentId}`);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Student status updated successfully');
      refetch();
      setConfirmDialog({
        open: false,
        studentId: '',
        studentName: '',
        action: 'deactivate',
      });
    },
    onError: (error: any) => {
      const errorMsg = error?.error || 'Failed to update course status';
      toast.error(errorMsg);
    },
  });

  const handleStatusToggle = (student: Student) => {
    if (student.isActive) {
      setConfirmDialog({
        open: true,
        studentId: student._id,
        studentName: student.studentName,
        action: 'deactivate',
      });
    } else {
      toggleStatusMutation.mutate(student._id);
    }
  };
  const confirmStatusToggle = () => {
    toggleStatusMutation.mutate(confirmDialog.studentId);
  };
  const handlePageChange = (newPage: number) => {
    navigate({ search: (prev) => ({ ...prev, page: newPage }) });
  };

  const handleLimitChange = (newLimit: number) => {
    navigate({ search: (prev) => ({ ...prev, page: 1, limit: newLimit }) });
  };

  const students = data?.students ?? [];
  const totalPages = data?.pagination?.totalPages || 1;
  const totalItems = data?.pagination?.total;
  const itemsPerPage = data?.pagination?.limit || limit;

  const columns: ColumnDef<Student>[] = [
    {
      accessorKey: 'studentName',
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 font-medium"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Student Name
          <ArrowUpDown className="h-4 w-4" />
        </button>
      ),
      cell: ({ row }) => (
        <div className="font-medium">
          {row.original.studentName || 'Not Set'}
        </div>
      ),
    },
    {
      accessorKey: 'mobileNumber',
      header: 'Phone Number',
      cell: ({ row }) => <div>{row.original.mobileNumber || '-'}</div>,
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => <div>{row.original.email || '-'}</div>,
    },
    {
      accessorKey: 'gender',
      header: 'Gender',
      cell: ({ row }) => (
        <div className="capitalize">{row.original.gender || '-'}</div>
      ),
    },
    {
      accessorKey: 'registrationComplete',
      header: 'Registered',
      cell: ({ row }) => (
        <div
          className={
            row.original.registrationComplete
              ? 'text-green-600'
              : 'text-red-600'
          }>
          {row.original.registrationComplete ? 'Yes' : 'No'}
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 font-medium"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Created At
          <ArrowUpDown className="h-4 w-4" />
        </button>
      ),
      cell: ({ row }) =>
        format(new Date(row.original.createdAt), 'MMM dd, yyyy'),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const student = row.original;
        return (
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() =>
                    navigate({
                      to: '/students/$id',
                      params: { id: student._id },
                    })
                  }
                  className="p-2 rounded-md cursor-pointer hover:bg-secondary-background transition-colors"
                  title="View Student Details">
                  <Eye className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View Student</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() =>
                    navigate({
                      to: '/students/edit/$id',
                      params: { id: student._id },
                    })
                  }
                  className="p-2 rounded-md cursor-pointer hover:bg-secondary-background transition-colors"
                  title="Edit Student ">
                  <Pencil className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View Student</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleStatusToggle(student)}
                  disabled={toggleStatusMutation.isPending}
                  className={`p-2 rounded-md hover:bg-accent cursor-pointer transition-colors ${
                    student.isActive ? 'text-green-600' : 'text-gray-400'
                  } ${toggleStatusMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                  aria-label="Toggle course status">
                  <Power className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{student.isActive ? 'Deactivate' : 'Activate'} Student</p>
              </TooltipContent>
            </Tooltip>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: students,
    columns,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
      columnVisibility,
    },
  });

  return (
    <div className="mx-auto p-4 md:p-6">
      <div className="mb-6  gap-4 ">
        <div className="flex  gap-3 justify-end">
          {/* Search Input */}
          <Input
            placeholder="Search by name, phone, email..."
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
            className="w-full sm:w-72"
          />
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
                    No students found
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-muted/50 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 border-b text-sm">
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
      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) =>
          setConfirmDialog((prev) => ({ ...prev, open }))
        }>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Deactivate Course?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate{' '}
              <strong>"{confirmDialog.studentName}"</strong>?
              <br />
              <br />
              This student is currently deactivated. They will not appear to
              other students and cannot be enrolled until reactivated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={toggleStatusMutation.isPending}
              onClick={() =>
                setConfirmDialog({
                  open: false,
                  studentId: '',
                  studentName: '',
                  action: 'deactivate',
                })
              }>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={toggleStatusMutation.isPending}
              onClick={confirmStatusToggle}
              className="">
              {toggleStatusMutation.isPending
                ? 'Deactivating...'
                : 'Deactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
