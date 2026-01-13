import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { _axios } from '@/lib/axios'
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useState } from 'react'
import { useSearch } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight, Pencil, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { CourseTableSkeleton } from '@/components/TableSkeleton'
import { Button } from '@/components/ui/button'

type grades = {
  _id: string
  grade: string
}

type ApiResponse = {
  grades: grades[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

export const Route = createFileRoute('/grades/')({
  component: GradePage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      page: Number(search.page ?? 1),
      search: (search.search as string) ?? '',
      sortBy: (search.sortBy as string) ?? 'createdAt',
      sortOrder: (search.sortOrder as 'asc' | 'desc') ?? 'desc',
    }
  },
})

function GradePage() {
  const navigate = Route.useNavigate()
  const search = useSearch({ from: '/grades/' })
  const {
    page = 1,
    search: searchTerm = '',
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = search

  const [sorting, setSorting] = useState<SortingState>([
    { id: sortBy, desc: sortOrder === 'desc' },
  ])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  const { data, isLoading } = useQuery<ApiResponse>({
    queryKey: ['grades', { page, search: searchTerm, sortBy, sortOrder }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: '10',
        search: searchTerm,
        sortBy,
        sortOrder,
      })
      const res = await _axios.get(`/grades?${params.toString()}`)
      return res.data
    },
  })
  console.log(data, 'data')
  const grades = data?.grades ?? []
  const pagination = data?.pagination

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
        const grade = row.original
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                navigate({
                  to: `/grades/$id`,
                  params: { id: grade._id },
                  state: { grade } as any,
                })
              }
              className="p-2 rounded-md cursor-pointer text-foreground transition-colors"
              title="Edit Grade"
            >
              <Pencil className="h-4 w-4 text-foreground" />
            </button>

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
        )
      },
    },
  ]

  const table = useReactTable({
    data: grades,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    manualPagination: true,
    pageCount: pagination?.totalPages ?? -1,
  })

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
          className="h-10 cursor-pointer text-background rounded-xsm"
        >
          <Plus /> Create Grade
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <CourseTableSkeleton />
      ) : (
        <div className="rounded-xsm  bg-sidebar shadow-sm">
          <table className="w-full table-auto">
            <thead className="border-b ">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-3 py-4 text-left border-[0.5px] border-background text-sm font-medium text-foreground"
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
                    className="px-6 py-12 text-center text-foreground"
                  >
                    No Grades found
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className=" hover:bg-background">
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-3 py-2 border-[0.5px] border-background hover:bg-secondary-background"
                      >
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
          <div className="text-sm text-gray-600">
            Showing page {pagination.page} of {pagination.totalPages} (
            {pagination.total} total)
          </div>

          <div className="flex gap-2">
            <button
              onClick={() =>
                navigate({ search: (prev) => ({ ...prev, page: page - 1 }) })
              }
              disabled={!pagination.hasPrevPage}
              className="flex items-center gap-2 rounded-lg border px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>

            <button
              onClick={() =>
                navigate({ search: (prev) => ({ ...prev, page: page + 1 }) })
              }
              disabled={!pagination.hasNextPage}
              className="flex items-center gap-2 rounded-lg border px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-gray-50"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
