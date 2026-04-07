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
import { AlertTriangle, Pencil, Plus, Power } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { CourseTableSkeleton } from '@/components/TableSkeleton';
import { Button } from '@/components/ui/button';
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
import { useDebouncedValue } from '@mantine/hooks';
import { Pagination } from '@/components/Pagination';
type staffs = {
  _id: string;
  staffName: string;
  phoneNumber: string;
  role: string;
  image: string;
  isActive: boolean;
};

type ApiResponse = {
  staffs: staffs[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
};

export const Route = createFileRoute('/mentors/')({
  component: MentorsPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      page: Number(search.page ?? 1),
      search: (search.search as string) ?? '',
      limit: (search.limit as number) ?? 10,
      sortBy: (search.sortBy as string) ?? 'createdAt',
      sortOrder: (search.sortOrder as 'asc' | 'desc') ?? 'desc',
    };
  },
});

function MentorsPage() {
  const queryClient = useQueryClient();

  const navigate = Route.useNavigate();
  const search = useSearch({ from: '/mentors/' });
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
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    mentorId: string;
    mentorName: string;
    action: 'deactivate' | 'activate';
  }>({
    open: false,
    mentorId: '',
    mentorName: '',
    action: 'deactivate',
  });
  const { data, isLoading } = useQuery<ApiResponse>({
    queryKey: [
      'mentors',
      { page, search: debounced, sortBy, sortOrder, limit },
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search: debounced,
        sortBy,
        sortOrder,
      });
      const res = await _axios.get(`/staffs?${params.toString()}`);
      return res.data;
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (mentorId: string) => {
      const res = await _axios.patch(`/staffs/toggle-status/${mentorId}`);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Mentor status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['mentors'] });
      setConfirmDialog({
        open: false,
        mentorId: '',
        mentorName: '',
        action: 'deactivate',
      });
    },
    onError: (error: any) => {
      const errorMsg = error?.error || 'Failed to update course status';
      toast.error(errorMsg);
    },
  });

  const handleStatusToggle = (mentor: staffs) => {
    if (mentor.isActive) {
      setConfirmDialog({
        open: true,
        mentorId: mentor._id,
        mentorName: mentor.staffName,
        action: 'deactivate',
      });
    } else {
      toggleStatusMutation.mutate(mentor._id);
    }
  };
  const confirmStatusToggle = () => {
    toggleStatusMutation.mutate(confirmDialog.mentorId);
  };

  const handlePageChange = (newPage: number) => {
    navigate({ search: (prev) => ({ ...prev, page: newPage }) });
  };

  const handleLimitChange = (newLimit: number) => {
    navigate({ search: (prev) => ({ ...prev, page: 1, limit: newLimit }) });
  };
  const staffs = data?.staffs ?? [];
  const totalPages = data?.pagination?.totalPages || 1;
  const totalItems = data?.pagination?.total;
  const itemsPerPage = data?.pagination?.limit || limit;

  const columns: ColumnDef<staffs>[] = [
    {
      accessorKey: 'mentor.staffName',
      header: 'Mentor',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <img
            src={row.original.image}
            alt={row.original.staffName}
            className="h-10 w-10 rounded-full object-cover"
          />
          <span>{row.original.staffName}</span>
        </div>
      ),
    },
    {
      accessorKey: 'phoneNumber',
      header: 'Phone Number',
      cell: ({ row }) => (
        <div className="font-medium">{row.original.phoneNumber}</div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const mentor = row.original;
        return (
          <div className="flex items-center gap-2">
            {/* Edit Course */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() =>
                    navigate({
                      to: `/mentors/$id`,
                      params: { id: mentor._id },
                      state: { mentor } as any,
                    })
                  }
                  className="p-2 rounded-md cursor-pointer text-foreground transition-colors"
                  title="Edit Mentor">
                  <Pencil className="h-4 w-4 text-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit Mentor</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleStatusToggle(mentor)}
                  disabled={toggleStatusMutation.isPending}
                  className={`p-2 rounded-md hover:bg-accent cursor-pointer transition-colors ${
                    mentor.isActive ? 'text-green-600' : 'text-gray-400'
                  } ${toggleStatusMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                  aria-label="Toggle Mentor status">
                  <Power className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{mentor.isActive ? 'Deactivate' : 'Activate'} Mentor</p>
              </TooltipContent>
            </Tooltip>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: staffs,
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
          name="mentor-search"
          placeholder="Search mentors..."
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
          onClick={() =>
            navigate({ to: '/mentors/$id', params: { id: 'new' } })
          }
          className="h-10 cursor-pointer text-background rounded-xsm">
          <Plus /> Create Mentor
        </Button>
      </div>

      {isLoading ? (
        <CourseTableSkeleton />
      ) : (
        <div className="rounded-md border bg-card">
          <table className="w-full ">
            <thead className=" ">
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
                    No Staff found
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className=" hover:bg-muted/50 transition-colors">
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
      {/* Deactivation Confirmation Dialog */}
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
              <strong>"{confirmDialog.mentorName}"</strong>?
              <br />
              <br />
              This course will no longer be visible to students and cannot be
              enrolled until reactivated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={toggleStatusMutation.isPending}
              onClick={() =>
                setConfirmDialog({
                  open: false,
                  mentorId: '',
                  mentorName: '',
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
