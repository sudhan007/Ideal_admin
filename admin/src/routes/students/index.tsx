// src/routes/students.tsx
import { createFileRoute, useSearch } from '@tanstack/react-router'
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
import { format } from 'date-fns'
import { ArrowUpDown, ChevronLeft, ChevronRight, Eye, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Type based on your API response
type Student = {
  _id: string
  studentName?: string
  mobileNumber: string
  email: string
  gender?: 'male' | 'female' | 'other'
  registrationComplete?: boolean
  createdAt: string
  // Add other fields if needed (class, board, etc.)
}

type ApiResponse = {
  students: Student[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
  message?: string
}

export const Route = createFileRoute('/students/')({
  component: StudentsPage,
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page ?? 1),
    search: (search.search as string) ?? '',
    gender: (search.gender as string) ?? '',
    sortBy: (search.sortBy as 'studentName' | 'createdAt') ?? 'createdAt',
    sortOrder: (search.sortOrder as 'asc' | 'desc') ?? 'desc',
  }),
})

function StudentsPage() {
  const navigate = Route.useNavigate()
  const search = useSearch({ from: '/students/' })
  const {
    page = 1,
    search: searchTerm = '',
    gender = '',
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = search

  const [sorting, setSorting] = useState<SortingState>([
    { id: sortBy, desc: sortOrder === 'desc' },
  ])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  const { data, isLoading } = useQuery<ApiResponse>({
    queryKey: [
      'students',
      { page, search: searchTerm, gender, sortBy, sortOrder },
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: '10',
        search: searchTerm,
        gender,
        sortBy,
        sortOrder,
      })
      const res = await _axios.get(`/student/list?${params.toString()}`)
      return res.data
    },
  })

  const students = data?.students ?? []
  const pagination = data?.pagination

  const columns: ColumnDef<Student>[] = [
    {
      accessorKey: 'studentName',
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 font-medium"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Student Name
          <ArrowUpDown className="h-4 w-4" />
        </button>
      ),
      cell: ({ row }) => (
        <div className="font-medium">
          {row.original.studentName || 'Not Set'}
        </div>
      ),
    },
    {
      accessorKey: 'mobileNumber',
      header: 'Phone Number',
      cell: ({ row }) => <div>{row.original.mobileNumber || '-'}</div>,
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => <div>{row.original.email || '-'}</div>,
    },
    {
      accessorKey: 'gender',
      header: 'Gender',
      cell: ({ row }) => (
        <div className="capitalize">{row.original.gender || '-'}</div>
      ),
    },
    {
      accessorKey: 'registrationComplete',
      header: 'Registered',
      cell: ({ row }) => (
        <div
          className={
            row.original.registrationComplete
              ? 'text-green-600'
              : 'text-red-600'
          }
        >
          {row.original.registrationComplete ? 'Yes' : 'No'}
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 font-medium"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
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
        const student = row.original
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                navigate({
                  to: '/students/$id',
                  params: { id: student._id },
                })
              }
              className="p-2 rounded-md hover:bg-secondary-background transition-colors"
              title="View Student Details"
            >
              <Eye className="h-4 w-4" />
            </button>
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data: students,
    columns,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
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
    <div className="mx-auto p-4 md:p-6">
      {/* Filters & Actions */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search Input */}
          <Input
            placeholder="Search by name, phone, email..."
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

          {/* Gender Filter */}
          {/* <Select
            value={gender}
            onValueChange={(value) =>
              navigate({
                search: (prev) => ({
                  ...prev,
                  gender: value === 'all' ? '' : value,
                  page: 1,
                }),
                replace: true,
              })
            }
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genders</SelectItem>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select> */}
        </div>

        {/* Create Student Button */}
        <Button
          // onClick={() => navigate({ to: '/students/new' })}
          className="w-full sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Student
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="rounded-lg bg-sidebar p-8 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-700 rounded w-1/4 mx-auto"></div>
            <div className="h-64 bg-gray-700 rounded"></div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border bg-sidebar shadow-sm overflow-hidden">
          <table className="w-full table-auto">
            <thead className="bg-secondary-background">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-sm font-medium text-foreground border-b"
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
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-6 py-12 text-center text-muted-foreground"
                  >
                    No students found
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b hover:bg-secondary-background/50 transition-colors"
                  >
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
        <div className="mt-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="text-sm text-muted-foreground">
            Showing page {pagination.page} of {pagination.totalPages} (
            {pagination.total} total students)
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                navigate({ search: (prev) => ({ ...prev, page: page - 1 }) })
              }
              disabled={!pagination.hasPrevPage}
            >
              <ChevronLeft className="mr-1 h-4 w-4" /> Prev
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                navigate({ search: (prev) => ({ ...prev, page: page + 1 }) })
              }
              disabled={!pagination.hasNextPage}
            >
              Next <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
