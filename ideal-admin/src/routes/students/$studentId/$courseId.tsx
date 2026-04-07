import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { _axios } from '@/lib/axios';
import { format } from 'date-fns';
import { BookOpen, Clock, Award, BarChart3, ArrowBigLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/students/$studentId/$courseId')({
  component: StudentCourseProgress,
});

function StudentCourseProgress() {
  const { studentId, courseId } = Route.useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['student-course-progress', studentId, courseId],
    queryFn: async () => {
      const response = await _axios.get(
        `/student/enrolled-course-details/${studentId}/${courseId}`,
      );
      if (!response.data?.status) {
        throw new Error(response.data?.message || 'Failed to fetch progress');
      }
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading course progress...</p>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-red-600 text-5xl mb-4">!</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-600 mb-6">
            {error?.message ||
              'Failed to load course progress. Please try again later.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const {
    course,
    enrollment,
    overallProgress,
    chapters,
    lessons,
    quizzes,
    tasks,
  } = data;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Button
        onClick={() =>
          navigate({
            to: '/students/$id',
            params: { id: studentId },
            search: {
              page: 1,
              limit: 10,
              search: '',
              sortBy: 'createdAt',
              sortOrder: 'desc',
              gender: '',
            },
          })
        }
        variant="outline"
        className="rounded-xsm hover:text-foreground text-foreground  cursor-pointer hover:bg-accent/50 my-2">
        <ArrowBigLeft className="mr-2 h-4 w-4" /> Back to Students
      </Button>
      {/* Header / Course Banner */}
      <div className="relative">
        <img
          src={course.bannerImage}
          alt={course.courseName}
          className="w-full h-64 object-cover brightness-75"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
          <h1 className="text-4xl font-bold mb-2">{course.courseName}</h1>
          <p className="text-lg opacity-90">
            Enrolled on{' '}
            {format(new Date(enrollment.enrolledAt), 'MMMM dd, yyyy')}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 mt-2 z-10">
        {/* Overall Progress Card */}
        <div className="bg-white rounded-xl shadow-xl p-8 mb-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="w-full ">
              <div className="flex items-center gap-3 mb-4">
                <BarChart3 className="w-8 h-8 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-800">
                  Your Progress
                </h2>
              </div>

              <div className="mb-6">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">Overall Completion</span>
                  <span className="font-bold text-blue-600">
                    {overallProgress.completionPercentage}%
                  </span>
                </div>
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                    style={{
                      width: `${overallProgress.completionPercentage}%`,
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                <StatCard
                  icon={<BookOpen className="w-6 h-6" />}
                  label="Chapters"
                  value={`${overallProgress.completedChapters}/${overallProgress.totalChapters}`}
                  color="blue"
                />
                <StatCard
                  icon={<Clock className="w-6 h-6" />}
                  label="Lessons"
                  value={`${lessons.completed}/${lessons.total}`}
                  color="indigo"
                />
                <StatCard
                  icon={<Award className="w-6 h-6" />}
                  label="Tasks"
                  value={`${tasks.submitted}/${tasks.total}`}
                  color="green"
                />
              </div>
            </div>

            {/* Quick Stats */}
            <div className="w-full md:w-1/2 bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Activity Summary</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Quizzes Attempted:</span>
                  <span className="font-medium">{quizzes.totalAttempts}</span>
                </div>
                <div className="flex justify-between">
                  <span>Passed:</span>
                  <span className="font-medium text-green-600">
                    {quizzes.passed}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Pass Rate:</span>
                  <span className="font-medium">{quizzes.passPercentage}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chapters List */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <BookOpen className="w-7 h-7 text-blue-600" />
            Course Chapters
          </h2>

          <div className="space-y-6">
            {chapters.map((chapter: any) => (
              <div
                key={chapter.chapterId}
                className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">
                      {chapter.chapterName}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Order {chapter.order} • {chapter.totalLessons} lessons
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-600">
                      {chapter.completionPercentage}%
                    </div>
                    <div className="text-sm text-gray-500">Complete</div>
                  </div>
                </div>

                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all duration-500"
                    style={{ width: `${chapter.completionPercentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {chapters.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No chapters available yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Reusable small stat component
function StatCard({ icon, label, value, color = 'blue' }: any) {
  const colorClasses: any = {
    blue: 'bg-blue-100 text-blue-700',
    indigo: 'bg-indigo-100 text-indigo-700',
    green: 'bg-green-100 text-green-700',
  };

  return (
    <div className={`p-4 rounded-lg ${colorClasses[color]} bg-opacity-70`}>
      <div className="flex items-center gap-3">
        <div
          className={`p-3 rounded-full ${colorClasses[color]} bg-opacity-30`}>
          {icon}
        </div>
        <div>
          <div className="text-sm font-medium opacity-80">{label}</div>
          <div className="text-xl font-bold">{value}</div>
        </div>
      </div>
    </div>
  );
}
