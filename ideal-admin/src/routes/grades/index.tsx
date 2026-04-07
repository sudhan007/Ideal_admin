import { createFileRoute } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { _axios } from '@/lib/axios';
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useState } from 'react';
import { useSearch } from '@tanstack/react-router';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { CourseTableSkeleton } from '@/components/TableSkeleton';
import { Button } from '@/components/ui/button';
import { useDebouncedValue } from '@mantine/hooks';
import { Pagination } from '@/components/Pagination';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
type grades = {
  _id: string;
  grade: string;
};

type ApiResponse = {
  grades: grades[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
};

export const Route = createFileRoute('/grades/')({
  component: GradePage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      page: Number(search.page ?? 1),
      limit: (search.limit as number) ?? 10,
      search: (search.search as string) ?? '',
      sortBy: (search.sortBy as string) ?? 'createdAt',
      sortOrder: (search.sortOrder as 'asc' | 'desc') ?? 'desc',
    };
  },
});

function GradePage() {
  const navigate = Route.useNavigate();
  const search = useSearch({ from: '/grades/' });
  const {
    page = 1,
    search: searchTerm = '',
    limit,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = search;
  const queryClient = useQueryClient();

  const [debounced] = useDebouncedValue(searchTerm, 600);
  const [sorting, setSorting] = useState<SortingState>([
    { id: sortBy, desc: sortOrder === 'desc' },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const { data, isLoading } = useQuery<ApiResponse>({
    queryKey: ['grades', { page, limit, search: debounced, sortBy, sortOrder }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search: debounced,
        sortBy,
        sortOrder,
      });
      const res = await _axios.get(`/grades?${params.toString()}`);
      return res.data;
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (gradeId: string) => _axios.delete(`/grades/${gradeId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      toast.success('Grade deleted successfully');
    },
  });
  const handlePageChange = (newPage: number) => {
    navigate({ search: (prev) => ({ ...prev, page: newPage }) });
  };

  const handleLimitChange = (newLimit: number) => {
    navigate({ search: (prev) => ({ ...prev, page: 1, limit: newLimit }) });
  };

  const grades = data?.grades ?? [];
  const totalPages = data?.pagination?.totalPages || 1;
  const totalItems = data?.pagination?.total;
  const itemsPerPage = data?.pagination?.limit || limit;

  const columns: ColumnDef<grades>[] = [
    {
      accessorKey: 'grade',
      header: 'Grade',
      cell: ({ row }) => (
        <div className="font-medium">{row.original.grade}</div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const grade = row.original;
        return (
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() =>
                    navigate({
                      to: `/grades/$id`,
                      params: { id: grade._id },
                      state: { grade } as any,
                    })
                  }
                  className="p-2 rounded-md cursor-pointer text-foreground transition-colors"
                  title="Edit Grade">
                  <Pencil className="h-4 w-4 text-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit Grade</p>
              </TooltipContent>
            </Tooltip>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete "{grade.grade}"?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove the lesson and all associated
                    content.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteMutation.mutate(grade._id)}
                    className="">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: grades,
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
    <div className=" mx-auto p-2">
      {/* Global Search */}
      <div className="flex justify-end gap-3">
        <Input
          type="text"
          name="grade-search"
          placeholder="Search grades..."
          value={searchTerm}
          onChange={(e) =>
            navigate({
              search: (prev) => ({ ...prev, search: e.target.value, page: 1 }),
              replace: true,
            })
          }
          className="mb-6 w-full max-w-sm border border-foreground px-4 py-2 
             focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-none 
             focus-visible::border-none transition-colors h-10 rounded-xsm"
        />
        <Button
          onClick={() => navigate({ to: '/grades/$id', params: { id: 'new' } })}
          className="h-10 cursor-pointer text-background rounded-xsm">
          <Plus /> Create Grade
        </Button>
      </div>

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
                    No Grades found
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-muted/50 transition-colors">
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
    </div>
  );
}
