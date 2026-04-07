import { Pagination } from '@/components/Pagination';
import { CourseTableSkeleton } from '@/components/TableSkeleton';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { _axios } from '@/lib/axios';
import { useDebouncedValue } from '@mantine/hooks';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, useSearch } from '@tanstack/react-router';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
} from '@tanstack/react-table';
import { format } from 'date-fns';
import {
  ArrowUpDown,
  CircleQuestionMark,
  Pencil,
  Plus,
  PlusIcon,
} from 'lucide-react';
import { useState } from 'react';

export const Route = createFileRoute('/demo/')({
  component: DemoCoursePage,
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page ?? 1),
    limit: (search.limit as number) ?? 10,
    search: (search.search as string) ?? '',
    sortBy: (search.sortBy as string) ?? 'createdAt',
    sortOrder: (search.sortOrder as 'asc' | 'desc') ?? 'desc',
  }),
});

type Demo = {
  _id: string;
  videoUrl: string;
  courseId: string;
  course: {
    courseName: string;
  };
  createdAt: string;
};

type ApiResponse = {
  ok: boolean;
  data: Demo[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

function DemoCoursePage() {
  const navigate = Route.useNavigate();
  const search = useSearch({ from: '/demo/' });

  const {
    page = 1,
    limit,
    search: searchTerm = '',
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = search;
  const [debounced] = useDebouncedValue(searchTerm, 600);

  const [sorting, setSorting] = useState<SortingState>([
    { id: sortBy, desc: sortOrder === 'desc' },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const { data, isLoading } = useQuery<ApiResponse>({
    queryKey: ['demos', { page, limit, search: debounced, sortBy, sortOrder }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search: debounced,
        sortBy,
        sortOrder,
      });
      const res = await _axios.get(`/course-demo?${params.toString()}`);
      return res.data;
    },
  });
  const handlePageChange = (newPage: number) => {
    navigate({ search: (prev) => ({ ...prev, page: newPage }) });
  };

  const handleLimitChange = (newLimit: number) => {
    navigate({ search: (prev) => ({ ...prev, page: 1, limit: newLimit }) });
  };

  const demos = data?.data ?? [];
  const totalPages = data?.pagination?.totalPages || 1;
  const totalItems = data?.pagination?.total;
  const itemsPerPage = data?.pagination?.limit || limit;

  const columns: ColumnDef<Demo>[] = [
    {
      accessorKey: 'videoUrl',
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 font-medium"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Video Url
          <ArrowUpDown className="h-4 w-4" />
        </button>
      ),
      cell: ({ row }) => (
        <div className="font-medium">{row.original.videoUrl}</div>
      ),
    },

    {
      id: 'course',
      header: 'Course',
      cell: ({ row }) => (
        <div className="text-sm">{row.original.course?.courseName || '—'}</div>
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
        const demo = row.original;
        return (
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() =>
                    navigate({
                      to: `/demo/$id`,
                      params: { id: demo._id },
                      state: {
                        demo: {
                          _id: demo._id,
                          videoUrl: demo.videoUrl,
                          courseId: demo.courseId,
                        },
                      },
                    })
                  }
                  className="p-2 rounded-md cursor-pointer hover:bg-muted transition-colors">
                  <Pencil className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit Demo</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() =>
                    navigate({
                      to: `/demo/addquestion`,
                      search: {
                        page: 1,
                        limit: 10,
                        demoCourseId: demo._id,
                        mode: 'create',
                      },
                    })
                  }
                  className="p-2 rounded-md cursor-pointer hover:bg-muted transition-colors">
                  <PlusIcon />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add Questions to Demo</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => {
                    navigate({
                      to: `/demo/addquestion`,
                      search: {
                        page: 1,
                        limit: 10,
                        demoCourseId: demo._id,
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
            {/* <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() =>
                    navigate({
                      to: `/batches/whatsapp/$id`,
                      params: { id: batch._id },
                    })
                  }
                  className="p-2 rounded-md cursor-pointer hover:bg-muted transition-colors">
                  <MessageCircle className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Send Message</p>
              </TooltipContent>
            </Tooltip> */}
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: demos,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  return (
    <div className="mx-auto p-2">
      {/* Header + Search + Create Button */}
      <div className="flex justify-end gap-3 mb-6">
        <Button
          onClick={() => navigate({ to: '/demo/$id', params: { id: 'new' } })}
          className="gap-2 cursor-pointer">
          <Plus className="h-4 w-4" />
          Create Demo Course
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <CourseTableSkeleton />
      ) : (
        <div className="rounded-md border bg-card">
          <table className="w-full">
            <thead>
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
              {table.getRowModel().rows?.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="h-24 text-center text-muted-foreground">
                    No Demos found
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
    </div>
  );
}
