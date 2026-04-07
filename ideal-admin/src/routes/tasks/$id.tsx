// src/routes/tasks/$id.tsx
import {
  createFileRoute,
  useLocation,
  useRouter,
} from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { _axios } from '@/lib/axios';
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useState } from 'react';
import { useSearch } from '@tanstack/react-router';
import {
  ArrowUpDown,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Eye,
  ChevronLeftIcon,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useDebouncedValue } from '@mantine/hooks';
import { Pagination } from '@/components/Pagination';
import { format } from 'date-fns';
import { CourseTableSkeleton } from '@/components/TableSkeleton';

type SubmissionStatus = 'SUBMITTED' | 'RE_SUBMITTED' | 'REJECTED' | 'COMPLETED';

type Submission = {
  _id: string;
  taskId: string;
  studentId: string;
  currentStatus: SubmissionStatus;
  totalSubmissions: number;
  latestSubmissionNumber: number;
  submittedAt: string;
  studentName: string;
  createdAt: string;
  updatedAt: string;
  taskName: string;
  taskDescription: string;
  taskDueDate: string;
};

type ApiResponse = {
  ok: boolean;
  data: Submission[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalSubmissions: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
};

// ── Route ────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/tasks/$id')({
  component: TaskSubmissionsPage,
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page ?? 1),
    limit: (search.limit as number) ?? 10,
    search: (search.search as string) ?? '',
    status: (search.status as SubmissionStatus | undefined) ?? undefined,
    sortBy: (search.sortBy as string) ?? 'createdAt',
    sortOrder: (search.sortOrder as 'asc' | 'desc') ?? 'desc',
  }),
});

function TaskSubmissionsPage() {
  const { id: taskId } = Route.useParams();
  const state: any = useLocation().state;
  const taskName = state.taskName;
  const router = useRouter();
  const navigate = Route.useNavigate();
  const search = useSearch({ from: '/tasks/$id' });

  const {
    page = 1,
    search: searchTerm = '',
    status,
    limit,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = search;

  const [sorting, setSorting] = useState<SortingState>([
    { id: sortBy, desc: sortOrder === 'desc' },
  ]);
  const [debounced] = useDebouncedValue(searchTerm, 600);

  const { data, isLoading } = useQuery<ApiResponse>({
    queryKey: [
      'task-submissions',
      taskId,
      { page, limit, search: debounced, status, sortBy, sortOrder },
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        taskId: taskId,
        page: String(page),
        limit: String(limit),
        search: debounced,
        ...(status && { status }),
        sortBy,
        sortOrder,
      });

      const res = await _axios.get(`/task/submissions?${params.toString()}`);
      return res.data;
    },
  });
  const handlePageChange = (newPage: number) => {
    navigate({ search: (prev) => ({ ...prev, page: newPage }) });
  };

  const handleLimitChange = (newLimit: number) => {
    navigate({ search: (prev) => ({ ...prev, page: 1, limit: newLimit }) });
  };
  const submissions = data?.data ?? [];
  const totalPages = data?.pagination?.totalPages || 1;
  const totalItems = data?.pagination?.totalSubmissions;
  const itemsPerPage = data?.pagination?.limit || limit;

  const columns: ColumnDef<Submission>[] = [
    {
      accessorKey: 'studentName',
      header: 'Student ',
      cell: ({ row }) => (
        <div className="font-medium">{row.original.studentName}</div>
      ),
    },
    {
      accessorKey: 'currentStatus',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.currentStatus;

        const statusStyles = {
          SUBMITTED: 'bg-blue-100 text-blue-800',
          RE_SUBMITTED: 'bg-purple-100 text-purple-800',
          REJECTED: 'bg-red-100 text-red-800',
          COMPLETED: 'bg-green-100 text-green-800',
        };

        const statusIcons = {
          SUBMITTED: <Clock className="h-4 w-4" />,
          RE_SUBMITTED: <RefreshCw className="h-4 w-4" />,
          REJECTED: <XCircle className="h-4 w-4" />,
          COMPLETED: <CheckCircle2 className="h-4 w-4" />,
        };

        return (
          <div
            className={cn(
              'inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium',
              statusStyles[status],
            )}>
            {statusIcons[status]}
            {status.replace('_', ' ')}
          </div>
        );
      },
    },
    {
      accessorKey: 'totalSubmissions',
      header: 'Attempts',
      cell: ({ row }) => (
        <div className="text-center font-medium">
          {row.original.totalSubmissions}
        </div>
      ),
    },
    {
      accessorKey: 'taskDueDate',
      header: ({ column }) => (
        <button
          className="flex items-center gap-1"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Due Date
          <ArrowUpDown className="h-4 w-4" />
        </button>
      ),
      cell: ({ row }) => (
        <div className="text-sm">
          {format(new Date(row?.original?.taskDueDate), 'MMM dd, yyyy')}
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <button
          className="flex items-center gap-1"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Submitted At
          <ArrowUpDown className="h-4 w-4" />
        </button>
      ),
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {format(new Date(row.original.submittedAt), 'MMM dd, yyyy')}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const submission = row.original;
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="cursor-pointer"
                onClick={() =>
                  navigate({
                    to: `/tasks/submissions/$submissionId`,
                    params: { submissionId: submission._id },
                  })
                }>
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View Submission</p>
            </TooltipContent>
          </Tooltip>
        );
      },
    },
  ];

  const table = useReactTable({
    data: submissions,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

  return (
    <div className="container mx-auto py-6">
      {/* Header */}

      <div className="mb-6">
        <div className="flex items-center gap-3">
          <ChevronLeftIcon
            className="h-6 w-6 cursor-pointer"
            onClick={() => router.history.back()}
          />
          <h1 className="text-2xl font-bold"> Submissions for Task</h1>
        </div>
        <p className="text-muted-foreground">Task : {taskName}</p>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Search by student ID..."
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
            className="w-full sm:w-64"
          />

          <Select
            value={status ?? 'all'}
            onValueChange={(value) =>
              navigate({
                search: (prev) => ({
                  ...prev,
                  status:
                    value === 'all' ? undefined : (value as SubmissionStatus),
                  page: 1,
                }),
                replace: true,
              })
            }>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="SUBMITTED">Submitted</SelectItem>
              <SelectItem value="RE_SUBMITTED">Re-submitted</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <CourseTableSkeleton />
      ) : (
        <div className="rounded-md border">
          <table className="w-full">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-sm font-medium text-muted-foreground bg-muted/50">
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
              {table.getRowModel().rows?.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="h-24 text-center text-muted-foreground">
                    No submissions found
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="border-t hover:bg-muted/30">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3">
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
    </div>
  );
}
