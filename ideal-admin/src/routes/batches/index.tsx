// src/routes/batches.tsx
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { _axios } from '@/lib/axios';
import {
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useState } from 'react';
import { useSearch } from '@tanstack/react-router';
import { format } from 'date-fns';
import {
  ArrowUpDown,
  Pencil,
  Plus,
  CalendarDays,
  PlusIcon,
  Eye,
  MessageCircle,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CourseTableSkeleton } from '@/components/TableSkeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useDebouncedValue } from '@mantine/hooks';
import { Pagination } from '@/components/Pagination';
type Batch = {
  _id: string;
  batchName: string;
  batchCode: string;
  courseId: string;
  course: {
    courseName: string;
  };
  startDate: string;
  endDate: string;
  days: string[];
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdAt: string;
};

type ApiResponse = {
  ok: boolean;
  data: Batch[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

export const Route = createFileRoute('/batches/')({
  component: BatchesPage,
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page ?? 1),
    limit: (search.limit as number) ?? 10,
    search: (search.search as string) ?? '',
    sortBy: (search.sortBy as string) ?? 'createdAt',
    sortOrder: (search.sortOrder as 'asc' | 'desc') ?? 'desc',
  }),
});

function BatchesPage() {
  const navigate = Route.useNavigate();
  const search = useSearch({ from: '/batches/' });

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
    queryKey: [
      'batches',
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
      const res = await _axios.get(`/batches?${params.toString()}`);
      return res.data;
    },
  });
  const handlePageChange = (newPage: number) => {
    navigate({ search: (prev) => ({ ...prev, page: newPage }) });
  };

  const handleLimitChange = (newLimit: number) => {
    navigate({ search: (prev) => ({ ...prev, page: 1, limit: newLimit }) });
  };

  const batches = data?.data ?? [];
  const totalPages = data?.pagination?.totalPages || 1;
  const totalItems = data?.pagination?.total;
  const itemsPerPage = data?.pagination?.limit || limit;

  const columns: ColumnDef<Batch>[] = [
    {
      accessorKey: 'batchName',
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 font-medium"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Batch Name
          <ArrowUpDown className="h-4 w-4" />
        </button>
      ),
      cell: ({ row }) => (
        <div className="font-medium">{row.original.batchName}</div>
      ),
    },
    {
      accessorKey: 'batchCode',
      header: 'Batch Code',
      cell: ({ row }) => (
        <div className="font-mono text-sm">{row.original.batchCode}</div>
      ),
    },
    {
      id: 'course',
      header: 'Course',
      cell: ({ row }) => (
        <div className="text-sm">{row.original.course?.courseName || '—'}</div>
      ),
    },
    // {
    //   accessorKey: 'days',
    //   header: 'Days',
    //   cell: ({ row }) => (
    //     <div className="flex flex-wrap gap-1">
    //       {row.original.days.map((day) => (
    //         <span
    //           key={day}
    //           className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
    //           {day.slice(0, 3)}
    //         </span>
    //       ))}
    //     </div>
    //   ),
    // },
    {
      id: 'period',
      header: 'Period',
      cell: ({ row }) => (
        <div className="text-sm">
          <div className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
            <span>
              {format(new Date(row.original.startDate), 'dd MMM yy')} –{' '}
              {format(new Date(row.original.endDate), 'dd MMM yy')}
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {row.original.startTime} – {row.original.endTime}
          </div>
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
        const batch = row.original;
        return (
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() =>
                    navigate({
                      to: `/batches/$id`,
                      params: { id: batch._id },
                      state: {
                        batch: {
                          courseId: batch.courseId,
                          batchName: batch.batchName,
                          batchCode: batch.batchCode,
                          startDate: batch.startDate,
                          endDate: batch.endDate,
                          startTime: batch.startTime,
                          endTime: batch.endTime,
                        },
                      } as any,
                    })
                  }
                  className="p-2 rounded-md cursor-pointer hover:bg-muted transition-colors">
                  <Pencil className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit Batch</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() =>
                    navigate({
                      to: `/batches/addstudents/$batchId`,
                      params: { batchId: batch._id },
                      state: {
                        batchName: batch.batchName,
                        batchId: batch._id,
                        batchCode: batch.batchCode,
                      } as any,
                    })
                  }
                  className="p-2 rounded-md cursor-pointer hover:bg-muted transition-colors">
                  <PlusIcon />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add Student</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() =>
                    navigate({
                      to: `/batches/viewstudents/$batchId`,
                      params: { batchId: batch._id },
                      search: {
                        page: 1,
                        limit: 10,
                        search: '',
                        sortBy: 'createdAt',
                        sortOrder: 'desc',
                      },
                    })
                  }
                  className="p-2 rounded-md cursor-pointer hover:bg-muted transition-colors">
                  <Eye className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View Students</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
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
            </Tooltip>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: batches,
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
        <Input
          placeholder="Search batches..."
          value={searchTerm}
          onChange={(e) =>
            navigate({
              search: (prev) => ({ ...prev, search: e.target.value, page: 1 }),
              replace: true,
            })
          }
          className="max-w-sm"
        />

        <Button
          onClick={() =>
            navigate({ to: '/batches/$id', params: { id: 'new' } })
          }
          className="gap-2 cursor-pointer">
          <Plus className="h-4 w-4" />
          Create Batch
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
                    No batches found
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
