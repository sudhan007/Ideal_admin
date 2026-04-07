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
import { useDebouncedValue } from '@mantine/hooks';
import { useState } from 'react';
import { useSearch } from '@tanstack/react-router';
import { format } from 'date-fns';
import {
  ArrowUpDown,
  Eye,
  Pencil,
  Plus,
  Power,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { CourseTableSkeleton } from '@/components/TableSkeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { Pagination } from '@/components/Pagination';

type Course = {
  _id: string;
  courseName: string;
  mentor: {
    staffName: string;
    image: string;
    phoneNumber: string;
  };
  board: {
    id: string;
    name: string;
  };
  grade: {
    id: string;
    name: string;
  };
  strikePrice: string;
  actualPrice: string;
  bannerImage: string;
  isActive: boolean;
  isTrending: boolean;
  createdAt: string;
};

type ApiResponse = {
  courses: Course[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
};

export const Route = createFileRoute('/courses/')({
  component: CoursesPage,
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

function CoursesPage() {
  const navigate = Route.useNavigate();
  const queryClient = useQueryClient();
  const search = useSearch({ from: '/courses/' });
  const {
    page,
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
    courseId: string;
    courseName: string;
    action: 'deactivate' | 'activate';
  }>({
    open: false,
    courseId: '',
    courseName: '',
    action: 'deactivate',
  });

  const { data, isLoading } = useQuery<ApiResponse>({
    queryKey: [
      'courses',
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
      const res = await _axios.get(`/courses?${params.toString()}`);
      return res.data;
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (courseId: string) => {
      const res = await _axios.patch(`/courses/toggle-status/${courseId}`);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Course status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setConfirmDialog({
        open: false,
        courseId: '',
        courseName: '',
        action: 'deactivate',
      });
    },
    onError: (error: any) => {
      const errorMsg = error?.error || 'Failed to update course status';
      toast.error(errorMsg);
    },
  });

  const toggleTrendingMutation = useMutation({
    mutationFn: async (courseId: string) => {
      const res = await _axios.patch(`/courses/trending/${courseId}`);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Trending status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
    onError: (error: any) => {
      const errorMsg = error?.error || 'Failed to update trending status';
      toast.error(errorMsg);
    },
  });

  const handleStatusToggle = (course: Course) => {
    if (course.isActive) {
      setConfirmDialog({
        open: true,
        courseId: course._id,
        courseName: course.courseName,
        action: 'deactivate',
      });
    } else {
      toggleStatusMutation.mutate(course._id);
    }
  };

  const confirmStatusToggle = () => {
    toggleStatusMutation.mutate(confirmDialog.courseId);
  };

  const handlePageChange = (newPage: number) => {
    navigate({ search: (prev) => ({ ...prev, page: newPage }) });
  };

  const handleLimitChange = (newLimit: number) => {
    navigate({ search: (prev) => ({ ...prev, page: 1, limit: newLimit }) });
  };

  const courses = data?.courses ?? [];
  const totalPages = data?.pagination?.totalPages || 1;
  const totalItems = data?.pagination?.total;
  const itemsPerPage = data?.pagination?.limit || limit;

  const columns: ColumnDef<Course>[] = [
    {
      accessorKey: 'courseName',
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 font-medium"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Course Name
          <ArrowUpDown className="h-4 w-4" />
        </button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{row.original.courseName}</span>
          {row.original.isTrending && (
            <Badge
              variant="secondary"
              className="bg-orange-100 text-orange-700 border-orange-200">
              <TrendingUp className="h-3 w-3 mr-1" />
              Trending
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'mentor.staffName',
      header: 'Mentor',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <img
            src={row.original.mentor.image}
            alt={row.original.mentor.staffName}
            className="h-10 w-10 rounded-full object-cover"
          />
          <span>{row.original.mentor.staffName}</span>
        </div>
      ),
    },
    {
      accessorKey: 'board',
      header: 'Board',
      cell: ({ row }) => (
        <div className="font-medium">{row.original.board.name}</div>
      ),
    },
    {
      accessorKey: 'grade',
      header: 'Grade',
      cell: ({ row }) => (
        <div className="font-medium">{row.original.grade.name}</div>
      ),
    },
    {
      accessorKey: 'actualPrice',
      header: 'Price',
      cell: ({ row }) => (
        <div>
          <span className="text-lg font-medium text-foreground">
            ₹{Number(row.original.actualPrice).toLocaleString('en-IN')}
          </span>
          {row.original.strikePrice !== row.original.actualPrice && (
            <span className="ml-2 text-sm text-gray-500 line-through">
              ₹{Number(row.original.strikePrice).toLocaleString('en-IN')}
            </span>
          )}
        </div>
      ),
    },
    // {
    //   accessorKey: 'isActive',
    //   header: 'Status',
    //   cell: ({ row }) => (
    //     <Badge
    //       variant={row.original.isActive ? 'default' : 'secondary'}
    //       className={
    //         row.original.isActive
    //           ? 'bg-green-100 text-green-700 border-green-200'
    //           : 'bg-gray-100 text-gray-700 border-gray-200'
    //       }>
    //       {row.original.isActive ? 'Active' : 'Inactive'}
    //     </Badge>
    //   ),
    // },
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
        const course = row.original;

        return (
          <div className="flex items-center gap-2">
            <TooltipProvider>
              {/* Edit Course */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() =>
                      navigate({
                        to: `/courses/$id`,
                        params: { id: course._id },
                        state: { course } as any,
                      })
                    }
                    className="p-2 rounded-md hover:bg-accent cursor-pointer text-foreground transition-colors"
                    aria-label="Edit course">
                    <Pencil className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit Course</p>
                </TooltipContent>
              </Tooltip>

              {/* View Chapters */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() =>
                      navigate({
                        to: `/courses/$id/chapters/$chapterId`,
                        params: { id: course._id, chapterId: 'new' },
                      })
                    }
                    className="p-2 rounded-md hover:bg-accent cursor-pointer text-foreground transition-colors"
                    aria-label="View chapters">
                    <Eye className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View Chapters</p>
                </TooltipContent>
              </Tooltip>

              {/* Toggle Active Status */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleStatusToggle(course)}
                    disabled={toggleStatusMutation.isPending}
                    className={`p-2 rounded-md hover:bg-accent cursor-pointer transition-colors ${
                      course.isActive ? 'text-green-600' : 'text-gray-400'
                    } ${toggleStatusMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                    aria-label="Toggle course status">
                    <Power className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{course.isActive ? 'Deactivate' : 'Activate'} Course</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => toggleTrendingMutation.mutate(course._id)}
                    disabled={toggleTrendingMutation.isPending}
                    className={`p-2 rounded-md hover:bg-accent cursor-pointer transition-colors ${
                      course.isTrending ? 'text-orange-600' : 'text-gray-400'
                    } ${toggleTrendingMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                    aria-label="Toggle trending status">
                    <TrendingUp className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{course.isTrending ? 'Remove from' : 'Add to'} Trending</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: courses,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    // getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting,
      columnFilters,
    },
    // manualPagination: true,
    // pageCount: data?.pagination?.totalPages ?? -1,
  });

  return (
    <div className="mx-auto p-2">
      <div className="flex justify-end gap-3">
        <Input
          type="text"
          name="course-search"
          placeholder="Search courses..."
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
            navigate({ to: '/courses/$id', params: { id: 'new' } })
          }
          className="h-10 cursor-pointer text-background rounded-xsm">
          <Plus /> Create Course
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <CourseTableSkeleton />
      ) : (
        <div className="rounded-md border bg-card">
          <table className="w-full">
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
                    No Courses found
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
              <strong>"{confirmDialog.courseName}"</strong>?
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
                  courseId: '',
                  courseName: '',
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
