import { Skeleton } from '@/components/ui/skeleton'

export function CourseTableSkeleton() {
  return (
    <div className="mx-auto p-2">

      {/* Table Skeleton */}
      <div className="rounded-xsm bg-sidebar shadow-sm">
        <table className="w-full table-auto">
          <thead className="border-b">
            <tr>
              {/* 4 columns: Course Name, Mentor, Price, Created At */}
              <th className="px-3 py-4 text-left border-[0.5px] border-background">
                <Skeleton className="h-5 w-32 bg-gray-200" />
              </th>
              <th className="px-3 py-4 text-left border-[0.5px] border-background">
                <Skeleton className="h-5 w-20 bg-gray-200" />
              </th>
              <th className="px-3 py-4 text-left border-[0.5px] border-background">
                <Skeleton className="h-5 w-16 bg-gray-200" />
              </th>
              <th className="px-3 py-4 text-left border-[0.5px] border-background">
                <Skeleton className="h-5 w-28 bg-gray-200" />
              </th>
            </tr>
          </thead>
          <tbody>
            {[...Array(10)].map((_, i) => ( // 10 rows to match your limit
              <tr key={i} className="hover:bg-background animate-pulse">
                {/* Course Name */}
                <td className="px-3 py-2 border-[0.5px] border-background">
                  <Skeleton className="h-5 w-48 bg-gray-200" />
                </td>
                {/* Mentor (image + name) */}
                <td className="px-3 py-2 border-[0.5px] border-background">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full bg-gray-200" />
                    <Skeleton className="h-5 w-32 bg-gray-200" />
                  </div>
                </td>
                {/* Price */}
                <td className="px-3 py-2 border-[0.5px] border-background">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-20 bg-gray-200" />
                    <Skeleton className="h-5 w-16 bg-gray-200" />
                  </div>
                </td>
                {/* Created At */}
                <td className="px-3 py-2 border-[0.5px] border-background">
                  <Skeleton className="h-5 w-24 bg-gray-200" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Skeleton */}
      <div className="mt-6 flex items-center justify-between">
        <Skeleton className="h-5 w-64 bg-gray-200" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28 bg-gray-200" />
          <Skeleton className="h-10 w-24 bg-gray-200" />
        </div>
      </div>
    </div>
  )
}