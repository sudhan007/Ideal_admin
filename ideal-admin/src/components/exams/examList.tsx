//@ts-nocheck
import { useQuery } from '@tanstack/react-query';
import { _axios } from '@/lib/axios';
import {
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useState } from 'react';
import { useRouter, useSearch } from '@tanstack/react-router';
import { format } from 'date-fns';
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Pencil,
  Plus,
  View,
  ArrowBigLeft,
  Eye,
  PlusCircle,
  CircleQuestionMark,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CourseTableSkeleton } from '../TableSkeleton';
import { useNavigate } from '@tanstack/react-router';
import { useDebouncedValue } from '@mantine/hooks';
import { Pagination } from '../Pagination';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
type Exam = {
  _id: string;
  examName: string;
  dueDateTime: string;
  createdAt: string;
  courseName: string;
  chapterName: string;
  lessonName: string;
  courseId: string;
  chapterId: string;
  lessonId: string;
};

type ApiResponse = {
  data: Exam[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalExams: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
};

export function ExamList() {
  const navigate = useNavigate();
  const router = useRouter();
  const search: any = useSearch({ from: '/courses/exams/' });

  const {
    page = 1,
    limit = 10,
    search: searchTerm = '',
    sortBy = 'createdAt',
    sortOrder = 'desc',
    lessonId,
    courseId,
    chapterId,
  }: any = search;

  const [sorting, setSorting] = useState<SortingState>([
    { id: sortBy, desc: sortOrder === 'desc' },
  ]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [debounced] = useDebouncedValue(searchTerm, 600);

  const { data, isLoading } = useQuery<ApiResponse>({
    queryKey: ['exams', { page, limit, search: debounced, sortBy, sortOrder }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        courseId: String(courseId),
        chapterId: String(chapterId),
        lessonId: String(lessonId),
        search: debounced,
        sortBy,
        sortOrder,
      });
      const res = await _axios.get(`/exam?${params.toString()}`);
      return res.data;
    },
  });

  const handlePageChange = (newPage: number) => {
    navigate({ search: (prev) => ({ ...prev, page: newPage }) });
  };

  const handleLimitChange = (newLimit: number) => {
    navigate({ search: (prev) => ({ ...prev, page: 1, limit: newLimit }) });
  };

  const exams = data?.data ?? [];
  const totalPages = data?.pagination?.totalPages || 1;
  const totalItems = data?.pagination?.totalExams;
  const itemsPerPage = data?.pagination?.limit || limit;

  const handleCreateExams = () => {
    navigate({
      to: '/courses/exams',
      search: {
        page,
        limit,
        lessonId,
        courseId,
        chapterId,
        mode: 'create',
      },
    });
  };

  const handleEditQuestion = (examId: string) => {
    navigate({
      to: '/courses/exams',
      search: {
        page,
        limit,
        lessonId,
        courseId,
        chapterId,
        mode: 'edit',
        examId,
      },
    });
  };

  const columns: ColumnDef<Exam>[] = [
    {
      accessorKey: 'examName',
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 font-medium"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Exam Name
          <ArrowUpDown className="h-4 w-4" />
        </button>
      ),
      cell: ({ row }) => (
        <div className="font-medium">{row.original.examName}</div>
      ),
    },
    {
      accessorKey: 'courseName',
      header: 'Course',
      cell: ({ row }) => (
        <div className="text-muted-foreground">{row.original.courseName}</div>
      ),
    },
    {
      id: 'chapter-lesson',
      header: 'Chapter / Lesson',
      cell: ({ row }) => (
        <div className="text-sm">
          <div>{row.original.chapterName}</div>
          <div className="text-muted-foreground text-xs">
            {row.original.lessonName}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'dueDateTime',
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 font-medium"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Due Date
          <ArrowUpDown className="h-4 w-4" />
        </button>
      ),
      cell: ({ row }) => (
        <div className="text-sm">
          {format(new Date(row.original.dueDateTime), 'MMM dd, yyyy HH:mm')}
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 font-medium"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Created
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
        const exam = row.original;
        return (
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => {
                    navigate({
                      to: '/courses/exams',
                      search: {
                        courseId: exam.courseId,
                        chapterId: exam.chapterId,
                        lessonId: exam.lessonId,
                        mode: 'edit',
                        examId: exam._id,
                        examData: exam,
                      },
                    });
                  }}
                  className="p-2 rounded cursor-pointer  hover:bg-secondary-background transition-colors">
                  <Pencil className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit Exam</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => {
                    navigate({
                      to: `/courses/exams/$id`,
                      params: {
                        id: exam._id,
                      },
                      state: {
                        examName: exam.examName,
                      },
                    });
                  }}
                  className="p-2 rounded cursor-pointer  hover:bg-secondary-background transition-colors">
                  <Eye className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View Exam</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => {
                    navigate({
                      to: `/courses/exams/addquestions`,
                      search: {
                        page: 1,
                        limit: 10,
                        examId: exam._id,
                        mode: 'create',
                      },
                    });
                  }}
                  className="p-2 rounded cursor-pointer  hover:bg-secondary-background transition-colors">
                  <PlusCircle className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add Questions to Exam</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => {
                    navigate({
                      to: `/courses/exams/addquestions`,
                      search: {
                        page: 1,
                        limit: 10,
                        examId: exam._id,
                        mode: 'list',
                      },
                    });
                  }}
                  className="p-2 rounded cursor-pointer  hover:bg-secondary-background transition-colors">
                  <CircleQuestionMark className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View Questions</p>
              </TooltipContent>
            </Tooltip>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: exams,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
      columnVisibility,
    },
  });

  return (
    <div className="mx-auto p-2">
      {/* Header + Search + Create Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <Button
          onClick={() =>
            navigate({
              to: '/courses/$id/chapters/$chapterId',
              params: {
                id: courseId,
                chapterId: chapterId,
              },
            })
          }
          variant="outline"
          className="rounded-xsm hover:text-foreground text-foreground  cursor-pointer hover:bg-accent/50">
          <ArrowBigLeft className="mr-2 h-4 w-4" /> Back to Chapters
        </Button>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Input
            placeholder="Search exams..."
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
            className="w-full sm:w-72 h-10"
          />
          <Button
            onClick={handleCreateExams}
            className="h-10 cursor-pointer text-background rounded-xsm">
            <Plus /> Create Exam
          </Button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <CourseTableSkeleton />
      ) : (
        <div className="rounded-lg border bg-card shadow-sm">
          <table className="w-full table-auto">
            <thead className="border-b bg-muted/40">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
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
                    className="px-6 py-12 text-center text-muted-foreground">
                    No exams found
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b hover:bg-muted/30 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 text-sm">
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
