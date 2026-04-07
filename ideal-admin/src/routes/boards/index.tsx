import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
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
import { Pencil, Plus } from 'lucide-react';
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
type boards = {
  _id: string;
  boardName: string;
};

type ApiResponse = {
  boards: boards[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
};

export const Route = createFileRoute('/boards/')({
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
  const search = useSearch({ from: '/boards/' });
  const {
    page = 1,
    search: searchTerm = '',
    limit,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = search;

  const [debounced] = useDebouncedValue(searchTerm, 600);
  const [sorting, setSorting] = useState<SortingState>([
    { id: sortBy, desc: sortOrder === 'desc' },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const { data, isLoading } = useQuery<ApiResponse>({
    queryKey: ['boards', { page, limit, search: debounced, sortBy, sortOrder }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search: debounced,
        sortBy,
        sortOrder,
      });
      const res = await _axios.get(`/boards?${params.toString()}`);
      return res.data;
    },
  });
  const handlePageChange = (newPage: number) => {
    navigate({ search: (prev) => ({ ...prev, page: newPage }) });
  };

  const handleLimitChange = (newLimit: number) => {
    navigate({ search: (prev) => ({ ...prev, page: 1, limit: newLimit }) });
  };

  const boards = data?.boards ?? [];
  const totalPages = data?.pagination?.totalPages || 1;
  const totalItems = data?.pagination?.total;
  const itemsPerPage = data?.pagination?.limit || limit;

  const columns: ColumnDef<boards>[] = [
    {
      accessorKey: 'boardName',
      header: 'Board',
      cell: ({ row }) => (
        <div className="font-medium">{row.original.boardName}</div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const board = row.original;
        return (
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() =>
                    navigate({
                      to: `/boards/$id`,
                      params: { id: board._id },
                      state: { board } as any,
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
            {/* <button
              onClick={() =>
                navigate({
                  to: `/mentors/$id`,
                  params: { id: mentor._id },
                })
              }
              className="p-2 rounded-md cursor-pointer text-foreground transition-colors"
              title="View Mentor"
            >
              <Eye className="h-4 w-4 text-foreground" />
            </button> */}
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: boards,
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
          placeholder="Search boards..."
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
          onClick={() => navigate({ to: '/boards/$id', params: { id: 'new' } })}
          className="h-10 cursor-pointer text-background rounded-xsm">
          <Plus /> Create Board
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
                    No Board found
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
