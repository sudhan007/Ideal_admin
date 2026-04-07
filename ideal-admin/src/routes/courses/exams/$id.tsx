// src/routes/courses/exams/$id.tsx
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
  Percent,
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

type ExamSubmission = {
  _id: string;
  studentId: string;
  examId: string;
  correctCount: number;
  wrongCount: number;
  totalQuestions: number;
  scorePercentage: number;
  submittedAt: string;
  examName: string;
  examDueDate: string;
  examCreatedAt: string;
  chapterName: string;
  lessonName: string;
  studentName: string;
  studentPhoneNumber?: string;
  studentEmail?: string | null;
};

type ApiResponse = {
  ok: boolean;
  data: ExamSubmission[];
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

export const Route = createFileRoute('/courses/exams/$id')({
  component: ExamSubmissionsPage,
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page ?? 1),
    limit: (search.limit as number) ?? 10,
    search: (search.search as string) ?? '',
    // You can add status filter later if your backend supports it
    sortBy: (search.sortBy as string) ?? 'submittedAt',
    sortOrder: (search.sortOrder as 'asc' | 'desc') ?? 'desc',
  }),
});

function ExamSubmissionsPage() {
  const { id: examId } = Route.useParams();
  const state: any = useLocation().state;
  const examNameFromState = state?.examName || 'Exam';

  const router = useRouter();
  const navigate = Route.useNavigate();
  const search = useSearch({ from: '/courses/exams/$id' });

  const {
    page = 1,
    search: searchTerm = '',
    limit,
    sortBy = 'submittedAt',
    sortOrder = 'desc',
  } = search;

  const [sorting, setSorting] = useState<SortingState>([
    { id: sortBy, desc: sortOrder === 'desc' },
  ]);
  const [debouncedSearch] = useDebouncedValue(searchTerm, 600);

  const { data, isLoading } = useQuery<ApiResponse>({
    queryKey: [
      'exam-submissions',
      examId,
      { page, limit, search: debouncedSearch, sortBy, sortOrder },
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        examId,
        page: String(page),
        limit: String(limit),
        search: debouncedSearch,
        sortBy,
        sortOrder,
      });

      const res = await _axios.get(`/exam/submissions?${params.toString()}`);
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

  const columns: ColumnDef<ExamSubmission>[] = [
    {
      accessorKey: 'studentName',
      header: 'Student',
      cell: ({ row }) => (
        <div className="font-medium">{row.original.studentName}</div>
      ),
    },
    {
      accessorKey: 'scorePercentage',
      header: ({ column }) => (
        <button
          className="flex items-center gap-1"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Score %
          <ArrowUpDown className="h-4 w-4" />
        </button>
      ),
      cell: ({ row }) => {
        const percentage = row.original.scorePercentage;
        const color =
          percentage >= 80
            ? 'text-green-600'
            : percentage >= 50
              ? 'text-amber-600'
              : 'text-red-600';

        return (
          <div className={cn('font-medium', color)}>
            {percentage.toFixed(1)}%
          </div>
        );
      },
    },
    {
      id: 'performance',
      header: 'Performance',
      cell: ({ row }) => {
        const { correctCount, wrongCount, totalQuestions } = row.original;
        return (
          <div className="text-sm">
            {correctCount} / {totalQuestions} correct
            {wrongCount > 0 && (
              <span className="text-red-600 ml-2">({wrongCount} wrong)</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'submittedAt',
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
          {row.original.submittedAt
            ? format(new Date(row.original.submittedAt), 'MMM dd, yyyy ')
            : '—'}
        </div>
      ),
    },
    {
      accessorKey: 'examDueDate',
      header: 'Due Date',
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {format(new Date(row.original.examDueDate), 'MMM dd, yyyy')}
        </div>
      ),
    },
    {
      id: 'chapter',
      header: 'Chapter / Lesson',
      cell: ({ row }) => (
        <div className="text-sm">
          <div>{row.original.chapterName}</div>
          <div className="text-xs text-muted-foreground">
            {row.original.lessonName}
          </div>
        </div>
      ),
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
          <h1 className="text-2xl font-bold">Submissions for Exam</h1>
        </div>
        <p className="text-muted-foreground">Exam: {examNameFromState}</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Search by student name or phone..."
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

          {/* Add status filter here later if needed */}
          {/* <Select ... /> */}
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
                    No exam submissions found
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
