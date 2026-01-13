import { createFileRoute, useLocation, useRouter } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { format } from 'date-fns'
import {
  CalendarIcon,
  MailIcon,
  PhoneIcon,
  MapPinIcon,
  UserIcon,
  BookOpenIcon,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react'
import { _axios } from '@/lib/axios'
import { useQuery } from '@tanstack/react-query'

interface Student {
  _id: string
  studentName: string
  email: string
  profileImageUrl?: string
  mobileNumber?: string
  studentPhoneNumber?: string
  address?: string
  dateOfBirth?: string
  gender?: string
  parentName?: string
  parentPhoneNumber?: string
  grade?: string
  nameOfTheBoard?: string
  previousYearAnnualTotalMarks?: string
  previousYearMathMarks?: string
  enrolledCourses: EnrolledCourse[]
  isActive: boolean
}

interface EnrolledCourse {
  courseId: string
  courseName: string
  bannerImage?: string
  enrolledAt: string
  overallProgress: number
}

export const Route = createFileRoute('/students/$id')({
  component: StudentDetailsPage,
})

const fetchStudentById = async (studentId: string): Promise<Student> => {
  const response = await _axios.get(`/student/${studentId}`)

  // If you're using axios
  return response.data.student
}

function StudentDetailsPage() {
  const { id: studentId } = Route.useParams()
  const location = useLocation()
  const router = useRouter()

  const {
    data: student,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['student', studentId],
    queryFn: () => fetchStudentById(studentId),
    enabled: !!studentId, // prevents running with undefined id
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading student details...</p>
        </div>
      </div>
    )
  }

  if (isError || !student) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-destructive">
              {isError || 'Student not found'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  const averageProgress =
    student.enrolledCourses.length > 0
      ? Math.round(
          student.enrolledCourses.reduce(
            (sum, c) => sum + c.overallProgress,
            0,
          ) / student.enrolledCourses.length,
        )
      : 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        {/* Student Profile Header */}
        <div className="mb-10">
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-slate-900">
            <CardHeader className="pb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <Avatar className="h-20 w-20 ring-2 ring-slate-200 dark:ring-slate-700 flex-shrink-0">
                  <AvatarImage
                    src={student.profileImageUrl || '/placeholder.svg'}
                    alt={student.studentName}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-semibold">
                    {getInitials(student.studentName)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-3 truncate">
                    {student.studentName}
                  </h1>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge
                      variant={student.isActive ? 'default' : 'secondary'}
                      className="capitalize"
                    >
                      {student.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    {student.gender && (
                      <Badge variant="outline" className="capitalize">
                        {student.gender}
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    {student.email && (
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <MailIcon className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{student.email}</span>
                      </div>
                    )}
                    {student.studentPhoneNumber && (
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <PhoneIcon className="h-4 w-4 flex-shrink-0" />
                        <span>{student.studentPhoneNumber}</span>
                      </div>
                    )}
                    {student.address && (
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <MapPinIcon className="h-4 w-4 flex-shrink-0" />
                        <span className="line-clamp-1">{student.address}</span>
                      </div>
                    )}
                    {student.dateOfBirth && (
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <CalendarIcon className="h-4 w-4 flex-shrink-0" />
                        <span>
                          {format(
                            new Date(student.dateOfBirth),
                            'MMM dd, yyyy',
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {/* Student Details Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-slate-900">
              <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="flex items-center gap-2 text-lg text-slate-900 dark:text-white">
                  <UserIcon className="h-5 w-5 text-blue-600" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {student.parentName && (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        Parent Name
                      </p>
                      <p className="text-slate-900 dark:text-white font-medium">
                        {student.parentName}
                      </p>
                    </div>
                  )}
                  {student.parentPhoneNumber && (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        Parent Phone
                      </p>
                      <p className="text-slate-900 dark:text-white font-medium">
                        {student.parentPhoneNumber}
                      </p>
                    </div>
                  )}
                  {student.dateOfBirth && (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        Date of Birth
                      </p>
                      <p className="text-slate-900 dark:text-white font-medium">
                        {format(new Date(student.dateOfBirth), 'MMMM dd, yyyy')}
                      </p>
                    </div>
                  )}
                  {student.gender && (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        Gender
                      </p>
                      <p className="text-slate-900 dark:text-white font-medium capitalize">
                        {student.gender}
                      </p>
                    </div>
                  )}
                  {student.address && (
                    <div className="md:col-span-2 space-y-1">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        Address
                      </p>
                      <p className="text-slate-900 dark:text-white font-medium">
                        {student.address}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Academic Information */}
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-slate-900">
              <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="flex items-center gap-2 text-lg text-slate-900 dark:text-white">
                  <BookOpenIcon className="h-5 w-5 text-blue-600" />
                  Academic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {student.grade && (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        Current Grade
                      </p>
                      <p className="text-slate-900 dark:text-white font-medium">
                        {student.grade}
                      </p>
                    </div>
                  )}
                  {student.nameOfTheBoard && (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        Board
                      </p>
                      <p className="text-slate-900 dark:text-white font-medium">
                        {student.nameOfTheBoard}
                      </p>
                    </div>
                  )}
                  {student.previousYearAnnualTotalMarks && (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        Previous Year Total
                      </p>
                      <p className="text-slate-900 dark:text-white font-medium">
                        {student.previousYearAnnualTotalMarks}
                      </p>
                    </div>
                  )}
                  {student.previousYearMathMarks && (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        Previous Year Math
                      </p>
                      <p className="text-slate-900 dark:text-white font-medium">
                        {student.previousYearMathMarks}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Account Status Card */}
          <div>
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 sticky top-6">
              <CardHeader className="pb-4 border-b border-blue-100 dark:border-slate-700">
                <CardTitle className="flex items-center gap-2 text-lg text-slate-900 dark:text-white">
                  <CheckCircle2 className="h-5 w-5 text-blue-600" />
                  Status Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-5">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                    Account Status
                  </p>
                  <Badge
                    className={`${student.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}
                    variant="outline"
                  >
                    {student.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                    Enrolled Courses
                  </p>
                  <p className="text-3xl font-bold text-blue-600">
                    {student.enrolledCourses.length}
                  </p>
                </div>

                {student.enrolledCourses.length > 0 && (
                  <div className="space-y-3 pt-3 border-t border-blue-100 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                          Avg. Progress
                        </p>
                      </div>
                      <p className="text-lg font-bold text-blue-600">
                        {averageProgress}%
                      </p>
                    </div>
                    <Progress value={averageProgress} className="h-2" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Enrolled Courses Section */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Enrolled Courses
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {student.enrolledCourses.length}{' '}
              {student.enrolledCourses.length === 1 ? 'course' : 'courses'}
            </p>
          </div>

          {student.enrolledCourses.length === 0 ? (
            <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
              <CardContent className="py-12 text-center">
                <BookOpenIcon className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                <p className="text-slate-500 dark:text-slate-400">
                  No courses enrolled yet
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {student.enrolledCourses.map((course) => (
                <Card
                  key={course.courseId}
                  className="border-0 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden bg-white dark:bg-slate-900 flex flex-col"
                >
                  {course.bannerImage && (
                    <div className="relative h-32 bg-gradient-to-br from-slate-200 to-slate-100 dark:from-slate-700 dark:to-slate-800 overflow-hidden">
                      <img
                        src={course.bannerImage || '/placeholder.svg'}
                        alt={course.courseName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-slate-900 dark:text-white line-clamp-2">
                      {course.courseName}
                    </CardTitle>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                      Enrolled{' '}
                      {format(new Date(course.enrolledAt), 'MMM dd, yyyy')}
                    </p>
                  </CardHeader>
                  <CardContent className="pt-0 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                          Progress
                        </p>
                        <p className="text-sm font-bold text-blue-600">
                          {course.overallProgress}%
                        </p>
                      </div>
                      <Progress
                        value={course.overallProgress}
                        className="h-2"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
