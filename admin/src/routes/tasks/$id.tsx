// src/routes/tasks/$id.tsx
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { _axios } from '@/lib/axios'
import {
  ColumnDef,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useState } from 'react'
import { useSearch } from '@tanstack/react-router'
import { format } from 'date-fns'
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

// ── Types ────────────────────────────────────────────────────────────────

type SubmissionStatus = 'SUBMITTED' | 'RE_SUBMITTED' | 'REJECTED' | 'COMPLETED'

type Submission = {
  _id: string
  taskId: string
  studentId: string
  currentStatus: SubmissionStatus
  totalSubmissions: number
  latestSubmissionNumber: number
  createdAt: string
  updatedAt: string
  taskName: string
  taskDescription: string
  taskDueDate: string
}

type ApiResponse = {
  ok: boolean
  data: Submission[]
  pagination: {
    currentPage: number
    totalPages: number
    totalSubmissions: number
    limit: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

// ── Route ────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/tasks/$id')({
  component: TaskSubmissionsPage,
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page ?? 1),
    search: (search.search as string) ?? '',
    status: (search.status as SubmissionStatus | undefined) ?? undefined,
    sortBy: (search.sortBy as string) ?? 'createdAt',
    sortOrder: (search.sortOrder as 'asc' | 'desc') ?? 'desc',
  }),
})

function TaskSubmissionsPage() {
  const { id: taskId } = Route.useParams()
  const navigate = Route.useNavigate()
  const search = useSearch({ from: '/tasks/$id' })

  const {
    page = 1,
    search: searchTerm = '',
    status,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = search

  const [sorting, setSorting] = useState<SortingState>([
    { id: sortBy, desc: sortOrder === 'desc' },
  ])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  const { data, isLoading } = useQuery<ApiResponse>({
    queryKey: [
      'task-submissions',
      taskId,
      { page, search: searchTerm, status, sortBy, sortOrder },
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        taskId: taskId,
        page: String(page),
        limit: '10',
        search: searchTerm,
        ...(status && { status }),
        sortBy,
        sortOrder,
      })

      const res = await _axios.get(`/task/submissions?${params.toString()}`)
      return res.data
    },
  })

  const submissions = data?.data ?? []
  const pagination = data?.pagination

  const columns: ColumnDef<Submission>[] = [
    {
      accessorKey: 'studentId',
      header: 'Student ID',
      cell: ({ row }) => (
        <div className="font-medium">{row.original.studentId}</div>
      ),
    },
    {
      accessorKey: 'currentStatus',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.currentStatus

        const statusStyles = {
          SUBMITTED: 'bg-blue-100 text-blue-800',
          RE_SUBMITTED: 'bg-purple-100 text-purple-800',
          REJECTED: 'bg-red-100 text-red-800',
          COMPLETED: 'bg-green-100 text-green-800',
        }

        const statusIcons = {
          SUBMITTED: <Clock className="h-4 w-4" />,
          RE_SUBMITTED: <RefreshCw className="h-4 w-4" />,
          REJECTED: <XCircle className="h-4 w-4" />,
          COMPLETED: <CheckCircle2 className="h-4 w-4" />,
        }

        return (
          <div
            className={cn(
              'inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium',
              statusStyles[status],
            )}
          >
            {statusIcons[status]}
            {status.replace('_', ' ')}
          </div>
        )
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
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Due Date
          <ArrowUpDown className="h-4 w-4" />
        </button>
      ),
      cell: ({ row }) => (
        <div className="text-sm">
          {format(new Date(row.original.taskDueDate), 'MMM dd, yyyy HH:mm')}
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <button
          className="flex items-center gap-1"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Submitted At
          <ArrowUpDown className="h-4 w-4" />
        </button>
      ),
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {format(new Date(row.original.createdAt), 'MMM dd, yyyy')}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const submission = row.original
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              navigate({
                to: `/tasks/submissions/${taskId}/${submission._id}`,
              })
            }
          >
            View
          </Button>
        )
      },
    },
  ]

  const table = useReactTable({
    data: submissions,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting,
      columnVisibility,
    },
    manualPagination: true,
    pageCount: pagination?.totalPages ?? -1,
  })

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Submissions for Task</h1>
        <p className="text-muted-foreground">Task ID: {taskId}</p>
      </div>

      {/* Filters & Search */}
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
            }
          >
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
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="rounded-md border">
          <table className="w-full">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-sm font-medium text-muted-foreground bg-muted/50"
                    >
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
                    className="h-24 text-center text-muted-foreground"
                  >
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

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {pagination.currentPage} of {pagination.totalPages} pages (
            {pagination.totalSubmissions} total submissions)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasPrevPage}
              onClick={() =>
                navigate({ search: (prev) => ({ ...prev, page: page - 1 }) })
              }
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasNextPage}
              onClick={() =>
                navigate({ search: (prev) => ({ ...prev, page: page + 1 }) })
              }
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
