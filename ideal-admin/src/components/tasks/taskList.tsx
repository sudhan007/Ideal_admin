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
type Task = {
  _id: string;
  taskName: string;
  taskDescription: string;
  dueDateTime: string;
  fileType: 'IMAGE' | 'PDF' | string;
  fileUrls: string[];
  createdAt: string;
  courseName: string;
  chapterName: string;
  lessonName: string;
  courseId: string;
  chapterId: string;
  lessonId: string;
};

type ApiResponse = {
  data: Task[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalTasks: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
};

export function TaskList() {
  const navigate = useNavigate();
  const router = useRouter();
  const search: any = useSearch({ from: '/courses/tasks/' });

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
    queryKey: ['tasks', { page, limit, search: debounced, sortBy, sortOrder }],
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
      const res = await _axios.get(`/task?${params.toString()}`);
      return res.data;
    },
  });

  const handlePageChange = (newPage: number) => {
    navigate({ search: (prev) => ({ ...prev, page: newPage }) });
  };

  const handleLimitChange = (newLimit: number) => {
    navigate({ search: (prev) => ({ ...prev, page: 1, limit: newLimit }) });
  };

  const tasks = data?.data ?? [];
  const totalPages = data?.pagination?.totalPages || 1;
  const totalItems = data?.pagination?.totalTasks;
  const itemsPerPage = data?.pagination?.limit || limit;

  const handleCreateTasks = () => {
    navigate({
      to: '/courses/tasks',
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

  const handleEditQuestion = (taskId: string) => {
    navigate({
      to: '/courses/tasks',
      search: {
        page,
        limit,
        lessonId,
        courseId,
        chapterId,
        mode: 'edit',
        taskId,
      },
    });
  };

  const columns: ColumnDef<Task>[] = [
    {
      accessorKey: 'taskName',
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 font-medium"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Task Name
          <ArrowUpDown className="h-4 w-4" />
        </button>
      ),
      cell: ({ row }) => (
        <div className="font-medium">{row.original.taskName}</div>
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
      accessorKey: 'fileType',
      header: 'Attachment',
      cell: ({ row }) => {
        const task = row.original;
        if (!task.fileUrls?.length)
          return <span className="text-muted-foreground">—</span>;

        return (
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {task.fileType} × {task.fileUrls.length}
            </span>
          </div>
        );
      },
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
        const task = row.original;
        return (
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => {
                    navigate({
                      to: '/courses/tasks',
                      search: {
                        courseId: task.courseId,
                        chapterId: task.chapterId,
                        lessonId: task.lessonId,
                        mode: 'edit',
                        taskId: task._id,
                        taskData: task,
                      },
                    });
                  }}
                  className="p-2 rounded cursor-pointer  hover:bg-secondary-background transition-colors">
                  <Pencil className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit Task</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => {
                    navigate({
                      to: `/tasks/$id`,
                      params: {
                        id: task._id,
                      },
                      state: {
                        taskName: task.taskName,
                      },
                    });
                  }}
                  className="p-2 rounded cursor-pointer  hover:bg-secondary-background transition-colors">
                  <Eye className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View Task</p>
              </TooltipContent>
            </Tooltip>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: tasks,
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
            placeholder="Search tasks..."
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
            onClick={handleCreateTasks}
            className="h-10 cursor-pointer text-background rounded-xsm">
            <Plus /> Create Task
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
                    No tasks found
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
