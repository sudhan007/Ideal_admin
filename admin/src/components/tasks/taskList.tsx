//@ts-nocheck
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
  FileText,
  Pencil,
  Plus,
  View,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CourseTableSkeleton } from '../TableSkeleton'
import { useNavigate } from '@tanstack/react-router'

type Task = {
  _id: string
  taskName: string
  taskDescription: string
  dueDateTime: string
  fileType: 'IMAGE' | 'PDF' | string
  fileUrls: string[]
  createdAt: string
  courseName: string
  chapterName: string
  lessonName: string
  courseId: string
  chapterId: string
  lessonId: string
}

type ApiResponse = {
  data: Task[]
  pagination: {
    currentPage: number
    totalPages: number
    totalTasks: number
    limit: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

export function TaskList() {
  const navigate = useNavigate()
  const search: any = useSearch({ from: '/tasks/' })

  const {
    page = 1,
    search: searchTerm = '',
    sortBy = 'createdAt',
    sortOrder = 'desc',
  }: any = search

  const [sorting, setSorting] = useState<SortingState>([
    { id: sortBy, desc: sortOrder === 'desc' },
  ])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  const { data, isLoading } = useQuery<ApiResponse>({
    queryKey: ['tasks', { page, search: searchTerm, sortBy, sortOrder }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: '10',
        search: searchTerm,
        sortBy,
        sortOrder,
      })
      const res = await _axios.get(`/task?${params.toString()}`)
      return res.data
    },
  })

  const tasks = data?.data ?? []
  const pagination = data?.pagination

  const columns: ColumnDef<Task>[] = [
    {
      accessorKey: 'taskName',
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 font-medium"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
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
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
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
        const task = row.original
        if (!task.fileUrls?.length)
          return <span className="text-muted-foreground">—</span>

        return (
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {task.fileType} × {task.fileUrls.length}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 font-medium"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
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
        const task = row.original
        return (
          <div className="flex items-center gap-2">
            {/* You can decide what actions make sense for tasks */}
            <button
              onClick={() => {
                navigate({
                  to: '/tasks',
                  search: {
                    courseId: task.courseId,
                    chapterId: task.chapterId,
                    lessonId: task.lessonId,
                    mode: 'edit',
                    taskId: task._id,
                    taskData: task,
                  },
                })
              }}
              className="p-2 rounded hover:bg-secondary-background transition-colors"
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                navigate({
                  to: `/tasks/${task._id}`,
                })
              }}
              className="p-2 rounded hover:bg-secondary-background transition-colors"
              title="Edit"
            >
              <View className="h-4 w-4" />
            </button>
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data: tasks,
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
    <div className="mx-auto p-2">
      {/* Header + Search + Create Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold"></h1>
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
                      className="px-4 py-3 text-left text-sm font-medium text-muted-foreground"
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
                    className="px-6 py-12 text-center text-muted-foreground"
                  >
                    No tasks found
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b hover:bg-muted/30 transition-colors"
                  >
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

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
          <div>
            Showing page {pagination.currentPage} of {pagination.totalPages} (
            {pagination.totalTasks} total tasks)
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasPrevPage}
              onClick={() =>
                navigate({
                  search: (prev) => ({ ...prev, page: page - 1 }),
                })
              }
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasNextPage}
              onClick={() =>
                navigate({
                  search: (prev) => ({ ...prev, page: page + 1 }),
                })
              }
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
